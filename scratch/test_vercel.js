async function run() {
  try {
    const res = await fetch("https://ytsplatform.vercel.app/api/register");
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text.substring(0, 500)); // Print first 500 chars
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}
run();
