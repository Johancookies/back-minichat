import rabbitConnect from "../config/rabbitConnect.js";

const sendMessageRabbit = ({ id_channel, msg, res, callback }) => {
  rabbitConnect((conn) => {
    conn.createChannel((err, channel) => {
      if (err)
        res.json({ message: "error at create channel rabbit", status: 500 });
      const queue = id_channel;
      const message = msg;
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
      channel.close(() => {
        conn.close();
      });
    });
  });
  callback(() => {
    rabbitConnect((conn) => {
      conn.createChannel((err, channel) => {
        if (err)
          res.json({ message: "error at create channel rabbit", status: 500 });
        channel.assertQueue(queue, { durable: true });
        channel.prefetch(1);
        channel.consume(
          queue,
          (msg) => {
            // insert to database
            console.log("menssage: ", msg);
          },
          { noAck: true }
        );
      });
    });
    return "sent to database mysql";
  });
};

export default sendMessageRabbit;
