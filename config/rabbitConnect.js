import amqp from "amqplib/callback_api.js";

export default (callback) => {
  amqp.connect(
    "amqp://" +
      process.env.RABBITMQ_USER +
      ":" +
      process.env.RABBITMQ_PASS +
      "@" +
      RABBITMQ_HOST +
      ":" +
      RABBITMQ_PORT +
      "",
    (err, conn) => {
      if (err) console.error(err);
      console.log("rabit connetc");
      callback(conn);
    }
  );
};
