import "dotenv/config.js";
import mysql from 'mysql';
import getRethinkDB from "./src/rethinkdb/rethinkdb.js";
import r from "rethinkdb";
import { InsertLogs } from "./src/utils/insert_logs.js";
import fs from 'fs';
import token_notification from './token_notification.json' assert { type: "json" };
import users from './users.json' assert { type: "json" };
import members from './members.json' assert { type: "json" };
import channels from './channels.json' assert { type: "json" };
import meetings from './meetings.json' assert { type: "json" };
import messages from './messages.json' assert { type: "json" };
import message_status from './message_status.json' assert { type: "json" };
import reasign_history from './reasign_history.json' assert { type: "json" };

console.log(`

[̲̅P][̲̅R][̲̅O][̲̅Y][̲̅E][̲̅C][̲̅T] [̲̅K][̲̅A][̲̅I]

───────█████████████████████
────████▀─────────────────▀████
──███▀───────────────────────▀███
─██▀───────────────────────────▀██
█▀───────────────────────────────▀█
█─────────────────────────────────█
█─────────────────────────────────█
█─────────────────────────────────█
█───█████─────────────────█████───█
█──██▓▓▓███─────────────███▓▓▓██──█
█──██▓▓▓▓▓██───────────██▓▓▓▓▓██──█
█──██▓▓▓▓▓▓██─────────██▓▓▓▓▓▓██──█
█▄──████▓▓▓▓██───────██▓▓▓▓████──▄█
▀█▄───▀███▓▓▓██─────██▓▓▓███▀───▄█▀
──█▄────▀█████▀─────▀█████▀────▄█
─▄██───────────▄█─█▄───────────██▄
─███───────────██─██───────────███
─███───────────────────────────███
──▀██──██▀██──█──█──█──██▀██──██▀
───▀████▀─██──█──█──█──██─▀████▀
────▀██▀──██──█──█──█──██──▀██▀
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
──────────██──█──█──█──██
───────────█▄▄█▄▄█▄▄█▄▄█

`);

console.log(`

    \r\n\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2557\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2591\u2588\u2588\u2557\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2591\r\n\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2591\r\n\u2588\u2588\u2551\u2591\u2591\u255A\u2550\u255D\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2557\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2557\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2557\u2591\r\n\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2551\u2591\u255A\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2554\u2550\u2550\u255D\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2551\u2591\u2591\u2588\u2588\u2551\u2588\u2588\u2551\u2591\u2591\u255A\u2588\u2588\u2557\r\n\u255A\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2591\u255A\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\r\n\u2591\u255A\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u2550\u2550\u255D\u2591\u255A\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u2550\u2550\u255D\u2591\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u2591\u255A\u2550\u2550\u2550\u2550\u255D\u2591\u2591\u255A\u2550\u2550\u2550\u2550\u2550\u255D\u2591

`);

console.log(`Inicializando proyecto kai...`);

// conexion con rathinkdb
const conn = await getRethinkDB();

// // conexion con pool de mysql
// var pool = mysql.createPool({
//     connectionLimit:100,
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     charset: "utf8mb4",
// });

// const table = `messages`;

// // consulta en rethinkdb
// // r.table('token_notification').limit(1).run(conn)
// r.table(table).slice(0,3000).run(conn)
// // r.table('token_notification').slice(1,3).run(conn)
// // r.table('token_notification').run(onn)
// .then((cursor) => {
//     console.log(`Step 1`);
//     // console.log(cursor.toArray());
//     return cursor.toArray();
// }).then(async (results) => {
//     console.log(`Step 2`);
//     console.log(`results = ${results.length}`);
//     console.log('results = ', results);
//     pool.getConnection((err,connection)=> {
//         if(err)
//         throw err;
//         console.log('Database connected successfully');
//         for (var i = 0; i < results.length; i++) {
//             console.log(`i = ${i}`);
//             const dataRethinkdb = {
//                 id_rethink: results[i].id,
//                 ...results[i],
//             };

