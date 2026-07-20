const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
};

async function migrate() {
  let pool;
  try {
    console.log("Connecting to database...");
    pool = await sql.connect(config);
    console.log("✅ Connected to database");

    console.log("Altering NotificationLog table to add MessageContent...");
    await pool.request().query(`
      IF COL_LENGTH('NotificationLog', 'MessageContent') IS NULL
      BEGIN
          ALTER TABLE NotificationLog ADD MessageContent NVARCHAR(MAX) NULL
      END
    `);
    console.log("✅ MessageContent added to NotificationLog table");

    console.log("🎉 Phase 4 migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    if (pool) pool.close();
  }
}

migrate();
