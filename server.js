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

function reportDates(ganttDates) {
  // Fechas tecnicas para calcular jornadas desplazadas sin mostrarlas en el Gantt.
  const extended = [...ganttDates]
  for (const date of ['11-Aug-26', '12-Aug-26', '13-Aug-26', '14-Aug-26', '17-Aug-26', '18-Aug-26', '19-Aug-26', '20-Aug-26', '21-Aug-26', '24-Aug-26', '25-Aug-26', '26-Aug-26', '27-Aug-26', '28-Aug-26', '31-Aug-26', '1-Sep-26', '2-Sep-26', '3-Sep-26', '4-Sep-26', '7-Sep-26', '8-Sep-26']) {
    if (!extended.includes(date)) extended.push(date)
  }
  return extended
}

function readGanttDates() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const match = /const dateStrs = "([^"]+)"/.exec(html);
  if (!match) return [];
  const dates = match[1].split(',').map(s => s.trim());
  const pushed = /dateStrs\.push\(([^)]+)\)/.exec(html);
  if (pushed) {
    const extra = [...pushed[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    dates.push(...extra);
  }
  return [...new Set(dates)];
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // API: GET /api/data - toutes les données
  if (req.method === 'GET' && pathname === '/api/data') {
    const data = db.getAllData();
    // Incluir todas las fechas del Gantt, incluidas las agregadas tecnicamente al final.
    data.ganttDates = readGanttDates();
    // Mismo helper que usa la grafica "Horas Contratadas vs Horas Restantes" del dashboard.
    data.reporteHoras = calculateReporteHoras({
      ganttRows: data.ganttRows,
      staticMonthly: data.staticMonthly,
      proyectos: data.proyectos,
      ganttDates: reportDates(data.ganttDates),
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
    const dates = readGanttDates();
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

  // Persist the support dashboard selected locally so it can be published with main.
  if (req.method === 'POST' && pathname === '/api/support-html') {
    readJsonBody(req, res, data => {
      if (typeof data.html !== 'string' || !/<html[\s>]/i.test(data.html)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid support HTML' }));
        return;
      }
      try {
        fs.writeFileSync(path.join(ROOT, 'assets', 'support', 'dashboard_alpina_2.html'), data.html, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
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
