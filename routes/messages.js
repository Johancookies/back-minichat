const express = require("express");
const cron = require("node-cron");

const r = require("rethinkdb");
const getRethinkDB = require("../config/db");
const messages = express.Router();

const url_taskMap = {};

// middleware
messages.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

// get messages by channel
messages.get("/by-channel", async (req, response) => {
  const conn = await getRethinkDB();
  const idChannel = req.query.id_channel;
  r.table("messages")
    .filter({ id_channel: idChannel })
    .run(conn, (err, cursor) => {
      if (err) console.log(err);
      cursor.toArray((err, result) => {
        if (err) console.log(err);
        response.json({ data: result });
      });
    });
});

// create messages
messages.post("/", async (req, response) => {
  const conn = await getRethinkDB();
  const message = req.body;
  const currentDate = new Date();
  const task = cron.schedule(
    "5 * * * * *",
    () => {
      console.log("Meeting inactive...");
    },
    { scheduled: false }
  );

  let meet_id = "";
  r.table("meetings")
    .filter(
      r
        .row("id_channel")
        .eq(message.id_channel)
        .and(r.row("status").eq("active").or(r.row("status").eq("waiting")))
    )
    .run(conn, (err, cursor) => {
      if (err) console.log(err);
      cursor.toArray((err, result) => {
        if (err) console.log(err);
        if (url_taskMap[result[0].id]) {
          task.stop();
        } else {
          url_taskMap[result[0].id] = task;
        }
        task.start();
        if (result[0].status === "waiting") {
          r.table("meetings")
            .filter({ id: result[0].id })
            .update({ status: "active" })
            .run(conn, (err, res) => {
              if (err) console.log(err);
            });
        }
        meet_id = result[0].id;
        message.id_meet = meet_id;
        message.create_at = currentDate;
        insertMessage(conn, message, response);
      });
    });
});

function insertMessage(con, data, response) {
  try {
    r.table("messages")
      .insert(data)
      .run(con, (err, res) => {
        if (err) console.log(err);
        let messageStatus = {
          id_message: res.generated_keys[0],
          status: "sent",
        };
        r.table("message_status")
          .insert(messageStatus)
          .run(con, (err, res) => {
            if (err) console.log(err);
            response.sendStatus(200);
          });
      });
  } catch (e) {
    response.json({ error: e, status: 500 });
  }
}

module.exports = messages;
