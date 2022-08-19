import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";
import ioEmmit from "../../../app.js";

import messageService from "../messages/services.js";

import { url_taskMap } from "../messages/services.js";
import sendMessageRabbit from "../../rabbitmq/send.js";

const service = {};

service.createMeeting = async (id_channel) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    let dataMeeting = {
      id_channel: id_channel,
      create_at: new Date().toISOString(),
      status: "active",
    };
    r.table("meetings")
      .insert(dataMeeting)
      .run(conn, (err, res) => {
        if (err) reject(err);
        dataMeeting.id_rethink = res.generated_keys[0];
        console.log("meeting");
        sendMessageRabbit({
          msg: dataMeeting,
          flag: "insert_meeting",
        });
        const timeout = setTimeout(() => {
          service.closeMeeting(res.generated_keys[0], id_channel);
        }, 300000);

        url_taskMap[res.generated_keys[0]] = timeout;
        resolve({ id: res.generated_keys[0] });
      });
  });
};

service.closeMeetingByChannel = async (id_channel) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    service
      .getMeetingActiveByChannel(id_channel)
      .then((result) => {
        if (result.length > 0) {
          service.closeMeeting(result[0].id, id_channel);
          resolve("change status successfully");
        } else {
          resolve({ message: "not meeting found" });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

service.closeMeeting = async (id_meet, id_channel) => {
  service
    .status(id_meet, "inactive")
    .then((result) => {
      let tzoffset = new Date().getTimezoneOffset() * 60000;
      var create_at = new Date(Date.now() - tzoffset)
        .toISOString()
        .slice(0, -1);

      const meetData = {
        id_meet: id_meet,
        status: "inactive",
      };

      sendMessageRabbit({
        msg: meetData,
        flag: "update_statusmeeting",
      });

      const message = {
        author: "back",
        author_name: "back",
        author_type: "back",
        content: "Ha terminado esta conversación",
        create_at: create_at,
        id_channel: id_channel + "",
        id_meet: id_meet + "",
        type: "meet",
      };

      messageService
        .insertMessage(message)
        .then((result) => {
          console.log("close meeting ", id_meet);
          ioEmmit({ key: "close_meeting", message: id_channel });
        })
        .catch((err) => {
          console.log("error in close meet");
          console.log(err);
        });
    })
    .catch((err) => {
      console.log("error in close meet");
      console.log(err);
    });
};

service.status = async (id_meet, status) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("meetings")
      .filter({ id: id_meet })
      .update({ status: status })
      .run(conn, (err, res) => {
        if (err) reject(err);
        resolve("change status successfully");
      });
  });
};

service.getMeetingActiveByChannel = async (id_channel) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("meetings")
      .filter(
        r
          .row("id_channel")
          .eq(id_channel)
          .and(r.row("status").eq("active").or(r.row("status").eq("waiting")))
      )
      .limit(1)
      .run(conn, (err, cursor) => {
        if (err) reject(err);

        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
  });
};

service.changeStatusToWaiting = async (id_channel) => {
  const conn = await getRethinkDB();
  r.table("meetings")
    .filter(
      r.row("id_channel").eq(id_channel).and(r.row("status").eq("active"))
    )
    .limit(1)
    .update({ status: "waiting" })
    .run(conn, (err, res) => {
      if (err) console.log(err);
      if (res.replaced) {
        // const meetData = {
        //   id_meet: id_meet,
        //   status: "waiting",
        // };

        // sendMessageRabbit({
        //   msg: meetData,
        //   flag: "update_statusmeeting",
        // });

        console.log("change meeting status successfully", id_channel);
      }
    });
};

service.getMeetings = async (filter) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("meetings")
      .filter(filter)
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve({ data: result });
        });
      });
  });
};

service.getCountMeetings = async (filter) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("meetings")
      .filter(filter)
      .count()
      .run(conn, (err, result) => {
        if (err) reject(err);
        resolve({ data: result });
      });
  });
};

export default service;
