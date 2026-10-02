const { sql, getConnection } = require('../app/library/db');
async function test() {
  const pool = await getConnection();
  const q = await pool.request().query("SELECT TOP 1 * FROM Registrations ORDER BY CreatedAt DESC");
  console.log(Object.keys(q.recordset[0]));
}
test().catch(console.log).finally(() => process.exit(0));
