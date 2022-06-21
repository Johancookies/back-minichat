const express = require("express");

const rethinkdb = require("rethinkdb");
const getRethinkDB = require("../config/db");

const serviceLines = express.Router();

serviceLines.get("/", async (req, res) => {
  const conn = await getRethinkDB();
  rethinkdb.table("service_lines").run(conn, (err, cursor) => {
    if (err) throw err;
    cursor.toArray((err, result) => {
      if (err) throw err;
      res.json({
        data: result,
      });
    });
  });
});

serviceLines.post("/", async (req, response) => {
  const conn = await getRethinkDB();
  const serviceLine = req.body;
  rethinkdb
    .table("service_lines")
    .insert(serviceLine)
    .run(conn, function (err) {
      if (err) throw err;
      response.sendStatus(200);
    });
});

module.exports = serviceLines;
