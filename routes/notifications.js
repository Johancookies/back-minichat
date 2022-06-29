import express from "express";
import fetch from "node-fetch";
import r from "rethinkdb";
import getRethinkDB from "../config/db";

const notification = express.Router();

notification.post("/", (req, res) => {
  let notification = {
    title: "Esto es una notificación",
    text: "No puede ser envié una notificación :3",
  };

  let fcm_tokens = [
    "fOuR4yqdja4TNHU442oGLZ:APA91bGu_MwiA3oYulmYmOWKuwi-yW-Auz6Bwj3OSxHhW3vsDhn9OdyEYyuL2jUnaPPXhpiYQstO5jiJUkYYUH-tOzg5kddsYuShiDc685gYCyHCuwOL9FI7MQGuEbp0_N5CAcU2P7Et",
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
