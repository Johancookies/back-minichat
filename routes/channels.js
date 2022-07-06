import express from "express";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";
import connectMysql from "../config/mysql.js";
import sendMessageRabbit from "../rabbitmq/send.js";
import { addMemberInMySql } from "../routes/members.js";
import { getRandomInt, listTowerControl } from "../helpers/helper_functions.js";

const channel = express.Router();

// middleware
channel.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

// get to send or insert the channel
channel.post("/", async (req, response) => {
  try {
    const conn = await getRethinkDB();
    let member = req.body;
    let idMember = member.id;
    let idServiceLine = member.id_service_line;
    const channelId = idMember + idServiceLine; // id of the channel (unique)
    r.table("members")
      .filter({ id_member: idMember })
      .run(conn, (err, cursor) => {
        if (err) console.log(err);
        cursor.toArray((err, res) => {
          if (res.length === 0) {
            let dataMember = {
              id_member: member.id,
              first_name: member.first_name,
              last_name: member.last_name,
              photo: member.photo,
              email: member.email,
              mobile_phone: member.mobile_phone,
              document_number: member.document_number,
            };
            r.table("members")
              .insert(dataMember)
              .run(conn, (err, res) => {
                if (err) console.log(err);
                dataMember.id = res.generated_keys[0];
                sendMessageRabbit({
                  id_channel: "create_members",
                  msg: dataMember,
                  queryMySql: addMemberInMySql,
                });
                if (member.token) {
                  let token = {
                    device: member.device,
                    type: member.type,
                    id_user: member.id_user ?? null,
                    id_member: member.id ?? null,
                    token: member.token,
                  };
                  r.table("token_notification")
                    .insert(token)
                    .run(conn, (err, res) => {
                      if (err) console.log(err);
                    });
                }
                r.table("channels")
                  .filter({ id_channel: channelId })
                  .run(conn, (err, cursor) => {
                    if (err) response.sendStatus(500);
                    cursor.toArray((err, result) => {
                      if (err) response.sendStatus(500);
                      if (result.length === 0) {
                        const randomUser = getRandomInt(0, 4);
                        const time = new Date(); // creaate the time of the channel
                        let channel = {
                          id_channel: channelId,
                          create_at: time,
                          id_member: res.generated_keys[0],
                          id_service_line: idServiceLine,
                          id_user: listTowerControl[randomUser],
                        };
                        r.table("channels")
                          .insert(channel)
                          .run(conn, function (err, res) {
                            if (err) console.log(err);
                            channel.id = res.generated_keys[0];
                            sendMessageRabbit({
                              id_channel: "create_channels",
                              msg: channel,
                              queryMySql: addChannelsInMySql,
                            });
                            response.json({
                              id_channel: channel.id_channel,
                            });
                          });
                      } else {
                        response.json({
                          id_channel: result[0].id_channel,
                        });
                      }
                    });
                  });
              });
          } else {
            r.table("channels")
              .filter({ id_channel: channelId })
              .run(conn, (err, cursor) => {
                if (err) response.sendStatus(500);
                if (cursor) {
                  cursor.toArray((err, result) => {
                    if (err) response.sendStatus(500);
                    if (result.length === 0) {
                      const time = new Date(); // creaate the time of the channel
                      const randomUser = getRandomInt(0, 4);
                      let channel = {
                        id_channel: channelId,
                        create_at: time,
                        id_member: res[0].id,
                        id_service_line: idServiceLine,
                        id_user: listTowerControl[randomUser],
                      };
                      r.table("channels")
                        .insert(channel)
                        .run(conn, function (err, res) {
                          if (err) response.sendStatus(500);
                          response.json({
                            id_channel: channel.id_channel,
                          });
                        });
                    } else {
                      response.json({
                        id_channel: result[0].id_channel,
                      });
                    }
                  });
                }
              });
          }
        });
      });
  } catch (e) {
    response.json({
      error: e,
      status: 500,
    });
  }
});

channel.post("/reassign", async (req, res) => {
  const data = req.body;
  const conn = await getRethinkDB();
  r.table("channels")
    .filter({ id_channel: data.id_channel })
    .update({ id_user: data.id_user })
    .run(conn, (err, res) => {
      sendMessageRabbit({
        id_channel: "update_user_channel",
        msg: data,
        queryMySql: updateChannelUserMySql,
      });
      if (err) console.log(err);
      res.json({
        status: "success",
        message: "Channel reassigned successfully",
      });
    });
});

// get channels by product
channel.get("/by-collab", async (req, response) => {
  const conn = await getRethinkDB();
  const idUser = req.query.id_user;
  r.table("channels")
    .eqJoin(r.row("id_member"), r.table("members"))
    .without({ right: "id" })
    .zip()
    .filter({ id_user: idUser })
    .run(conn, (err, cursor) => {
      if (err) console.log(err);
      cursor.toArray((err, result) => {
        if (err) console.log(err);
        response.json({
          data: result,
        });
      });
    });
});

// MySql Queries
export const addChannelsInMySql = (data) => {
  connectMysql((conn) => {
    conn.connect((err) => {
      if (err) console.log(err);
      console.log("connected");
    });
    const query = `INSERT INTO channels (id, id_channel, create_at, id_service_line, id_user, id_member) VALUES ("${data.id}", "${data.id_channel}", "${data.create_at}", "${data.id_service_line}", "${data.id_user}", "${data.id_member}");`;
    conn.query(query, (err, result) => {
      if (err) console.log(err);
      console.log("Insert Channel in mysql: ", data.id);
    });
    conn.end();
  });
};

const updateChannelUserMySql = (data) => {
  connectMysql((conn) => {
    conn.connect((err) => {
      if (err) console.log(err);
      console.log("connected");
    });
    const query = `UPDATE channels SET id_user = "${data.id_user}" WHERE id_channel = "${data.id_channel}"`;
    conn.query(query, (err, result) => {
      if (err) console.log(err);
      console.log("Update Channel in mysql: ", data.id);
    });
    conn.end();
  });
};

export default channel;
