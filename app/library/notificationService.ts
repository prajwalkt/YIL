import nodemailer from 'nodemailer';
import { getConnection } from './db';

// ─────────────────────────────────────────────────────────
// Schema capability cache — checked once per server lifetime.
// Avoids repeated sys.columns queries on every notification.
// ─────────────────────────────────────────────────────────
let _hasRegistrationID: boolean | null = null;

async function hasRegistrationIDColumn(): Promise<boolean> {
  if (_hasRegistrationID !== null) return _hasRegistrationID;
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT COUNT(*) AS cnt
      FROM sys.columns
      WHERE object_id = OBJECT_ID('NotificationLog') AND name = 'RegistrationID'
    `);
    _hasRegistrationID = result.recordset[0].cnt > 0;
  } catch {
    _hasRegistrationID = false;
  }
  return _hasRegistrationID;
}

// ─────────────────────────────────────────────────────────
// Logger Helper
// ─────────────────────────────────────────────────────────
export async function logNotification(
  userId: number | null,
  type: string,
  channel: 'EMAIL' | 'WHATSAPP',
  status: 'SENT' | 'FAILED' | 'QUEUED',
  errorMsg?: string,
  messageContent?: string,
  recipientName?: string,
  registrationId?: number | null,
) {
  try {
    const pool = await getConnection();
    const supportsRegID = await hasRegistrationIDColumn();

    const req = pool.request()
      .input('UserID', userId)
      .input('Type', type)
      .input('Channel', channel)
      .input('Status', status)
      .input('ErrorMessage', errorMsg || null)
      .input('MessageContent', messageContent || null)
      .input('RecipientName', recipientName || null);

    if (supportsRegID) {
      // Migration has been applied: persist the direct registration link
      req.input('RegistrationID', registrationId ?? null);
      await req.query(`
        INSERT INTO NotificationLog
          (UserID, Type, Channel, Status, ErrorMessage, MessageContent, RecipientName, RegistrationID)
        VALUES
          (@UserID, @Type, @Channel, @Status, @ErrorMessage, @MessageContent, @RecipientName, @RegistrationID)
      `);
    } else {
      // Migration not yet applied: write all columns that currently exist.
      // RecipientName is already present in the live schema — it is always written.
      await req.query(`
        INSERT INTO NotificationLog
          (UserID, Type, Channel, Status, ErrorMessage, MessageContent, RecipientName)
        VALUES
          (@UserID, @Type, @Channel, @Status, @ErrorMessage, @MessageContent, @RecipientName)
      `);
    }
  } catch (err) {
    console.error('Failed to write notification log:', err);
  }
}

// ─────────────────────────────────────────────────────────
// Multi-Channel Service
// ─────────────────────────────────────────────────────────
export async function sendMultiChannelNotification({
  userId,
  registrationId,
  email,
  phone,
  type, // e.g. 'ACCOUNT_ACTIVATION'
  subject,
  html,
  text,
  recipientName,
}: {
  userId: number | null;
  registrationId?: number | null;
  email: string;
  phone?: string;
  type: string;
  subject: string;
  html: string;
  text: string;
  recipientName?: string;
}) {
  // 1. Send Email
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log('====================================================');
      console.log(`📧 SIMULATED EMAIL TO: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log('----------------------------------------------------');
      console.log(text);
      console.log('====================================================');
      await logNotification(userId, type, 'EMAIL', 'SENT', 'Simulated output', html, recipientName, registrationId);
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Yokogawa Training Services" <${process.env.SMTP_USER}>`,
        to: email, subject, html,
      });
      await logNotification(userId, type, 'EMAIL', 'SENT', undefined, html, recipientName, registrationId);
    }
  } catch (emailErr: any) {
    console.error(`Email delivery failed to ${email}:`, emailErr);
    await logNotification(userId, type, 'EMAIL', 'FAILED', emailErr.message, html, recipientName, registrationId);
  }

  // 2. Send WhatsApp
  if (phone) {
    try {
      const pool = await getConnection();
      const settingsResult = await pool.request().query(`
        SELECT SettingKey, SettingValue FROM SystemSettings 
        WHERE SettingKey IN ('WhatsAppApiUrl', 'WhatsAppApiKey', 'WhatsAppSender', 'WhatsAppTemplateId')
      `);
      
      const config: any = {};
      settingsResult.recordset.forEach(r => config[r.SettingKey] = r.SettingValue);

      if (!config.WhatsAppApiUrl || !config.WhatsAppApiKey) {
        console.warn(`📱 [WhatsApp SKIPPED] To: ${phone} (Provider not configured)`);
        await logNotification(userId, type, 'WHATSAPP', 'FAILED', 'WARNING: WhatsApp provider is not configured in System Settings.', text, recipientName, registrationId);
      } else {
        // Generic HTTP integration
        const res = await fetch(config.WhatsAppApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.WhatsAppApiKey}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
              name: config.WhatsAppTemplateId || "registration_approved",
              language: { code: "en_US" }
            }
          })
        });

        if (!res.ok) {
          const errData = await res.text();
          throw new Error(`WhatsApp API responded with ${res.status}: ${errData}`);
        }
        await logNotification(userId, type, 'WHATSAPP', 'SENT', undefined, text, recipientName, registrationId);
      }
    } catch (waErr: any) {
      console.error(`WhatsApp delivery failed to ${phone}:`, waErr);
      await logNotification(userId, type, 'WHATSAPP', 'FAILED', waErr.message, text, recipientName, registrationId);
    }
  }

  return { success: true };
}
