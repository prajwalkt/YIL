// @ts-ignore
import sql from "mssql";

const config: sql.config = {
  user: process.env.MSSQL_DB_USER!,
  password: process.env.MSSQL_DB_PASSWORD!,
  server: process.env.MSSQL_DB_SERVER!,
  database: process.env.MSSQL_DB_NAME!,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✅ SQL Server Connected");
  }

  return pool;
}