//             // Querys de SELECT INSERT y DELETE

//             // token_notification
//             // const querySelect =  `SELECT * FROM token_notification WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO token_notification (id_rethink, device, id_member, id_user, token, type) VALUES ('${
//             //     dataRethinkdb.id_rethink
//             //   }','${dataRethinkdb.device}','${dataRethinkdb.id_member ?? null}','${
//             //     dataRethinkdb.id_user ?? null
//             //   }','${dataRethinkdb.token}','${dataRethinkdb.type}')`;

//             // users
//             // const querySelect =  `SELECT * FROM users WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO users (first_name, id_user, last_name, role_id, status, id_rethink) VALUES ('${dataRethinkdb.first_name}','${dataRethinkdb.id_user}','${dataRethinkdb.last_name}','${dataRethinkdb.role_id}','${dataRethinkdb.status}','${dataRethinkdb.id_rethink}')`;

//             // members
//             // const querySelect =  `SELECT * FROM members WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO members (id_member, document_number, email, first_name, last_name, mobile_phone, photo, id_rethink) VALUES ('${dataRethinkdb.id_member}','${dataRethinkdb.document_number}','${dataRethinkdb.email}','${dataRethinkdb.first_name}','${dataRethinkdb.last_name}','${dataRethinkdb.mobile_phone}','${dataRethinkdb.photo}','${dataRethinkdb.id_rethink}')`;
//             // const queryDelete =  `DELETE FROM members WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;

//             // channels
//             // const querySelect =  `SELECT * FROM channels WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO channels (id_channel, id_member, id_service_line, id_user, id_rethink) VALUES ('${dataRethinkdb.id_channel}','${dataRethinkdb.id_member}','${dataRethinkdb.id_service_line}','${dataRethinkdb.id_user}','${dataRethinkdb.id_rethink}')`;
//             // const queryDelete =  `DELETE FROM channels WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;

//             // meetings
//             // const querySelect =  `SELECT * FROM meetings WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO meetings (id_channel, create_at, status, id_rethink) VALUES ('${dataRethinkdb.id_channel}','${dataRethinkdb.create_at}','${dataRethinkdb.status}','${dataRethinkdb.id_rethink}')`;
//             // const queryDelete =  `DELETE FROM meetings WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;

//             // messages
//             // const querySelect =  `SELECT * FROM messages WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO messages (
//             //     author, 
//             //     author_name, 
//             //     author_type, 
//             //     content, 
//             //     create_at, 
//             //     id_channel, 
//             //     id_meet, 
//             //     id_rethink, 
//             //     type, 
//             //     url_file,
//             //     name_file,
//             //     size_file
//             //     ) 
//             //     VALUES (
//             //       '${dataRethinkdb.author}',
//             //       '${dataRethinkdb.author_name}',
//             //       '${dataRethinkdb.author_type}',
//             //       '${dataRethinkdb.content}',
//             //       '${dataRethinkdb.create_at}',
//             //       '${dataRethinkdb.id_channel}',
//             //       '${dataRethinkdb.id_meet}',
//             //       '${dataRethinkdb.id_rethink}',
//             //       '${dataRethinkdb.type}',
//             //       '${dataRethinkdb.url_file ?? null}',
//             //       '${dataRethinkdb.name_file ?? null}',
//             //       '${dataRethinkdb.size_file ?? null}'
//             //     )`;
//             // const queryDelete =  `DELETE FROM messages WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;

//             // message_status
//             // const querySelect =  `SELECT * FROM message_status WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO message_status (id_message, status, id_rethink) VALUES ('${dataRethinkdb.id_message}','${dataRethinkdb.status}','${dataRethinkdb.id_rethink}')`;
//             // const queryDelete =  `DELETE FROM message_status WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;

