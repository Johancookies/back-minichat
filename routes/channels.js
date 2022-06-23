const express = require("express");

const rethinkdb = require("rethinkdb");
const getRethinkDB = require("../config/db");

const channel = express.Router();

// middleware

channel.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

// get to send or insert the channel
channel.get("/", async (req, response) => {
  try {
    const conn = await getRethinkDB();
    let id_user = req.query.id_user;
    let id_service_line = req.query.id_service_line;
    const channelId = id_user + id_service_line; // id of the channel (unique)
    rethinkdb
      .table("channels")
      .filter({ id_channel: channelId })
      .run(conn, (err, cursor) => {
        if (err) response.sendStatus(500);
        if (cursor) {
          cursor.toArray((err, result) => {
            if (err) response.sendStatus(500);
            if (result.length === 0) {
              const time = new Date(); // creaate the time of the channel
              let channel = {
                id_channel: channelId,
                create_at: time,
                id_user: id_user,
                id_service_line: id_service_line,
              };
              rethinkdb
                .table("channels")
                .insert(channel)
                .run(conn, function (err, _res) {
                  if (err) response.sendStatus(500);
                  response.json({
                    id_channel: channel.id_channel,
                  });
                });
            } else {
              response.json({
                id_channel: result[0].id_channel,
              });
            }
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

// get channels by product
channel.get("/by-product", async (req, response) => {
  const conn = await getRethinkDB();
  const id_product = req.query.id_product;
  rethinkdb
    .table("channels")
    .filter({ id_product: id_product })
    .run(conn, (err, cursor) => {
      if (err) console.log(err);
      cursor.toArray((err, result) => {
        if (err) console.log(err);
        response.json({
          data: result,
        });
      });
    });
});

// post to create channels
channel.post("/", async (req, response) => {
  try {
    const channel = req.body;
    const conn = await getRethinkDB();
    rethinkdb
      .table("channels")
      .insert(channel)
      .run(conn, function (err, _res) {
        if (err) throw err;
        response.sendStatus(200);
      });
  } catch (e) {
    response.json({ error: e, status: 500 });
  }
});

module.exports = channel;
