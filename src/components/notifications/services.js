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

service.sendNotification = (filter) => {
  return new Promise((resolve, reject) => {
    service
      .getTokens(filter)
      .then((result) => {
        console.log(result);
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

export default service;
