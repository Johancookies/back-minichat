import express from "express";
import fetch from "node-fetch";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";
import connectMysql from "../config/mysql.js";
import sendMessageRabbit from "../rabbitmq/send.js";

const members = express.Router();

members.post("/", async (req, response) => {
  const conn = await getRethinkDB();
  const member = req.body;
  let dataMember = {
    id_member: member.id_member,
    document_number: member.document_number,
    email: member.email,
    first_name: member.firts_name,
    last_name: member.last_name,
    mobile_phone: member.mobile_phone,
    photo: member.photo,
  };
  if (member.token_oauth) {
    fetch(
      `https://dev.notification.bodytech.co/api/tokenpush/get-tokens-user/${member.id}`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + member.token_oauth,
          "Content-Type": "application/json",
          "x-bodytech-organization": 1,
          "x-bodytech-brand": 1,
        },
      }
    ).then(({ data }) => {
      if (data && data.data && data.data.length > 0) {
        data.data.forEach((token) => {
          let dataToken = {
            device: token.os,
            type: "mobile",
            id_user: member.id_user ?? null,
            id_member: member.id ?? null,
            token: token.token,
          };
          r.table("token_notification")
            .insert(dataToken)
            .run(conn, (err, res) => {
              if (err) console.log(err);
            });
        });
      }
    });
  }

  r.table("members")
    .insert(dataMember)
    .run(conn, (err, res) => {
      if (err) {
        console.log(err);
        response.send(400);
        response.json({ message: "Something went wrong!", status: "error" });
      } else {
        dataMember.id = res.generated_keys[0];
        sendMessageRabbit({
          id_channel: "insert_mysql",
          msg: dataMember,
          res: response,
          queryMySql: addMemberInMySql,
        });
        response.status(200);
        response.json({
          message: "Member added successfully",
          status: "success",
        });
      }
    });
});

export const addMemberInMySql = (data) => {
  connectMysql((conn) => {
    conn.connect((err) => {
      if (err) console.log(err);
      console.log("connected");
    });
    const query = `INSERT INTO members (id_member_my_body, id_member, document_number, email, first_name, last_name,  mobile_phone, photo) VALUES ("${data.id_member}", "${data.id}", "${data.document_number}", "${data.email}", "${data.first_name}", "${data.last_name}", "${data.mobile_phone}", "${data.photo}");`;
    conn.query(query, (err, result) => {
      if (err) console.log(err);
      console.log("Insert member in mysql: ", data.id);
    });
    conn.end();
  });
};

export default members;
