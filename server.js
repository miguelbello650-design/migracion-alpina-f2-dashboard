const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const db = require('./db');

const PORT = 3000;
const ROOT = process.cwd();

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

  // API: GET /api/data - toutes les données
  if (req.method === 'GET' && pathname === '/api/data') {
    const data = db.getAllData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // API: GET /api/data/gantt/:bot
  if (req.method === 'GET' && pathname.startsWith('/api/data/gantt/')) {
    const bot = pathname.split('/')[4];
    if (!['nova','feli','robotina','googlenova'].includes(bot)) {
      res.writeHead(400); res.end('Bad bot'); return;
    }
    const rows = db.getGanttRows(bot);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  // API: POST /api/sync/gantt - update gantt rows
  if (req.method === 'POST' && pathname === '/api/sync/gantt') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const botMap = { nova:'nova', feli:'feli', robotina:'robotina', googlenova:'googlenova' };
        Object.keys(data).forEach(bot => {
          const realBot = botMap[bot];
          if (!realBot) return;
          data[bot].forEach((row, idx) => {
            db.updateGanttRow(realBot, idx, row);
          });
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: POST /api/sync/static - update static_monthly
  if (req.method === 'POST' && pathname === '/api/sync/static') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        db.setAllStaticMonthly(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: POST /api/sync - generic full sync
  if (req.method === 'POST' && pathname === '/api/sync') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.ganttRows) {
          Object.keys(data.ganttRows).forEach(bot => {
            data.ganttRows[bot].forEach((row, idx) => {
              db.updateGanttRow(bot, idx, row);
            });
          });
        } else if (data.nova || data.feli || data.robotina || data.googlenova) {
          ['nova','feli','robotina','googlenova'].forEach(bot => {
            if (data[bot]) data[bot].forEach((row, idx) => db.updateGanttRow(bot, idx, row));
          });
        }
        if (data.staticMonthly) db.setAllStaticMonthly(data.staticMonthly);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
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
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.end(content);
  });
});

// Seed DB on startup if first run
db.init();
db.seedFromHtml();

server.listen(PORT, () => {
  console.log(`\n  Servidor local iniciado (SQLite)`);
  console.log(`  Abre: http://localhost:${PORT}`);
  console.log(`  Presiona Ctrl+C para detener.\n`);
});

process.on('SIGINT', () => { db.close(); process.exit(); });
process.on('SIGTERM', () => { db.close(); process.exit(); });
