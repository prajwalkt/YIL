const sql = require('mssql');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.neon' });

const mssqlConfig = {
  user: process.env.MSSQL_DB_USER || "sa",
  password: process.env.MSSQL_DB_PASSWORD || "4xg8i3h0rf265",
  server: process.env.MSSQL_DB_SERVER || "172.20.10.4",
  database: process.env.MSSQL_DB_NAME || "LMS_DB",
  requestTimeout: 300000,
  options: { encrypt: false, trustServerCertificate: true },
};

const pgClient = new Client({
  connectionString: process.env.NEON_DATABASE_URL,
});

function mapType(mssqlType, length) {
  const type = mssqlType.toUpperCase();
  if (type === 'INT') return 'INTEGER';
  if (type === 'BIGINT') return 'BIGINT';
  if (type === 'SMALLINT') return 'SMALLINT';
  if (type === 'TINYINT') return 'SMALLINT';
  if (type === 'BIT') return 'BOOLEAN';
  if (type.includes('VARCHAR') || type.includes('CHAR') || type === 'TEXT') return 'TEXT';
  if (type === 'DATETIME' || type === 'DATETIME2' || type === 'DATE') return 'TIMESTAMP';
  if (type === 'DECIMAL' || type === 'NUMERIC') return 'NUMERIC';
  if (type === 'FLOAT' || type === 'REAL') return 'DOUBLE PRECISION';
  if (type === 'UNIQUEIDENTIFIER') return 'UUID';
  return 'TEXT';
}

async function migrate() {
  let pool;
  try {
    console.log("Connecting to MS SQL Server...");
    pool = await sql.connect(mssqlConfig);
    console.log("Connected to MSSQL.");

    console.log("Connecting to Neon Postgres...");
    await pgClient.connect();
    console.log("Connected to Neon.");

    // Get all tables
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    for (const row of tablesResult.recordset) {
      const tableName = row.TABLE_NAME;
      
      const columnsResult = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE,
        COLUMNPROPERTY(object_id('${tableName}'), COLUMN_NAME, 'IsIdentity') as IsIdentity
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);

      let createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      const colDefs = [];
      const columns = [];
      
      for (const col of columnsResult.recordset) {
        let def = `  "${col.COLUMN_NAME}" ${mapType(col.DATA_TYPE, col.CHARACTER_MAXIMUM_LENGTH)}`;
        if (col.IsIdentity === 1) {
            def = `  "${col.COLUMN_NAME}" SERIAL PRIMARY KEY`;
        } else if (col.IS_NULLABLE === 'NO') {
            def += ' NOT NULL';
        }
        colDefs.push(def);
        columns.push(col.COLUMN_NAME);
      }
      createSql += colDefs.join(',\n') + '\n);';
      
      console.log(`Creating table ${tableName}...`);
      try {
          await pgClient.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          await pgClient.query(createSql);
      } catch(e) {
          console.log("Error creating table " + tableName, e.message);
      }

      // Insert data
      console.log(`Migrating data for ${tableName}...`);
      const dataResult = await pool.request().query(`SELECT * FROM [${tableName}]`);
      if (dataResult.recordset.length > 0) {
          for (const rowData of dataResult.recordset) {
              const keys = Object.keys(rowData);
              const vals = Object.values(rowData);
              const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
              const insertSql = `INSERT INTO "${tableName}" ("${keys.join('", "')}") VALUES (${placeholders})`;
              try {
                  await pgClient.query(insertSql, vals);
              } catch(e) {
                  // console.log("Insert err", e.message);
              }
          }
      }
      
      // Update sequences for SERIAL columns
      const identityCol = columnsResult.recordset.find(c => c.IsIdentity === 1);
      if (identityCol) {
          try {
             await pgClient.query(`SELECT setval('"${tableName}_${identityCol.COLUMN_NAME}_seq"', (SELECT MAX("${identityCol.COLUMN_NAME}") FROM "${tableName}"))`);
          } catch(e) { }
      }
    }

    console.log("Migration script completed.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    if (pool) await pool.close();
    await pgClient.end();
  }
}

migrate();
