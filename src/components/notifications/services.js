import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";
import fetch from "node-fetch";

const service = {};

service.getTokens = async (filter) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("token_notification")
      .filter(filter)
      .run(conn, (err, cursor) => {
        if (err) console.log(err);
        cursor.toArray((err, res) => {
          if (err) console.log(err);
          if (res.length > 0) {
            let tokens = res.map((token) => token.token);
            resolve(tokens);
          } else {
            resolve([]);
          }
        });
      });
  });
};

service.sendNotification = (filter, message) => {
  return new Promise((resolve, reject) => {
    service
      .getTokens(filter)
      .then((result) => {
        sendPush({ message, tokens: result });
        resolve("notifications");
      })
      .catch((err) => {
        reject(err);
      });
  });
};

service.addTokens = async (token, id_member) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    if (token) {
      r.table("token_notification")
        .insert(token)
        .run(conn, (err, res) => {
          if (err) console.log(err);
          resolve("token aggregated");
        });
    } else {
      fetch(`${process.env.API_FETCH}${id_member}`, {
        method: "GET",
        headers: {
          Authorization: process.env.API_AUTHORIZATION,
          "Content-Type": "application/json",
          "x-bodytech-organization": process.env.API_ORGANIZATION,
          "x-bodytech-brand": process.env.API_BRAND,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data && data.data.length > 0) {
            data.data.forEach((token) => {
              let dataToken = {
                device: token.os,
                type: "mobile",
                id_user: id_member_user ?? null,
                id_member: id_member.toString(),
                token: token.token,
              };
              r.table("token_notification")
                .insert(dataToken)
                .run(conn, (err, res) => {
                  if (err) console.log(err);
                  resolve("token aggregated");
                });
            });
          }
        });
    }
  });
};

function sendPush({ message, tokens }) {
  let notification = {
    title: message.author_name,
    body: message.content,
  };

  let data = {
    body: {
      id_channel: message.id_channel,
      coach: "Soporte",
    },
  };

  let notification_body = {
    notification: notification,
    data: data,
    registration_ids: [tokens],
    // to: tokens[0],
  };

  fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: "key=" + process.env.FCM_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(notification_body),
  })
    .then((res) => {
      console.log(res);
      console.log("Notification send successfully");
    })
    .catch((err) => {
      console.log("Something went wrong!", err);
    });
}

export default service;
