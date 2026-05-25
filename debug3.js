const fs = require('fs');
const html = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/index.html', 'utf8');

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

let pos = 0;
while (pos < block.length && block[pos] !== '{') pos++;
let bd = 0, is = false, j = pos;
for (; j < block.length; j++) {
  if (block[j] === '"' && block[j-1] !== '\\') is = !is;
  if (!is) {
    if (block[j] === '{') bd++;
    if (block[j] === '}') { bd--; if (bd === 0) break; }
  }
}
const firstObj = block.substring(pos, j + 1);

// Direct test
const s = firstObj;
console.log('task regex test:');
const re = /"task":"([^"]*)"/;
const m = s.match(re);
console.log('Match result:', m);
console.log('s.indexOf task:', s.indexOf('task'));
console.log('Chars around task:', s.substring(s.indexOf('task')-5, s.indexOf('task')+30));
console.log('Char codes:');
for (let i = s.indexOf('task')-2; i < s.indexOf('task') + 25; i++) {
  console.log('  [' + i + '] ' + s[i] + ' (0x' + s.charCodeAt(i).toString(16) + ')');
}
