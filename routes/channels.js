import express from "express";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";
import ioEmmit from "../app.js";
import connectMysql from "../config/mysql.js";
import sendMessageRabbit from "../rabbitmq/send.js";
import { addMemberInMySql } from "../routes/members.js";
import { getRandomInt, listTowerControl } from "../helpers/helper_functions.js";
import fetch from "node-fetch";

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
    let idUserAsignet = member.id_user;
    const channelId = idMember + "" + idServiceLine; // id of the channel (unique)
    // connectMysql((connMysql) => {
    //   connMysql.connect((err) => {
    //     if (err) console.log(err);
    //     console.log("connected");
    //   });
    //   const query = `SELECT * FROM members where id_member = "${idMember}"`;
    //   connMysql.query(query, (err, res) => {
    //     if (err) console.log(err);
    //     if (res.length === 0) {
    //       let dataMember = {
    //         id_member: member.id,
    //         first_name: member.first_name,
    //         last_name: member.last_name,
    //         photo: member.photo,
    //         mobile_phone: member.mobile_phone,
    //         email: member.email,
    //         document_number: member.document_number,
    //       };
    //       r.table("members")
    //         .insert(dataMember)
    //         .run(conn, (err, res) => {
    //           if (err) console.log(err);
    //           dataMember.id = res.generated_keys[0];
    //           // sendMessageRabbit({
    //           //   id_channel: "insert_mysql",
    //           //   msg: dataMember,
    //           //   queryMySql: addMemberInMySql,
    //           // });
    //           addMemberInMySql(dataMember);
    //           if (member.token) {
    //             let token = {
    //               device: member.device,
    //               type: member.type,
    //               id_user: member.id_user ?? null,
    //               id_member: member.id ?? null,
    //               token: member.token,
    //             };
    //             r.table("token_notification")
    //               .insert(token)
    //               .run(conn, (err, res) => {
    //                 if (err) console.log(err);
    //               });
    //           } else {
    //             try {
    //               fetch(process.env.API_FETCH + member.id, {
    //                 method: "GET",
    //                 headers: {
    //                   Authorization: process.env.API_AUTHORIZATION,
    //                   "x-bodytech-organization": process.env.API_ORGANIZATION,
    //                   "x-bodytech-brand": process.env.API_BRAND,
    //                 },
    //               })
    //                 .then((res) => res.json())
    //                 .then((res) => {
    //                   if (res.data.length > 0) {
    //                     for (var i = 0; i < res.data.length; i++) {
    //                       let token = {
    //                         device: res.data[i].device,
    //                         type: res.data[i].os,
    //                         id_user: member.id_user ?? null,
    //                         id_member: member.id ?? null,
    //                         token: res.data[i].token,
    //                       };
    //                       r.table("token_notification")
    //                         .insert(token)
    //                         .run(conn, (err, res) => {
    //                           if (err) console.log(err);
    //                         });
    //                     }
    //                   }
    //                 });
    //             } catch (error) {
    //               console.log(error);
    //             }
    //           }
    //           r.table("channels")
    //             .filter({ id_channel: channelId })
    //             .run(conn, (err, cursor) => {
    //               if (err) response.sendStatus(500);
    //               cursor.toArray((err, result) => {
    //                 if (err) response.sendStatus(500);
    //                 if (result.length === 0) {
    //                   r.table("users")
    //                     .filter({ status: "active" })
    //                     .run(conn, (err, cursor) => {
    //                       if (err) console.log(err);
    //                       cursor.toArray((err, result) => {
    //                         if (err) console.log(err);
    //                         if (result.length > 0) {
    //                           const randomUser = getRandomInt(
    //                             0,
    //                             result.length - 1
    //                           );
    //                           const id_user = result[randomUser].id_user;
    //                           console.log(id_user);
    //                           const time = new Date(); // creaate the time of the channel
    //                           let channel = {
    //                             id_channel: channelId,
    //                             create_at: time,
    //                             id_member: res.generated_keys[0],
    //                             id_service_line: idServiceLine,
    //                             id_user: idUserAsignet ?? id_user,
    //                           };
    //                           console.log(channel);
    //                           r.table("channels")
    //                             .insert(channel)
    //                             .run(conn, function (err, res) {
    //                               if (err) console.log(err);
    //                               channel.id = res.generated_keys[0];
    //                               // sendMessageRabbit({
    //                               //   id_channel: "insert_mysql",
    //                               //   msg: channel,
    //                               //   queryMySql: addChannelsInMySql,
    //                               // });
    //                               addChannelsInMySql(channel);
    //                               ioEmmit({
    //                                 key: "new_channels",
    //                                 data: id_user,
    //                               });
    //                               response.json({
    //                                 id_channel: channel.id_channel,
    //                               });
    //                             });
    //                         } else {
    //                           response.json({
    //                             status: 500,
    //                             message: "No hay usuarios disponibles.",
    //                           });
    //                         }
    //                       });
    //                     });
    //                 } else {
    //                   response.json({
    //                     id_channel: result[0].id_channel,
    //                   });
    //                 }
    //               });
    //             });
    //         });
    //     } else {
    //       r.table("channels")
    //         .filter({ id_channel: channelId })
    //         .run(conn, (err, cursor) => {
    //           if (err) response.sendStatus(500);
    //           if (cursor) {
    //             cursor.toArray((err, result) => {
    //               if (err) response.sendStatus(500);
    //               if (result.length === 0) {
    //                 const time = new Date(); // creaate the time of the channel

    //                 r.table("users")
    //                   .filter({ status: "active" })
    //                   .run(conn, (err, cursor) => {
    //                     if (err) console.log(err);
    //                     cursor.toArray((err, result) => {
    //                       if (err) console.log(err);
    //                       if (result.length > 0) {
    //                         const randomUser = getRandomInt(
    //                           0,
    //                           result.length - 1
    //                         );
    //                         const id_user = result[randomUser].id_user;
    //                         let channel = {
    //                           id_channel: channelId,
    //                           create_at: time,
    //                           id_member: res[0].id,
    //                           id_service_line: idServiceLine,
    //                           id_user: idUserAsignet ?? id_user,
    //                         };
    //                         console.log(channel);
    //                         r.table("channels")
    //                           .insert(channel)
    //                           .run(conn, function (err, res) {
    //                             if (err) response.sendStatus(500);
    //                             channel.id = res.generated_keys[0];
    //                             // sendMessageRabbit({
    //                             //   id_channel: "insert_mysql",
    //                             //   msg: channel,
    //                             //   queryMySql: addChannelsInMySql,
    //                             // });
    //                             addChannelsInMySql(channel);
    //                             ioEmmit({
    //                               key: "new_channels",
    //                               data: id_user,
    //                             });
    //                             response.json({
    //                               id_channel: channel.id_channel,
    //                             });
    //                           });
    //                       } else {
    //                         response.json({
    //                           status: 500,
    //                           message: "No hay usuarios disponibles.",
    //                         });
    //                       }
    //                     });
    //                   });
    //               } else {
    //                 r.table("users")
    //                   .filter({
    //                     status: "active",
    //                     id_user: result[0].id_user,
    //                   })
    //                   .run(conn, (err, cursor) => {
    //                     if (err) console.log(err);
    //                     cursor.toArray((err, res) => {
    //                       if (err) console.log(err);
    //                       if (res.length > 0) {
    //                         response.json({
    //                           id_channel: result[0].id_channel,
    //                         });
    //                       } else {
    //                         r.table("users")
    //                           .filter({ status: "active" })
    //                           .run(conn, (err, cursor) => {
    //                             if (err) console.log(err);
    //                             cursor.toArray((err, users) => {
    //                               if (err) console.log(err);
    //                               if (users.length > 0) {
    //                                 const randomUser = getRandomInt(
    //                                   0,
    //                                   result.length - 1
    //                                 );
    //                                 const id_user = users[randomUser].id_user;

    //                                 r.table("channels")
    //                                   .filter({
    //                                     id_channel: result[0].id_channel,
    //                                   })
    //                                   .update({
    //                                     id_user: idUserAsignet ?? id_user,
    //                                   })
    //                                   .run(conn, (err, res) => {
    //                                     if (err) console.log(err);
    //                                     response.json({
    //                                       id_channel: result[0].id_channel,
    //                                     });
    //                                   });
    //                               } else {
    //                                 response.json({
    //                                   status: 500,
    //                                   message: "No hay usuarios disponibles.",
    //                                 });
    //                               }
    //                             });
    //                           });
    //                       }
    //                     });
    //                   });
    //               }
    //             });
    //           }
    //         });
    //     }
    //   });
    //   connMysql.end();
    // });
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
              mobile_phone: member.mobile_phone,
              email: member.email,
              document_number: member.document_number,
            };
            r.table("members")
              .insert(dataMember)
              .run(conn, (err, res) => {
                if (err) console.log(err);
                dataMember.id = res.generated_keys[0];
                // sendMessageRabbit({
                //   id_channel: "create_members",
                //   msg: dataMember,
                //   queryMySql: addMemberInMySql,
                // });
                // addMemberInMySql(dataMember);
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
                } else {
                  try {
                    fetch(process.env.API_FETCH + member.id, {
                      method: "GET",
                      headers: {
                        Authorization: process.env.API_AUTHORIZATION,
                        "x-bodytech-organization": process.env.API_ORGANIZATION,
                        "x-bodytech-brand": process.env.API_BRAND,
                      },
                    })
                      .then((res) => res.json())
                      .then((res) => {
                        if (res.data.length > 0) {
                          for (var i = 0; i < res.data.length; i++) {
                            let token = {
                              device: res.data[i].device,
                              type: res.data[i].os,
                              id_user: member.id_user ?? null,
                              id_member: member.id ?? null,
                              token: res.data[i].token,
                            };
                            r.table("token_notification")
                              .insert(token)
                              .run(conn, (err, res) => {
                                if (err) console.log(err);
                              });
                          }
                        }
                      });
                  } catch (error) {
                    console.log(error);
                  }
                }
                r.table("channels")
                  .filter({ id_channel: channelId })
                  .run(conn, (err, cursor) => {
                    if (err) response.sendStatus(500);
                    cursor.toArray((err, result) => {
                      if (err) response.sendStatus(500);
                      if (result.length === 0) {
                        r.table("users")
                          .filter({ status: "active" })
                          .run(conn, (err, cursor) => {
                            if (err) console.log(err);
                            cursor.toArray((err, result) => {
                              if (err) console.log(err);
                              if (result.length > 0) {
                                const randomUser = getRandomInt(
                                  0,
                                  result.length - 1
                                );
                                const id_user = result[randomUser].id_user;
                                console.log(id_user);
                                const time = new Date(); // creaate the time of the channel
                                let channel = {
                                  id_channel: channelId,
                                  create_at: time,
                                  id_member: res.generated_keys[0],
                                  id_service_line: idServiceLine,
                                  id_user: idUserAsignet ?? id_user,
                                };
                                console.log(channel);
                                r.table("channels")
                                  .insert(channel)
                                  .run(conn, function (err, res) {
                                    if (err) console.log(err);
                                    channel.id = res.generated_keys[0];
                                    // sendMessageRabbit({
                                    //   id_channel: "create_channels",
                                    //   msg: channel,
                                    //   queryMySql: addChannelsInMySql,
                                    // });
                                    // addChannelsInMySql(channel);
                                    save(dataMember, channel);
                                    ioEmmit({
                                      key: "new_channels",
                                      data: id_user,
                                    });
                                    response.json({
                                      id_channel: channel.id_channel,
                                    });
                                  });
                              } else {
                                response.json({
                                  status: 500,
                                  message: "No hay usuarios disponibles.",
                                });
                              }
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

                      r.table("users")
                        .filter({ status: "active" })
                        .run(conn, (err, cursor) => {
                          if (err) console.log(err);
                          cursor.toArray((err, result) => {
                            if (err) console.log(err);
                            if (result.length > 0) {
                              const randomUser = getRandomInt(
                                0,
                                result.length - 1
                              );
                              const id_user = result[randomUser].id_user;
                              let channel = {
                                id_channel: channelId,
                                create_at: time,
                                id_member: res[0].id,
                                id_service_line: idServiceLine,
                                id_user: idUserAsignet ?? id_user,
                              };
                              console.log(channel);
                              r.table("channels")
                                .insert(channel)
                                .run(conn, function (err, res) {
                                  if (err) response.sendStatus(500);
                                  channel.id = res.generated_keys[0];
                                  // sendMessageRabbit({
                                  //   id_channel: "insert_mysql",
                                  //   msg: channel,
                                  //   queryMySql: addChannelsInMySql,
                                  // });
                                  addChannelsInMySql(channel);
                                  ioEmmit({
                                    key: "new_channels",
                                    data: id_user,
                                  });
                                  response.json({
                                    id_channel: channel.id_channel,
                                  });
                                });
                            } else {
                              response.json({
                                status: 500,
                                message: "No hay usuarios disponibles.",
                              });
                            }
                          });
                        });
                    } else {
                      r.table("users")
                        .filter({
                          status: "active",
                          id_user: result[0].id_user,
                        })
                        .run(conn, (err, cursor) => {
                          if (err) console.log(err);
                          cursor.toArray((err, res) => {
                            if (err) console.log(err);
                            if (res.length > 0) {
                              response.json({
                                id_channel: result[0].id_channel,
                              });
                            } else {
                              r.table("users")
                                .filter({ status: "active" })
                                .run(conn, (err, cursor) => {
                                  if (err) console.log(err);
                                  cursor.toArray((err, users) => {
                                    if (err) console.log(err);
                                    if (users.length > 0) {
                                      const randomUser = getRandomInt(
                                        0,
                                        result.length - 1
                                      );
                                      const id_user = users[randomUser].id_user;

                                      r.table("channels")
                                        .filter({
                                          id_channel: result[0].id_channel,
                                        })
                                        .update({
                                          id_user: idUserAsignet ?? id_user,
                                        })
                                        .run(conn, (err, res) => {
                                          if (err) console.log(err);
                                          response.json({
                                            id_channel: result[0].id_channel,
                                          });
                                        });
                                    } else {
                                      response.json({
                                        status: 500,
                                        message: "No hay usuarios disponibles.",
                                      });
                                    }
                                  });
                                });
                            }
                          });
                        });
                    }
                  });
                }
              });
          }
        });
      });
  } catch (e) {
    console.log(e);
    response.json({
      error: e,
      status: 500,
    });
  }
});

channel.post("/reassign", async (req, response) => {
  const data = req.body;
  const conn = await getRethinkDB();
  r.table("channels")
    .filter({ id_channel: data.id_channel })
    .update({ id_user: data.id_user })
    .run(conn, (err, res) => {
      // sendMessageRabbit({
      //   id_channel: "insert_mysql",
      //   msg: data,
      //   queryMySql: updateChannelUserMySql,
      // });
      updateChannelUserMySql(data);
      if (err) console.log(err);
      response.json({
        status: "success",
        message: "Channel reassigned successfully",
      });
    });
});

// get channels by product
channel.get("/by-collab", async (req, response) => {
  const conn = await getRethinkDB();
  const idUser = parseInt(req.query.id_user);
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
    console.log(data.id_member);
    const query = `INSERT INTO channels (id_rethink, create_at, id_channel, id_member, id_service_line, id_user) VALUES ("${data.id}", "${data.create_at}",  "${data.id_channel}", "${data.id_member}", "${data.id_service_line}", "${data.id_user}");`;
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

const save = async (member, channel) => {
  console.log("entra");
  await addMemberInMySql(member);
  console.log("despues");
  addChannelsInMySql(channel);
};

export default channel;
