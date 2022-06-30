import express from "express";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";
import ioEmmit from "../app.js";
import uploadAWS from "../aws/aws.js";

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
    .orderBy("create_at")
    .run(conn, (err, cursor) => {
      if (err) console.log(err);
      cursor.toArray((err, result) => {
        if (err) console.log(err);
        response.json({ data: result });
      });
    });
});

// create messages
messages.post("/", uploadAWS.array("file", 3), async (req, response) => {
  const conn = await getRethinkDB();
  const message = req.body;
  const currentDate = new Date();

  let file = null;
  if (req.files && req.files.length > 0) {
    file = req.files[0].location;
  }

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
        if (result.length === 0) {
          createMeeting({
            con: conn,
            data: message,
            response: response,
            idChannel: message.id_channel,
            file: file,
          });
        } else {
          if (result[0].status === "waiting") {
            r.table("meetings")
              .filter({ id: result[0].id })
              .update({ status: "active" })
              .run(conn, (err, res) => {
                if (err) console.log(err);
              });
          }
          const timeout = setTimeout(() => {
            r.table("meetings")
              .filter({ id: result[0].id })
              .update({ status: "inactive" })
              .run(conn, (err, res) => {
                if (err) console.log(err);
                console.log("inactive meeting" + result[0].id);
                ioEmmit({ key: "close_meeting", data: result[0].id });
              });
          }, 600000);
          if (url_taskMap[result[0].id]) {
            clearTimeout(url_taskMap[result[0].id]);
          }
          url_taskMap[result[0].id] = timeout;
          meet_id = result[0].id;
          message.id_meet = meet_id;
          message.create_at = currentDate;
          insertMessage(conn, message, response, file);
        }
      });
    });
});

function insertMessage(con, data, response, file) {
  try {
    if (data.type === "text") {
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
    } else {
      data.url_file = file;
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
              response.send({
                message: "Uploaded!",
                status: "success",
              });
            });
        });
    }
  } catch (e) {
    response.json({ error: e, status: 500 });
  }
}

function createMeeting({ con, idChannel, data, response, file }) {
  try {
    const currentDate = new Date();
    let dataMeeting = {
      id_channel: idChannel,
      status: "active",
      create_at: currentDate,
    };
    r.table("meetings")
      .insert(dataMeeting)
      .run(con, (err, res) => {
        if (err) console.log(err);
        meet_id = res[0].id;
        data.id_meet = meet_id;
        data.create_at = currentDate;
        insertMessage(con, data, response, file);
        const timeout = setTimeout(() => {
          r.table("meetings")
            .filter({ id: res[0].id })
            .update({ status: "inactive" })
            .run(con, (err, result) => {
              if (err) console.log(err);
              console.log("inactive meeting" + res[0].id);
              ioEmmit({ key: "close_meeting", data: res[0].id });
            });
        }, 600000);
        url_taskMap[res[0].id] = timeout;
      });
  } catch (e) {
    console.log(e);
  }
}

export default messages;
