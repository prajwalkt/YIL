const { sql, getConnection } = require('../app/library/db');

async function checkAndAdd() {
  const pool = await getConnection();
  try {
    await pool.request().query("ALTER TABLE Registrations ADD TrainerId INT NULL;");
    console.log("Added TrainerId column.");
  } catch(e) {
    console.log("Column probably exists:", e.message);
  }
}
checkAndAdd().finally(() => process.exit(0));
