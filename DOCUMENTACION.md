# Dashboard Migración Alpina F2 - RPA

## Descripción
Dashboard web para tracking de proyectos RPA con tres bots activos (NOVA, FELI, ROBOTINA) y proyectos históricos/completados:
- **PROYECTOS ALPINA** — Vista general con proyectos agrupados por estado (Finalizados / En Proceso / Próximos), incluye proyectos activos (con Gantt), estáticos (históricos) y gráfico de dona con horas totales
- **REPORTE DE HORAS ALPINA** — 4 bloques con filtro por mes + 2 gráficos: Desarrollo (NOVA, FELI, ROBOTINA con horas dinámicas; OPTIMUS, LA MONITA, HORAS EXTRA con horas fijas mensuales), Soporte (con horas mensuales), Actualización PDD (5 proyectos con horas mensuales) y Actividades adicionales (5 actividades con horas mensuales). Incluye gráfico de dona (distribución por bloque) y gráfico de barras (horas por mes, apilado por bloque al filtrar un mes específico).
- **% AVANCE** — Progreso por fase y total por bot; los nombres de los bots son clickeables y navegan al Gantt correspondiente
- **GANTT NOVA / FELI / ROBOTINA** — Diagramas Gantt con barras, notas y columnas especiales (accesibles solo desde % Avance, no desde la barra de pestañas)

## Stack
- **Lenguaje**: HTML + CSS + JavaScript (vanilla, un solo archivo `index.html`)
- **Backend**: Node.js con `better-sqlite3` (solo en servidor local `localhost:3000`)
- **Base de datos**: SQLite (`database.db`) con schema en `db.js`
- **Hosting**: GitHub Pages (`https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard`)
- **Sincronización**: Windows Task Scheduler (script `sync-github.ps1`, diario 8:00 AM)

## Estructura del Proyecto

```
C:\Users\2NV\Desktop\Prueba de IPM\
├── index.html              # Dashboard completo (único archivo)
├── server.js               # Servidor local Node.js (API REST con SQLite)
├── db.js                   # Capa de base de datos SQLite (better-sqlite3)
├── database.db             # Base de datos SQLite (se genera automáticamente, ignorada por git)
├── package.json            # Dependencias Node.js (better-sqlite3)
├── package-lock.json       # Lockfile de npm
├── start.ps1               # Atajo para iniciar el servidor
├── .gitignore              # Ignora state.json, database.db y node_modules/
├── GANTT NOVA.csv          # Datos fuente NOVA (not usado directamente)
├── GANTT FELI.csv          # Datos fuente FELI (notas extraídas manualmente)
├── GANTT ROBOTINA.csv      # Datos fuente ROBOTINA (notas extraídas manualmente)
├── % De Avance.csv         # Porcentajes de avance (referencia)
├── sync-github.ps1         # Script de sincronización automática
├── sync-log.txt            # Log de sincronización
└── DOCUMENTACION.md        # Este archivo
```

## PROYECTOS ALPINA (pestaña general)

Agrupa los bots por estado general calculado automáticamente:
- **✅ Finalizados**: todas las tareas con fecha fin anterior a hoy
- **🔄 En Proceso**: alguna tarea en curso o activa
- **📅 Próximos**: todas las tareas con fecha inicio posterior a hoy

Cada proyecto muestra en tarjeta: nombre, responsable, badge de estado, barra de progreso (o link "Ver más detalle" si no tiene datos), conteo de tareas, fecha inicio y fin estimado.

Los proyectos se organizan dentro de cada sección usando el mismo grid que Finalizados/En Proceso (`auto-fill minmax(280px, 1fr)`), con posicionamiento explícito (`grid-column` / `grid-row`) para la sección Próximos, asegurando que todas las tarjetas tengan idénticas dimensiones.

En el lado derecho se muestra un **gráfico de dona** (SVG) con la distribución de horas por proyecto. El centro muestra el total acumulado (finalizados + en curso). Los proyectos sin horas (próximos) no aparecen en el gráfico.

