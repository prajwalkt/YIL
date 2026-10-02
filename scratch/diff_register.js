const fs = require('fs');
const d1 = fs.readFileSync('app/api/register/route.ts', 'utf8').split('\n').map(l => l.trimEnd());
const d2 = fs.readFileSync('scratch/c277c62_register.ts', 'utf8').split('\n').map(l => l.trimEnd());
let i = 0, j = 0;
while(i < d1.length || j < d2.length) {
  if (d1[i] !== d2[j]) {
    console.log(`L${i+1} (-): ${d1[i]}`);
    console.log(`L${j+1} (+): ${d2[j]}`);
  }
  i++; j++;
}
