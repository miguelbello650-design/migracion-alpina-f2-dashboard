const fs = require('fs');
const html = fs.readFileSync('C:/Users/2NV/Desktop/Prueba de IPM/index.html', 'utf8');

const idx = html.indexOf('let GANTT_ROWS =');
console.log('Found at index:', idx);

// Find the opening [
const startArray = html.indexOf('[', idx);
console.log('Opening [ at:', startArray);

// Track depth
let depth = 1, inStr = false;
let i = startArray + 1;
for (; i < html.length; i++) {
  const c = html[i];
  const prev = i > 0 ? html[i-1] : '';
  if (c === '"' && prev !== '\\') inStr = !inStr;
  if (!inStr) {
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') { depth--; if (depth === 0) { console.log('Closing ] at:', i); break; } }
  }
}

const block = html.substring(startArray + 1, i);
console.log('Block length:', block.length);
console.log('First 200 of block:', block.substring(0, 200));
console.log('Last 200 of block:', block.substring(Math.max(0, block.length - 200)));

// Now try to parse first object
const firstObjMatch = block.match(/\{([^}]+)\}/);
if (firstObjMatch) {
  console.log('\nFirst object match:', firstObjMatch[0].substring(0, 100));
}