### Proyectos Estáticos (sin Gantt)

Proyectos que no tienen datos en Gantt. Se definen con `staticData` en el array `PROYECTOS`. Pueden ser finalizados, en proceso o próximos.

**Finalizados:**
| Proyecto | Responsable | Inicio | Fin | Horas |
|----------|-------------|--------|-----|-------|
| OPTIMUS | Cristian Bonilla | 20-Nov-2025 | 9-Ene-2026 | 286h |
| LA MONITA | Johan Sabino | 20-Nov-2025 | 26-Ene-2026 | 373h |
| HORAS EXTRA | Javier Gonzalez | 9-Dic-2025 | 20-Feb-2026 | 304h |

**Próximos:**
| Proyecto | Responsable | Color | Alcance |
|----------|-------------|-------|---------|
| Migración Google - BOT NOVA | Johan Sabino | `#4285F4` | Migración de los bots RPA a Google Cloud Platform: traslado, configuración y validación de automatizaciones en el nuevo entorno, asegurando accesos, dependencias, conectividad, permisos, software base y continuidad operativa |
| BOT FELI - FASE 2 | Cristian Bonilla | `#6366f1` | Inclusión del flujo para crear materiales HALL · Incluir la creación de materiales para Ecuador/otros países (Configuración variable) · Reemplazo de MDG / Data Hub |
| Migración Google - BOT FELI | Cristian Bonilla | `#4285F4` | Migración de los bots RPA a Google Cloud Platform: traslado, configuración y validación de automatizaciones en el nuevo entorno, asegurando accesos, dependencias, conectividad, permisos, software base y continuidad operativa |
| BOT ROBOTINA - FASE 2 | Javier Gonzalez | `#0891b2` | Generar el "Excel para el Robot" (paso 29 del PDD) · Adjuntar archivo en el cierre del ticket (paso 30.3 del PDD) |
| Migración Google - BOT ROBOTINA | Javier Gonzalez | `#4285F4` | Migración de los bots RPA a Google Cloud Platform: traslado, configuración y validación de automatizaciones en el nuevo entorno, asegurando accesos, dependencias, conectividad, permisos, software base y continuidad operativa |

Campos de `staticData`: `{ status, progress?, startDate?, endDate?, hours?, desc }`. 
- Si `progress` es `undefined`, se muestra "Ver más detalle →" que abre un modal con el contenido de `desc` (soporta `<br>` para múltiples líneas).
- Si `hours`, `startDate` o `endDate` son `undefined`, se omiten esas filas.
- La barra de progreso usa clase `completed` (verde `#10b981`) cuando `status === 'finalizado'`.

## Datos Compartidos

### GANTT_DATES
Array de fechas (índice 0-88, 89 fechas total) compartido por los 3 Gantts:

| Índice | Fecha | Índice | Fecha | Índice | Fecha |
|--------|-------|--------|-------|--------|-------|
| 0 | 6-Feb-26 | 11 | 23-Feb-26 | 23 | 11-Mar-26 |
| 1 | 9-Feb-26 | 12 | 24-Feb-26 | 24 | 12-Mar-26 |
| ... | ... | 13 | 25-Feb-26 | 25 | 13-Mar-26 |
| 5 | 13-Feb-26 | 14 | 26-Feb-26 | 26 | 16-Mar-26 |
| 6 | 16-Feb-26 | 15 | 27-Feb-26 | 27 | 17-Mar-26 |
| 7 | 17-Feb-26 | 16 | 2-Mar-26 | 28 | 18-Mar-26 |
| 8 | 18-Feb-26 | 17 | 3-Mar-26 | 29 | 19-Mar-26 |
| 9 | 19-Feb-26 | 18 | 4-Mar-26 | 30 | 20-Mar-26 |
| 10 | 20-Feb-26 | 19 | 5-Mar-26 | 31 | 24-Mar-26 |

