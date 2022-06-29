import express from "express";
import rethinkdb from "rethinkdb";
import getRethinkDB from "../config/db.js";

const users = express.Router();

users.post("/", async (req, response) => {
  const conn = await getRethinkDB();
  const user = req.body;
  let dataUser = {
    id_user: user.id,
    first_name: user.firts_name,
    last_name: user.last_name,
    role_id: user.role_id,
  };
  r.table("users")
    .insert(dataUser)
    .run(conn, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        const dataToken = {
          device: user.device,
          type: user.type,
          id_user: user.id ?? null,
          id_member: null,
          token: user.token,
        };
        r.table("token_notification")
          .insert(dataToken)
          .run(conn, (err, res) => {
            if (err) {
              response.send(400);
              response.json({
                message: "Something went wrong!",
                status: 400,
              });
            } else {
              response.send(200);
              response.json({
                message: "User added successfully!",
                status: 200,
              });
            }
          });
      }
    });
});
