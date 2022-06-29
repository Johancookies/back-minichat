import express from "express";
import fetch from "node-fetch";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";

const notification = express.Router();

notification.post("/", (req, res) => {
  let notification = {
    title: "Esto es una notificación",
    body: {
      content: "No puede ser, envié una notificación :3",
      id_channel: null,
    },
  };

  let fcm_tokens = [
    "fOuR4yqdja4TNHU442oGLZ:APA91bGJ4HWZAdZvnh7sQfC89MGTeNcqcTyX8_MQ00ErhA-ywMr12thvqqXY563V-A-KwkTezBKYqcqc0YaPep3oL7hxpwFQ4E3625P_FVRJjuUM-x8bGGxkoFpVedP44zorMvEZLW6f",
  ];
  let notification_body = {
    notification: notification,
    registration_ids: fcm_tokens,
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
      res.status(200).send("Notification send successfully");
    })
    .catch((err) => {
      res.status(400).send("Something went wrong!");
      console.log(err);
    });
});

notification.post("/add-token", async (req, response) => {
  const token = req.body;
  const conn = await getRethinkDB();
  if (token.token) {
    r.table("token_notification")
      .insert(token)
      .run(conn, (err, res) => {
        if (err) {
          console.log(err);
          response.status(400);
          response.json({ message: "Something went wrong!", status: 400 });
        } else {
          response.status(200);
          response.json({ message: "Token added successfully", status: 200 });
        }
      });
  } else {
    response.json({ message: "You did not send any token", status: 400 });
  }
});

export default notification;
