const fs = require('fs');
const html = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/index.html', 'utf8');

const name = 'GANTT_ROWS';
const re = new RegExp(`(?:const|let)\\s+${name}\\s*=\\s*\\[`);
const startMatch = html.match(re);
console.log('startMatch:', startMatch ? startMatch[0] : 'null');

if (startMatch) {
  const startIdx = startMatch.index + startMatch[0].length;
  let depth = 0, inStr = false, endIdx = startIdx;
  for (let i = startIdx; i < html.length; i++) {
    if (html[i] === '"' && (i === 0 || html[i-1] !== '\\')) inStr = !inStr;
    if (!inStr) {
      if (html[i] === '[') depth++;
      if (html[i] === ']') { if (depth === 0) { endIdx = i; break; } depth--; }
    }
  }
  const block = html.substring(startIdx, endIdx);
  
  const tasks = [];
  let pos = 0;
  while (pos < block.length) {
    while (pos < block.length && block[pos] !== '{') pos++;
    if (pos >= block.length) break;
    let braceDepth = 0, inStr2 = false, j = pos;
    for (; j < block.length; j++) {
      if (block[j] === '"' && (j === 0 || block[j-1] !== '\\')) inStr2 = !inStr2;
      if (!inStr2) {
        if (block[j] === '{') braceDepth++;
        if (block[j] === '}') { braceDepth--; if (braceDepth === 0) break; }
      }
    }
    const objStr = block.substring(pos, j + 1);
    pos = j + 1;
    
    const obj = {};
    const pairRe = /([a-zA-Z_$][\w]*)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|\[([^\]]*)\]|([\d.]+)|true|false)/g;
    let m;
    while ((m = pairRe.exec(objStr)) !== null) {
      const key = m[1];
      if (m[2] !== undefined) obj[key] = m[2];
      else if (m[3] !== undefined) obj[key] = m[3].split(',').filter(s => s.trim()).map(Number);
      else if (m[4] !== undefined) obj[key] = parseFloat(m[4]);
      else if (m[0].includes('true')) obj[key] = true;
      else if (m[0].includes('false')) obj[key] = false;
    }
    
    if (obj.hours && obj.fixedIdx !== undefined) tasks.push(obj);
  }
  console.log('Tasks parsed:', tasks.length);
  const est = tasks.find(t => t.task && t.task.includes('Estabilización'));
  console.log('Estabilización found:', est ? est.task : 'NO');
  if (est) console.log('inProgress:', est.inProgress, 'fixedEndIdx:', est.fixedEndIdx);
}
