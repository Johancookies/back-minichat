const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
var r = require("rethinkdb");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// database connection
let rdbConn = null;
const rdbConnect = async function () {
  try {
    const conn = await r.connect({
      host: process.env.RETHINKDB_HOST || "localhost",
      port: process.env.RETHINKDB_PORT || 28015,
      username: process.env.RETHINKDB_USERNAME || "admin",
      password: process.env.RETHINKDB_PASSWORD || "",
      db: process.env.RETHINKDB_NAME || "real_time_chat",
    });

    // Handle close
    conn.on("close", function (e) {
      console.log("RDB connection closed: ", e);
      rdbConn = null;
    });

    console.log("Connected to RethinkDB");
    rdbConn = conn;
    return conn;
  } catch (err) {
    throw err;
  }
};

const getRethinkDB = async function () {
  if (rdbConn != null) {
    return rdbConn;
  }
  return await rdbConnect();
};

//routes

app.get("/chats/:room", async (req, res) => {
  const conn = await getRethinkDB();
  const room = req.params.room;

  let query = r.table("chats").filter({ room: room });
  let orderedQuery = query.orderBy(r.desc("ts"));
  orderedQuery.run(conn, (err, cursor) => {
    if (err) throw err;
    cursor.toArray((err, result) => {
      if (err) throw err;
      res.json({
        data: result,
      });
    });
  });
});

// socket config
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", async (data) => {
    const conn = await getRethinkDB();
    r.table("chats")
      .insert(data)
      .run(conn, function (err, res) {
        if (err) throw err;
      });
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.send("...");
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
