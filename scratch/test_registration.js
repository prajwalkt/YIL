async function testRegistration() {
  const formData = new FormData();
  formData.append("name", "Test User");
  formData.append("email", "test@test.com");
  formData.append("course", "CENTUM VP DCS Fundamentals & Engineering");
  formData.append("trainingMode", "E-Learning (Self-Paced)");
  formData.append("sponsor", "SELF");
  
  try {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      body: formData
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
testRegistration();