**Rango completo**: 6-Feb-26 a 18-Jun-26  
**Findes de semana**: Excluidos del array (solo días laborables)

### GANTT_NOTES
Mapa global de notas compartido entre NOVA y FELI (Robotina usa su propio mapa).

### GRAY_DAYS
Array por Gantt de días que se renderizan con fondo gris:
- **NOVA**: GRAY_DAYS_NOVA
- **FELI**: GRAY_DAYS_FELI
- **ROBOTINA**: GRAY_DAYS_ROBOTINA

## Tasks / Data Model

Cada tarea en los arrays `GANTT_ROWS`, `GANTT_ROWS_FELI`, `GANTT_ROWS_ROBOTINA`:

```js
{
  phase: "Nombre Fase",         // String. Si es igual a la anterior, no se repite la fila de fase
  task: "Nombre de la tarea",   // String. Si es falsy, se omite (fase sin tareas)
  resp: "2NV",                  // Responsable
  hours: 8,                     // Horas estimadas
  days: 1,                      // Días estimados
  fixedIdx: 11,                 // Índice de inicio en GANTT_DATES
  fixedEndIdx: 11,              // Índice de fin en GANTT_DATES
  skipIndices: [51,52],         // Índices a saltar (gaps dentro del rango)
  notesIdx: [25,26],            // Índices que tienen nota asociada
  milestone: true,              // Hito (barra amarilla + 🚩)
  inProgress: true              // Tarea en curso (progreso parcial por días transcurridos)
}
```

### Campos Clave

| Campo | Descripción |
|-------|-------------|
| `fixedIdx` / `fixedEndIdx` | Rango en GANTT_DATES. Se copian a `startIdx`/`endIdx` por `assignDates()` |
| `skipIndices` | Días no laborables dentro del rango. La barra se divide en segmentos continuos |
| `notesIdx` | Días con ⚠. Si el índice coincide con un `skipIndex`, se renderiza en celda vacía; si no, sobre la barra |
| `milestone` | Forza color amarillo (`#f59e0b`) y muestra 🚩 en la barra |
| `inProgress` | Fuerza cálculo de % parcial aunque la fecha fin ya pasó |

## Colores

### Fichas de bot (Dashboard)
| Bot | Color |
|-----|-------|
| NOVA | `#0033a0` (Alpina blue) |
| FELI | `#4f46e5` (Indigo) |
| ROBOTINA | `#0d9488` (Teal) |

### Colores de íconos en PROYECTOS ALPINA
| Proyecto | Color |
|----------|-------|
| NOVA | `#0033a0` |
| FELI | `#6366f1` |
| ROBOTINA | `#0891b2` |
| OPTIMUS | `#7c3aed` (púrpura) |
| LA MONITA | `#dc2626` (rojo) |
| HORAS EXTRA | `#b45309` (ámbar) |
| Migración Google - BOT NOVA | `#4285F4` (azul Google) |
| BOT FELI - FASE 2 | `#6366f1` (índigo) |
| Migración Google - BOT FELI | `#4285F4` (azul Google) |
| BOT ROBOTINA - FASE 2 | `#0891b2` (teal) |
| Migración Google - BOT ROBOTINA | `#4285F4` (azul Google) |
| Completado (barra) | `#10b981` (verde) |

### Barras Gantt
| Estado | Color |
|--------|-------|
| Finalizada (`dates[end] < today`) | `#10b981` (green) |
| En curso (`dates[start] <= today`) | `#2563eb` (blue) |
| Pendiente (`dates[start] > today`) | `#94a3b8` (gray) |
| Hito (`milestone: true`) | `#f59e0b` (yellow) |

### Columnas Especiales
| Tipo | Fondo |
|------|-------|
| Hoy (`isSameDay(dates[d], new Date())`) | `rgba(239,68,68,0.25)` (rojo) |
| Gris (días en `GRAY_DAYS`) | `rgba(148,163,184,0.25)` (gris) |
| Fin de semana | `#f1f5f9` |
| Normal | `#fff` |

