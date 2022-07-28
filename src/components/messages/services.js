import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";
import ioEmmit from "../../../app.js";

import meetingService from "../meetings/services.js";
import channelService from "../channels/services.js";
import notificationsService from "../notifications/services.js";
import memberService from "../member/services.js";

const service = {};

export const url_taskMap = {};

service.getByChannel = async (id_channel) => {
  const conn = await getRethinkDB();
  return new Promise((resolve, reject) => {
    r.table("messages")
      .filter({ id_channel: id_channel })
      .orderBy(r.asc("create_at"))
      .run(conn, (err, cursor) => {
        if (err) reject({ error: err });
        cursor.toArray((err, result) => {
          if (err) reject({ error: err });
          resolve({ data: result });
        });
      });
  });
};

service.addMessages = async (message, file) => {
  return new Promise((resolve, reject) => {
    meetingService
      .getMeetingActiveByChannel(message.id_channel)
      .then((result) => {
        if (result.length === 0) {
          meetingService
            .createMeeting(message.id_channel)
            .then((result) => {
              message = result.id;
              service
                .insertMessage(message, file)
                .then((result) => {
                  resolve(result);
                })
                .catch((err) => {
                  reject(err);
                });
            })
            .catch((err) => {
              reject(err);
            });
        } else {
          if (result[0].status === "waiting") {
            meetingService.status(result[0].id, "active");
          }
          const timeout = setTimeout(() => {
            meetingService.status(result[0].id, "inactive").then((result) => {
              console.log("inactive meeting" + result[0].id);
              ioEmmit({ key: "close_meeting", message: result[0].id });
            });
          }, 60000);
          if (url_taskMap[result[0].id]) {
            clearTimeout(url_taskMap[result[0].id]);
          }
          url_taskMap[result[0].id] = timeout;

          message.id_meet = result[0].id;
          service
            .insertMessage(message, file)
            .then((result) => {
              resolve(result);
            })
            .catch((err) => {
              reject(err);
            });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

service.insertMessage = async (message, file) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    try {
      if (message.type === "text") {
        r.table("messages")
          .insert(message)
          .run(conn, (err, res) => {
            if (err) reject({ error: 500 });
            message.id_rethink = res.generated_keys[0];
            message.flag = "insert_messages";
            // sendMessageRabbit({
            //   msg: message,
            // });
            let messageStatus = {
              id_message: res.generated_keys[0],
              status: "sent",
            };
            service.messageStatus(messageStatus);
            resolve({ status: 200, message: message });

            service.messageNotification(message);
          });
      } else {
        message.url_file = file.location;
        message.name_file = file.originalname;
        message.size_file = file.size;
        r.table("messages")
          .insert(message)
          .run(conn, (err, res) => {
            if (err) console.log(err);
            message.id_rethink = res.generated_keys[0];
            message.flag = "insert_messages";
            // sendMessageRabbit({
            //   msg: message,
            // });
            let messageStatus = {
              id_message: res.generated_keys[0],
              status: "sent",
            };
            service.messageStatus(messageStatus);
            resolve({ status: 200, message: message });

            service.messageNotification(message);
          });
      }
    } catch (e) {
      resolve({ error: e, status: 500 });
    }
  });
};

service.messageNotification = (message) => {
  channelService
    .channelById(message.id_channel)
    .then((result) => {
      if (result.length > 0) {
        if (message.author_type === "member") {
          notificationsService.sendNotification({
            id_user: result[0].id_user,
          });
        } else {
          memberService
            .getMember(result[0].id_member)
            .then((result) => {
              notificationsService.sendNotification({
                id_member: result[0].id_member,
              });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      } else {
        reject("channel not found");
      }
    })
    .catch((err) => {
      reject(err);
    });
};

service.messageStatus = async (status) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("message_status")
      .insert(status)
      .run(conn, (err, res) => {
        if (err) console.log(err);
        resolve("change status successfully");
      });
  });
};

service.createChanges = async (id_channel) => {
  const conn = await getRethinkDB();

  r.table("messages")
    .filter({ id_channel: id_channel })
    .changes()
    .run(conn, (err, cursorChanges) => {
      if (err) console.error(err);
      cursorChanges.each((err, result) => {
        console.log(result.new_val);
        ioEmmit({
          key: "receive_message",
          data: {
            ...result.new_val,
            status: "sent",
          },
          to: id_channel,
        });
      });
    });
};

export default service;
