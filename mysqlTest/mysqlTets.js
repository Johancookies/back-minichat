import connectMysql from "../config/mysql.js";

connectMysql((conn) => {
  conn.connect((err) => {
    if (err) console.log(err);
    console.log("connected");
  });
  const sql = "SELECT * FROM movies";
  // const qyery2 =`INSERT INTO messages (id, content) VALUES(${data.id})`
  conn.query(sql, (err, result) => {
    if (err) console.log(err);
    else {
      console.log(result);
    }
	});
	conn.end()
});
