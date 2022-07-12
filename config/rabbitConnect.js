import amqp from "amqplib/callback_api.js";

export default (callback) => {
  amqp.connect("amqp://devops:Body123@100.21.116.102:5672", (err, conn) => {
    if (err) console.error(err);
    console.log("rabit connetc");
    callback(conn);
  });
};
