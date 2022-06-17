const express = require("express");

const rethinkdb = require("rethinkdb");
const getRethinkDB = require("../config/db");

const channel = express.Router();

channel.post("/", async (req, response) => {
  const channel = req.body;
  const conn = await getRethinkDB();
  rethinkdb.table("channels")
    .insert(channel)
    .run(conn, function (err, res) {
      if (err) throw err;
      response.sendStatus(200)
    });
});

module.exports = channel;
