const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/const dateStrs = "([^"]+)"/);
if (!m) { console.log('NO DATES'); process.exit(1); }
const dates = m[1].split(',');
const now = new Date(); now.setHours(0,0,0,0);
console.log('Today:', now.toDateString());
console.log('Date range:', dates[0], 'to', dates[dates.length-1]);
const idx = dates.findIndex(d => {
  const parts = d.trim().split('-');
  const dt = new Date(2026, {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5}[parts[1]], parseInt(parts[0]));
  return dt.getTime() === now.getTime();
});
console.log('todayIdx:', idx);
