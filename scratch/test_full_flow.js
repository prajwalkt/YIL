const fs = require('fs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'YTS-LMS-JWT-Secret-2024-ChangeMe-UseOpenSSLRandBase64-64chars-InProd!!';
const fakeIp = Math.random().toString();

const finToken = jwt.sign({ userId: 2, email: "finance@yts.com", role: "FINANCE" }, JWT_SECRET, { expiresIn: '1h' });
const tmToken = jwt.sign({ userId: 3, email: "tm@yts.com", role: "TM" }, JWT_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ userId: 1, email: "admin@yts.com", role: "ADMIN" }, JWT_SECRET, { expiresIn: '1h' });

async function runFlow() {
  console.log("0. Tokens Generated.");

  console.log("1. Registration...");
  let formData = new FormData();
  formData.append("name", "Gap Analysis User");
  formData.append("email", "gapuser@example.com");
  formData.append("phone", "1234567890");
  formData.append("organization", "Test Org");
  formData.append("country", "India");
  formData.append("graduationYear", "2024");
  formData.append("course", "CENTUM VP DCS Fundamentals & Engineering");
  formData.append("trainingMode", "E-Learning (Self-Paced)");
  formData.append("sponsor", "SELF");
  
  let res = await fetch("http://localhost:3000/api/register", { 
    method: "POST", 
    body: formData,
    headers: { 'x-forwarded-for': fakeIp }
  });
  let data = await res.json();
  if (!data.success) { console.log("Reg fail:", data); return; }
  const regId = data.registrationId;
  console.log("Registration ID:", regId);

  console.log("2. Payment Upload...");
  let payForm = new FormData();
  payForm.append("registrationId", regId.toString());
  payForm.append("transactionId", "TXNGAP123");
  const realPdf = fs.readFileSync('public/uploads/payments/1783480136424-assessment_dinesh_stdm_ci_25th_may.pdf');
  const fileContent = new Blob([realPdf], { type: "application/pdf" });
  payForm.append("paymentProof", fileContent, "dummy.pdf");
  
  res = await fetch("http://localhost:3000/api/payment", { 
    method: "POST", 
    body: payForm,
    headers: { 'x-forwarded-for': fakeIp } 
  });
  data = await res.json();
  if (!data.success) { console.log("Pay fail:", data); return; }
  console.log("Payment success.");

  console.log("3. Finance Approval...");
  res = await fetch("http://localhost:3000/api/admin/approvals", { 
    method: "PUT", 
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp, 'Cookie': `auth_token=${finToken}` },
    body: JSON.stringify({ registrationId: regId, action: 'APPROVE', role: 'FINANCE' }) 
  });
  data = await res.json();
  if (!data.success) { console.log("Finance fail:", data); return; }
  console.log("Finance approved.");

  console.log("4. TM Approval...");
  res = await fetch("http://localhost:3000/api/admin/approvals", { 
    method: "PUT", 
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp, 'Cookie': `auth_token=${tmToken}` },
    body: JSON.stringify({ registrationId: regId, action: 'APPROVE', role: 'TRAINING_MANAGER' }) 
  });
  data = await res.json();
  if (!data.success) { console.log("TM fail:", data); return; }
  console.log("TM approved.");

  console.log("5. Admin Approval (User Creation)...");
  res = await fetch("http://localhost:3000/api/admin/approvals", { 
    method: "PUT", 
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp, 'Cookie': `auth_token=${adminToken}` },
    body: JSON.stringify({ registrationId: regId, action: 'APPROVE', role: 'ADMIN' }) 
  });
  data = await res.json();
  if (!data.success) { console.log("Admin fail:", data); return; }
  console.log("Admin approved.", data);
  
}
runFlow();
