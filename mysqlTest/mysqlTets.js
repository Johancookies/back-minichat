import connectMysql from "../config/mysql.js";

connectMysql((conn) => {
  conn.connect((err) => {
    if (err) console.log(err);
    console.log("connected");
  });
  const sql = "SELECT * FROM movies";
  conn.query(sql, (err, result) => {
    if (err) console.log(err);
    else {
      console.log(result);
    }
	});
	conn.end()
});