## Progreso

### Cálculo por Tarea
- **Completada** (fecha fin pasó, no `inProgress`): 100%
- **Pendiente** (fecha inicio > today): 0%
- **En progreso**: % = `(días hábiles transcurridos / días hábiles efectivos) * 100`
  - Se cuentan desde `startIdx` hasta `min(todayIdx, endIdx)` excluyendo `skipIndices`
  - Si `todayIdx === endIdx && endIdx > startIdx` (tarea multi-día que finaliza hoy), se descuenta 1 día para no dar 100% prematuro
  - Si `todayIdx >= endIdx` (tarea que finaliza hoy o vencida), se limita al 99%
  - Si `todayIdx === endIdx && startIdx === endIdx` (tarea 1-día que inicia hoy): no descuenta, se muestra 99%

### Cálculo por Fase
- Promedio simple de los % de todas las tareas en esa fase (truncado con `Math.floor` para evitar 100% prematuro)

### Cálculo Total
- Promedio simple de los % de todas las fases (truncado con `Math.floor` para no mostrar 100% anticipadamente)

### Horas (por Bot, en tarjeta de % Avance)
- **Ejecutadas**: horas completas de tareas finalizadas (`GANTT_DATES[end] <= today && !inProgress`)
- **En Curso**: horas prorrateadas de tareas en progreso (`hours * (completed / effectiveDays)` redondeado con `Math.round`)
  - A diferencia del progreso de fase, NO descuenta el día cuando `todayIdx === endIdx`
  - Una tarea que inicia hoy cuenta sus horas completas como "En Curso"
- **Total**: suma de Ejecutadas + En Curso
- **NOVA**: se resta 1h al subtotal "En Curso" como ajuste manual para que coincida con el cierre esperado del cliente (482h en vez de 483h); en `blockTotal` del reporte se aplica igual solo a `inProgress`, no al total

### Tareas en Curso (debajo de cada tarjeta)
- Cada tarjeta muestra una sección `🔄 En Curso` con el nombre de las tareas actualmente en progreso (filtro: `start <= today <= end` o `inProgress:true`)

## Gantt Rendering

### buildGantt(rows, dates, title, grayDays, notes)
Función principal que renderiza el Gantt como tabla HTML.

**Parámetros:**
- `rows` — Array de tareas
- `dates` — GANTT_DATES
- `title` — Título (NOVA/FELI/ROBOTINA)
- `grayDays` — Array de índices para fondo gris
- `notes` — Mapa de notas `{indice: "texto"}`

**Lógica de barras:**
1. Sin `skipIndices` → `colspan` continuo
2. Con skipIndices → segmentos múltiples con `colspan`
3. Si `today` cae dentro de la barra → se divide en 3 partes (antes/hoy/después)

### Fila de Fase
Se renderiza cuando `r.phase` cambia. Ocupa todas las columnas de fecha.
Sin notas ni íconos (solo fondo de color).

### Tooltips
Cada barra tiene un tooltip con: `nombre | fecha_inicio → fecha_fin`

### ⚠ Notas
Aparecen en:
- Celdas antes de la barra (índices < startIdx con notesIdx)
- Celdas de gap (skipIndices con notesIdx)
- Barras (active days con notesIdx)

## Funciones Auxiliares

