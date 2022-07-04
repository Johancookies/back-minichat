import mysql from "mysql";

export default function (callback) {
  const conn = mysql.createConnection({
    host: "localhost",
    user: "bodytech",
    password: "bodytech",
    database: "bodytech",
	});
	callback(conn)
}
