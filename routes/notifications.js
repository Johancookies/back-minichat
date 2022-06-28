import express from "express";
import fetch from "node-fetch";

const notification = express.Router();

notification.post("/", (req, res) => {
  let notification = {
    title: "Esto es una notificación",
    text: "No puede ser envie una notificación :3",
  };

  let fcm_tokens = [];
  let notification_body = {
    notification: notification,
    registration_ids: fcm_tokens,
  };

  fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization:
        "key=" +
        "AAAA_ORg-Eg:APA91bE_HdRRJQs6VEjZcXdXeGZY8eWCDUVDSf-QQWazq5N7v-bdTvCKc4Sjq0ag0GEvJPKlgjEnCXBcUR8WaICXXY5VsLk_nmDzzR68734Tvqe1Vg3GnQRF9asY-DwXgf03cqD7e7n-",
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

export default notification;
