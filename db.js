const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, 'database.db');
let db;

function open() {
  if (db) return db;
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

function init() {
  const d = open();
  d.exec(`
    CREATE TABLE IF NOT EXISTS gantt_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot TEXT NOT NULL, sort_idx INTEGER,
      phase TEXT, task TEXT, resp TEXT,
      hours REAL, days REAL,
      fixedIdx INTEGER, fixedEndIdx INTEGER,
      skipIndices TEXT, notesIdx TEXT,
      milestone INTEGER DEFAULT 0,
      inProgress INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS static_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skey TEXT NOT NULL, month TEXT NOT NULL, hours REAL NOT NULL,
      UNIQUE(skey, month)
    );
    CREATE TABLE IF NOT EXISTS proyectos (
      pkey TEXT PRIMARY KEY, name TEXT, icon TEXT,
      responsable TEXT, color TEXT,
      status TEXT, progress REAL,
      startDate TEXT, endDate TEXT,
      hours REAL, descr TEXT
    );
    CREATE TABLE IF NOT EXISTS gantt_notes (
      nidx INTEGER PRIMARY KEY, ntext TEXT
    );
    CREATE TABLE IF NOT EXISTS gray_days (
      bot TEXT NOT NULL, day_idx INTEGER NOT NULL,
      PRIMARY KEY(bot, day_idx)
    );
    CREATE TABLE IF NOT EXISTS config (
      ckey TEXT PRIMARY KEY, cvalue TEXT
    );
  `);
  return d;
}

function hasData() {
  const d = open();
  return d.prepare('SELECT COUNT(*) as c FROM config WHERE ckey = ?').get('seeded').c > 0;
}

function markSeeded() {
  const d = open();
  d.prepare('INSERT OR REPLACE INTO config (ckey,cvalue) VALUES (?,?)').run('seeded', '1');
}

function clearAll() {
  const d = open();
  ['gantt_rows','static_monthly','proyectos','gantt_notes','gray_days','config'].forEach(t => d.prepare('DELETE FROM ' + t).run());
}

// Convert JS object/array literal to JSON, handling single quotes and unquoted keys
function jsLiteralToJSON(str) {
  let out = '';
  let inStr = false, strChar = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i], prev = i > 0 ? str[i-1] : '';
    if (inStr) {
      if (c === strChar && prev !== '\\') {
        // End of string - output closing delimiter
        out += '"';
        inStr = false; strChar = null;
      } else if (c === '"') {
        // Double quote inside single-quoted string - escape it
        out += '\\"';
      } else {
        out += c;
      }
      continue;
    }
    if (c === "'") {
      // Start single-quoted string - output double quote instead
      out += '"';
      inStr = true; strChar = "'";
    } else if (c === '"') {
      // Start double-quoted string
      out += '"';
      inStr = true; strChar = '"';
    } else if (c === '`') {
      // Template literal - treat as string, use double quotes
      out += '"';
      inStr = true; strChar = '`';
    } else if (c === ',' || c === '{' || c === '}') {
      out += c;
    } else if (c === ' ' || c === '\n' || c === '\r' || c === '\t') {
      out += c;
    } else if (c === ':' && i > 0 && /[\w"'\]}]/.test(str[i-1])) {
      // Likely a key-value separator
      out += ':';
    } else if (/[a-zA-Z_$]/.test(c)) {
      // Check if this is an unquoted key before ':'
      // Read ahead to see if we have word: pattern
      let j = i;
      while (j < str.length && /\w/.test(str[j])) j++;
      if (j < str.length && str[j] === ':') {
        // This is an unquoted key - quote it
        out += '"' + str.substring(i, j) + '":';
        i = j;
      } else {
        out += c;
      }
    } else {
      out += c;
    }
  }
  // Remove trailing commas
  out = out.replace(/,(\s*[}\]])/g, '$1');
  // Replace new Date(...) with its ISO string representation
  out = out.replace(/new Date\((\d{4}),(\d{1,2}),(\d{1,2})(?:,\d+,\d+,\d+)?\)/g, (m, y, mo, d) => {
    const dt = new Date(parseInt(y), parseInt(mo), parseInt(d));
    return '"' + dt.toISOString().split('T')[0] + '"';
  });
  return out;
}

// Extract a JS literal (array or object) with proper depth tracking
function extractJSLiteral(script, varName) {
  const idx = script.search(new RegExp('(?:let|const|var)\\s+' + varName + '\\s*='));
  if (idx === -1) return null;
  let pos = script.indexOf('=', idx) + 1;
  while (pos < script.length && script[pos] <= ' ') pos++;
  const origPos = pos;
  if (script[pos] !== '[' && script[pos] !== '{') return null;
  let depth = 0, inStr = false, strChar = null;
  const endChar = script[pos] === '[' ? ']' : '}';
  for (let i = pos; i < script.length; i++) {
    const c = script[i], prev = i > 0 ? script[i-1] : '';
    if (inStr) {
      if (c === strChar && prev !== '\\') inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c; continue; }
    if (c === script[pos]) depth++;
    if (c === endChar) { depth--; if (depth === 0) { pos = i + 1; break; } }
  }
  const raw = script.substring(origPos, pos);
  // Convert JS to JSON
  try {
    const json = jsLiteralToJSON(raw);
    return JSON.parse(json);
  } catch(e) {
    console.log('  JSON parse error for ' + varName + ': ' + e.message.substring(0,100));
    return null;
  }
}

