const express = require("express");

const r = require("rethinkdb");
const getRethinkDB = require("../config/db");

const messages = express.Router();

messages.post("/", async (req, response) => {
  const conn = await getRethinkDB();
  const message = req.body;
  let meet_id = "";
  r.table("meetings")
    .filter({ id_channel: message.id_channel })
    .limit(1)
    .run(conn, (err, cursor) => {
      if (err) console.log(err);
      cursor.toArray((err, result) => {
        if (err) console.log(err);
        if (result.length === 0) {
          createMeeting(conn, message, response);
        } else {
          if (result[0].status === "inactive") {
            createMeeting(conn, message, response);
          } else {
            meet_id = result[0].id;
            message.id_meet = meet_id;
            insertMessage(conn, message, response);
          }
        }
      });
    });
});

function insertMessage(con, data, response) {
  r.table("messages")
    .insert(data)
    .run(con, (err, res) => {
      if (err) console.log(err);
      response.sendStatus(200);
    });
}

function createMeeting(con, message, response) {
  const currentDate = new Date();
  let dataMeeting = {
    id_channel: message.id_channel,
    status: "active",
    create_at: currentDate,
  };
  r.table("meetings")
    .insert(dataMeeting)
    .run(con, (err, res) => {
      if (err) console.log(err);
      meet_id = res.generated_keys[0];
      message.id_meet = meet_id;
      insertMessage(con, message, response);
    });
}

module.exports = messages;
