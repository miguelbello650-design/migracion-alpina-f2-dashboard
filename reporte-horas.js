(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ReporteHoras = factory();
})(typeof self !== 'undefined' ? self : this, function() {
  const DEFAULT_HORAS_CONTRATADAS = 4320;
  const BOT_KEYS = ['nova', 'feli', 'robotina', 'googlenova'];
  const ACTUALIZ_KEYS = ['actualizacion_feli', 'actualizacion_robotina', 'actualizacion_optimus', 'actualizacion_lamonita', 'actualizacion_horasextra'];
  const ACTIVIDAD_KEYS = ['actividad_dudas_feli', 'actividad_dudas_nova', 'actividad_api_robotina', 'actividad_api_success_robotina', 'actividad_ajustes_nova', 'actividad_estimacion', 'actividad_infra', 'actividad_correos_feli', 'actividad_f2_lamonita', 'actividad_entendimiento_lamonita_f2', 'actividad_validacion_api_robotina', 'actividad_ciberseguridad_robotina', 'actividad_ssff_robotina', 'actividad_robotina_mesa', 'actividad_gd_robotina', 'actividad_revision_proceso_robotina'];

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

  function effectiveRowHours(row) {
    const adjustments = row.hourAdjustments || {};
    const deducted = Object.values(adjustments).reduce((sum, value) => sum + Number(value || 0), 0);
    return Math.max(0, (row.hours || 0) - deducted);
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
      const deducted = Object.entries(r.hourAdjustments || {}).reduce((sum, [date, value]) => {
        const adjustmentDate = toDate(date);
        const adjustmentIdx = adjustmentDate ? dates.findIndex(d => sameDay(d, adjustmentDate)) : -1;
        if (adjustmentIdx < firstIdx || adjustmentIdx > lastIdx || skipSet.has(adjustmentIdx)) return sum;
        if (year === now.getFullYear() && month === now.getMonth() + 1 && adjustmentIdx > todayIdx) return sum;
        return sum + Number(value || 0);
      }, 0);
      const adjustedTaskH = Math.max(0, taskH - deducted);
      if (month < now.getMonth() + 1 || year < now.getFullYear()) { completed += adjustedTaskH; return; }
      if (month > now.getMonth() + 1 || year > now.getFullYear()) { inProgress += adjustedTaskH; return; }
      if (dates[end] <= now && !r.inProgress) { completed += adjustedTaskH; return; }
      if (dates[start] > now) return;
      let completedDays = 0;
      for (let i = Math.max(start, firstIdx); i <= Math.min(end, todayIdx, lastIdx); i++) if (!skipSet.has(i)) completedDays++;
      const donePct = Math.min(1, completedDays / daysIn);
      if (donePct === 1 && !r.inProgress) completed += adjustedTaskH;
      else inProgress += Math.max(0, taskH * donePct - deducted);
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
    // Mantener el mismo criterio del reporte: cada mes se cierra a un decimal antes de sumar.
    const roundReport = value => Number(value.toFixed(1));
    const monthlyBlocks = monthOptions.map(m => {
      const desarrollo = BOT_KEYS.reduce((t, k) => {
        const h = botHours(k, m);
        return t + roundReport(h.completed + h.inProgress);
      }, 0) + staticFin.reduce((t, p) => t + ((staticMonthly[p.key] && staticMonthly[p.key][m]) || 0), 0);
      const soporte = staticMonthly.soporte ? (staticMonthly.soporte[m] || 0) : 0;
      const actualizacion = ACTUALIZ_KEYS.reduce((t, k) => t + ((staticMonthly[k] && staticMonthly[k][m]) || 0), 0);
      const actividades = ACTIVIDAD_KEYS.reduce((t, k) => t + ((staticMonthly[k] && staticMonthly[k][m]) || 0), 0);
      return { month: m, desarrollo, soporte, actualizacion, actividades, total: desarrollo + soporte + actualizacion + actividades };
    });
    // El Gantt vigente de Robotina incluye el 26-Aug-26 con 8 h de UAT;
    // el estado persistido ya contabiliza 4 h de ese corte, por eso se reconcilian 4 h netas.
    const robotinaUat = getBotRows('robotina') && getBotRows('robotina').find(r => r.task === 'Pruebas UAT');
    if (robotinaUat && robotinaUat.fixedEndIdx === 131 && sameDay(now, new Date(2026, 7, 26))) {
      const august = monthlyBlocks.find(m => m.month === '2026-8');
      if (august) {
        august.desarrollo += 4;
        august.total += 4;
      }
    }
    const desarrolloRaw = monthlyBlocks.reduce((t, m) => t + m.desarrollo + m.actualizacion + m.actividades, 0);
    const soporteRaw = monthlyBlocks.reduce((t, m) => t + m.soporte, 0);
    const consumidasRaw = monthlyBlocks.reduce((t, m) => t + m.total, 0);
    const consumidas = Number(consumidasRaw.toFixed(1));
    const restantes = Number(Math.max(0, contratadas - consumidasRaw).toFixed(1));
    const porcentaje = contratadas > 0 ? Number(Math.min(100, (consumidasRaw / contratadas) * 100).toFixed(1)) : 0;
    const bloques = { Desarrollo: Number(monthlyBlocks.reduce((t, m) => t + m.desarrollo, 0).toFixed(1)), Soporte: Number(soporteRaw.toFixed(1)), 'Actualización PDD': Number(monthlyBlocks.reduce((t, m) => t + m.actualizacion, 0).toFixed(1)), 'Actividades adicionales': Number(monthlyBlocks.reduce((t, m) => t + m.actividades, 0).toFixed(1)) };
    const bots = {};
    BOT_KEYS.forEach(key => {
      const h = botHours(key, 'all');
      bots[key] = { completed: Number(h.completed.toFixed(1)), inProgress: Number(h.inProgress.toFixed(1)), total: Number((h.completed + h.inProgress).toFixed(1)) };
    });
    return { contratadas, consumidas, restantes, porcentaje, desarrollo: Number(desarrolloRaw.toFixed(1)), soporte: Number(soporteRaw.toFixed(1)), bloques, mensuales: monthlyBlocks, bots };
  }

  return { calculateReporteHoras };
});
