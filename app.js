import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import "dotenv/config.js";

// db
import r from "rethinkdb";
import getRethinkDB from "./config/db.js";

// import routes
import serviceLines from "./routes/service_lines.js";
import channel from "./routes/channels.js";
import messages from "./routes/messages.js";
import notifications from "./routes/notifications.js";
import members from "./routes/members.js";
import users from "./routes/users.js";

const app = express(); // initial express
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// middleware to control any error when join to the server
app.use((err, _req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  next("router");
});

// principal roiter to know if the server is ok
app.get("/", (_, res) => {
  res.send("The server is ok");
});

// router
app.use("/service-lines", serviceLines);
app.use("/channels", channel);
app.use("/messages", messages);
app.use("/notifications", notifications);
app.use("/members", members);
app.use("/users", users);

// socket middleware
io.use((socket, next) => {
  if (!socket.request) {
    const err = new Error("error");
    err.data = { content: "Not socket request" };
    next(err);
  } else {
    next();
  }
});

// socket config
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("service_ping", (data) => {
    socket.emit("pong", 1);
  });

  // change feed messages
  socket.on("join_room", async (room) => {
    console.log(`User ${socket.id} joined room ${room}`);
    socket.join(room);
    try {
      const conn = await getRethinkDB();

      r.table("meetings")
        .filter(
          r
            .row("id_channel")
            .eq(room)
            .and(r.row("status").eq("active").or(r.row("status").eq("waiting")))
        )
        .run(conn, (err, cursor) => {
          if (err) console.log(err);
          cursor.toArray((err, result) => {
            if (err) console.log(err);
            if (result.length === 0) {
              createMeeting(conn, room);
              r.table("messages")
                .filter({ id_channel: room })
                .changes()
                .run(conn, (err, cursor) => {
                  if (err) console.error(err);
                  cursor.each((err, result) => {
                    console.log(result.new_val);
                    if (err) console.log(err);
                    io.to(room).emit("receive_message", {
                      ...result.new_val,
                      status: "sent",
                    });
                  });
                });
            } else if (result[0].status === "waiting") {
              r.table("meetings")
                .filter({ id: result[0].id })
                .update({ status: "active" })
                .run(conn, (err, res) => {
                  if (err) console.log(err);
                  console.log("change meeting status " + result[0].id);
                });
            }
          });
        });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("join_channels", async (userId) => {
    socket.join(userId);
    const conn = await getRethinkDB();
    console.log("join channels " + userId);

    r.table("channels")
      .filter({ id_user: userId.toString() })
      .changes()

      .run(conn, (err, cursor) => {
        if (err) console.log(err);
        cursor.each((err, resultChannel) => {
          if (err) console.log(err);
          r.table("members")
            .filter({ id: resultChannel.new_val.id_member })
            .run(conn, (err, cursor) => {
              cursor.toArray((err, result) => {
                if (err) console.log(err);
                io.emit("new_channels", {
                  ...resultChannel.new_val,
                  ...result[0],
                });
              });
            });
        });
      });
  });

  socket.on("receive_message", async (data) => {
    const conn = await getRethinkDB();
    let messageStatus = {
      id_message: data.id_message,
      status: "received",
    };
    r.table("message_status")
      .insert(messageStatus)
      .run(conn, (err, res) => {
        if (err) console.log(err);
        io.to(data.id_channel).emit("change_status", {
          id_message: data.id_message,
          status: "received",
        });
      });
  });

  socket.on("change_waiting", async (message) => {
    const conn = await getRethinkDB();
    if (message && Object.keys(message).length > 0) {
      r.table("meetings")
        .filter({ id: message.id_meet })
        .update({ status: "waiting" })
        .run(conn, (err, res) => {
          if (err) console.log(err);
          console.log("change meeting status " + message.id_meet);
        });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });
});

function ioEmmit({ key, data }) {
  io.emit(key, data);
}

server.listen(process.env.PORT, () => {
  console.log("server is running on port " + process.env.PORT);
});

function createMeeting(con, idChannel) {
  try {
    const currentDate = new Date();
    let dataMeeting = {
      id_channel: idChannel,
      status: "waiting",
      create_at: currentDate,
    };
    r.table("meetings")
      .insert(dataMeeting)
      .run(con, (err, res) => {
        if (err) console.log(err);
      });
  } catch (e) {
    console.log(e);
  }
}

export default ioEmmit;
