const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.MSSQL_DB_USER || "sa",
  password: process.env.MSSQL_DB_PASSWORD || "4xg8i3h0rf265",
  server: process.env.MSSQL_DB_SERVER || "172.20.10.4",
  database: process.env.MSSQL_DB_NAME || "LMS_DB",
  options: { encrypt: false, trustServerCertificate: true },
};

async function backupDB() {
  let pool;
  try {
    console.log("Connecting to SQL Server...");
    pool = await sql.connect(config);
    console.log("Connected.");

    const backupData = {};
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    for (const row of tablesResult.recordset) {
      const tableName = row.TABLE_NAME;
      console.log(`Backing up table: ${tableName}...`);
      const dataResult = await pool.request().query(`SELECT * FROM [${tableName}]`);
      backupData[tableName] = dataResult.recordset;
    }

    const backupPath = path.join(__dirname, 'lms_db_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`Backup completed successfully! Saved to ${backupPath}`);
  } catch (err) {
    console.error("Backup failed:", err);
  } finally {
    if (pool) await pool.close();
  }
}

backupDB();
