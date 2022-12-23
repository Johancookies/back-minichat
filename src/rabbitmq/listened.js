import rabbitConnect from "./rabbitConnect.js";

import memberService from "../components/member/services.js"
import usersService from "../components/users/services.js"
import channelService from "../components/channels/services.js"
import meetingService from "../components/meetings/services.js"
import messagesService from "../components/messages/services.js"
import channelHistoryService from "../components/channels/services.js"
import tokenService from "../components/users/services.js"


const receiveMsg = () => {
  rabbitConnect((conn) => {
    conn.createChannel((err, channel) => {
      if (err) console.error(err);
      const queue = "chat_msm_env";

      channel.assertQueue(queue, {
        durable: false,
      });
      channel.prefetch(1);
      console.log(
        " [*] Waiting for messages in %s. To exit press CTRL+C ",
        queue
      );
      channel.consume(
        queue,
        async (msg) => {
          const message = JSON.parse(msg.content.toString());
          switch (message.flag) {
            case 'insert_member':
              memberService.addMemberSql(message);
              break;

            case 'insert_user':
              usersService.addUsersSql(message);
              break;
            
            case 'insert_channel':
              channelService.addChannelSql(message);
              break;

            case 'insert_meeting':
              meetingService.addMeetingSql(message);
              break;

            case 'insert_messages':
              messagesService.addMessagesSql(message);
              break;

            case 'update_statusmeeting':
              meetingService.addStatusMeetingSql(message);
              break;

            case 'update_channel_user':
              channelService.updateChannelSql(message);
              break;

            case 'insert_reassign':
              channelHistoryService.addReassingSql(message);
              break;

            case 'update_user_status':
              usersService.updateStatusUserSql(message);
              break;
            
            case 'insert_token':
              tokenService.insertTokenSql(message);
              break;
              
            default:
              break;
          }
          console.log("[x] message recieved ", msg.content.toString());
        },
        { noAck: true }
      );
    });
  });
};

export default receiveMsg;