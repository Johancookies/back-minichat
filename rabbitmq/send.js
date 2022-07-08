import rabbitConnect from "../config/rabbitConnect.js";

const sendMessageRabbit = ({ id_channel, msg, res, queryMySql, }) => {
  rabbitConnect((conn) => {
    conn.createChannel((err, channel) => {
      if (err) console.log("rror")
      const queue = id_channel;
      const message = Buffer.from(JSON.stringify(msg));
      channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, message, { persistent: true });
      channel.prefetch(1);
      queryMySql(msg);
      channel.close(() => {
        conn.close();
      });
    });
  });
  //rabbitConnect((conn) => {
 //   conn.createChannel((err, channel) => {
   //   if (err) { console.log("error") }
    //  const queue = id_channel;
     // channel.assertQueue(queue, { durable: true });
      //channel.prefetch(1);
      //channel.consume(
       // queue,
        //function (msg) {
	 // console.log(msg);
          //var buf = JSON.parse(msg.content);
          //insert to database
          //queryMySql(buf);
        //},
        //{ noAck: true }
      //);
     // channel.close(() => {
      //  conn.close();
      //});
    //});
  //});
};

export default sendMessageRabbit;