//             // reasign_history
//             // const querySelect =  `SELECT * FROM reasign_history WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;
//             // const queryInsert =  `INSERT INTO reasign_history (id_channel, create_at, last_id_user, new_id_user, id_rethink) VALUES ('${dataRethinkdb.id_channel}','${dataRethinkdb.create_at}','${dataRethinkdb.last_id_user}','${dataRethinkdb.new_id_user}','${dataRethinkdb.id_rethink}')`;
//             // const queryDelete =  `DELETE FROM reasign_history WHERE id_rethink = '${dataRethinkdb.id_rethink}'`;

//             // query
//             try {
//                 // pool.query(queryDelete
//                 pool.query(querySelect
//                     , (err,data)=> {
//                     if(err){
//                         console.log('***************** ERROR SELECT *******************');
//                         // throw err;
//                         InsertLogs({
//                             connMySql: pool,
//                             err: err,
//                             pool: true,
//                           });
//                     }else{
//                         // console.log(`El id_rethink ${dataRethinkdb.id_rethink} fue eliminado`);
//                         if (data.length > 0){
//                             console.log(`El id_rethink ${dataRethinkdb.id_rethink} existe`);
//                         }else{
//                             // query
//                             pool.query(queryInsert
//                                 , (err,data)=> {
//                                 if(err){
//                                     console.log('***************** ERROR INSERT *******************');
//                                     // throw err;
//                                     InsertLogs({
//                                         connMySql: pool,
//                                         err: err,
//                                         pool: true,
//                                     });
//                                 }else{
//                                     console.log(`Insertar id_rethink ${dataRethinkdb.id_rethink}`);
//                                 }
//                             });
//                         }
//                     }
//                 });
//                 // retornar conexion
//                 connection.release();
//             } catch (error) {
//                 console.log('***************** CATCH ERROR *******************');
//                 console.log(error);
//                 connection.release();
//             }
//         };
//         // pool.end(function (err) {
//         //     if (err) throw err;
//         //     console.log("Database ending successfully");
//         // });
//     });
// }).catch((err) => {
//     console.log('Error de migracion');
//     console.log('err = ', err);
// });

// function sleep(ms) {
//     return new Promise((resolve) => {
//       setTimeout(resolve, ms);
//     });
// }

