import { config } from 'dotenv';
config({ path: '.env.local' });
import { getConnection } from '../app/library/db';

async function runMigration() {
  try {
    const pool = await getConnection();
    console.log("Connected to DB");
    
    // Check if ManualURL column exists
    const checkCol = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'LMS_Courses' AND COLUMN_NAME = 'ManualURL'
    `);
    
    if (checkCol.recordset.length === 0) {
      console.log("Adding ManualURL column...");
      await pool.request().query(`ALTER TABLE LMS_Courses ADD ManualURL NVARCHAR(MAX) NULL;`);
    } else {
      console.log("ManualURL column already exists.");
    }
    
    console.log("Updating VPFE manual URL...");
    await pool.request().query(`
      UPDATE LMS_Courses 
      SET ManualURL = 'https://centumvpheyzinefixedv01.vercel.app?_vercel_share=Rzw2SNEquCO8HRVeDxjZfRikJJ2yKfTx' 
      WHERE Code = 'VPFE';
    `);
    
    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
