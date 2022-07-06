import rabbitConnect from "../config/rabbitConnect.js";

const sendMessageRabbit = ({ id_channel, msg, res, queryMySql, }) => {
  rabbitConnect((conn) => {
    conn.createChannel((err, channel) => {
      // if (err)
      //   res.json({ message: "error at create channel rabbit", status: 500 });
      const queue = id_channel;
      const message = Buffer.from(JSON.stringify(msg));
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, message, { persistent: true });
      channel.close(() => {
        conn.close();
      });
    });
  });
  rabbitConnect((conn) => {
    conn.createChannel((err, channel) => {
      // if (err)
      //   res.json({ message: "error at create channel rabbit", status: 500 });
      const queue = id_channel;
      channel.assertQueue(queue, { durable: true });
      channel.prefetch(1);
      channel.consume(
        queue,
        (msg) => {
          var buf = JSON.parse(msg.content);
          // insert to database
          queryMySql(buf);
        },
        { noAck: true }
      );
      // channel.close(() => {
      //   conn.close();
      // });
    });
  });
};

export default sendMessageRabbit;
