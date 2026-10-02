const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.MSSQL_DB_USER || 'sa',
  password: process.env.MSSQL_DB_PASSWORD || '4xg8i3h0rf265',
  server: process.env.MSSQL_DB_SERVER || '172.20.10.4',
  database: process.env.MSSQL_DB_NAME || 'LMS_DB',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    
    // Check if it exists
    const check = await pool.request().query(`SELECT * FROM SystemSettings WHERE SettingKey = 'WhatsAppSender'`);
    
    if (check.recordset.length === 0) {
      await pool.request().query(`INSERT INTO SystemSettings (SettingKey, SettingValue) VALUES ('WhatsAppSender', '+91 7022585130')`);
      console.log('Inserted WhatsAppSender');
    } else {
      await pool.request().query(`UPDATE SystemSettings SET SettingValue = '+91 7022585130' WHERE SettingKey = 'WhatsAppSender'`);
      console.log('Updated WhatsAppSender');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
