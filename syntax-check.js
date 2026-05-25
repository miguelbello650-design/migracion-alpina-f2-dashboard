const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.log('NO SCRIPT TAG'); process.exit(1); }
const js = m[1];
try {
  new Function(js);
  console.log('SYNTAX OK');
} catch(e) {
  console.log('SYNTAX ERROR:', e.message);
  const lines = js.split('\n');
  const errLine = parseInt(e.message.match(/line (\d+)/)?.[1] || '0');
  if (errLine) {
    console.log('Around line ' + errLine + ':');
    console.log(lines.slice(Math.max(0,errLine-3), errLine+2).map((l,i) => (errLine-2+i) + ': ' + l).join('\n'));
  }
}
