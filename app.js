const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");
require("dotenv").config();

// import routes
const serviceLines = require("./routes/service_lines");
const channel = require("./routes/channels");
const messages = require("./routes/messages");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// routes
app.get("/", (req, res) => {
  res.send("...");
});

app.use("/service-lines", serviceLines);
app.use("/channels", channel);
app.use("/messages", messages);

// app.get("/chats/:room", async (req, res) => {
//   res.send("dont have database");
//   const conn = await getRethinkDB();
//   const room = req.params.room;
//   let query = r.table("chats").filter({ room: room });
//   let orderedQuery = query.orderBy(r.desc("ts"));
//   orderedQuery.run(conn, (err, cursor) => {
//     if (err) throw err;
//     cursor.toArray((err, result) => {
//       if (err) throw err;
//       res.json({
//         data: result,
//       });
//     });
//   });
// });

// socket config
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", async (data) => {
    // const conn = await getRethinkDB();
    // r.table("chats")
    //   .insert(data)
    //   .run(conn, function (err, res) {
    //     if (err) throw err;
    //     console.log(res);
    //   });
    console.log(data);
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });
});

server.listen(process.env.PORT, () => {
  console.log("server is running in port " + process.env.PORT);
});
