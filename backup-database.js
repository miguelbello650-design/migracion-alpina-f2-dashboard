const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SOURCE = path.join(ROOT, 'database.db');
const BACKUPS = path.join(ROOT, 'backups');
const RETENTION_DAYS = 30;

async function main() {
  if (!fs.existsSync(SOURCE)) throw new Error('database.db no existe');
  fs.mkdirSync(BACKUPS, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUPS, `dashboard-${stamp}.db`);
  const db = new Database(SOURCE, { readonly: true });
  await db.backup(target);
  db.close();

  const limit = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  fs.readdirSync(BACKUPS, { withFileTypes: true })
    .filter(file => file.isFile() && file.name.endsWith('.db'))
    .forEach(file => {
      const filePath = path.join(BACKUPS, file.name);
      if (fs.statSync(filePath).mtimeMs < limit) fs.unlinkSync(filePath);
    });
  console.log(`Respaldo creado: ${target}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
