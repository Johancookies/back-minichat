import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import "dotenv/config.js";
import sendMessageRabbit from "./rabbitmq/send.js";
import { url_taskMap } from "./routes/messages.js";

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

import { Console } from "console";
import fs from "fs";

export const myLogger = new Console({
  stdout: fs.createWriteStream("normalStdout.txt"),
  stderr: fs.createWriteStream("errStdErr.txt"),
});

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
  myLogger.log("check server");
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
    myLogger.log(`User ${socket.id} joined room ${room}`);
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
        .limit(1)
        .run(conn, (err, cursor) => {
          console.log("Filtro de channels");
          if (err) console.log(err);
          cursor.toArray((err, result) => {
            console.log("entre a la validación del channel");
            if (err) console.log(err);
            console.log(result[0]);
            if (result.length === 0) {
              let createdMeet = null;
              console.log("Entre al changes");
              createMeeting(conn, room);
              r.table("messages")
                .filter({ id_channel: room })
                .changes()
                .run(conn, (err, cursorChanges) => {
                  if (err) console.error(err);
                  cursorChanges.each((err, result) => {
                    if (err) console.log(err);
                    if (
                      createdMeet !== null &&
                      createdMeet !== result.new_val.id_meet
                    ) {
                      console.log(createMeeting);
                      // cursorChanges.close();
                    } else {
                      console.log(result.new_val);
                      createdMeet = result.new_val.id_meet;
                      io.to(room).emit("receive_message", {
                        ...result.new_val,
                        status: "sent",
                      });
                    }
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
          if (resultChannel.new_val) {
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
          }
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

  socket.on("change_waiting", async (channel) => {
    const conn = await getRethinkDB();
    r.table("meetings")
      .filter(r.row("id_channel").eq(channel).and(r.row("status").eq("active")))
      .limit(1)
      .update({ status: "waiting" })
      .run(conn, (err, res) => {
        if (err) console.log(err);
        console.log("change meeting status successfully" + channel);
      });
  });

  socket.on("reactive_changefeed", async (room) => {
    console.log("reactive change feed");
    io.to(room).emit("recharge_messages");
    const conn = await getRethinkDB();
    r.table("messages")
      .filter({ id_channel: room })
      .changes()
      .run(conn, (err, cursor) => {
        if (err) console.error(err);
        cursor.each((err, result) => {
          if (err) console.log(err);
          io.to(room).emit("receive_message", {
            ...result.new_val,
            status: "sent",
          });
        });
      });
    r.table("meetings")
      .filter({ id_channel: room })
      .limit(1)
      .update({ status: "active" })
      .run(conn, (err, res) => {
        if (err) console.log(err);
      });
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });

  // socket.on("view_message", (message) => {
  //   const conn = await getRethinkDB();
  //   r.table("messages").filter({id: message.id}).run((conn, err)=>{

  //   })
  // });
});

function ioEmmit({ key, data }) {
  io.emit(key, data);
  console.log("key", key);
  console.log("data", data);
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
      .run(con, (err, result) => {
        if (err) console.log(err);
        dataMeeting.id_rethink = result.generated_keys[0];
        dataMeeting.create_at = new Date().toISOString();
        dataMeeting.flag = "insert_meeting";

        const timeout = setTimeout(() => {
          r.table("meetings")
            .filter({ id: result.generated_keys[0] })
            .update({ status: "inactive" })
            .run(con, (err, res) => {
              if (err) console.log(err);
              console.log("inactive meeting" + result.generated_keys[0]);
              ioEmmit({ key: "close_meeting", data: result.generated_keys[0] });
            });
        }, 60000);
        if (url_taskMap[result.generated_keys[0]]) {
          clearTimeout(url_taskMap[result.generated_keys[0]]);
        }
        url_taskMap[result.generated_keys[0]] = timeout;
      });
  } catch (e) {
    console.log(e);
  }
}

export default ioEmmit;
