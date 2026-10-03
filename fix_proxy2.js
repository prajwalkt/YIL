const fs = require('fs');
let content = fs.readFileSync('app/library/db.ts', 'utf8');
const start = content.indexOf('const caseInsensitiveRows = res.rows.map');
const end = content.indexOf('return {', start);
if (start > -1 && end > -1) {
  const newLogic = `    const caseInsensitiveRows = res.rows.map((row: any) => {
      if (!row) return row;
      const newRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        const mappedKey = CaseMap[lowerKey] || key;
        newRow[mappedKey] = value;
      }
      return newRow;
    });\n\n    `;
  content = content.substring(0, start) + newLogic + content.substring(end);
  fs.writeFileSync('app/library/db.ts', content);
  console.log('Fixed proxy logic manually!');
} else {
  console.log('Could not find start/end indices');
}
