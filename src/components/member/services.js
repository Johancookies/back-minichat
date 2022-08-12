import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";

import notificationServices from "../notifications/services.js";

const service = {};

service.addMember = async (member) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    service
      .getMember(member.id)
      .then((result) => {
        if (result.length === 0) {
          let dataMember = {
            id_member: member.id,
            document_number: member.document_number,
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            mobile_phone: member.mobile_phone,
            photo: member.photo,
          };

          r.table("members")
            .insert(dataMember)
            .run(conn, (err, result) => {
              if (err) reject(err);
              resolve({
                message: "Member added successfully",
                status: "success",
              });
            });

          if (member.token) {
            const dataToken = {
              device: member.device,
              type: "mobile",
              id_user: member.id_user ?? null,
              id_member: member.id ?? null,
              token: member.token,
            };
            notificationServices.addTokens(dataToken);
          } else {
            notificationServices.addTokens(null, member.id);
          }
        } else {
          resolve({
            message: "Current user exist!",
            status: "success",
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

service.getMember = async (id_member) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("members")
      .filter({
        id_member: id_member,
      })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
  });
};

service.getMemberByRethink = async (id) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("members")
      .filter({
        id: id,
      })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
  });
};

service.countMember = async () => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("members")
      .count()
      .run(conn, (err, result) => {
        if (err) reject(err);
        resolve({ data: result });
      });
  });
};

service.members = async () => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("members").run(conn, (err, cursor) => {
      if (err) reject(err);
      cursor.toArray((err, result) => {
        if (err) reject(err);
        resolve({ data: result });
      });
    });
  });
};

export default service;
