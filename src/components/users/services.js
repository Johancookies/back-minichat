import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";

import notificationServices from "../notifications/services.js";

const service = {};

service.addUser = async (user) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter({ id_user: user.id })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          if (result.length === 0) {
            let dataUser = {
              id_user: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              role_id: user.role_id,
              status: "active",
            };

            r.table("users")
              .insert(dataUser)
              .run(conn, (err, result) => {
                if (err) reject(err);
                const dataToken = {
                  device: user.device,
                  type: user.type,
                  id_user: user.id ?? null,
                  id_member: null,
                  token: user.token,
                };
                resolve({
                  message: "User added successfully",
                  status: "success",
                });
                notificationServices.addTokens(dataToken);
              });
          } else {
            resolve({
              message: "User already exist",
              status: "success",
            });
            r.table("token_notification")
              .filter(
                r.row("id_user").eq(user.id).and(r.row("token").eq(user.token))
              )
              .update({ token: user.token })
              .run(conn, (err, result) => {
                if (err) console.log(err);
              });
          }
        });
      });
  });
};

service.getUsers = async (filter) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter(filter)
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
  });
};

service.chageStatus = async (body) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter({ id_user: body.id_user })
      .update({ status: body.status })
      .run(conn, (err, res) => {
        if (err) reject(err);
        resolve({
          message: "Change status successfully",
          status: "success",
        });
      });
  });
};

export default service;
