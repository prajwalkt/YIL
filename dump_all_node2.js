const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function run() {
  try {
    const pool = await sql.connect(config);
    const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    for (const row of tables.recordset) {
      console.log(`Table: ${row.TABLE_NAME}`);
      const cols = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${row.TABLE_NAME}'`);
      for (const col of cols.recordset) {
        console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      }
    }
    pool.close();
  } catch (err) {
    console.error(err);
  }
}
run();
