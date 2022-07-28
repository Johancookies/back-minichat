import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";
import ioEmmit from "../../../app.js";
import { getRandomInt } from "../../helpers/helper_functions.js";

import usersService from "../users/services.js";
import membersService from "../member/services.js";

const service = {};

service.channel = async (body) => {
  const conn = await getRethinkDB();

  const id_channel = body.id_member + body.id_service_line;
  var id_user = body.id_user;

  return new Promise((resolve, reject) => {
    r.table("channels")
      .filter({ id_channel: id_channel })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);

          if (result.length > 0) {
            if (id_user) {
              service.reassign(id_channel, id_user).then((result) => {
                resolve({
                  ...result,
                  id_channel,
                });
              });
            } else {
              usersService
                .getUsers({ id_user: result[0].id_user, status: "active" })
                .then((result) => {
                  if (result.length > 0) {
                    resolve(result[0]);
                  } else {
                    usersService
                      .getUsers({ status: "active", role_id: 39 })
                      .then((users) => {
                        if (users.length > 0) {
                          const randomUser = getRandomInt(0, users.length - 1);
                          id_user = users[randomUser].id_user;
                          service
                            .reassign(id_channel, id_user)
                            .then((result) => {
                              resolve({
                                ...result,
                                id_channel,
                              });
                            });
                        } else {
                          reject({
                            message: "No hay usuarios disponibles.",
                          });
                        }
                      });
                  }
                })
                .catch((err) => {
                  reject(err);
                });
            }
          } else {
            membersService
              .getMember(parseInt(body.id_member))
              .then((member) => {
                let channel = {
                  id_channel: id_channel,
                  id_member: member[0].id,
                  id_service_line: id_service_line,
                  id_user: id_user,
                };
                if (id_user) {
                  service
                    .createChannel(channel)
                    .then((result) => {
                      resolve(result);
                    })
                    .catch((err) => {
                      reject(err);
                    });
                } else {
                  usersService
                    .getUsers({ status: "active", role_id: 39 })
                    .then((users) => {
                      if (users.length > 0) {
                        const randomUser = getRandomInt(0, users.length - 1);
                        channel.id_user = users[randomUser].id_user;

                        service
                          .createChannel(channel)
                          .then((result) => {
                            resolve(result);
                          })
                          .catch((err) => {
                            reject(err);
                          });
                      } else {
                        reject({
                          message: "No hay usuarios disponibles.",
                        });
                      }
                    })
                    .catch((err) => {
                      reject(err);
                    });
                }
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      });
  });
};

service.createChannel = async (channel) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    channel.create_at = new Date();

    r.table("channels")
      .insert(channel)
      .run(conn, (err, res) => {
        if (err) reject(err);
        console.log("new channel to user" + channel.id_user);
        ioEmmit({
          key: "new_channels",
          data: {
            id_user: channel.id_user,
            id_channel: channel.id_channel,
          },
        });
        resolve({
          id_channel: channel.id_channel,
        });
      });
  });
};

service.channelById = async (id_channel) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("channels")
      .filter({ id_channel: id_channel })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
  });
};

service.reassign = async (id_channel, id_user) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("channels")
      .filter({ id_channel: id_channel })
      .update({ id_user: id_user.toString() })
      .run(conn, (err, res) => {
        if (err) reject(err);
        ioEmmit({
          key: "new_channels",
          data: { id_user: id_user, id_channel: id_channel },
        });
        resolve({
          status: "success",
          message: "Channel reassigned successfully",
        });
      });
  });
};

service.byUser = async (id_user) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("channels")
      .eqJoin(r.row("id_member"), r.table("members"))
      .without({ right: "id" })
      .zip()
      .filter({ id_user: id_user })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve({
            data: result,
          });
        });
      });
  });
};

export default service;