function seedFromHtml() {
  const d = init();
  if (hasData()) return;
  console.log('Seeding database from index.html...');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const s = html.indexOf('<script>'), e = html.indexOf('</script>');
  const script = html.substring(s + 8, e);

  const botMap = { GANTT_ROWS:'nova', GANTT_ROWS_FELI:'feli', GANTT_ROWS_ROBOTINA:'robotina', GANTT_ROWS_GOOGLE_NOVA:'googlenova' };
  const insRow = d.prepare('INSERT OR REPLACE INTO gantt_rows (bot,sort_idx,phase,task,resp,hours,days,fixedIdx,fixedEndIdx,skipIndices,notesIdx,milestone,inProgress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
  Object.keys(botMap).forEach(varName => {
    const rows = extractJSLiteral(script, varName);
    if (!rows || !Array.isArray(rows)) { console.log('  No data for ' + varName); return; }
    const bot = botMap[varName];
    const tx = d.transaction(() => {
      rows.forEach((r, i) => {
        if (!r || !r.task) return;
        insRow.run(bot, i, r.phase||'', r.task||'', r.resp||'', r.hours||0, r.days||0, r.fixedIdx, r.fixedEndIdx, JSON.stringify(r.skipIndices||[]), JSON.stringify(r.notesIdx||[]), r.milestone?1:0, r.inProgress?1:0);
      });
    });
    tx();
    console.log('  ' + varName + ': ' + rows.filter(r=>r&&r.task).length + ' rows');
  });

  const stats = extractJSLiteral(script, 'STATIC_MONTHLY');
  if (stats) {
    const insStat = d.prepare('INSERT OR REPLACE INTO static_monthly (skey,month,hours) VALUES (?,?,?)');
    const tx = d.transaction(() => {
      Object.keys(stats).forEach(k => {
        Object.keys(stats[k]).forEach(m => {
          if (m.startsWith('_')) return;
          insStat.run(k, m, stats[k][m]);
        });
      });
    });
    tx();
    console.log('  STATIC_MONTHLY: ' + Object.keys(stats).length + ' keys');
  }

  const proys = extractJSLiteral(script, 'PROYECTOS');
  if (proys && Array.isArray(proys)) {
    const insP = d.prepare('INSERT OR REPLACE INTO proyectos (pkey,name,icon,responsable,color,status,progress,startDate,endDate,hours,descr) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    const tx = d.transaction(() => {
      proys.forEach(p => {
        const sd = p.staticData || {};
        insP.run(p.key, p.name, p.icon, p.responsable, p.color, sd.status||'', sd.progress, sd.startDate||null, sd.endDate||null, sd.hours, sd.desc||'');
      });
    });
    tx();
    console.log('  PROYECTOS: ' + proys.length + ' projects');
  }

  // Extract GANTT_NOTES (GANTT_NOTES[idx] = "text" statements)
  const notesRe = /GANTT_NOTES\[(\d+)\]\s*=\s*"((?:[^"\\]|\\.)*)"/g;
  let nM;
  const notesOut = {};
  while ((nM = notesRe.exec(script)) !== null) notesOut[parseInt(nM[1])] = nM[2];
  if (Object.keys(notesOut).length) {
    const insN = d.prepare('INSERT OR REPLACE INTO gantt_notes (nidx,ntext) VALUES (?,?)');
    const tx = d.transaction(() => {
      Object.keys(notesOut).forEach(k => {
        insN.run(parseInt(k), notesOut[k]);
      });
    });
    tx();
    console.log('  GANTT_NOTES: ' + Object.keys(notesOut).length + ' entries');
  }

  markSeeded();
  console.log('Database seeded');
}

function getGanttRows(bot) {
  const d = open();
  return d.prepare('SELECT * FROM gantt_rows WHERE bot = ? ORDER BY sort_idx').all(bot).map(r => {
    const obj = { phase: r.phase, task: r.task, resp: r.resp, hours: r.hours, days: r.days, fixedIdx: r.fixedIdx, fixedEndIdx: r.fixedEndIdx };
    const si = JSON.parse(r.skipIndices||'[]');
    if (si.length) obj.skipIndices = si;
    const ni = JSON.parse(r.notesIdx||'[]');
    if (ni.length) obj.notesIdx = ni;
    if (r.milestone) obj.milestone = true;
    if (r.inProgress) obj.inProgress = true;
    return obj;
  });
}

