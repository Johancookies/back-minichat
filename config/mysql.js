import mysql from "mysql";

export default function (callback) {
  console.log("MySql function");

  callback(conn);
}

export const getConnectionMySql = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  return conn;
};
