const express = require("express");

const rethinkdb = require("rethinkdb");
const getRethinkDB = require("../config/db");

const channel = express.Router();

channel.post("/", async (req, res) => {
  console.log(req.body);
  //   const conn = await getRethinkDB();
  // r.table("channels")
  //   .insert(data)
  //   .run(conn, function (err, res) {
  //     if (err) throw err;
  //     console.log(res);
  //   });
});

module.exports = channel;
