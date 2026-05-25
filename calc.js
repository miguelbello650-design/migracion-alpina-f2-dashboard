const fs = require('fs');
const html = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/index.html', 'utf8');

// Parse dates
const datesStr = html.match(/const dateStrs = "([^"]+)"/)[1];
const dates = datesStr.split(',').map((s, i) => {
  const [d, mon] = s.trim().split('-');
  return new Date(2026, {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5}[mon], parseInt(d));
});

const now = new Date(2026, 4, 25);
const todayIdx = dates.findIndex(d => d.getTime() === now.getTime());
console.log('Today index:', todayIdx);

// Find GANTT_ROWS block
const idx = html.indexOf('let GANTT_ROWS =');
const startArray = html.indexOf('[', idx);
let depth = 1, inStr = false;
let endIdx = startArray + 1;
for (; endIdx < html.length; endIdx++) {
  const c = html[endIdx], prev = html[endIdx-1];
  if (c === '"' && prev !== '\\') inStr = !inStr;
  if (!inStr) {
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') { depth--; if (depth === 0) break; }
  }
}
const block = html.substring(startArray + 1, endIdx);

// Parse each object - bare keys (no quotes around field names)
const tasks = [];
let pos = 0;
while (pos < block.length) {
  while (pos < block.length && block[pos] !== '{') pos++;
  if (pos >= block.length) break;
  
  let bd = 0, is = false, j = pos;
  for (; j < block.length; j++) {
    if (block[j] === '"' && block[j-1] !== '\\') is = !is;
    if (!is) {
      if (block[j] === '{') bd++;
      if (block[j] === '}') { bd--; if (bd === 0) break; }
    }
  }
  
  const objStr = block.substring(pos, j + 1);
  pos = j + 1;
  
  const tname = (objStr.match(/task:"([^"]*)"/) || [])[1];
  const hours = parseFloat((objStr.match(/hours:([\d.]+)/) || [])[1]);
  const fIdx = parseInt((objStr.match(/fixedIdx:(\d+)/) || [])[1]);
  const fEnd = parseInt((objStr.match(/fixedEndIdx:(\d+)/) || [])[1]);
  const skipM = objStr.match(/skipIndices:\[([^\]]+)\]/);
  const inProg = objStr.includes('inProgress:true');
  
  if (tname && !isNaN(hours) && !isNaN(fIdx)) {
    const skip = skipM ? skipM[1].split(',').map(Number) : [];
    tasks.push({ task: tname, hours, start: fIdx, end: !isNaN(fEnd) ? fEnd : fIdx, skip, inProgress: inProg });
  }
}

console.log('Tasks parsed:', tasks.length);
console.log('Planned total:', tasks.reduce((s, t) => s + t.hours, 0));

// Prorated
let prorated = 0;
let details = [];
tasks.forEach(t => {
  const span = t.end - t.start + 1;
  const eff = span - t.skip.length;
  if (eff <= 0) return;
  
  let contrib;
  if (dates[t.end] <= now && !t.inProgress) {
    contrib = t.hours;
  } else if (dates[t.start] > now) {
    contrib = 0;
  } else {
    const skipSet = new Set(t.skip);
    let completed = 0;
    for (let idx = t.start; idx <= Math.min(todayIdx, t.end); idx++) {
      if (!skipSet.has(idx)) completed++;
    }
    const pct = Math.min(1, completed / eff);
    contrib = Math.round(t.hours * pct);
    if (contrib !== t.hours) {
      details.push({ task: t.task, hours: t.hours, completed, eff, pct: Math.round(completed/eff*100), contrib });
    }
  }
  prorated += contrib;
});

console.log('Prorated total:', prorated, 'h');
console.log('\nPartial tasks:');
details.forEach(d => console.log(`  "${d.task.substring(0,50)}": ${d.hours}h × ${d.pct}% (${d.completed}/${d.eff}) = ${d.contrib}h`));
console.log('\nDiff:', tasks.reduce((s, t) => s + t.hours, 0) - prorated);
