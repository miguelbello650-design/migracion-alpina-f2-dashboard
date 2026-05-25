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

// Find first object
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
console.log('First object string:');
console.log(firstObj.substring(0, 200));
console.log('\n---');
console.log('Has task:', (/"task":"([^"]*)"/).test(firstObj));
console.log('Has hours:', (/hours:([\d.]+)/).test(firstObj));
console.log('Has fixedIdx:', (/fixedIdx:(\d+)/).test(firstObj));
console.log('\nExtracted task:', (firstObj.match(/"task":"([^"]*)"/) || ['','NOT FOUND'])[1]);
console.log('Extracted hours:', parseFloat((firstObj.match(/hours:([\d.]+)/) || [])[1]));
console.log('Extracted fixedIdx:', parseInt((firstObj.match(/fixedIdx:(\d+)/) || [])[1]));
console.log('hours isNaN:', isNaN(parseFloat((firstObj.match(/hours:([\d.]+)/) || [])[1])));
