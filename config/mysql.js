import mysql from "mysql";

export default function (callback) {
  console.log("MySql function");
  const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
	});
	callback(conn)
}
