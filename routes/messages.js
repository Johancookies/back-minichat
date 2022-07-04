import express from "express";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";
import ioEmmit from "../app.js";
import uploadAWS from "../aws/aws.js";
import fetch from "node-fetch";
import sendMessageRabbit from "../rabbitmq/send.js";

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
    file = req.files[0];
  }

  let meet_id = "";
  r.table("meetings")
    .filter(
      r
        .row("id_channel")
        .eq(message.id_channel)
        .and(r.row("status").eq("active").or(r.row("status").eq("waiting")))
    )
    .limit(1)
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
          }, 60000);
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

messages.post("/close-meeting", async (req, res) => {
  const conn = await getRethinkDB();
  const { id_channel } = req.body;
  if (!id_channel) res.sendStatus(204);
  r.table("meetings")
    .filter({ id_channel: id_channel })
    .update({ status: "inactive" })
    .run(conn, (err, response) => {
      if (err) {
        console.log(err);
        res.json({ menssage: "error", status: 500 });
      }
      res.json({ menssage: "meeting closed", status: 200 });
    });
});

function insertMessage(con, data, response, file) {
  try {
    if (data.type === "text") {
      r.table("messages")
        .insert(data)
        .run(con, (err, res) => {
          if (err) console.log(err);
          sendMessageRabbit({
            id_channel: data.id_channel,
            msg: JSON.stringify(data),
            res: response,
            callback: (data) => {
              console.log(data);
            },
          });
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
          r.table("channels")
            .filter({ id_channel: data.id_channel })
            .run(con, (err, cursor) => {
              if (err) console.log(err);
              cursor.toArray((err, result) => {
                if (err) console.log(err);
                if (result.length > 0) {
                  if (data.author_type === "member") {
                    r.table("token_notification")
                      .filter({
                        id_user: Number(result[0].id_user),
                      })
                      .run(con, (err, cursor) => {
                        if (err) console.log(err);
                        cursor.toArray((err, res) => {
                          if (err) console.log(err);
                          if (res.length > 0) {
                            let tokens = res.map((token) => token.token);
                            sendPush({ message: data, tokens: tokens });
                          }
                        });
                      });
                  } else {
                    r.table("members")
                      .filter({
                        id: result[0].id_member,
                      })
                      .run(con, (err, cursor) => {
                        if (err) console.log(err);
                        cursor.toArray((err, res) => {
                          if (err) console.log(err);
                          r.table("token_notification")
                            .filter({
                              id_member: res[0].id_member,
                            })
                            .run(con, (err, cursor) => {
                              if (err) console.log(err);
                              cursor.toArray((err, res) => {
                                if (err) console.log(err);
                                if (res.length > 0) {
                                  let tokens = res.map((token) => token.token);
                                  sendPush({ message: data, tokens: tokens });
                                }
                              });
                            });
                        });
                      });
                  }
                }
              });
            });
        });
    } else {
      data.url_file = file.location;
      data.name_file = file.originalname;
      data.size_file = file.size;
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
        const meet_id = res.generated_keys[0];
        data.id_meet = meet_id;
        data.create_at = currentDate;
        insertMessage(con, data, response, file);
        const timeout = setTimeout(() => {
          r.table("meetings")
            .filter({ id: res.generated_keys[0] })
            .update({ status: "inactive" })
            .run(con, (err, result) => {
              if (err) console.log(err);
              console.log("inactive meeting" + res.generated_keys[0]);
              ioEmmit({ key: "close_meeting", data: res.generated_keys[0] });
            });
        }, 60000);
        url_taskMap[res.generated_keys[0]] = timeout;
      });
  } catch (e) {
    console.log(e);
  }
}

function sendPush({ message, tokens }) {
  let notification = {
    title: message.author_name,
    body: message,
  };

  let notification_body = {
    notification: notification,
    registration_ids: tokens,
  };

  fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: "key=" + process.env.FCM_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(notification_body),
  })
    .then(() => {
      console.log("Notification send successfully");
    })
    .catch((err) => {
      console.log("Something went wrong!", err);
    });
}

export default messages;
