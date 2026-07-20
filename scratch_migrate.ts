import { getConnection } from './app/library/db';

async function migrate() {
  const pool = await getConnection();
  try {
    await pool.request().query(`
      ALTER TABLE Registrations ADD TransactionID NVARCHAR(200) NULL;
    `);
    console.log("Added TransactionID to Registrations");
  } catch (e: any) {
    console.log("Error or already exists:", e.message);
  }
  process.exit(0);
}

migrate();
