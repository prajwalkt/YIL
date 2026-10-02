const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'YTS-LMS-JWT-Secret-2024-ChangeMe-UseOpenSSLRandBase64-64chars-InProd!!';
const studentToken = jwt.sign({ userId: 34, email: "gapuser@example.com", role: "STUDENT" }, JWT_SECRET, { expiresIn: '1h' });

async function run() {
  const res = await fetch("http://localhost:3000/api/student/dashboard", {
    headers: { 'Cookie': `auth_token=${studentToken}` }
  });
  const data = await res.json();
  console.log("DASHBOARD DATA:");
  console.log(JSON.stringify(data.enrollments, null, 2));
}
run();
