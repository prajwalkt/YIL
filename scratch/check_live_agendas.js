async function run() {
  const res = await fetch("https://ytsplatform.vercel.app/api/register");
  console.log("STATUS:", res.status);
  console.log("HEADERS:", Object.fromEntries(res.headers.entries()));
  
  const data = await res.json();
  if (data.courses) {
    let hasHash = false;
    for (const c of data.courses) {
      if (c.agendaPath === "#") {
        hasHash = true;
        console.log(`FOUND #: ${c.name} -> ${c.agendaPath}`);
      } else {
        console.log(`${c.name} -> ${c.agendaPath}`);
      }
    }
    if (!hasHash) {
      console.log("No courses with agendaPath: '#' found!");
    }
  } else {
    console.log(data);
  }
}
run();
