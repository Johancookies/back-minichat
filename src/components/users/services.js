import getRethinkDB from "../../config/db.js";
import r from "rethinkdb";

import notificationServices from "../notifications/services.js";
import sendMessageRabbit from "../../rabbitmq/send.js";
import getConnectionMySql from "../../config/mysql.js";

const service = {};

service.addUser = async (user) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter({ id_user: user.id })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          if (result.length === 0) {
            let dataUser = {
              id_user: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              role_id: user.role_id,
              status: "inactive",
            };

            r.table("users")
              .insert(dataUser)
              .run(conn, (err, result) => {
                if (err) reject(err);
                dataUser.id_rethink = result.generated_keys[0];

                const dataToken = {
                  device: user.device,
                  type: user.type,
                  id_user: user.id ?? null,
                  id_member: null,
                  token: user.token,
                };
                sendMessageRabbit({
                  msg: { ...dataUser, ...dataToken },
                  flag: "insert_user",
                });
                resolve({
                  message: "User added successfully",
                  status: "success",
                });
                notificationServices.addTokens(dataToken);
              });
          } else {
            r.table("users")
              .filter({ id_user: user.id })
              .update({
                first_name: user.first_name,
                last_name: user.last_name,
              })
              .run(conn, (err, res) => {
                if (err) console.log(err);
                else {
                  console.log("user update");
                }
              });

            resolve({
              message: "User already exist",
              status: "success",
            });
            r.table("token_notification")
              .filter(
                r.row("id_user").eq(user.id).and(r.row("token").eq(user.token))
              )
              .update({ token: user.token })
              .run(conn, (err, result) => {
                if (err) console.log(err);
              });
          }
        });
      });
  });
};

service.getUsers = async (filter) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
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

service.chageStatus = async (body) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter({ id_user: body.id_user })
      .update({ status: body.status })
      .run(conn, (err, res) => {
        if (err) reject(err);

        sendMessageRabbit({
          msg: {
            id_user: body.id_user,
            status: body.status,
          },
          flag: "update_user_status",
        });

        resolve({
          message: "Change status successfully",
          status: "success",
        });
      });
  });
};

service.countUsers = async (filter) => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter(filter)
      .count()
      .run(conn, (err, result) => {
        if (err) reject(err);
        resolve({ data: result });
      });
  });
};

service.addUserBot = async () => {
  const conn = await getRethinkDB();

  return new Promise((resolve, reject) => {
    r.table("users")
      .filter({ id_user: 11111111 })
      .run(conn, (err, cursor) => {
        if (err) reject(err);
        cursor.toArray((err, result) => {
          if (err) reject(err);
          if (result.length === 0) {
            let dataUser = {
                id_user: 11111111, // Cambiar el id_user si es necesario puede ser cualquiera
                first_name: 'Bot',
                last_name: 'Bot',
                role_id: 11111111, // Cambiar el role_id si es necesario puede ser cualquiera
                status: "inactive",
            };

            r.table("users")
                .insert(dataUser)
                .run(conn, (err, result) => {
                if (err) reject(err);
                dataUser.id_rethink = result.generated_keys[0];

                const dataToken = {
                    device: null,
                    type: 'bot',
                    id_user: dataUser.id_user ?? null,
                    id_member: null,
                    token: 11111111,
                };
                sendMessageRabbit({
                    msg: { ...dataUser, ...dataToken },
                    flag: "insert_user",
                });
                resolve({
                    message: "User added successfully",
                    status: "success",
                });
                //   notificationServices.addTokens(dataToken);
            });
          }
        });
      });
  });
};

service.addUsersSql = (member) =>{
  const connMySql = getConnectionMySql();
  const query = () => {
    return new Promise((res, rej) => {
      // Insert data user
      connMySql.query(
        `INSERT INTO users (first_name, id_user, last_name, role_id, status, id_rethink) VALUES ('${member.first_name}','${member.id_user}','${member.last_name}','${member.role_id}','${member.status}','${member.id_rethink}')`,
        (err, result) => {
          if (err) rej(err);
          // connMySql.query(
          //     `INSERT INTO token_notification (device, id_user, token, type, id_member) VALUES ('${member.device}','${member.id_user}','${member.token}','${member.type}','')`,
          //     (err, result) => {
          //       // Insert data token user
          //       if (err) rej(err);
          //       console.log(result);
          //       res("execute query successfully")
          //     }
          //   );
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

service.updateStatusUserSql = (member) =>{ 
  const connMySql = getConnectionMySql();
  const query = () => {
    return new Promise((res, rej) => {
      connMySql.query(
        `UPDATE users SET status = '${member.status}' WHERE id_user = '${member.id_user}'`,
        (err, result) => {
          if (err) rej(err);
          res("execute query successfully")
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

service.insertTokenSql = (member) =>{ 
  const connMySql = getConnectionMySql();
  const query = () => {
    return new Promise((res, rej) => {
      try {
        connMySql.query(
            `INSERT INTO token_notification (id_rethink, device, id_member, id_user, token, type) VALUES ('${member.id_rethink}','${member.device}','${member.id_member ?? null}','${member.id_user ?? null}','${member.token}','${member.type}')`,
            (err, result) => {
                if (err) rej(err);
                res("execute query successfully")
            }
        );
      } catch (error) {
        console.log({error});
      }  
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
