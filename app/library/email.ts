import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────
// Generic Email Sender
// ─────────────────────────────────────────────────────────
export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('====================================================');
    console.log(`📧 SIMULATED EMAIL TO: ${to}`);
    console.log(`Subject: ${subject}`);
    if (attachments) console.log(`Attachments: ${attachments.length} files`);
    console.log('----------------------------------------------------');
    const textBody = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
    console.log(textBody);
    console.log('====================================================');
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: `"Yokogawa Training Services" <${process.env.SMTP_USER}>`,
      to, subject, html, attachments
    });

    console.log(`Real email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}

// ─────────────────────────────────────────────────────────
// Approval Email — Sends account credentials after Admin approval
// ─────────────────────────────────────────────────────────
export async function sendApprovalEmail({
  to, name, course, tempPassword, loginUrl,
}: {
  to: string;
  name: string;
  course: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const subject = `✅ Registration Approved — Your YTS Account is Ready`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#004098,#0060cc);padding:40px 40px 30px;text-align:center;">
          <div style="width:60px;height:60px;background:#fff;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <span style="color:#004098;font-weight:900;font-size:20px;line-height:60px;">YTS</span>
          </div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Registration Approved! 🎉</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Yokogawa Training Services</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#333;font-size:16px;margin:0 0 16px;">Dear <strong>${name}</strong>,</p>
          <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
            We are pleased to inform you that your registration for <strong>${course}</strong> has been approved. 
            Your YTS Learning Management System account is now active.
          </p>
          
          <!-- Credentials Box -->
          <div style="background:#f8f9ff;border:2px solid #e0e7ff;border-radius:10px;padding:24px;margin:0 0 24px;">
            <h3 style="color:#004098;margin:0 0 16px;font-size:16px;">🔐 Your Login Credentials</h3>
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr>
                <td style="color:#666;font-size:13px;width:140px;font-weight:600;">Portal URL:</td>
                <td><a href="${loginUrl}" style="color:#0060cc;font-weight:600;font-size:13px;">${loginUrl}</a></td>
              </tr>
              <tr>
                <td style="color:#666;font-size:13px;font-weight:600;">Username:</td>
                <td style="font-family:monospace;background:#fff;border:1px solid #e0e0e0;border-radius:4px;padding:4px 8px;font-size:13px;color:#333;">${to}</td>
              </tr>
              <tr>
                <td style="color:#666;font-size:13px;font-weight:600;">Temp Password:</td>
                <td style="font-family:monospace;background:#fff;border:1px solid #e0e0e0;border-radius:4px;padding:4px 8px;font-size:13px;font-weight:700;color:#d32f2f;">${tempPassword}</td>
              </tr>
            </table>
          </div>

          <!-- Warning -->
          <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:0 0 24px;">
            <p style="margin:0;color:#795548;font-size:13px;line-height:1.5;">
              ⚠️ <strong>Important:</strong> You will be required to change your temporary password on first login. 
              Please choose a strong password with at least 8 characters, including uppercase, lowercase, numbers and special characters.
            </p>
          </div>

          <!-- Steps -->
          <h3 style="color:#333;font-size:14px;margin:0 0 12px;">📋 Next Steps:</h3>
          <ol style="color:#555;font-size:13px;line-height:2;margin:0 0 24px;padding-left:20px;">
            <li>Click the portal URL above or visit <a href="${loginUrl}" style="color:#0060cc;">${loginUrl}</a></li>
            <li>Enter your email and the temporary password above</li>
            <li>Set your new permanent password when prompted</li>
            <li>Access your course materials and learning schedule</li>
          </ol>

          <a href="${loginUrl}" style="display:inline-block;background:#004098;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;">
            Login to YTS Portal →
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f9ff;padding:20px 40px;border-top:1px solid #e0e7ff;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">
            Yokogawa Training Services | Yokogawa India Ltd<br>
            This is an automated email. Please do not reply directly to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({ to, subject, html });
}

// ─────────────────────────────────────────────────────────
// WhatsApp Notification Stub (Future Integration)
// Replace this implementation with actual WhatsApp API calls
// e.g. Twilio, Meta Business API, etc.
// ─────────────────────────────────────────────────────────
export async function sendWhatsApp({
  to, message,
}: {
  to: string;   // Phone number in E.164 format, e.g. +919876543210
  message: string;
}) {
  // TODO: Integrate with WhatsApp Business API or Twilio
  // Example Twilio implementation:
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await client.messages.create({
  //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
  //   to: `whatsapp:${to}`,
  //   body: message
  // });
  console.log(`📱 [WhatsApp STUB] To: ${to}`);
  console.log(`Message: ${message}`);
  return { success: true, simulated: true };
}
