const fs = require('fs');
const html = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/index.html', 'utf8');

const datesStr = html.match(/const dateStrs = "([^"]+)"/)[1];
const dates = datesStr.split(',').map((s, i) => {
  const [d, mon] = s.trim().split('-');
  return new Date(2026, {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5}[mon], parseInt(d));
});

const now = new Date(2026, 4, 25);
const todayIdx = dates.findIndex(d => d.getTime() === now.getTime());

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
console.log('Planned:', tasks.reduce((s, t) => s + t.hours, 0));

// Test different approaches
function compute(method, excludeToday) {
  return tasks.reduce((s, t) => {
    const end = t.end;
    const start = t.start;
    const span = end - start + 1;
    const eff = span - t.skip.length;
    if (eff <= 0) return s;
    
    if (dates[end] <= now && !t.inProgress) return s + t.hours;
    if (dates[start] > now) return s;
    
    const skipSet = new Set(t.skip);
    let completed = 0;
    const limit = excludeToday ? Math.min(todayIdx - 1, end) : Math.min(todayIdx, end);
    for (let i = start; i <= limit; i++) {
      if (!skipSet.has(i)) completed++;
    }
    const pct = Math.min(1, completed / eff);
    if (method === 'round') return s + Math.round(t.hours * pct);
    if (method === 'floor') return s + Math.floor(t.hours * pct);
    return s + Math.round(t.hours * pct);
  }, 0);
}

console.log('Math.round (includes today):', compute('round', false));
console.log('Math.round (excludes today):', compute('round', true));
console.log('Math.floor (includes today):', compute('floor', false));
console.log('Math.floor (excludes today):', compute('floor', true));
console.log('Math.round + exclude today + eff-1:', 
  tasks.reduce((s, t) => {
    const end = t.end, start = t.start;
    const span = end - start + 1;
    const eff = span - t.skip.length;
    if (eff <= 0) return s;
    if (dates[end] <= now && !t.inProgress) return s + t.hours;
    if (dates[start] > now) return s;
    const skipSet = new Set(t.skip);
    let completed = 0;
    for (let i = start; i <= Math.min(todayIdx - 1, end); i++) {
      if (!skipSet.has(i)) completed++;
    }
    const pct = Math.min(1, completed / Math.max(1, eff - 1));
    return s + Math.round(t.hours * pct);
  }, 0));
