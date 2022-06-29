import rethinkdb from "rethinkdb";

// database connection
let rdbConn = null;
const rdbConnect = async function () {
  try {
    const conn = await rethinkdb.connect({
      host: process.env.RETHINKDB_HOST || "172.28.60.104",
      port: process.env.RETHINKDB_PORT || 28015,
      username: process.env.RETHINKDB_USERNAME || "admin",
      password: process.env.RETHINKDB_PASSWORD || "",
      db: process.env.RETHINKDB_NAME || "real_time_chat",
    });

    // Handle close
    conn.on("close", function (e) {
      console.log("RDB connection closed: ", e);
      rdbConn = null;
    });

    console.log("Connected to RethinkDB");
    rdbConn = conn;
    return conn;
  } catch (err) {
    throw err;
  }
};

const getRethinkDB = async function () {
  if (rdbConn != null) {
    return rdbConn;
  }
  return await rdbConnect();
};

export default getRethinkDB;
