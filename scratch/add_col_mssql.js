const sql = require('mssql');

const config = {
  user: 'sa',
  password: '4xg8i3h0rf265',
  server: '172.20.10.4',
  database: 'LMS_DB',
  options: {
    encrypt: true, // For Azure
    trustServerCertificate: true // For local dev
  }
};

async function checkAndAdd() {
  try {
    const pool = await sql.connect(config);
    await pool.request().query("ALTER TABLE Registrations ADD TrainerId INT NULL;");
    console.log("Added TrainerId column.");
  } catch(e) {
    console.log("Column probably exists:", e.message);
  } finally {
    process.exit(0);
  }
}
checkAndAdd();
