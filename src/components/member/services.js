import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";

import notificationServices from "../notifications/services.js";
import sendMessageRabbit from "../../rabbitmq/send.js";
import getConnectionMySql from "../../config/mysql.js";

const service = {};

service.addMember = async (member) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    service
      .getMember(member.id)
      .then((result) => {
        const dataToken = {
          device: member.device ?? null,
          type: "mobile",
          id_user: member.id_user ?? null,
          id_member: member.id ?? null,
          token: member.token ?? null,
        };
        notificationServices.updateTokensByMembers({ id_member: member.id, token: dataToken });
        if (result.length === 0) {
          let dataMember = {
            id_member: member.id,
            document_number: member.document_number,
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            mobile_phone: member.mobile_phone,
            photo: member.photo,
            brand: member.brand ?? 1
          };
          r.table("members")
            .insert(dataMember)
            .run(conn, (err, result) => {
              if (err) reject(err);
              dataMember.id_rethink = result.generated_keys[0];

              sendMessageRabbit({
                msg: { ...dataMember, ...dataToken },
                flag: "insert_member",
              });

              resolve({
                message: "Member added successfully",
                status: "success",
              });
            });
        } else {
          r.table('members')
            .filter({
              id_member: member.id
            })
            .update({
              brand: member.brand ?? 1
            })
            .run(conn, (err, result) => {
              resolve({
                message: "Current user exist!",
                status: "success",
              });
            })
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

service.filter = async () => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("members")
      .filter(function (doc) {
        return doc("first_name").match("rafa");
      })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, mebers) => {
          if (err) reject(err);
          mebers.forEach((val) => {
            r.table("token_notification")
              .filter({ id_member: val.id_member })
              .run(conn, (err, cursor) => {
                if (err) reject(err);
                cursor.toArray((err, result) => {
                  if (err) reject(err);
                  console.log({ member: val, tokens: result });
                });
              });
          });
          resolve("ok");
        });
      });
  });
};

service.addMemberSql = (member) =>{ 
  const connMySql = getConnectionMySql();
  const query = () => {
    return new Promise((res, rej) => {
      connMySql.query(
        `INSERT INTO members (id_member, document_number, email, first_name, last_name, mobile_phone,photo, id_rethink) VALUES ('${member.id_member}','${member.document_number}','${member.email}','${member.first_name}','${member.last_name}','${member.mobile_phone}','${member.photo}','${member.id_rethink}')`,
        (err, result) => {
          if (err) rej(err);
          console.log(result);
          // try {
          //   connMySql.query(
          //     `INSERT INTO token_notification (device, id_user, token, type, id_member) VALUES ('${member.device}','','${member.token}','${member.type}','${member.id_member}')`,
          //     (err, result) => {
          //       // Insert data token user
          //       if (err) rej(err);
          //       console.log(result);
          //       res("execute query successfully")
          //     }
          //   );
          // } catch (error) {
          //   console.log(error);
          // }
        }
      );
    });
  };
  query()
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });
}

export default service;
