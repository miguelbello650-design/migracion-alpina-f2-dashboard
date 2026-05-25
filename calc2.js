const fs = require('fs');
const html = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/index.html', 'utf8');

const datesStr = html.match(/const dateStrs = "([^"]+)"/)[1];
const dates = datesStr.split(',').map((s, i) => {
  const [d, mon] = s.trim().split('-');
  return new Date(2026, {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5}[mon], parseInt(d));
});
const now = new Date(2026, 4, 25);
const todayIdx = dates.findIndex(d => d.getTime() === now.getTime());

function parseArray(name) {
  const re = new RegExp(`(?:const|let)\\s+${name}\\s*=\\s*\\[`);
  const m = html.match(re);
  if (!m) return [];
  const start = m.index + m[0].length;
  let depth = 1, inStr = false, end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === '"' && html[i-1] !== '\\') inStr = !inStr;
    if (!inStr) {
      if (html[i] === '[' || html[i] === '{') depth++;
      if (html[i] === ']' || html[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  const block = html.substring(start, end);
  const rows = [];
  let pos = 0;
  while (pos < block.length) {
    while (pos < block.length && block[pos] !== '{') pos++;
    if (pos >= block.length) break;
    let bd = 0, is = false, j = pos;
    for (; j < block.length; j++) {
      if (block[j] === '"' && block[j-1] !== '\\') is = !is;
      if (!is) { if (block[j] === '{') bd++; if (block[j] === '}') { bd--; if (bd === 0) break; } }
    }
    const objStr = block.substring(pos, j + 1);
    pos = j + 1;
    const phase = (objStr.match(/phase:"([^"]*)"/) || [])[1];
    const task = (objStr.match(/task:"([^"]*)"/) || [])[1];
    const hours = parseFloat((objStr.match(/hours:([\d.]+)/) || [])[1]);
    const fIdx = parseInt((objStr.match(/fixedIdx:(\d+)/) || [])[1]);
    const fEnd = parseInt((objStr.match(/fixedEndIdx:(\d+)/) || [])[1]);
    const skipM = objStr.match(/skipIndices:\[([^\]]+)\]/);
    const inProg = objStr.includes('inProgress:true');
    if (task && !isNaN(fIdx)) {
      rows.push({ phase: phase || '', task, hours, start: fIdx, end: !isNaN(fEnd) ? fEnd : fIdx, skip: skipM ? skipM[1].split(',').map(Number) : [], inProgress: inProg });
    }
  }
  return rows;
}

const rows = parseArray('GANTT_ROWS_ROBOTINA');
console.log('Tasks:', rows.length);

// Group phases
const phases = [];
let currentPhase = null;
rows.forEach(r => {
  if (r.phase) currentPhase = r.phase;
  if (!phases.length || phases[phases.length-1].name !== currentPhase) {
    phases.push({ name: currentPhase, tasks: [] });
  }
  phases[phases.length-1].tasks.push(r);
});

const phaseResults = phases.map(p => {
  const pcts = p.tasks.map(r => {
    const end = r.end;
    const start = r.start;
    const span = end - start + 1;
    const eff = span - r.skip.length;
    if (eff <= 0) return 0;
    if (dates[end] <= now && !r.inProgress) return 100;
    if (dates[start] > now) return 0;
    const skipSet = new Set(r.skip);
    let completed = 0;
    for (let i = start; i <= Math.min(todayIdx, end); i++) {
      if (!skipSet.has(i)) completed++;
    }
    return Math.min(100, Math.round(completed / eff * 100));
  });
  const phasePct = pcts.length > 0 ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length) : 0;
  return { name: p.name, pct: phasePct, tasks: p.tasks.map((t, i) => ({ task: t.task.substring(0,50), pct: pcts[i], inProgress: t.inProgress, idx: t.start+'-'+t.end })) };
});

const total = phaseResults.length > 0 ? Math.floor(phaseResults.reduce((s, p) => s + p.pct, 0) / phaseResults.length) : 0;

phaseResults.forEach(p => {
  console.log(`\n${p.name}: ${p.pct}%`);
  p.tasks.forEach(t => console.log(`  ${t.pct}% ${t.inProgress?'🔄':'  '} [${t.idx}] ${t.task}`));
});
console.log(`\nTotal: ${total}%`);

// Hours
const hours = rows.reduce((a, r) => {
  const span = r.end - r.start + 1;
  const eff = span - r.skip.length;
  if (eff <= 0) return a;
  if (dates[r.end] <= now && !r.inProgress) { a.completed += (r.hours || 0); return a; }
  if (dates[r.start] > now) return a;
  const skipSet = new Set(r.skip);
  let completed = 0;
  for (let i = r.start; i <= Math.min(todayIdx, r.end); i++) {
    if (!skipSet.has(i)) completed++;
  }
  const pct = Math.min(1, completed / eff);
  a.inProgress += Math.round((r.hours || 0) * pct);
  return a;
}, { completed: 0, inProgress: 0 });
console.log(`\nEjecutadas: ${hours.completed}h, En Curso: ${hours.inProgress}h, Total: ${hours.completed + hours.inProgress}h`);
