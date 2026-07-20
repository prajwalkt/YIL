const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
};

async function migrate() {
  let pool;
  try {
    console.log("Connecting to database...");
    pool = await sql.connect(config);
    console.log("✅ Connected to database");

    // 1. Create NotificationLog table
    console.log("Ensuring NotificationLog table exists...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationLog' and xtype='U')
      CREATE TABLE NotificationLog (
        LogID int IDENTITY(1,1) PRIMARY KEY,
        UserID int NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        Type varchar(50) NOT NULL,
        Channel varchar(20) NOT NULL,
        Status varchar(20) NOT NULL,
        ErrorMessage nvarchar(MAX) NULL,
        CreatedAt datetime DEFAULT GETDATE()
      )
    `);
    console.log("✅ NotificationLog table ensured");

    // 2. Seed WhatsApp config into SystemSettings
    console.log("Ensuring WhatsApp settings in SystemSettings...");
    const settings = [
      { key: 'WhatsAppApiUrl', val: '', desc: 'WhatsApp Provider API Endpoint' },
      { key: 'WhatsAppApiKey', val: '', desc: 'WhatsApp API Key/Token' },
      { key: 'WhatsAppSender', val: '', desc: 'WhatsApp Sender Phone Number' },
      { key: 'WhatsAppTemplateId', val: '', desc: 'WhatsApp Template ID for Activation' }
    ];

    for (const s of settings) {
      await pool.request()
        .input('Key', s.key).input('Val', s.val).input('Desc', s.desc)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = @Key)
          INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
          VALUES (@Key, @Val, @Desc)
        `);
    }
    console.log("✅ WhatsApp settings ensured in SystemSettings");

    console.log("🎉 Phase 3 migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    if (pool) pool.close();
  }
}

migrate();
