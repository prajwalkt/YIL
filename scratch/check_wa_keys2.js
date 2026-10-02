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
    const result = await pool.request().query(`
      SELECT SettingKey, SettingValue FROM SystemSettings 
      WHERE SettingKey IN ('WhatsAppApiUrl', 'WhatsAppApiKey', 'WhatsAppTemplateId')
    `);
    console.log('Existing Keys:', result.recordset);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