function updateGanttRow(bot, sortIdx, data) {
  const d = open();
  const fields = [], vals = [];
  ['fixedIdx','fixedEndIdx','hours','days','phase','task','resp'].forEach(f => {
    if (data[f] !== undefined) { fields.push(f+'=?'); vals.push(data[f]); }
  });
  if (data.inProgress !== undefined) { fields.push('inProgress=?'); vals.push(data.inProgress?1:0); }
  if (data.skipIndices) { fields.push('skipIndices=?'); vals.push(JSON.stringify(data.skipIndices)); }
  if (data.notesIdx) { fields.push('notesIdx=?'); vals.push(JSON.stringify(data.notesIdx)); }
  if (data.milestone !== undefined) { fields.push('milestone=?'); vals.push(data.milestone?1:0); }
  if (!fields.length) return false;
  vals.push(bot, sortIdx);
  d.prepare('UPDATE gantt_rows SET ' + fields.join(',') + ' WHERE bot=? AND sort_idx=?').run(...vals);
  return true;
}

function replaceGanttRows(bot, rows) {
  const d = open();
  const insert = d.prepare('INSERT INTO gantt_rows (bot,sort_idx,phase,task,resp,hours,days,fixedIdx,fixedEndIdx,skipIndices,notesIdx,milestone,inProgress) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
  d.transaction(() => {
    d.prepare('DELETE FROM gantt_rows WHERE bot=?').run(bot);
    rows.forEach((row, index) => {
      if (!row || !row.task) return;
      insert.run(bot, index, row.phase||'', row.task, row.resp||'', row.hours||0, row.days||0, row.fixedIdx, row.fixedEndIdx, JSON.stringify(row.skipIndices||[]), JSON.stringify(row.notesIdx||[]), row.milestone?1:0, row.inProgress?1:0);
    });
  })();
}

function getAllGanttRows() {
  const d = open();
  const rows = d.prepare('SELECT * FROM gantt_rows ORDER BY bot, sort_idx').all();
  const result = { nova: [], feli: [], robotina: [], googlenova: [] };
  rows.forEach(r => {
    if (!r.task) return;
    const obj = { phase: r.phase, task: r.task, resp: r.resp, hours: r.hours, days: r.days, fixedIdx: r.fixedIdx, fixedEndIdx: r.fixedEndIdx };
    const si = JSON.parse(r.skipIndices||'[]');
    if (si.length) obj.skipIndices = si;
    const ni = JSON.parse(r.notesIdx||'[]');
    if (ni.length) obj.notesIdx = ni;
    if (r.milestone) obj.milestone = true;
    if (r.inProgress) obj.inProgress = true;
    if (result[r.bot]) result[r.bot].push(obj);
  });
  return result;
}

function getStaticMonthly(key) {
  const d = open();
  const rows = d.prepare('SELECT month, hours FROM static_monthly WHERE skey = ?').all(key);
  const obj = {};
  rows.forEach(r => obj[r.month] = r.hours);
  return obj;
}

function getAllStaticMonthly() {
  const d = open();
  const rows = d.prepare('SELECT skey, month, hours FROM static_monthly').all();
  const result = {};
  rows.forEach(r => {
    if (!result[r.skey]) result[r.skey] = {};
    result[r.skey][r.month] = r.hours;
  });
  return result;
}

function updateStaticMonthly(key, month, hours) {
  const d = open();
  d.prepare('INSERT OR REPLACE INTO static_monthly (skey,month,hours) VALUES (?,?,?)').run(key, month, hours);
}

function setAllStaticMonthly(data) {
  const d = open();
  const ins = d.prepare('INSERT OR REPLACE INTO static_monthly (skey,month,hours) VALUES (?,?,?)');
  const tx = d.transaction(() => {
    d.prepare('DELETE FROM static_monthly').run();
    Object.keys(data).forEach(k => {
      Object.keys(data[k]).forEach(m => {
        if (m.startsWith('_')) return;
        ins.run(k, m, data[k][m]);
      });
    });
  });
  tx();
}

function getProyectos() {
  const d = open();
  return d.prepare('SELECT * FROM proyectos').all().map(p => {
    const result = { key: p.pkey, name: p.name, icon: p.icon, responsable: p.responsable, color: p.color };
    if (p.status) {
      result.staticData = { status: p.status };
      if (p.progress !== null && p.progress !== undefined) result.staticData.progress = p.progress;
      if (p.hours !== null && p.hours !== undefined) result.staticData.hours = p.hours;
      if (p.descr) result.staticData.desc = p.descr;
      if (p.startDate) result.staticData.startDate = p.startDate;
      if (p.endDate) result.staticData.endDate = p.endDate;
    }
    return result;
  });
}

function getGanttNotes() {
  const d = open();
  const rows = d.prepare('SELECT nidx, ntext FROM gantt_notes').all();
  const obj = {};
  rows.forEach(r => obj[r.nidx] = r.ntext);
  return obj;
}

function getAllData() {
  return {
    ganttRows: getAllGanttRows(),
    staticMonthly: getAllStaticMonthly(),
    proyectos: getProyectos(),
    ganttNotes: getGanttNotes()
  };
}

function close() {
  if (db) db.close();
}

module.exports = { init, seedFromHtml, open, close, getGanttRows, updateGanttRow, replaceGanttRows, getAllGanttRows, getStaticMonthly, getAllStaticMonthly, updateStaticMonthly, setAllStaticMonthly, getProyectos, getGanttNotes, getAllData };
