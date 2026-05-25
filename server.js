const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const PORT = 3000;
const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, 'state.json');

const monthsAbb = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};

// Parse date strings into Date objects
function parseDates() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/const dateStrs = "([^"]+)"/);
  if (!m) return [];
  return m[1].split(',').map(s => {
    const [d, mon, y] = s.trim().split('-');
    return new Date(2026, monthsAbb[mon], parseInt(d));
  });
}

// Extract a JS array from index.html by name (handle const or let)
function extractArray(html, name) {
  const re = new RegExp(`(?:const|let)\\s+${name}\\s*=\\s*\\[`);
  const startMatch = html.match(re);
  if (!startMatch) return null;
  const startIdx = startMatch.index + startMatch[0].length;
  let depth = 0, inStr = false, endIdx = startIdx;
  for (let i = startIdx; i < html.length; i++) {
    const c = html[i];
    if (c === '"' && (i === 0 || html[i-1] !== '\\')) inStr = !inStr;
    if (!inStr) {
      if (c === '[') depth++;
      if (c === ']') { if (depth === 0) { endIdx = i; break; } depth--; }
    }
  }
  const block = html.substring(startIdx, endIdx);
  return parseJSArray(block);
}

// Parse JS array of objects (handle JS syntax not JSON)
function parseJSArray(str) {
  const tasks = [];
  let pos = 0;
  while (pos < str.length) {
    while (pos < str.length && str[pos] !== '{') pos++;
    if (pos >= str.length) break;
    let braceDepth = 0, inStr = false, j = pos;
    for (; j < str.length; j++) {
      if (str[j] === '"' && (j === 0 || str[j-1] !== '\\')) inStr = !inStr;
      if (!inStr) {
        if (str[j] === '{') braceDepth++;
        if (str[j] === '}') { braceDepth--; if (braceDepth === 0) break; }
      }
    }
    const objStr = str.substring(pos, j + 1);
    pos = j + 1;
    tasks.push(parseJSObject(objStr));
  }
  return tasks;
}

// Parse a single JS object literal
function parseJSObject(str) {
  const obj = {};
  const pairRe = /([a-zA-Z_$][\w]*)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|\[([^\]]*)\]|true|false|([\d.]+))/g;
  let m;
  while ((m = pairRe.exec(str)) !== null) {
    const key = m[1];
    let val;
    if (m[2] !== undefined) val = m[2];         // string
    else if (m[3] !== undefined) val = m[3].split(',').filter(s => s.trim()).map(Number);  // array
    else if (m[4] !== undefined) val = parseFloat(m[4]);  // number
    else if (str.substring(m.index).match(/:\s*true/)) val = true;
    else if (str.substring(m.index).match(/:\s*false/)) val = false;
    obj[key] = val;
  }
  return obj;
}

// Serialize tasks back to JS array string
function serializeArray(tasks) {
  const lines = tasks.map((t, i) => {
    const keys = Object.keys(t);
    const pairs = keys.map(k => {
      let v = t[k];
      if (typeof v === 'string') return `${k}:"${v.replace(/"/g, '\\"')}"`;
      if (Array.isArray(v)) return `${k}:[${v.join(',')}]`;
      return `${k}:${v}`;
    });
    return '  { ' + pairs.join(',') + ' }';
  });
  return lines.join(',\n');
}

// Replace an array in index.html
function replaceArray(html, name, newTasks) {
  const re = new RegExp(`((?:const|let)\\s+${name}\\s*=\\s*\\[)[\\s\\S]*?(\\];)`);
  const serialized = serializeArray(newTasks);
  return html.replace(re, `$1\n${serialized}\n$2`);
}

// Load state from state.json or extract from index.html
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return {
    nova: extractArray(html, 'GANTT_ROWS'),
    feli: extractArray(html, 'GANTT_ROWS_FELI'),
    robotina: extractArray(html, 'GANTT_ROWS_ROBOTINA')
  };
}

// Save state and update index.html
function saveState(state, res, sendResponse) {
  // Write state.json
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  // Update index.html
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  html = replaceArray(html, 'GANTT_ROWS', state.nova);
  html = replaceArray(html, 'GANTT_ROWS_FELI', state.feli);
  html = replaceArray(html, 'GANTT_ROWS_ROBOTINA', state.robotina);
  fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');

  // Respond quickly, then do git async
  if (sendResponse !== false) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }

  // Git push (async, don't block response)
  exec('git add -A && git commit --allow-empty -m "Auto-sync from dashboard" && git push', { cwd: ROOT, timeout: 30000 }, (err) => {
    if (err) console.error('Git sync error:', err.message);
  });
}

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ps1': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // API: GET /api/state
  if (req.method === 'GET' && pathname === '/api/state') {
    const state = loadState();
    const dates = parseDates();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...state, dates }));
    return;
  }

  // API: POST /api/sync
  if (req.method === 'POST' && pathname === '/api/sync') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        saveState({ nova: data.nova, feli: data.feli, robotina: data.robotina }, res);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Servidor local iniciado`);
  console.log(`  Abre: http://localhost:${PORT}`);
  console.log(`  Los cambios del admin chat se guardarán automáticamente.`);
  console.log(`  Presiona Ctrl+C para detener.\n`);
});
