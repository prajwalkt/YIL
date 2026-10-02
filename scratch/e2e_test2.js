async function runFlow() {
  console.log("1. Registration...");
  let formData = new FormData();
  formData.append("name", "E2E Test User");
  formData.append("email", "e2etest@example.com");
  formData.append("phone", "1234567890");
  formData.append("organization", "Test Org");
  formData.append("country", "India");
  formData.append("graduationYear", "2024");
  formData.append("course", "CENTUM VP DCS Fundamentals & Engineering");
  formData.append("trainingMode", "E-Learning (Self-Paced)");
  formData.append("sponsor", "SELF");
  
  let res = await fetch("http://localhost:3000/api/register", { method: "POST", body: formData });
  let data = await res.json();
  console.log("Register response:", data);
  if (!data.success) {
    console.log("Registration failed. Stopping.");
    return;
  }
  const regId = data.registrationId;
  console.log("Registration ID:", regId);
  
}
runFlow();
