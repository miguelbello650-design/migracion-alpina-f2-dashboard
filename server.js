const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const db = require('./db');
const { calculateReporteHoras } = require('./reporte-horas');

const PORT = 3000;
const ROOT = process.cwd();
const MAX_BODY_BYTES = 1024 * 1024;

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

function readJsonBody(req, res, onData) {
  let size = 0;
  let body = '';
  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Payload too large' }));
      req.destroy();
      return;
    }
    body += chunk;
  });
  req.on('end', () => {
    if (size > MAX_BODY_BYTES || res.writableEnded) return;
    try { onData(JSON.parse(body)); }
    catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // API: GET /api/data - toutes les données
  if (req.method === 'GET' && pathname === '/api/data') {
    const data = db.getAllData();
    // Incluir fechas del Gantt desde el HTML
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const match = /const dateStrs = "([^"]+)"/.exec(html);
    if (match) {
      data.ganttDates = match[1].split(',').map(s => s.trim());
    }
    // Mismo helper que usa la grafica "Horas Contratadas vs Horas Restantes" del dashboard.
    data.reporteHoras = calculateReporteHoras({
      ganttRows: data.ganttRows,
      staticMonthly: data.staticMonthly,
      proyectos: data.proyectos,
      ganttDates: data.ganttDates,
      contratadas: 4320
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // API: GET /api/dates - fechas del Gantt
  if (req.method === 'GET' && pathname === '/api/dates') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const match = /const dateStrs = "([^"]+)"/.exec(html);
    if (!match) {
      res.writeHead(404); res.end('Dates not found'); return;
    }
    const dates = match[1].split(',').map(s => s.trim());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dates));
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
    readJsonBody(req, res, data => {
      try {
        const botMap = { nova:'nova', feli:'feli', robotina:'robotina', googlenova:'googlenova' };
        Object.keys(data).forEach(bot => {
          const realBot = botMap[bot];
          if (!realBot) return;
          db.replaceGanttRows(realBot, data[bot]);
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
    readJsonBody(req, res, data => {
      try {
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
    readJsonBody(req, res, data => {
      try {
        if (data.ganttRows) {
          Object.keys(data.ganttRows).forEach(bot => db.replaceGanttRows(bot, data.ganttRows[bot]));
        } else if (data.nova || data.feli || data.robotina || data.googlenova) {
          ['nova','feli','robotina','googlenova'].forEach(bot => {
            if (data[bot]) db.replaceGanttRows(bot, data[bot]);
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

  // Only the dashboard entry points and assets are safe to expose locally.
  const relativePath = decodeURIComponent(pathname === '/' ? 'index.html' : pathname).replace(/^[/\\]+/, '');
  const filePath = path.resolve(ROOT, relativePath);
  const assetsRoot = path.resolve(ROOT, 'assets') + path.sep;
  const allowed = filePath === path.resolve(ROOT, 'index.html') ||
    filePath === path.resolve(ROOT, 'reporte-horas.js') ||
    filePath.startsWith(assetsRoot);
  if (!allowed) { notFound(res); return; }
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        notFound(res);
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Servidor local iniciado (SQLite)`);
  console.log(`  Abre: http://localhost:${PORT}`);
  console.log(`  Presiona Ctrl+C para detener.\n`);
});

process.on('SIGINT', () => { db.close(); process.exit(); });
process.on('SIGTERM', () => { db.close(); process.exit(); });
