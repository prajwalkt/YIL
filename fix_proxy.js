const fs = require('fs');
let dbFile = fs.readFileSync('app/library/db.ts', 'utf8');

const newLogic = `    const caseInsensitiveRows = res.rows.map((row: any) => {
      if (!row) return row;
      const newRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        const mappedKey = CaseMap[lowerKey] || key;
        newRow[mappedKey] = value;
      }
      return newRow;
    });`;

const oldLogic = `    const caseInsensitiveRows = res.rows.map((row: any) => {
      return new Proxy(row, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            const lowerProp = prop.toLowerCase();
            const key = Object.keys(target).find(k => k.toLowerCase() === lowerProp);
            if (key) return target[key];
          }
          return target[prop];
        }
      });
    });`;

dbFile = dbFile.replace(oldLogic, newLogic);
fs.writeFileSync('app/library/db.ts', dbFile);
console.log('Successfully updated proxy logic');
