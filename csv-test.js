const fs = require('fs');
const csv = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/GANT NOVA.csv', 'utf8');
const lines = csv.trim().split('\n');

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && (i === 0 || line[i-1] !== '\\')) { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur.trim());
  return cols;
}

// Sum hours (col 3 = index 3)
let sum = 0, count = 0;
for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  if (cols.length >= 4) {
    const h = parseFloat(cols[3].replace(',', '.'));
    if (!isNaN(h)) { sum += h; count++; }
  }
}
console.log('CSV tasks:', count, 'sum:', sum);
