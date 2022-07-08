import amqp from "amqplib/callback_api.js";

export default (callback) => {
  amqp.connect("amqp://localhost", (err, conn) => {
    if (err) console.error(err);
    callback(conn);
  });
};