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
      id_channel: 78783354321,
    },
  };

  let fcm_tokens = [
    "cBNYr2d1Qw2sqP1dv-Y98B:APA91bE0iIbI2CVNak-ohyVzjA0COb6G_B5LD4xI7tWDAA2YcbUXEUolgboAALvFf4h88koRhwdCP1lQbop0m3s-UKZHWai6iXg31m7ayggagy4g5yf_HUJAYInNM_dujgGFW4ZjElbf",
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
      .filter({ id_user: token.id_user })
      .run(conn, (err, cursor) => {
        if (err) {
          console.log(err);
        } else {
          cursor.toArray((err, result) => {
            if (resutl && result.length > 0) {
              r.table("token_notification")
                .filter({ id_user: token.id_user })
                .update({ token: token.token })
                .run(conn, (err, res) => {
                  if (err) {
                    console.log(err);
                    response.status(400);
                    response.json({
                      message: "Something went wrong!",
                      status: "error",
                    });
                  } else {
                    response.status(200);
                    response.json({
                      message: "Token added successfully",
                      status: "success",
                    });
                  }
                });
            } else {
              r.table("token_notification")
                .insert(token)
                .run(conn, (err, res) => {
                  if (err) {
                    console.log(err);
                    response.status(400);
                    response.json({
                      message: "Something went wrong!",
                      status: "error",
                    });
                  } else {
                    response.status(200);
                    response.json({
                      message: "Token added successfully",
                      status: "success",
                    });
                  }
                });
            }
          });
        }
      });
  } else {
    response.json({ message: "You did not send any token", status: "error" });
  }
});

export default notification;
