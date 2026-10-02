const { getConnection } = require('./app/library/db.js');
(async () => {
  try {
    const pool = await getConnection();
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
