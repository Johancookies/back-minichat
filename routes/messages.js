const express = require("express");

const r = require("rethinkdb");
const getRethinkDB = require("../config/db");

const messages = express.Router();

messages.post("/", async (req, response) => {
  const conn = await getRethinkDB();
  const message = req.body;
  r.table("meetings")
    .filter({ id_channel: message.id_channel })
    .limit(1)
    .run(conn, (err, cursor) => {
      if (err) response.sendStatus(500);
      cursor.toArray((err, result) => {
        if (err) response.sendStatus(500);
        response.json(result);
      });
    });
});
