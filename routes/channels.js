const express = require("express");

const rethinkdb = require("rethinkdb");
const getRethinkDB = require("../config/db");

const channel = express.Router();

channel.post("/", async (req, response) => {
  const channel = req.body;
  const conn = await getRethinkDB();
  rethinkdb
    .table("channels")
    .insert(channel)
    .run(conn, function (err, res) {
      if (err) throw err;
      response.sendStatus(200);
    });
});

channel.get("/", async (req, response) => {
  const conn = await getRethinkDB();
  const data = req.body;
  const channelId = data.id_user + data.id_service_line;
  rethinkdb
    .table("channels")
    .filter({ id_channel: channelId })
    .run(conn, (err, cursor) => {
      if (err) response.sendStatus(500);
      console.log(cursor);
      cursor.toArray((err, result) => {
        if (err) response.sendStatus(500);
        response.json({
          id_channel: result.id_channel,
        });
      });
    });
});

module.exports = channel;
