const express = require("express");

const rethinkdb = require("rethinkdb");
const getRethinkDB = require("../config/db");

const channel = express.Router();

// middleware

app.use(async (err, req, res, next) => {
  if (err) res.json({ error: err, status: 504 });
  if (req.body) next("router");
  res.sendStatus(204);
});

// get to send or insert the channel

channel.get("/", async (req, response) => {
  const conn = await getRethinkDB();
  const data = req.body; // get the data of the body
  const channelId = data.id_user + data.id_service_line; // id of the channel (unique)
  try {
    rethinkdb
      .table("channels")
      .filter({ id_channel: channelId })
      .run(conn, (err, cursor) => {
        if (err) response.sendStatus(500);
        if (cursor) {
          cursor.toArray((err, result) => {
            if (err) response.sendStatus(500);
            response.json({
              id_channel: result.id_channel,
            });
          });
        } else {
          const time = new Date(); // creaate the time of the channel
          let channel = {
            id_channel: channelId,
            create_at: time,
            id_user: data.id_user,
            id_service_line: data.id_service_line,
          };
          rethinkdb
            .table("channels")
            .insert(channel)
            .run(conn, function (err, _res) {
              if (err) response.sendStatus(500);
              response.json({
                id_channel: channel.id_channel
              });
            });
        }
      });
  } catch (e) {
    response.json({
      error: e,
      status: 500,
    });
  }
});

// post to create channels
channel.post("/", async (req, response) => {
  const channel = req.body;
  const conn = await getRethinkDB();
  rethinkdb
    .table("channels")
    .insert(channel)
    .run(conn, function (err, _res) {
      if (err) throw err;
      response.sendStatus(200);
    });
});

module.exports = channel;
