import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import "dotenv/config.js";
import sendMessageRabbit from "./src/rabbitmq/send.js";

// services
import meetingService from "./src/components/meetings/services.js";
import messageService from "./src/components/messages/services.js";

//express services
import messages from "./src/components/messages/main.js";
import channel from "./src/components/channels/main.js";
import members from "./src/components/member/main.js";
import users from "./src/components/users/main.js";

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
app.use("/channels", channel);
app.use("/messages", messages);
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
      meetingService
        .getMeetingActiveByChannel(room)
        .then((result) => {
          if (result.length === 0) {
            meetingService
              .createMeeting(room)
              .then((result) => {
                console.log("create meeting " + result.id);
                messageService.createChanges(room);
              })
              .catch((err) => {
                console.log(err);
              });
          } else {
            meetingService
              .status(result[0].id, "active")
              .then((result) => {
                console.log("change meeting status " + result[0].id);
              })
              .catch((err) => {
                console.log(err);
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("receive_message", async (data) => {
    let messageStatus = {
      id_message: data.id_message,
      status: "received",
    };

    messageService
      .messageStatus(messageStatus)
      .then((result) => {
        io.to(data.id_channel).emit("change_status", {
          id_message: data.id_message,
          status: "received",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on("change_waiting", async (channel) => {
    meetingService.changeStatusToWaiting(channel);
  });

  socket.on("reactive_changefeed", async (room) => {
    console.log("reactive change feed");
    io.to(room).emit("recharge_messages");

    messageService.createChanges(room);
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

function ioEmmit({ key, data, to }) {
  if (to) {
    io.to(to).emit(key, data);
  } else {
    io.emit(key, data);
  }
  console.log("key", key);
  console.log("data", data);
}

server.listen(process.env.PORT, () => {
  console.log("server is running on port " + process.env.PORT);
});

export default ioEmmit;
