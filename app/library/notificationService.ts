import nodemailer from 'nodemailer';
import { getConnection } from './db';

// ─────────────────────────────────────────────────────────
// Logger Helper
// ─────────────────────────────────────────────────────────
export async function logNotification(userId: number | null, type: string, channel: 'EMAIL' | 'WHATSAPP', status: 'SENT' | 'FAILED' | 'QUEUED', errorMsg?: string, messageContent?: string) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('UserID', userId)
      .input('Type', type)
      .input('Channel', channel)
      .input('Status', status)
      .input('ErrorMessage', errorMsg || null)
      .input('MessageContent', messageContent || null)
      .query(`
        INSERT INTO NotificationLog (UserID, Type, Channel, Status, ErrorMessage, MessageContent)
        VALUES (@UserID, @Type, @Channel, @Status, @ErrorMessage, @MessageContent)
      `);
  } catch (err) {
    console.error('Failed to write notification log:', err);
  }
}

// ─────────────────────────────────────────────────────────
// Multi-Channel Service
// ─────────────────────────────────────────────────────────
export async function sendMultiChannelNotification({
  userId,
  email,
  phone,
  type, // e.g. 'ACCOUNT_ACTIVATION'
  subject,
  html,
  text,
}: {
  userId: number | null;
  email: string;
  phone?: string;
  type: string;
  subject: string;
  html: string;
  text: string;
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
      await logNotification(userId, type, 'EMAIL', 'SENT', 'Simulated output', html);
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
      await logNotification(userId, type, 'EMAIL', 'SENT', undefined, html);
    }
  } catch (emailErr: any) {
    console.error(`Email delivery failed to ${email}:`, emailErr);
    await logNotification(userId, type, 'EMAIL', 'FAILED', emailErr.message, html);
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
        await logNotification(userId, type, 'WHATSAPP', 'FAILED', 'WARNING: WhatsApp provider is not configured in System Settings.', text);
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
        await logNotification(userId, type, 'WHATSAPP', 'SENT', undefined, text);
      }
    } catch (waErr: any) {
      console.error(`WhatsApp delivery failed to ${phone}:`, waErr);
      await logNotification(userId, type, 'WHATSAPP', 'FAILED', waErr.message, text);
    }
  }

  return { success: true };
}
