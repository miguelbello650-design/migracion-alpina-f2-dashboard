const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const HTML_PATH = path.join(ROOT, 'index.html')
const LOGO_2NV_URL = 'https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard/assets/logos/logo-2nv-header.png'
const LOGO_ALPINA_URL = 'https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard/assets/logos/logo-alpina-header.png'

const BOT_CONFIG = {
  nova: { label: 'NOVA', developer: 'Johan Sabino', arrayName: 'GANTT_ROWS', color: '#0033a0' },
  feli: { label: 'FELI', developer: 'Cristian Bonilla', arrayName: 'GANTT_ROWS_FELI', color: '#6366f1' },
  robotina: { label: 'ROBOTINA', developer: 'Javier Gonzalez', arrayName: 'GANTT_ROWS_ROBOTINA', color: '#0891b2' }
}

function extractArray(script, name) {
  const marker = new RegExp('(?:let|const|var)\\s+' + name + '\\s*=')
  const match = marker.exec(script)
  if (!match) throw new Error('No se encontro ' + name)

  let pos = match.index + match[0].length
  while (script[pos] && script[pos] !== '[') pos++
  const start = pos
  let depth = 0
  let inString = false
  let stringChar = ''

  for (; pos < script.length; pos++) {
    const c = script[pos]
    const prev = pos > 0 ? script[pos - 1] : ''

    if (inString) {
      if (c === stringChar && prev !== '\\') inString = false
      continue
    }

    if (c === '"' || c === "'") {
      inString = true
      stringChar = c
      continue
    }

    if (c === '[') depth++
    if (c === ']') {
      depth--
      if (depth === 0) {
        pos++
        break
      }
    }
  }

  const literal = script.slice(start, pos)
  return Function('"use strict"; return ' + literal)()
}

function extractDates(script) {
  const match = /const dateStrs = "([^"]+)"/.exec(script)
  if (!match) throw new Error('No se encontro dateStrs')

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return match[1].split(',').map(value => {
    const p = value.split('-')
    return new Date(2026, months.indexOf(p[1]), parseInt(p[0], 10))
  })
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameOrBefore(a, b) {
  return a.getTime() <= b.getTime()
}

function sameOrAfter(a, b) {
  return a.getTime() >= b.getTime()
}

