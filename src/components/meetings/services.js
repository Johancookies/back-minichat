import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";

import { url_taskMap } from "../messages/services.js";

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
        const timeout = setTimeout(() => {
          service.status(res.generated_keys[0], "inactive");
        }, 60000);
        if (url_taskMap[res.generated_keys[0]]) {
          clearTimeout(url_taskMap[res.generated_keys[0]]);
        }
        url_taskMap[res.generated_keys[0]] = timeout;
        resolve({ id: res.generated_keys[0] });
      });
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
      console.log("change meeting status successfully" + id_channel);
    });
};

export default service;
