const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");
require("dotenv").config();

// db
const r = require("rethinkdb");
const getRethinkDB = require("./config/db");

// import routes
const serviceLines = require("./routes/service_lines");
const channel = require("./routes/channels");
const messages = require("./routes/messages");

const app = express(); // initial express
app.use(cors());
app.use(express.json());
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
    console.log(data);
    socket.emit("pong", 1);
  });

  // changefeed messages
  socket.on("join_room", async (room) => {
    console.log(`User ${socket.id} joined room ${room}`);
    const currentRoom = socket.rooms.values.some(
      (itemRoom) => itemRoom === room
    );
    socket.join(room); // join to the room user_id + service_lines
    if (!currentRoom) {
      try {
        const conn = await getRethinkDB(); // connect whit the database
        r.table("messages")
          .filter({ id_channel: room })
          .changes()
          .run(conn, (err, cursor) => {
            if (err) console.error(err);
            cursor.each((err, result) => {
              if (err) console.log(err);
              console.log(result.new_val);
              io.to(room).emit("receive_message", result.new_val);
            });
          });
      } catch (e) {
        console.error(e);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });
});

server.listen(process.env.PORT, () => {
  console.log("server is running on port " + process.env.PORT);
});
