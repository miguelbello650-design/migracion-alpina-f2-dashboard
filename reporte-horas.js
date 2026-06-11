(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ReporteHoras = factory();
})(typeof self !== 'undefined' ? self : this, function() {
  const DEFAULT_HORAS_CONTRATADAS = 4320;
  const BOT_KEYS = ['nova', 'feli', 'robotina', 'googlenova'];
  const ACTUALIZ_KEYS = ['actualizacion_feli', 'actualizacion_robotina', 'actualizacion_optimus', 'actualizacion_lamonita', 'actualizacion_horasextra'];
  const ACTIVIDAD_KEYS = ['actividad_dudas_feli', 'actividad_dudas_nova', 'actividad_api_robotina', 'actividad_api_success_robotina', 'actividad_ajustes_nova', 'actividad_estimacion', 'actividad_infra', 'actividad_correos_feli'];

  function toDate(value) {
    if (value instanceof Date) {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (typeof value === 'string') {
      const parts = value.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      if (parts.length === 3 && months.includes(parts[1])) {
        const d = new Date(2000 + Number(parts[2]), months.indexOf(parts[1]), Number(parts[0]));
        d.setHours(0, 0, 0, 0);
        return d;
      }
      const d = new Date(value + (value.includes('T') ? '' : 'T12:00:00'));
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null;
  }

  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getMonthOptions(dates, now) {
    const months = new Set();
    dates.forEach(d => months.add(d.getFullYear() + '-' + (d.getMonth() + 1)));
    months.add('2025-11');
    months.add('2025-12');
    months.add('2026-1');
    const curKey = now.getFullYear() + '-' + (now.getMonth() + 1);
    return Array.from(months).filter(m => m <= curKey).sort();
  }

  function lockedBotHours(key, filter, staticMonthly, monthOptions) {
    const lk = 'locked_' + key;
    if (!staticMonthly[lk]) return null;
    if (filter === 'all') {
      if (staticMonthly[lk]._total !== undefined) return { completed: staticMonthly[lk]._total, inProgress: 0 };
      const allCovered = monthOptions.every(m => staticMonthly[lk][m] !== undefined);
      if (allCovered) {
        const s = monthOptions.reduce((sum, m) => sum + (staticMonthly[lk][m] || 0), 0);
        return { completed: s, inProgress: 0 };
      }
      return null;
    }
    if (staticMonthly[lk][filter] !== undefined) return { completed: staticMonthly[lk][filter], inProgress: 0 };
    return null;
  }

  function calcBotHoursMonth(rows, filter, dates, now, monthOptions) {
    if (!rows) return { completed: 0, inProgress: 0 };
    if (filter === 'all') {
      let c = 0, p = 0;
      monthOptions.forEach(m => {
        const h = calcBotHoursMonth(rows, m, dates, now, monthOptions);
        c += h.completed;
        p += h.inProgress;
      });
      return { completed: c, inProgress: p };
    }
    const parts = filter.split('-').map(Number);
    const year = parts[0], month = parts[1];
    let firstIdx = -1, lastIdx = -1;
    dates.forEach((d, i) => {
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (firstIdx === -1) firstIdx = i;
        lastIdx = i;
      }
    });
    if (firstIdx === -1) return { completed: 0, inProgress: 0 };
    const todayIdx = dates.findIndex(d => sameDay(d, now));
    let completed = 0, inProgress = 0;
    rows.filter(r => r.task && r.fixedIdx !== undefined).forEach(r => {
      const start = r.fixedIdx;
      const end = r.fixedEndIdx !== undefined ? r.fixedEndIdx : r.fixedIdx;
      const totalSpan = end - start + 1;
      const skipCount = r.skipIndices ? r.skipIndices.length : 0;
      const effectiveDays = totalSpan - skipCount;
      if (effectiveDays <= 0) return;
      const skipSet = r.skipIndices ? new Set(r.skipIndices) : new Set();
      let daysIn = 0;
      for (let i = Math.max(start, firstIdx); i <= Math.min(end, lastIdx); i++) if (!skipSet.has(i)) daysIn++;
      if (daysIn <= 0) return;
      const pct = daysIn / effectiveDays;
      const taskH = (r.hours || 0) * pct;
      if (month < now.getMonth() + 1 || year < now.getFullYear()) { completed += taskH; return; }
      if (month > now.getMonth() + 1 || year > now.getFullYear()) { inProgress += taskH; return; }
      if (dates[end] <= now && !r.inProgress) { completed += taskH; return; }
      if (dates[start] > now) return;
      let completedDays = 0;
      for (let i = Math.max(start, firstIdx); i <= Math.min(end, todayIdx, lastIdx); i++) if (!skipSet.has(i)) completedDays++;
      const donePct = Math.min(1, completedDays / daysIn);
      if (donePct === 1 && !r.inProgress) completed += taskH;
      else inProgress += taskH * donePct;
    });
    return { completed, inProgress };
  }

  function calculateReporteHoras(input) {
    const dates = (input.ganttDates || []).map(toDate).filter(Boolean);
    const now = toDate(input.now || new Date());
    const staticMonthly = input.staticMonthly || {};
    const proyectos = input.proyectos || [];
    const ganttRows = input.ganttRows || {};
    const contratadas = input.contratadas || DEFAULT_HORAS_CONTRATADAS;
    const monthOptions = getMonthOptions(dates, now);
    const getBotRows = key => ganttRows[key] || null;
    const botHours = (key, filter) => {
      if (filter === 'all') {
        let c = 0, p = 0;
        monthOptions.forEach(m => {
          const locked = lockedBotHours(key, m, staticMonthly, monthOptions);
          if (locked) { c += locked.completed; return; }
          const h = calcBotHoursMonth(getBotRows(key), m, dates, now, monthOptions);
          c += h.completed;
          p += h.inProgress;
        });
        return { completed: c, inProgress: p };
      }
      const locked = lockedBotHours(key, filter, staticMonthly, monthOptions);
      if (locked) return locked;
      return calcBotHoursMonth(getBotRows(key), filter, dates, now, monthOptions);
    };
    const staticFin = proyectos.filter(p => p.staticData && p.staticData.status === 'finalizado');
    const sumMonths = data => monthOptions.reduce((s, m) => s + (data[m] || 0), 0);
    const blockTotal = key => {
      if (key === 'Desarrollo') {
        let t = 0;
        BOT_KEYS.forEach(k => { const h = botHours(k, 'all'); t += h.completed + h.inProgress; });
        staticFin.forEach(p => { const d = staticMonthly[p.key]; if (d) t += sumMonths(d); });
        return t;
      }
      if (key === 'Soporte') return sumMonths(staticMonthly.soporte || {});
      if (key === 'Actualizacion PDD') return ACTUALIZ_KEYS.reduce((t, k) => t + sumMonths(staticMonthly[k] || {}), 0);
      if (key === 'Actividades adicionales') return ACTIVIDAD_KEYS.reduce((t, k) => t + sumMonths(staticMonthly[k] || {}), 0);
      return 0;
    };
    const consumidasRaw = ['Desarrollo', 'Soporte', 'Actualizacion PDD', 'Actividades adicionales'].reduce((s, b) => s + blockTotal(b), 0);
    const consumidas = Number(consumidasRaw.toFixed(1));
    const restantes = Number(Math.max(0, contratadas - consumidasRaw).toFixed(1));
    const porcentaje = contratadas > 0 ? Number(Math.min(100, (consumidasRaw / contratadas) * 100).toFixed(1)) : 0;
    return { contratadas, consumidas, restantes, porcentaje };
  }

  return { calculateReporteHoras };
});
