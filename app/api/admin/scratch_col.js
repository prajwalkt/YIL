const { sql, getConnection } = require('../library/db');

async function test() {
  const pool = await getConnection();
  const q = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Registrations'");
  console.log(q.recordset.map(r => r.COLUMN_NAME));
}
test().catch(console.log).finally(() => process.exit(0));
