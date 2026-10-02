async function run() {
  try {
    const formData = new FormData();
    formData.append("registrationId", "1");
    formData.append("transactionId", "TXN12345");
    
    // Create a dummy JPEG with correct magic bytes
    const magicBytes = Buffer.from('ffd8ffe000104a4649460001', 'hex');
    const remaining = Buffer.alloc(1024, 'A');
    const fileContent = Buffer.concat([magicBytes, remaining]);
    
    const blob = new Blob([fileContent], { type: "image/jpeg" });
    formData.append("paymentProof", blob, "proof.jpg");

    console.log("Sending payment request...");
    const res = await fetch("https://ytsplatform.vercel.app/api/payment", {
      method: "POST",
      body: formData,
    });
    
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}
run();