// Borrado rethink masivo
// const dataMeetings = "07d2895e-ea30-4f7f-9cd6-3768d440dc97|09c74b3f-ab73-4f2f-bd47-3d4ec079d014|0713db57-c61e-402c-9506-5f04469c034a|0495b093-7af8-400e-93ae-1d1ad22dae40|09d6c96e-37c3-46a4-948b-41756d7091ce|0a2dd592-abf9-48c5-b715-9d40a5e6ebac|06fc0062-17e8-4dad-94cb-98fd9117c0f6|0c305273-01f6-4a2c-8321-47274b381d7b|0ac08653-453a-45f1-af41-dc84b9d1e6af|0705d1b3-ca42-48d5-8f7b-51eefd5950ca|056aff1c-0654-4312-8c97-379468f7be94|10c907d1-39e2-4aa7-99c2-819d0af696be|13ad9107-c328-4498-9994-aadc0f1e442a|0e7cac6f-4013-41e9-8abf-3d26b2e1aa0e|194bef5a-927c-444b-88c6-9404be454185|15ed9107-9883-4468-a753-df88385957a4|17591fe5-1086-4cdb-914e-df69b295cfeb|18df8127-585e-46ba-aab3-4a47b456c023|19d6ddfc-a7a9-47f6-b143-20f0afecf269|15163fec-4b6a-421a-b1b9-119f0de56084|1d0f7dab-d182-4735-a4a3-a122b2c00966|1ba5603b-8da1-40e1-bedc-deb5e669b16e|1d508901-c56a-4ba1-8cbe-04ff30da2fd9|1d427cbe-ebab-453e-b7eb-f68ee473ab5f|2094c54d-112d-4ec9-9a55-49f0979ebf07|2472e2b3-b986-473c-b704-a4102b923a6f|26e07f9d-dfa0-43df-aaca-b8a94911747f|2626128e-a09e-426e-9c71-b668529bcc9c|2a4c33ce-f3b5-4230-9af2-62eecb014a4d|324fa57b-69d6-4847-baa6-4a0a59f3fbcb|355b3607-cf9a-4643-abea-ce1a7e597986|33965555-b3f4-4f0f-8a6b-527ec3843a65|380d7748-4963-40c5-bda1-4fa6bc8cd3ad|3ae30dc1-affb-49fc-9389-8dd4e15b14f4|41baf131-8b31-4997-8f68-7f2be331f5a4|3b08ccbb-59e5-4f22-a4b3-0ab81c209d77|3a0cf7e6-b420-4dd8-a4e3-5e59aa52b094|391a7998-6759-4fea-8967-75972cbdc7f7|3c54f085-48fc-4126-9384-9d4ee9749f10|39ef0acb-8d1e-47c0-b140-e298a8315859|452e8583-efc6-4824-b0d9-089a859750cf|415ca04d-e728-4355-b063-4254849dd347|3eba8c72-b7fd-467d-90de-d899a85ea0b9|3c3dbc86-c156-42c8-970a-83c3e637f90d|45edb981-b611-4a2f-b528-8513fe33252a|3ba670e2-69c5-4ecf-8df1-ab9b2325c201|47dde0ff-6d67-409f-90cb-34d54532f247|4c2a79ad-25d9-465a-b492-6df3056c506b|4e2a0a00-bcd8-4f35-a312-5f53f279b623|523cdf71-87fc-4f98-abce-0f55164dd5aa|554e79c2-7b0a-4dca-99f3-c16c69f09bd1|58566eff-faeb-4338-912f-4a3bb60cb9e8|57d2c5af-08f2-44ec-af41-d990c40b8b82|57ddb177-42c5-4c77-b633-17a786701975|59d9994c-4569-4744-9e51-41d5abf584aa|5b88b948-bfcc-42aa-a621-b063b5eead96|617080a5-0d8a-42f6-850e-003e5200f74a|634d1612-5218-49e3-a2fc-8e844394691e|63e5448f-a5ae-4b52-a177-3cb94bd375b3|5efc2de3-5460-4366-94e5-0fe603a50aa2|5f5e452b-de25-49e4-b8ba-c5fbef054084|6415831f-15f0-4acd-9fa8-5260c620bc74|643029f2-1a2f-45c6-a54c-84a3732225ab|65f2f53f-e0c3-4b28-8248-a8b60d649e8d|663e55ac-27a2-4b9d-90cb-37c828049be8|68186615-4efc-4566-8735-be04dca4463d|650a5d28-c2b4-42d2-85ca-c4a6558f8606|68f59edb-f81a-4525-8ddc-f4b35e341d13|6dcee4ba-b654-4e15-8406-ac89ca5aa1a6|772bee71-9d57-41c1-b9e8-402bffec2a62|6ef5f682-958a-4bb8-8b6d-50e7ecadd962|6fc3f8c0-17ce-4022-808d-75b313d30b90|6e50d532-6416-4fe1-9bd9-eca578012cf7|847b7d91-6488-4ff9-9d88-eed3a0246f4e|734c37d7-7dc8-4eed-ab78-31c4a5aa6c2a|7a26be53-4cd1-4f88-bcb5-31ee93ccf600|6d554ce9-c8d1-4432-babd-8b987bc71631|70139493-46fe-4aff-93af-d8df13b77785|82070a0a-9c72-4f91-872d-9989e9492184|7a33f932-5698-4c12-b630-c3c8ea4081ff|7f1677f2-39c9-487e-88bb-04407ff92871|82a9f169-07d9-4b62-9375-769865b050ac|8937213a-e577-42a4-a2a6-70208551bf15|8bf4a87a-548d-420e-9f6e-6c5f0b9a262c|aab619b5-adb8-42f3-9d39-7bac48c61729|93a9786e-6baf-4be0-973b-afdb77e058ec|ab6cbb88-2f38-487a-928e-8813a5e494e3|99b2d164-80e4-4784-878a-58df7337c138|a46eb7c3-de80-4af5-b19d-7b2eac3afe67|a52591cd-3ff8-4afc-8988-c99a4d28a35e|9426c313-6f5f-4a2d-a8e9-1d48d0c9ea35|8d57e7e5-eadb-42dd-8634-dc2bf749e19c|97bfd99f-ec71-48dc-a8f0-824f4278fea6|ab62d4f8-4370-4d2e-bc39-a8945b669c77|9862294f-617a-42f8-aee2-b893a0350fc9|9c2ac876-0659-453d-a1d5-0ee3aa4fe70e|8e051f01-2f00-406f-a4cf-cca1563b61c2|8e249af3-53c4-4626-a86c-63e93b1beb2d|aece323a-93d9-4608-a229-c475ff26dc28|9ef4607d-64b0-4f0d-88b9-04bb5fcd1520|a0fd9880-8e30-47d8-8d8f-7042a715cd7b|9f888319-f4df-49b7-aa71-398846880366|968530de-c34f-40c3-945b-f1766bacf675|a1462baf-7b83-4530-b445-b6a79ea9b7d5|9534af31-0d3d-4a39-9633-859e84893e99|a1a3012a-d23d-4a93-a85d-786d9d5e22e2|9bfa5c7c-271b-49b8-8cb4-30a9efbe859d|8ed96d67-13eb-40f0-b849-4ec50c93b8b9|b0bd041f-5e38-436e-ba8c-abff0f6b8bb7|b4e5e5f9-3783-490a-87a4-2aadeab2be02|b907c938-f627-4f7f-9faa-cab169cf2f04|b58c2f17-6373-4227-99a3-a05bd7bdedca|c2baf9fb-14e0-468b-97c6-fd5401cc7025|bc411e9b-e256-401f-a225-13ead9b8cc53|c21e113f-4059-4f13-896f-3c60fa0cd1d4|b7a7d911-1049-49d2-847d-745259f9a523|ba6d5c68-bc70-4bb6-b065-fccc45f26855|bac6b572-1eb1-40cc-b30e-790ca357b84f|bb03cc9a-590c-4f79-8ea3-4c42d7eb952d|c2e2654e-f7d7-4c87-8f5b-dce53317b49f|c4a4797e-5139-4deb-aee1-c2e0f855712b|c6ff944b-087e-484e-a44c-7aceca661c87|c76246a8-8cf6-4cc2-90b5-d29becb09bf7|cd547cc9-e1c8-4ba6-bf72-ce6d14ff6607|cd57f981-27b6-40b0-9856-091430a34a97|d472c631-b892-494a-ad60-1dfc8aeb730a|d4fdd144-68a9-4c43-a33c-8557af3ad08b|d8c914e9-013e-46c8-8b37-b8942d7ed449|dc90ee50-a6ce-4564-bfab-0fee3aeb8645|d82ab935-e45a-44d7-8e6b-969e96623a17|df851eb1-74d3-4512-a8f8-bc3ab3a55a2c|e0741e12-7c89-46d9-be52-83e4586bd16f|eb9c8a33-506d-4b2f-a1de-807ede412ca9|f4ffd5cf-e73a-4660-a0f5-4920ce74673f|e37bda1d-4288-4fb9-bbde-0a0c3d46671d|ee11d8ee-7b9e-42f7-852c-15a617ebedcb|f245f3da-deb4-4059-b94a-1deced263500|f0db73b0-e988-4c2a-bce1-265e76aa0dc7|e790503e-e667-4acc-ab13-c60933b360dc|f7cf63b2-32ad-4b09-9970-a46637c9bfba|f00d01dd-5ee7-437d-9b35-415015d6113a|e74afbf8-aff3-4d3d-a65d-a07e72a856ff|f68da12c-f71d-45cd-bbac-8e48e79b00f9|e554af27-0674-4c5c-ad26-80b70d83c9ce|f8115423-e410-4837-a63a-09f0b63e0dd6|f93e5ccc-3c2c-4fd3-9dc7-3f865f5b0070|fc5ab3e5-58c6-4b7e-b24a-7bd71d4001f2|ff3bf443-9fe3-4ce6-9eec-d23eb2c76cb7|fee543a1-7299-4648-9da1-548c9e0f266a|ff0de812-fcb7-4e24-8747-c67bcc5c4d9e|ff9e64fc-3186-4104-a45a-58c0476b0cd7";
// const dataMeetingsTest = "07d2895e-ea30-4f7f-9cd6-3768d440dc97|09c74b3f-ab73-4f2f-bd47-3d4ec079d014|0713db57-c61e-402c-9506-5f04469c034a";