function formatDate(date) {
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatRange(start, end) {
  if (start.getTime() === end.getTime()) return formatDate(start)
  return formatDate(start) + ' al ' + formatDate(end)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isTaskInWeek(row, dates, weekStart, weekEnd) {
  if (!row.task || row.fixedIdx === undefined) return false
  const start = dates[row.fixedIdx]
  const end = dates[row.fixedEndIdx !== undefined ? row.fixedEndIdx : row.fixedIdx]
  if (!start || !end) return false
  return row.inProgress || (sameOrBefore(start, weekEnd) && sameOrAfter(end, weekStart))
}

function taskLine(row, dates) {
  const start = dates[row.fixedIdx]
  const end = dates[row.fixedEndIdx !== undefined ? row.fixedEndIdx : row.fixedIdx]
  const phase = row.phase ? row.phase + ' - ' : ''
  const state = row.inProgress ? ' (en curso)' : ''
  return '- ' + phase + row.task + ' [' + formatRange(start, end) + ']' + state
}

function taskInfo(row, dates) {
  const start = dates[row.fixedIdx]
  const end = dates[row.fixedEndIdx !== undefined ? row.fixedEndIdx : row.fixedIdx]
  return {
    phase: row.phase || '',
    task: row.task,
    range: formatRange(start, end),
    hours: row.hours || 0,
    inProgress: !!row.inProgress,
    milestone: !!row.milestone
  }
}

function buildHtmlEmail(subject, sections, weekStart, weekEnd) {
  const cards = sections.map(section => {
    const visibleTasks = section.tasks.slice(0, 4)
    const extraCount = Math.max(0, section.tasks.length - visibleTasks.length)
    const tasksHtml = visibleTasks.length
      ? visibleTasks.map(task => {
          const statusColor = task.milestone ? '#f59e0b' : task.inProgress ? '#2563eb' : section.color
          const statusText = task.milestone ? 'Hito' : task.inProgress ? 'En curso' : 'Planificado'
          const phase = task.phase ? '<span style="color:#64748b">' + escapeHtml(task.phase) + ' · </span>' : ''
          return '<tr>' +
            '<td style="padding:8px 0;border-bottom:1px solid #edf2f7;vertical-align:top">' +
              '<div style="font-size:13px;font-weight:600;color:#1e293b;line-height:1.35">' + phase + escapeHtml(task.task) + '</div>' +
              '<div style="font-size:11px;color:#64748b;margin-top:3px">' + escapeHtml(task.range) + '</div>' +
            '</td>' +
            '<td style="padding:8px 0 8px 10px;border-bottom:1px solid #edf2f7;text-align:right;vertical-align:top">' +
              '<span style="display:inline-block;border:1px solid ' + statusColor + ';color:' + statusColor + ';border-radius:11px;padding:2px 8px;font-size:10px;font-weight:700;white-space:nowrap">' + statusText + '</span>' +
            '</td>' +
          '</tr>'
        }).join('') +
        (extraCount ? '<tr><td colspan="2" style="padding:8px 0 0;color:#64748b;font-size:12px">+' + extraCount + ' actividades adicionales en el Gantt.</td></tr>' : '')
      : '<tr><td colspan="2" style="padding:8px 0;color:#94a3b8;font-size:13px">Sin actividades programadas en el Gantt para esta semana.</td></tr>'

    return '<table role="presentation" cellpadding="0" cellspacing="0" align="left" style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-left:5px solid ' + section.color + ';border-radius:8px;margin:0 0 12px;text-align:left">' +
      '<tr><td style="padding:12px 16px 4px">' +
        '<div style="font-size:16px;font-weight:800;color:' + section.color + ';line-height:1">' + escapeHtml(section.bot) + '</div>' +
        '<div style="font-size:12px;color:#64748b;margin-top:4px">' + escapeHtml(section.developer) + '</div>' +
      '</td></tr>' +
      '<tr><td style="padding:4px 16px 12px;text-align:left">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" align="left" style="width:100%;border-collapse:collapse;text-align:left">' + tasksHtml + '</table>' +
      '</td></tr>' +
    '</table>'
  }).join('')

  return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background:#f6f8fb;font-family:Segoe UI,Arial,sans-serif;color:#1e293b;text-align:left">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" align="left" style="width:100%;border-collapse:collapse;background:#f6f8fb;text-align:left"><tr><td style="padding:18px 10px;text-align:left">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" align="left" style="max-width:760px;width:100%;margin:0;border-collapse:collapse;text-align:left">' +
          '<tr><td style="padding:0 2px 12px;text-align:left">' +
            '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">' +
              '<tr><td style="padding-right:14px"><img src="' + LOGO_2NV_URL + '" alt="2NV" width="48" style="display:block;height:auto;border:0"></td>' +
              '<td style="border-left:1px solid #d1d9e6;height:32px;width:1px"></td>' +
              '<td style="padding-left:14px"><img src="' + LOGO_ALPINA_URL + '" alt="Alpina" width="78" style="display:block;height:auto;border:0"></td></tr>' +
            '</table>' +
          '</td></tr>' +
          '<tr><td style="padding:0 2px 10px;text-align:left">' +
            '<div style="font-size:14px;line-height:1.5;color:#334155">Buen día equipo,<br><br>Comparto el plan general de trabajo para esta semana según las actividades programadas en el Gantt.</div>' +
          '</td></tr>' +
          '<tr><td style="padding:8px 0;text-align:left">' + cards + '</td></tr>' +
          '<tr><td style="padding:10px 2px 0;text-align:left">' +
            '<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:13px;color:#334155;line-height:1.5">' +
              '<strong>Seguimiento:</strong> el avance será actualizado en el Dashboard durante la semana. Cualquier bloqueo crítico será informado oportunamente.' +
            '</div>' +
            '<div style="font-size:14px;color:#1e293b;margin-top:16px">Quedo atento a los comentarios,</div>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr></table>' +
    '</body></html>'
}

function buildEmail(targetDate) {
  const html = fs.readFileSync(HTML_PATH, 'utf8')
  const scriptStart = html.indexOf('<script>')
  const scriptEnd = html.lastIndexOf('</script>')
  if (scriptStart === -1 || scriptEnd === -1) throw new Error('No se encontro el script principal')

  const script = html.slice(scriptStart + 8, scriptEnd)
  const dates = extractDates(script)
  const weekStart = startOfWeek(targetDate)
  const weekEnd = addDays(weekStart, 4)
  const subject = 'Plan semanal RPA Alpina | Semana del ' + formatDate(weekStart) + ' al ' + formatDate(weekEnd)

  const sections = Object.keys(BOT_CONFIG).map(key => {
    const cfg = BOT_CONFIG[key]
    const rows = extractArray(script, cfg.arrayName)
    const tasks = rows.filter(row => isTaskInWeek(row, dates, weekStart, weekEnd))
    const activityLines = tasks.length
      ? tasks.map(row => taskLine(row, dates)).join('\n')
      : '- Sin actividades programadas en el Gantt para esta semana'

    return cfg.developer + '\n' +
      'Proyecto/Bot: ' + cfg.label + '\n' +
      'Actividades:\n' + activityLines
  })

  const sectionData = Object.keys(BOT_CONFIG).map(key => {
    const cfg = BOT_CONFIG[key]
    const rows = extractArray(script, cfg.arrayName)
    const tasks = rows.filter(row => isTaskInWeek(row, dates, weekStart, weekEnd)).map(row => taskInfo(row, dates))
    return { developer: cfg.developer, bot: cfg.label, color: cfg.color, tasks }
  })

  const body = 'Buen día equipo,\n\n' +
    'Comparto el plan general de trabajo para la semana del ' + formatDate(weekStart) + ' al ' + formatDate(weekEnd) + '.\n\n' +
    'Plan por desarrollador:\n\n' +
    sections.join('\n\n') + '\n\n' +
    'Seguimiento:\n' +
    'El avance será actualizado en el Dashboard durante la semana. Cualquier bloqueo crítico será informado oportunamente.\n\n' +
    'Quedo atento a los comentarios,'

  const bodyHtml = buildHtmlEmail(subject, sectionData, weekStart, weekEnd)
  return { subject, body, bodyHtml, weekStart, weekEnd }
}

const dateArg = process.argv.find(arg => /^\d{4}-\d{2}-\d{2}$/.test(arg))
const targetDate = dateArg ? new Date(dateArg + 'T12:00:00') : new Date()
const toArg = process.argv.find(arg => arg.startsWith('--to='))
const to = toArg ? toArg.slice(5) : 'Jesus.c@2nv.co; jm@2nv.co'
const htmlMode = process.argv.includes('--html')
const email = buildEmail(targetDate)

if (htmlMode) {
  const outPath = path.join(ROOT, 'correo-semanal-preview.html')
  fs.writeFileSync(outPath, email.bodyHtml, 'utf8')
  console.log('HTML: ' + outPath)
}

console.log('PARA: ' + to)
console.log('ASUNTO: ' + email.subject)
console.log('')
console.log(email.body)
