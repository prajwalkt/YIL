async function runFlow() {
  const fakeIp = Math.random().toString();
  
  console.log("0. Login as Admin...");
  let res = await fetch("http://localhost:3000/api/auth/login", { 
    method: "POST", 
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp },
    body: JSON.stringify({ email: "admin@yokogawa.com", password: "yokogawaadmin" }) 
  });
  let data = await res.json();
  if (!data.success) { console.log("Login fail:", data); return; }
  const token = data.token;

  console.log("1. Registration...");
  let formData = new FormData();
  formData.append("name", "E2E Test User 4");
  formData.append("email", "e2etest4@example.com");
  formData.append("phone", "1234567890");
  formData.append("organization", "Test Org");
  formData.append("country", "India");
  formData.append("graduationYear", "2024");
  formData.append("course", "CENTUM VP DCS Fundamentals & Engineering");
  formData.append("trainingMode", "E-Learning (Self-Paced)");
  formData.append("sponsor", "SELF");
  
  res = await fetch("http://localhost:3000/api/register", { 
    method: "POST", 
    body: formData,
    headers: { 'x-forwarded-for': fakeIp }
  });
  data = await res.json();
  if (!data.success) { console.log("Reg fail:", data); return; }
  const regId = data.registrationId;
  console.log("Registration ID:", regId);

  console.log("2. Payment Upload...");
  let payForm = new FormData();
  payForm.append("registrationId", regId.toString());
  payForm.append("transactionId", "TXN12345");
  const fs = require('fs');
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

  const authHeaders = { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp, 'Authorization': `Bearer ${token}` };

  console.log("3. Finance Approval...");
  res = await fetch("http://localhost:3000/api/admin/approvals", { 
    method: "PUT", 
    headers: authHeaders,
    body: JSON.stringify({ registrationId: regId, action: 'APPROVE', role: 'FINANCE' }) 
  });
  data = await res.json();
  if (!data.success) { console.log("Finance fail:", data); return; }

  console.log("4. TM Approval...");
  res = await fetch("http://localhost:3000/api/admin/approvals", { 
    method: "PUT", 
    headers: authHeaders,
    body: JSON.stringify({ registrationId: regId, action: 'APPROVE', role: 'TRAINING_MANAGER' }) 
  });
  data = await res.json();
  if (!data.success) { console.log("TM fail:", data); return; }

  console.log("5. Admin Approval (User Creation)...");
  res = await fetch("http://localhost:3000/api/admin/approvals", { 
    method: "PUT", 
    headers: authHeaders,
    body: JSON.stringify({ registrationId: regId, action: 'APPROVE', role: 'ADMIN' }) 
  });
  data = await res.json();
  if (!data.success) { console.log("Admin fail:", data); return; }
  console.log("SUCCESS!", data);
}
runFlow();