```js
isSameDay(a, b)           // Compara dos fechas (año, mes, día)
assignDates(rows)         // Copia fixedIdx/fixedEndIdx a startIdx/endIdx
calcPhaseProgress()       // Calcula % por fase y total
renderAll()               // Renderiza las 3 tarjetas + los 3 Gantts
renderNovaCard()          // Renderiza tarjeta NOVA (fases + horas ejecutadas/en curso/total)
renderFeliCard()          // Renderiza tarjeta FELI
renderRobotinaCard()      // Renderiza tarjeta ROBOTINA
renderProyectos()         // Renderiza pestaña PROYECTOS ALPINA (tarjetas + gráfico de dona)
renderProyectoCard(p, key, gridStyle?)  // Renderiza una tarjeta de proyecto (staticData o Gantt), acepta estilo grid opcional
renderProyectosChart()    // Renderiza el gráfico de dona con horas por proyecto
showProyectoDetalle(key)  // Abre modal con el alcance del proyecto (staticData.desc con <br>)
renderReporte()           // Renderiza 4 bloques + gráficos (dona y barras) con filtro por mes en REPORTE DE HORAS ALPINA
calcBotHours(rows)        // Calcula horas completadas y en curso para un array de tareas
calcBotHoursMonth(rows, filter) // Calcula horas en un mes específico (prorrateo por días hábiles)
lockedBotHours(key, filter) // Retorna horas fijas de un bot si existen; soporta `_total` para el acumulado 'all'
botHours(key, filter)     // Wrapper: usa lockedBotHours si existe, sino calcBotHoursMonth; para 'all' suma mes a mes
getMonthOptions()         // Retorna meses desde Nov 2025 hasta el mes actual (excluye meses futuros)
getReporteMonthFilter()   // Retorna filtro activo ('all' o 'YYYY-M') desde localStorage
STATIC_MONTHLY            // Objeto con horas fijas por mes (finalizados, soporte, actualización PDD, actividades + locked_*)
actualizKeys              // Keys de proyectos en Actualización PDD
actividadKeys             // Keys de actividades adicionales
openTab(id)               // Cambia a una pestaña por ID (activa botón + contenido)
openGantt(id)             // Cambia a un Gantt por ID (sin botón visible, solo contenido)
cellClass(d, isToday, grayDays)  // CSS class para celda
cellBg(d, isToday, isWeekend, grayDays)  // Color de fondo para celda
```

### Tarjetas (% Avance)
Cada tarjeta renderiza:
1. **Header**: icono + nombre del bot (clickeable, navega al Gantt) + responsable (en línea propia abajo) + % total a la derecha
2. **Milestone**: 🚩 Salida a Producción centrado en línea separada (si aplica)
3. **Fases** con barra de progreso (porcentaje individual)
4. **Footer línea 1**: Ejecutadas N h | En Curso N h | Total N h
5. **Footer línea 2**: Fases N | % Total de Avance N%
6. **Sección 🔄 En Curso**: lista de tareas en progreso (nombre + badge)

## Persistencia

### Navegación a Gantts

Los nombres de los bots en la pestaña **% AVANCE** (NOVA, FELI, ROBOTINA) tienen la clase `clickable` y al hacer clic ejecutan `openGantt(id)` que cambia al tab-content del Gantt correspondiente. Cada Gantt tiene un botón **← Volver a % Avance** que ejecuta `openTab('tab-avance')`.

Las pestañas Gantt no aparecen en la barra de pestañas; solo se acceden desde los nombres en % Avance.

### Pestaña activa
Se guarda en `localStorage('activeTab')` al hacer click en una pestaña.
Se restaura al cargar la página.

### Día actual
Usa `new Date()` en cada carga. No hay fechas fijas.

## Admin Chat

Panel protegido con contraseña para modificar tareas desde el navegador.

### Acceso
- El botón **⚙** solo aparece en `localhost:3000` (se crea dinámicamente desde JS)
- En GitHub Pages público no existe en el HTML
- Contraseña por defecto: `admin123`
- Se puede cambiar con el comando `/pwd NUEVA`

### Comandos

