import express from "express";
import r from "rethinkdb";
import getRethinkDB from "../config/db.js";

const users = express.Router();

users.post("/", async (req, response) => {
  const conn = await getRethinkDB();
	const user = req.body;
	const {id, token, first_name, last_name, role_id} = req.body // valited for no broken the server
	if ((!id) || (!token) || (!first_name) || (!last_name) || (!role_id)) response.sendStatus(204)
  r.table("users")
    .filter({ id_user: user.id })
    .run(conn, (err, cursor) => {
      if (err) {
        response.json({ message: "Something went wrong!", status: "error" });
      } else {
        cursor.toArray((err, result) => {
          if (err) {
            console.log(err);
            response.sendStatus(400);
          } else {
            if (result.length === 0) {
              let dataUser = {
                id_user: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
								role_id: user.role_id,
              };
              r.table("users")
                .insert(dataUser)
                .run(conn, (err, res) => {
									if (err) {
										response.sendStatus(500)
                    console.log(err);
                  } else {
                    const dataToken = {
                      device: user.device,
                      type: user.type,
                      id_user: user.id ?? null,
                      id_member: null,
                      token: user.token,
                    };
                    r.table("token_notification")
                      .insert(dataToken)
                      .run(conn, (err, res) => {
												if (err) {
													response.sendStatus(500)
                          response.json({
                            message: "Something went wrong!",
                            status: "error",
                          });
												} else {
													response.sendStatus(200)
                          response.json({
                            message: "User added successfully!",
                            status: "success",
                          });
                        }
                      });
                  }
                });
            } else {
              r.table("token_notification")
                .filter(
                  r
                    .row("id_user")
                    .eq(user.id)
                    .and(r.row("token").eq(user.token))
                )
                .run(conn, (err, cursor) => {
                  if (err) {
                    console.log(err);
                    response.sendStatus(400);
                  } else {
                    cursor.toArray((err, result) => {
                      if (err) {
                        console.log(err);
                        response.sendStatus(400);
                      } else {
                        if (result.length === 0) {
                          const dataToken = {
                            device: user.device,
                            type: user.type,
                            id_user: user.id ?? null,
                            id_member: null,
                            token: user.token,
                          };
                          r.table("token_notification")
                            .insert(dataToken)
                            .run(conn, (err, res) => {
                              if (err) {
                                console.log(err);
                                response.sendStatus(400);
                              } else {
                                response.sendStatus(200);
                                response.json({
                                  message: "Token added successfully",
                                  status: "success",
                                });
                              }
                            });
                        }
                      }
                    });
                  }
                });
            }
          }
        });
      }
    });
});

export default users;
