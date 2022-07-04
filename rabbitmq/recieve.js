import amqp from "amqplib/callback_api.js";

amqp.connect("amqp://localhost", (err, conn) => {
  if (err) console.error(err);
  conn.createChannel((err, channel) => {
    if (err) console.error(err);
    const queue = "my-queue2";

    channel.assertQueue(queue, {
      durable: true,
    });
    channel.prefetch(1);
    console.log(
      " [*] Waiting for messages in %s. To exit press CTRL+C ",
      queue
		);
    channel.consume(
      queue,
      (msg) => {
        console.log("[x] message recieved ", msg.content.toString());
      },
      { noAck: true }
    );
  });
});