| Comando | Formato | Ejemplo |
|---------|---------|---------|
| Estado | `/estado "bot" "tarea" estado` | `/estado "robotina" "Pruebas unitarias" completado` |
| Extender | `/extender "bot" "tarea" +N` | `/extender "nova" "Pruebas UAT" +2` |
| Mover | `/mover "bot" "tarea" a "DD-MMM"` | `/mover "robotina" "UAT" a "28-may"` |
| Agregar | `/agregar "bot" "fase" "tarea" horas dias` | `/agregar "nova" "Cierre" "Nueva tarea" 8 1` |
| Listar | `/listar [bot]` | `/listar robotina` |
| Guardar | `/save` | Guarda cambios en el navegador |
| Restaurar | `/load` | Restaura desde el navegador |
| Ayuda | `/ayuda` | Muestra todos los comandos |

### Estados válidos
- `completado` — ✅ barra verde, progreso 100%
- `en_curso` — 🔄 barra azul, progreso parcial por días transcurridos
- `pendiente` — ⏳ barra gris, progreso 0%

### Persistencia
- **Sin servidor** (file://): cambios en `localStorage` con `/save` y `/load`
- **Con servidor** (localhost:3000): cambios se guardan **automáticamente** al ejecutar cualquier comando (`/estado`, `/extender`, `/mover`, `/agregar`). No necesita `/save` manual.

## Base de Datos (SQLite)

### Schema (`db.js`)

| Tabla | Columnas | Propósito |
|-------|----------|-----------|
| `gantt_rows` | `id, bot, sort_idx, phase, task, resp, hours, days, fixedIdx, fixedEndIdx, skipIndices, notesIdx, milestone, inProgress` | Tareas de los 3 Gantts (NOVA, FELI, ROBOTINA) |
| `static_monthly` | `id, skey, month, hours` | Horas fijas mensuales (finalizados, soporte, actualización, actividades, locked_*) |
| `proyectos` | `pkey, name, icon, responsable, color, status, progress, hours, descr` | Proyectos estáticos (sin Gantt) |
| `gantt_notes` | `nidx, ntext` | Notas asociadas a días específicos del Gantt |
| `config` | `ckey, cvalue` | Configuración general (seed flag, etc.) |

### Seed Automático

En el primer inicio, `db.seedFromHtml()` extrae los datos de `index.html`:
1. Lee el contenido del `<script>` del HTML
2. Localiza las variables `GANTT_ROWS`, `GANTT_ROWS_FELI`, `GANTT_ROWS_ROBOTINA`, `STATIC_MONTHLY`, `PROYECTOS`, `GANTT_NOTES`
3. Convierte la notación JS a JSON (maneja quotes simples, keys sin comillas, `new Date()`, trailing commas)
4. Inserta todos los registros en SQLite
5. Marca `config.seeded = '1'` para no repetir el seed en reinicios

Si se borra `database.db`, al reiniciar el servidor se regenera automáticamente desde `index.html`.

## Servidor Local (Node.js)

Para que los cambios del admin chat persistan en disco y se reflejen en GitHub:

### Inicio
```powershell
# Doble click en start.ps1, o:
C:\nodejs\node-v22.9.0-win-x64\node.exe server.js
```
Luego abrir: `http://localhost:3000`

### Base de Datos (SQLite)
El servidor ahora usa SQLite (`better-sqlite3`) como backend de datos:
- **`db.js`**: capa de base de datos con esquema para `gantt_rows`, `static_monthly`, `proyectos`, `gantt_notes`, `config`
- **`database.db`**: archivo SQLite (se genera automáticamente en el primer inicio)
- Al iniciar, si la base está vacía, se siembra automáticamente desde los datos de `index.html`
- Las modificaciones se guardan en SQLite (no más `state.json`)

### API Endpoints
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/data` | GET | Devuelve todos los datos (ganttRows, staticMonthly, proyectos, ganttNotes) |
| `/api/data/gantt/:bot` | GET | Devuelve las tareas de un bot específico (nova/feli/robotina) |
| `/api/sync` | POST | Guarda cambios (ganttRows + staticMonthly) en la base de datos |
| `/api/sync/gantt` | POST | Guarda solo cambios de tareas Gantt |
| `/api/sync/static` | POST | Guarda solo datos mensuales estáticos |
| `/api/state` | GET | Legacy, equivalente a `/api/data` |

Cuando se abre `localhost:3000`, `IS_SERVER=true` activa:
  - `loadServerState()`: carga todos los datos desde `/api/data` al iniciar
  - `saveState()`: además de localStorage, hace POST a `/api/sync` con todos los datos

### Flujo de trabajo
1. Abrir `http://localhost:3000`
2. Usar admin chat (⚙) para modificar fechas/estados
3. Los cambios se guardan **automáticamente** en SQLite + GitHub (no necesita `/save` manual)
4. Recargar la página → los cambios persisten
5. La versión pública en GitHub Pages se actualiza con cada push automático

> **Nota**: `database.db` se genera automáticamente y está en `.gitignore`.  
> Si se corrompe, simplemente borrarlo y reiniciar el servidor para que se regenere desde `index.html`.

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `server.js` | Servidor Node.js (puerto 3000), maneja rutas API |
| `db.js` | Capa de base de datos SQLite (CRUD + seed automático) |
| `database.db` | Base de datos SQLite (se crea automáticamente, ignorada por git) |
| `start.ps1` | Atajo para iniciar el servidor |
| `.gitignore` | Ignora `database.db` y `state.json` |

## Sincronización Automática

- **Script**: `sync-github.ps1`
- **Horario**: Todos los días a las 8:00 AM
- **Acción**: `git add -A && git commit && git push`
- **Token**: Classic PAT (repo scope) almacenado en la URL remota
- **Tarea Windows**: `SyncGitHubPages` en Task Scheduler

### Configuración Manual (si se pierde)
```powershell
schtasks /Create /SC DAILY /TN "SyncGitHubPages" `
  /TR "'powershell.exe' -NoLogo -ExecutionPolicy Bypass -File 'C:\Users\2NV\Desktop\Prueba de IPM\sync-github.ps1'" `
  /ST 08:00 /RU desktop-c2hubqe\2NV /RP <password> /F
```

## Datos por Bot

### NOVA (GANTT_ROWS) — Responsable: Johan Sabino
- 39 tareas en 12 fases
- Fases: Levantamiento, Estructura Base, Gestión Outlook, Gestión documental, SAP VA01, SAP ZSD, SAP VA02, SAP VF01, Grabación+Consolidado, Reporte ejecución, Cierre
- **En Curso**: Estabilización (40h), Aprobación documentación (2h) → 18h total (ajuste -1h)
- **Total ejecutadas + en curso**: 482h

### FELI (GANTT_ROWS_FELI) — Responsable: Cristian Bonilla
- 29 tareas en 5 fases
- Fases: Estructura Base, FELI, Pruebas, Documentación, Producción
- **En Curso**: UAT usuario funcional (48h, 6d: 11-13 may + 25-27 may), Documentación técnica (14h), Documentación funcional (20h) → 82h total

### ROBOTINA (GANTT_ROWS_ROBOTINA) — Responsable: Javier Gonzalez
- 38 tareas en 3 fases
- Fases: Estructura Base | Core/Framework (22 tareas), Gestión Usuarios | Active Directory (9 tareas), Cierre (7 tareas)
- Milestone: Salida a Producción 🚩 (índice 83 = 11-Jun-26)
- Hitos de notas: índices 25, 26, 31, 50, 60, 61, 64, 71
- **En Curso**: Pruebas UAT (16h, 26-27 may), Elaboración documentación SDD (18h) → 34h total
- **Cierre fase**: 7 tareas, UAT iniciada (26-27 may) → ~14% de fase

## Reporte de Horas — Datos por Mes

Los datos alimentan dos gráficos al final del Reporte:
- **Dona**: distribución de horas totales por bloque (Desarrollo, Soporte, Actualización PDD, Actividades adicionales)
- **Barras**: total de horas por mes (estático, siempre muestra todos los meses sin importar el filtro)

### Desarrollo — Activos
Los 3 bots activos calculan horas:
- **NOVA** y **ROBOTINA**: dinámicamente según `calcBotHoursMonth()` para meses sin bloqueo; pueden tener `locked_nova`/`locked_robotina` en `STATIC_MONTHLY` con valores fijos por mes y `_total` para el total acumulado
- **FELI**: usa `locked_feli` en `STATIC_MONTHLY` para todos los meses ≤ May 2026 (valores fijos)

Horas fijas de bots por mes:
| Bot | Feb 2026 | Mar 2026 | Abr 2026 | May 2026 | Total (Todos) |
|-----|----------|----------|----------|----------|--------------|
| FELI | 99 | 137 | 128 | dinámico | dinámico |
| NOVA | — | — | 126 | dinámico | 398 |
| ROBOTINA | — | 130 | 134 | dinámico | 300 |

- Mayo usa cálculo dinámico desde Gantt para los 3 bots
- Los meses futuros se ocultan del filtro hasta que inicien

### Desarrollo — Finalizados
Horas fijas por mes definidas en `STATIC_MONTHLY`:
| Proyecto | Nov 2025 | Dic 2025 | Ene 2026 | Feb 2026 |
|---|---|---|---|---|
| OPTIMUS | 57.5 | 182.5 | 46 | — |
| LA MONITA | 44.5 | 189.5 | 139 | — |
| HORAS EXTRA | 0 | 130 | 131 | 43 |

### Soporte
| Nov 2025 | Dic 2025 | Ene 2026 | Feb 2026 | Mar 2026 | Abr 2026 | May 2026 |
|---|---|---|---|---|---|---|
| 0 | 49 | 29.5 | 42 | 39 | 90 | 0 |

### Actualización PDD
| Proyecto | Nov 2025 | Dic 2025 | Ene 2026 | Feb 2026 | Mar 2026 | Abr 2026 | May 2026 |
|---|---|---|---|---|---|---|---|
| FELI | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| ROBOTINA | 0 | 0 | 0 | 8 | 0 | 1.5 | 0 |
| OPTIMUS | 0 | 3 | 0 | 0 | 0 | 0 | 0 |
| LA MONITA | 2 | 1 | 3 | 0 | 0 | 0 | 0 |
| HORAS EXTRA | 6 | 0 | 8 | 0 | 0 | 0 | 0 |

### Actividades adicionales
| Actividad | Nov | Dic | Ene | Feb | Mar | Abr | May |
|---|---|---|---|---|---|---|---|
| Sesión Dudas Feli | 0 | 0 | 1 | 6 | 1 | 2 | 0 |
| Sesión Dudas Nova | 0 | 0 | 0 | 3 | 2 | 1 | 0 |
| Sesión API Robotina | 0 | 0 | 0 | 0 | 1.5 | 2.8 | 5.3 |
| Estimación Nova y Feli | 0 | 0 | 2 | 12 | 0 | 0 | 0 |
| Sesión con Infra. Alpina | 0 | 0 | 0 | 1.5 | 0 | 0 | 0 |
| Solución correos Feli | 0 | 0 | 0 | 0 | 0 | 0 | 4.5 |

## Convenciones de Código
- Sin comentarios en JS
- Sin punto y coma en JS
- Template literals para HTML strings
- Funciones flecha para callbacks
- Variables globales para datos compartidos (GANTT_DATES, etc.)
- La restauración de pestaña activa (`openTab`) se ejecuta al final del script, después de definir todos los datos (GANTT_DATES, etc.) para evitar ReferenceError por TDZ

## Bugfixes
- **Tab restoration TDZ**: La restauración de pestaña `tab-reporte` llamaba `renderReporte()` antes de que `GANTT_DATES` estuviera definido, causando un ReferenceError que detenía todo el script. Se movió al final del script, tras todas las declaraciones de datos/funciones.

## URLs
- **Dashboard**: https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard
- **Repositorio**: https://github.com/miguelbello650-design/migracion-alpina-f2-dashboard
