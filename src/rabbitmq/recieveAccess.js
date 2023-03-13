import {connetRabbit} from "../config/rabbitConnect.js";
import getConnectionMySql from "../config/mysql.js";
import service from "../components/userState/services.js";

const accessControl = () => {
    connetRabbit((conn) => {
    conn.createChannel((err, channel) => {
      if (err) console.error(err);
      const queue = "access_control_local";
      
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
        async (data) => {
            let dataString = data.content.toString()
            let dataJson = JSON.parse(dataString)
            service.addUser(dataJson)
        },
        { noAck: true }
      );
    });
  });
};

export default accessControl;