// r.table('meetings').filter({"id": '0713db57-c61e-402c-9506-5f04469c034a'}).run(conn)
// r.table('meetings').filter({"id": '07d2895e-ea30-4f7f-9cd6-3768d440dc97'}).delete().run(conn)
// r.table('meetings').filter(r.row("id").match(dataMeetings)).run(conn)
// .then((cursor) => {
//     console.log(`Step 1`);
//     // console.log(cursor);
//     return cursor.toArray();
// }).then(async (results) => {
//     console.log(`Step 2`);
//     console.log('results = ', results);
// }).catch((err) => {
//     console.log('error migration.service');
//     console.log('err = ', err);
// });

// Buscar channels en los mettings si hay o no
// r.table('meetings').filter(r.row("id").match(dataMeetings)).run(conn)
// .then((cursor) => {
//     console.log(`Step 1`);
//     return cursor.toArray();
// }).then(async (results) => {
//     console.log(`Step 2`);
//     console.log(`results = ${results.length}`);
//     console.log('results = ', results);
//     for (var i = 0; i < results.length; i++) {
//         console.log(`id = ${results[i].id}`);
//         r.table('channels').filter({id_channel: results[i].id_channel}).run(conn)
//         .then((cursor) => {
//             return cursor.toArray();
//         }).then(async (results) => {
//             if (results.length > 0) {
//                 console.log('si tiene channel');
//             }else{
//                 console.log('**** no tiene channel *****');
//             }
//         }).catch((err) => {
//             console.log('error migration.service');
//             console.log('err = ', err);
//         });
//     }
    
// }).catch((err) => {
//     console.log('error migration.service');
//     console.log('err = ', err);
// });

// extraccion de data rethinkdb
// r.table('reasign_history').run(conn)
// .then((cursor) => {
//     console.log(`Step 1`);
//     return cursor.toArray();
// }).then(async (results) => {
//     console.log(`Step 2`);
//     console.log(`results = ${results.length}`);
//     console.log('results = ', results);
//     fs.writeFileSync('reasign_history.json', JSON.stringify(results));
// }).catch((err) => {
//     console.log('Error de migracion');
//     console.log('err = ', err);
// });


// // insercion de data rethinkdb
// reasign_history.forEach((item,index,arr) => {
//     r.table('reasing_history').insert(item).run(conn)
//     .then((cursor) => {
//         console.log(`Step 1`);
//         console.log(cursor);
//         // return cursor.toArray();
//     }).then(async (results) => {
//         console.log(`Step 2`);
//         console.log(`results = ${results?.length}`);
//         console.log('results = ', results);
//     }).catch((err) => {
//         console.log('Error de migracion');
//         console.log('err = ', err);
//     });
// });