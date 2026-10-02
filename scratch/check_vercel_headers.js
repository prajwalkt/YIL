async function run() {
  try {
    const res = await fetch("https://ytsplatform.vercel.app/api/register");
    console.log("STATUS:", res.status);
    console.log("HEADERS:");
    for (let [key, value] of res.headers.entries()) {
      console.log(key, ":", value);
    }
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}
run();
