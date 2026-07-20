const fs = require('fs');
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

async function runMigration() {
  try {
    const pool = await sql.connect(config);
    const script = fs.readFileSync('./app/library/final_migrate.sql', 'utf8');
    
    // Split by GO and run each batch
    const batches = script.split(/\bGO\b/i);
    
    for (let batch of batches) {
      if (batch.trim()) {
        await pool.request().query(batch);
      }
    }
    console.log('Migration executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
