const sql = require('mssql');

const config = {
  user: 'sa',
  password: '4xg8i3h0rf265',
  server: '172.20.10.4',
  database: 'LMS_DB',
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
