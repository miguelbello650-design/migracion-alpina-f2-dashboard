# Dashboard Migración Alpina F2 - RPA

## Descripción
Dashboard web para tracking de proyectos RPA con tres bots activos (NOVA, FELI, ROBOTINA) y proyectos históricos/completados:
- **PROYECTOS ALPINA** — Vista general con proyectos agrupados por estado (Finalizados / En Proceso / Próximos), incluye proyectos activos (con Gantt), estáticos (históricos) y gráfico de dona con horas totales. La tarjeta de NOVA incluye `Ver detalle`, que navega a la pestaña `% AVANCE` y enfoca el bloque de NOVA.
- **REPORTE DE HORAS ALPINA** — 4 bloques con filtro por mes + 3 gráficos: Desarrollo (NOVA, FELI, ROBOTINA con horas dinámicas; OPTIMUS, LA MONITA, HORAS EXTRA con horas fijas mensuales), Soporte (con horas mensuales), Actualización PDD (5 proyectos con horas mensuales) y Actividades adicionales (8 actividades con horas mensuales). Incluye gráfico de dona (distribución por bloque), gráfico de barras (horas por mes) y gráfico final de horas contratadas vs horas restantes.
- **% AVANCE** — Progreso por fase y total por bot; los nombres de los bots son clickeables y navegan al Gantt correspondiente
- **GANTT NOVA / FELI / ROBOTINA** — Diagramas Gantt con barras, notas y columnas especiales (accesibles solo desde % Avance, no desde la barra de pestañas)

## Actualizacion visual 2NV

- Fondo de video local en `assets/video/dashboard-background.mp4`, con veladura para mantener la legibilidad.
- Interfaz adaptable para escritorio, tablet y telefono; en pantallas angostas las pestanas y los Gantt usan desplazamiento horizontal cuando es necesario.
- Cronogramas con superficie elevada, cabecera compacta, leyenda visual y barras con interaccion; Actividad, Responsable, Horas y Dias se muestran una sola vez en la cabecera.
- El reporte se denomina **Reporte de Horas por Hito**. La grafica **Horas por Mes** incluye eje Y y una curva de tendencia que se dibuja desde la primera barra; puntos y valores aparecen de forma escalonada, sin sombra de fondo.
- La barra superior enlaza a `https://2nv.co/` mediante el texto **Mas informacion sobre nuestra familia 2NV**.

### Estado operativo reciente

- **ROBOTINA**: la tarea **Logica de asociación de WO** permanece en curso (`inProgress:true`), con 40h, 5 días, fechas y alertas sin cambios.

## Actualizacion de resumen y soporte (2026-07-22)

- La navegacion principal incluye **RESUMEN**, **SEGUIMIENTO A DESARROLLO** y **SEGUIMIENTO A SOPORTE**.
- **RESUMEN** concentra el consumo de horas: Horas Contratadas vs Horas Restantes, Distribucion por Bloque, Horas por Mes y la tarjeta Horas de Desarrollo por Proyecto.
- La seccion **DESARROLLO** del resumen incluye una grafica independiente de evolucion mensual, con valores por punto, total y promedio. Usa solo horas de desarrollo y no se altera al filtrar las graficas superiores.
- **SEGUIMIENTO A SOPORTE** carga `assets/support/dashboard_alpina_2.html` por defecto. Se puede reemplazar desde Cargar HTML o restaurar; conserva sus subtabs nativas, pero muestra el contenido con tema claro, fondo transparente y espaciado del dashboard.
- Los controles **Cargar HTML** y **Restablecer** solo se muestran y operan en `localhost:3000`. En produccion se usa siempre el HTML publicado y se ignora cualquier version almacenada en el navegador.
- Las tarjetas KPI, graficas y tablas del HTML de soporte tienen hover con elevacion suave.
- La Monita Fase 2 conserva el alcance de nuevos clientes. El flujo de creacion de pedidos SAP se muestra en la tarjeta independiente **La Monita Fase 2 - Nuevo Flujo**.
- `reporte-horas.js` incluye `actividad_f2_lamonita` en el total compartido; Consumo de Horas, Distribucion por Bloque y `/api/data` usan las mismas horas.

## Stack
- **Lenguaje**: HTML + CSS + JavaScript (vanilla, un solo archivo `index.html`)
- **Backend**: Node.js con `better-sqlite3` (solo en servidor local `localhost:3000`)
- **Base de datos**: SQLite (`database.db`) con schema en `db.js`
- **Hosting**: GitHub Pages (`https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard`)
- **Publicación**: cambios locales y push a `main` solo bajo solicitud explícita del usuario

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
├── sync-github.ps1         # Script histórico de sincronización
├── sync-log.txt            # Log local de sincronización (no necesario en main)
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
| La Monita Fase 2 | Johan Sabino | `#dc2626` | Incorporación de nuevos clientes en el flujo del Bot · Incorporación de nuevo flujo, Proceso para la creación de pedidos (bajas) SAP |
| Migración Google - BOT NOVA | Johan Sabino | `#4285F4` | Migración de los bots RPA a Google Cloud Platform: traslado, configuración y validación de automatizaciones en el nuevo entorno, asegurando accesos, dependencias, conectividad, permisos, software base y continuidad operativa |
| BOT FELI - FASE 2 | Cristian Bonilla | `#6366f1` | Inclusión del flujo para crear materiales HALL · Incluir la creación de materiales para Ecuador/otros países (Configuración variable) · Reemplazo de MDG / Data Hub · Lógica para que en el asunto del caso pueda traer números o caracteres especiales · Automatización de precios |
| Migración Google - BOT FELI | Cristian Bonilla | `#4285F4` | Migración de los bots RPA a Google Cloud Platform: traslado, configuración y validación de automatizaciones en el nuevo entorno, asegurando accesos, dependencias, conectividad, permisos, software base y continuidad operativa |
| BOT ROBOTINA - FASE 2 | Javier Gonzalez | `#0891b2` | Generar el "Excel para el Robot" (paso 29 del PDD) · Adjuntar archivo en el cierre del ticket (paso 30.3 del PDD) |
| Migración Google - BOT ROBOTINA | Javier Gonzalez | `#4285F4` | Migración de los bots RPA a Google Cloud Platform: traslado, configuración y validación de automatizaciones en el nuevo entorno, asegurando accesos, dependencias, conectividad, permisos, software base y continuidad operativa |

Campos de `staticData`: `{ status, progress?, startDate?, endDate?, hours?, desc }`. 
- Si `progress` es `undefined`, se muestra "Ver más detalle →" que abre un modal con el contenido de `desc` (soporta `<br>` para múltiples líneas).
- Si `hours`, `startDate` o `endDate` son `undefined`, se omiten esas filas.
- `startDate` y `endDate` se persisten a través del ciclo SQLite (seed → DB → API → cliente) como strings ISO.
- La barra de progreso usa clase `completed` (verde `#10b981`) cuando `status === 'finalizado'`.

## Datos Compartidos

### GANTT_DATES
Array de fechas (índice 0-95, 96 fechas total) compartido por los 3 Gantts:

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

**Rango completo**: 6-Feb-26 a 1-Jul-26  
**Findes de semana**: Excluidos del array (solo días laborables)

### GANTT_NOTES
Mapa global de notas compartido entre NOVA y FELI (Robotina usa su propio mapa).

### GRAY_DAYS
Array por Gantt de días que se renderizan con fondo gris:
- **NOVA**: GRAY_DAYS_NOVA
- **FELI**: GRAY_DAYS_FELI (incluye 77,78: SAP Calidad caído 02-03 Jun; 93: sin inicio de Re mapeo ID SAP el 26-Jun; 99-103: sin avance Re mapeo ID SAP 07-14 Jul; 106 y 107: acceso incompleto a NWBC el 17 y 21-Jul)
- **ROBOTINA**: GRAY_DAYS_ROBOTINA (incluye 76: sin avance 01-Jun; 94: sin casos para pruebas unitarias 30-Jun; 96: cambio de alcance 02-Jul; 98: desarrollo proveedor Helix 06-Jul; 99: sesión operativa/API 07-Jul; 100-101: desarrollo y entrega API 08-09 Jul)

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

### Branding superior
- El topbar usa logos reales en lugar de texto: `assets/logos/logo-2nv-header.png` y `assets/logos/logo-alpina-header.png`.
- Se usan las versiones claras/oscuro de los logos porque contrastan mejor sobre el fondo `#1e3a5f`.

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
| La Monita Fase 2 | `#dc2626` (rojo) |
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
| Gris (días en `GRAY_DAYS`) | `rgba(148,163,184,0.25)` (gris, tiene prioridad sobre "Hoy") |
| Hoy (`isSameDay(dates[d], new Date())`) | `rgba(239,68,68,0.25)` (rojo) |
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
- **En Curso**: horas prorrateadas de tareas en progreso (`hours * (completed / effectiveDays)`, redondeado con `Math.round` en tarjetas % Avance; valores exactos en `calcBotHours` y `calcBotHoursMonth` para reporte y chart)
  - A diferencia del progreso de fase, NO descuenta el día cuando `todayIdx === endIdx`
  - Una tarea que inicia hoy cuenta sus horas completas como "En Curso"
  - Si la tarea tiene `inProgress:true`, siempre va a "En curso" aunque `donePct === 1` (no se marca como completada hasta que se quite la bandera)
- **Total**: suma de Ejecutadas + En Curso

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
openProyectoAvance(key)   // Navega desde Proyectos Alpina a % Avance y enfoca la tarjeta del bot
renderProyectosChart()    // Renderiza el gráfico de dona con horas por proyecto; para bots activos usa botHours(key, 'all'), la misma fuente del bloque Desarrollo del Reporte de horas
showProyectoDetalle(key)  // Abre modal con el alcance del proyecto (staticData.desc con <br>)
renderReporte()           // Renderiza 4 bloques + gráficos (dona, barras y horas contratadas/restantes) con filtro por mes en REPORTE DE HORAS ALPINA
calcBotHours(rows)        // Calcula horas completadas y en curso para un array de tareas
calcBotHoursMonth(rows, filter) // Calcula horas en un mes específico (prorrateo por días hábiles)
lockedBotHours(key, filter) // Retorna horas fijas de un bot si existen; soporta `_total` para el acumulado 'all'
botHours(key, filter)     // Wrapper: usa lockedBotHours si existe, sino calcBotHoursMonth; para 'all' suma mes a mes
getMonthOptions()         // Retorna meses desde Nov 2025 hasta el mes actual (excluye meses futuros)
getReporteMonthFilter()   // Retorna filtro activo ('all' o 'YYYY-M') desde localStorage
REPORTE_HORAS_CONTRATADAS // Total de horas contratadas usado en el gráfico final del reporte
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

### Flujo de trabajo local
1. El usuario informa los cambios diarios por el chat de Codex.
2. Codex actualiza los archivos locales necesarios (`index.html`, `db.js`, `server.js` o documentación, según aplique).
3. Codex verifica el estado local y, cuando sea necesario, prueba el dashboard en `localhost:3000`.
4. El usuario revisa o confirma el resultado.
5. Codex hace commit/push a `main` únicamente cuando el usuario lo pida explícitamente.

> No se usará automatización por Excel. Las reglas, fechas, estados y horas se actualizarán manualmente en el proyecto local a partir de las instrucciones dadas en este chat.

> **Nota**: `database.db` se genera automáticamente y está en `.gitignore`.  
> Si se corrompe, simplemente borrarlo y reiniciar el servidor para que se regenere desde `index.html`.

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `server.js` | Servidor Node.js (puerto 3000), maneja rutas API |
| `db.js` | Capa de base de datos SQLite (CRUD + seed automático) |
| `database.db` | Base de datos SQLite (se crea automáticamente, ignorada por git) |
| `start.ps1` | Atajo para iniciar el servidor |
| `.gitignore` | Ignora `database.db`, archivos WAL/SHM de SQLite, `state.json`, `node_modules/` y `sync-log.txt` |

## Publicación en GitHub

- **Flujo actual**: publicación manual bajo solicitud del usuario.
- **Acción esperada**: revisar cambios, hacer commit y hacer push a `main` cuando el usuario lo indique.
- **GitHub Pages**: la versión pública se actualiza después del push exitoso a `main`.
- **Log local**: `sync-log.txt` no es necesario para la rama `main` y debe permanecer ignorado.
- **Script histórico**: `sync-github.ps1` queda como referencia, pero no debe ejecutarse automáticamente salvo que el usuario lo solicite.

### Configuración histórica del script automático
```powershell
schtasks /Create /SC DAILY /TN "SyncGitHubPages" `
  /TR "'powershell.exe' -NoLogo -ExecutionPolicy Bypass -File 'C:\Users\2NV\Desktop\Prueba de IPM\sync-github.ps1'" `
  /ST 08:00 /RU desktop-c2hubqe\2NV /RP <password> /F
```

## Correo Semanal de Plan de Trabajo

Correo recurrente para informar el plan general de trabajo por desarrollador al inicio de cada semana.

### Configuración

- **Tipo**: borrador para revisar antes de enviar
- **Cliente**: Outlook Web
- **Destinatarios**: `Jesus.c@2nv.co; jm@2nv.co`
- **Horario de preparación**: 9:00 a. m.
- **Día objetivo**: lunes al inicio de semana; si el lunes es festivo, martes
- **Firma**: Outlook debe agregar la firma configurada del usuario
- **Cierre antes de firma**: `Quedo atento a los comentarios,`
- **Fuente del cuerpo**: tareas del Gantt en `index.html`

### Generación del cuerpo

El script `generar-correo-semanal.js` lee las fechas (`GANTT_DATES`) y tareas (`GANTT_ROWS`, `GANTT_ROWS_FELI`, `GANTT_ROWS_ROBOTINA`) desde `index.html`.

Comando:

```powershell
npm run correo-semanal
```

También se puede generar para una fecha específica:

```powershell
node generar-correo-semanal.js 2026-06-08
```

Para generar una vista previa HTML visual tipo dashboard:

```powershell
node generar-correo-semanal.js 2026-06-08 --html
```

Esto crea `correo-semanal-preview.html`, una plantilla HTML sencilla y alineada a la izquierda con:
- Saludo y texto introductorio.
- Tarjetas por desarrollador/bot con colores del dashboard.
- Actividades principales tomadas del Gantt.
- Badges de estado (`Planificado`, `En curso`, `Hito`).
- Bloque final de seguimiento y cierre antes de la firma de Outlook.

La plantilla HTML no debe incluir encabezado grande dentro del cuerpo como `Plan semanal RPA Alpina` ni `Semana del ...`; esa información queda en el asunto del correo.

Reglas para incluir tareas:
- La tarea inicia dentro de la semana.
- La tarea termina dentro de la semana.
- La tarea cruza algún día de la semana.
- La tarea tiene `inProgress:true`.

Agrupación:
- **Johan Sabino**: NOVA
- **Cristian Bonilla**: FELI
- **Javier Gonzalez**: ROBOTINA

### Flujo en Outlook Web

1. Generar asunto y cuerpo con `npm run correo-semanal`.
2. Abrir Outlook Web con la sesión autenticada del usuario.
3. Crear un correo nuevo como borrador.
4. Usar destinatarios `Jesus.c@2nv.co; jm@2nv.co`.
5. Pegar el asunto y cuerpo generados. Para una presentación visual, usar la versión HTML de `correo-semanal-preview.html`.
6. Dejar el correo como borrador para revisión.
7. Outlook Web debe agregar la firma configurada del usuario debajo de `Quedo atento a los comentarios,`.

Al pegar el cuerpo en Outlook Web, ubicar el cursor al inicio del cuerpo del mensaje antes de la firma. El contenido debe quedar antes de la firma, alineado a la izquierda.

### Estructura del correo

```text
Asunto: Plan semanal RPA Alpina | Semana del [lunes] al [viernes]

Buen día equipo,

Comparto el plan general de trabajo para la semana del [lunes] al [viernes].

Objetivo general de la semana:
[Resumen corto de la prioridad principal]

Plan por desarrollador:

Johan Sabino
Proyecto/Bot: NOVA
Actividades:
- [Tareas NOVA del Gantt que aplican a la semana]

Cristian Bonilla
Proyecto/Bot: FELI
Actividades:
- [Tareas FELI del Gantt que aplican a la semana]

Javier Gonzalez
Proyecto/Bot: ROBOTINA
Actividades:
- [Tareas ROBOTINA del Gantt que aplican a la semana]

Seguimiento: el avance será actualizado en el Dashboard durante la semana. Cualquier bloqueo crítico será informado oportunamente.

Quedo atento a los comentarios,
```

> Nota: el borrador no debe incluir manualmente la firma visual. Outlook agregará la firma configurada al crear o revisar el correo.

## Datos por Bot

### NOVA (GANTT_ROWS) — Responsable: Johan Sabino
- 39 tareas en 12 fases — **✅ Finalizado**
- Fases: Levantamiento, Estructura Base, Gestión Outlook, Gestión documental, SAP VA01, SAP ZSD, SAP VA02, SAP VF01, Grabación+Consolidado, Reporte ejecución, Cierre
- **Horas totales**: 144h ejecutadas (94h mayo + 50h en curso → 144h ejecutadas al finalizar)
- Última tarea: Estabilización (idx 69-75, 29-May-26)

### FELI (GANTT_ROWS_FELI) — Responsable: Cristian Bonilla
- 29 tareas en 5 fases
- Fases: Estructura Base, FELI, Pruebas, Documentación, Producción
- **En Curso**: UAT usuario funcional (96h, 12d: fin 09-Jun, salta 02-03 jun), Documentación técnica (14h), Documentación funcional (20h) → 130h total
- **02-03 Jun (idx 77,78)**: días grises — SAP Calidad caído
- **Cronograma post-UAT**: Re mapeo ID SAP inicia el 10-Jun (idx 82); Salida a Producción queda el 23-Jun (idx 90); Seguimiento postproducción termina el 01-Jul (idx 95), sin contar el festivo 29-Jun

**Nota vigente FELI 2026-06-09**: el cronograma actualizado de FELI tiene 30 tareas. UAT queda en 88h/11d, termina el 05-Jun, sin contar el 09-Jun y sigue con `inProgress:true`. La tarea Ajuste de Correo Gmail y Notificaciones se trabaja del 09-Jun al 12-Jun y esta en curso. Re mapeo ID SAP inicia el 16-Jun (idx 85), Salida a Produccion queda el 26-Jun (idx 93) y Seguimiento postproduccion termina el 06-Jul (idx 98).

**Nota vigente FELI 2026-06-18**: UAT con usuario funcional suma el dia 18-Jun-2026 (idx 87), queda en **112h / 14d** y sigue `inProgress:true`. El cronograma posterior se corre un dia habil: Re mapeo ID SAP queda del 19-Jun al 25-Jun (idx 88-92), Ajustes finales del 26-Jun al 30-Jun (idx 93-94), aprobacion/entrega el 01-Jul (idx 95), Salida a Produccion el 02-Jul (idx 96) y Seguimiento postproduccion del 03-Jul al 08-Jul (idx 97-100).

**Nota vigente FELI 2026-06-19**: UAT con usuario funcional suma el dia 19-Jun-2026 (idx 88), queda en **120h / 15d** y sigue `inProgress:true`. El cronograma posterior se corre un dia habil: Re mapeo ID SAP queda del 22-Jun al 26-Jun (idx 89-93), Ajustes finales del 30-Jun al 01-Jul (idx 94-95), aprobacion/entrega el 02-Jul (idx 96), Salida a Produccion el 03-Jul (idx 97) y Seguimiento postproduccion del 06-Jul al 09-Jul (idx 98-101).

**Nota vigente FELI 2026-06-22**: UAT con usuario funcional suma el dia 22-Jun-2026 (idx 89), queda en **128h / 16d** y sigue `inProgress:true`. El cronograma posterior se corre un dia habil: Re mapeo ID SAP queda del 23-Jun al 30-Jun (idx 90-94), Ajustes finales del 01-Jul al 02-Jul (idx 95-96), aprobacion/entrega el 03-Jul (idx 97), Salida a Produccion el 06-Jul (idx 98) y Seguimiento postproduccion del 07-Jul al 10-Jul (idx 99-102).

**Nota vigente FELI 2026-06-26**: el dia 26-Jun-2026 (idx 93) queda gris porque no se pudo iniciar Re mapeo ID SAP. El cronograma se corre desde ese dia: Re mapeo ID SAP queda del 30-Jun al 06-Jul (idx 94-98), Ajustes finales mantiene el primer dia el 24-Jun y mueve su segundo dia al 07-Jul (idx 91-99, saltando 92-98), aprobacion/entrega el 08-Jul (idx 100), Salida a Produccion el 09-Jul (idx 101) y Seguimiento postproduccion del 10-Jul al 17-Jul (idx 102-106).

**Nota vigente FELI 2026-07-07**: se agrega un dia adicional a **Re mapeo ID SAP** el 07-Jul-2026 (idx 99), queda en **48h / 6d** y `inProgress:true`. El cronograma posterior se corre un dia: Ajustes finales mueve su segundo dia al 08-Jul (idx 100), aprobacion/entrega el 09-Jul (idx 101), Salida a Produccion el 10-Jul (idx 102) y Seguimiento postproduccion del 14-Jul al 21-Jul (idx 103-107).

**Nota vigente FELI 2026-07-08**: se quita el 07-Jul-2026 (idx 99) como duracion efectiva de **Re mapeo ID SAP**. La tarea queda en **40h / 5d**, mantiene `inProgress:true`, el dia idx 99 queda gris y con alerta: "No se logra avanzar en el remapeo ya que no se a autorizado la transacción MBC1 y la NWBC. Adicional Alpina está realizando migración de SAP Rise y no se puede usar SAP hasta el 14 de Julio".

**Nota vigente FELI 2026-07-08 / 08-Jul**: se actualiza la alerta del 08-Jul-2026 (idx 100) en **Re mapeo ID SAP**: "No se logra avanzar en el remapeo ya que no se a autorizado la transacción MBC1 y la NWBC. Adicional Alpina está realizando migración de SAP Rise y no se puede usar SAP hasta el 14 de Julio". La columna queda gris y el cronograma se corre un dia desde el 08-Jul: Ajustes finales mueve su segundo dia al 09-Jul (idx 101), aprobacion/entrega al 10-Jul (idx 102), Salida a Produccion el 14-Jul (idx 103) y Seguimiento postproduccion del 15-Jul al 22-Jul (idx 104-108).

**Nota vigente FELI 2026-07-09**: se agrega la misma alerta para el 09-Jul-2026 (idx 101) y 10-Jul-2026 (idx 102) en **Re mapeo ID SAP**; ambas columnas quedan grises. El cronograma se corre dos dias desde el 10-Jul: Ajustes finales mueve su segundo dia al 14-Jul (idx 103), aprobacion/entrega al 15-Jul (idx 104), Salida a Produccion el 16-Jul (idx 105) y Seguimiento postproduccion del 17-Jul al 24-Jul (idx 106-110).

**Nota vigente FELI 2026-07-09 / Re mapeo 14-16 Jul**: se agregan 3 dias mas a **Re mapeo ID SAP** el 14-Jul, 15-Jul y 16-Jul (idx 103-105). La tarea queda en **64h / 8d** y mantiene `inProgress:true`. El cronograma posterior se corre 3 dias desde el 16-Jul: Ajustes finales mueve su segundo dia al 17-Jul (idx 106), aprobacion/entrega al 21-Jul (idx 107), Salida a Produccion el 22-Jul (idx 108) y Seguimiento postproduccion del 23-Jul al 29-Jul (idx 109-113).

**Nota vigente FELI 2026-07-15 / 14-Jul gris**: el 14-Jul-2026 (idx 103) queda gris en todo el Gantt de Feli. En **Re mapeo ID SAP** se agrega la alerta "No se logra avanzar debido a que SAP todabía no estaba listo despues de la migración de SAP RICE". La tarea conserva **64h / 8d**, mueve su cierre al 17-Jul (idx 106) y el cronograma posterior se corre un dia: Ajustes finales mueve su segundo dia al 21-Jul (idx 107), aprobacion/entrega al 22-Jul (idx 108), Salida a Produccion el 23-Jul (idx 109) y Seguimiento postproduccion del 24-Jul al 30-Jul (idx 110-114).

**Nota vigente FELI 2026-07-17 / 17-Jul gris**: el 17-Jul-2026 (idx 106) queda gris en todo el Gantt de Feli. En **Re mapeo ID SAP** se agrega la alerta "No se logra avanzar debido a que todavía no se cuenta con el acceso completo a la NWBC". La tarea conserva **64h / 8d**, se cierra el 21-Jul (idx 107) y el cronograma posterior se corre un dia: Ajustes finales al 22-Jul (idx 108), aprobacion/entrega al 23-Jul (idx 109), Salida a Produccion al 24-Jul (idx 110) y Seguimiento postproduccion del 27-Jul al 31-Jul (idx 111-115).

**Nota vigente FELI 2026-07-21 / 21-Jul gris**: el 21-Jul-2026 (idx 107) queda gris en todo el Gantt de Feli. En **Re mapeo ID SAP** se agrega la alerta "No se logra avanzar debido a que todavía no se cuenta con el acceso completo a la NWBC". La tarea conserva **64h / 8d**, se cierra el 22-Jul (idx 108) y el cronograma posterior se corre un dia: Ajustes finales al 23-Jul (idx 109), aprobacion/entrega al 24-Jul (idx 110), Salida a Produccion al 27-Jul (idx 111) y Seguimiento postproduccion del 28-Jul al 03-Aug (idx 112-116).

### ROBOTINA (GANTT_ROWS_ROBOTINA) — Responsable: Javier Gonzalez
- **Nota vigente 2026-07-21**: la tarea **Logica de asociación de WO** queda finalizada (`inProgress:false`) sin modificar sus 40h, 5 dias ni fechas planificadas.
- **Nota vigente 2026-07-22**: **Pruebas unitarias** suma el 22-Jul (idx 108), queda en **80h / 10 dias** y permanece en curso. El cronograma posterior se corre un dia: UAT al 23-Jul (idx 109), aprobacion/entrega al 24-Jul (idx 110), salida a produccion al 27-Jul (idx 111) y soporte postproduccion del 28-Jul al 03-Aug (idx 112-116).
- 40 tareas en 3 fases
- Fases: Estructura Base | Core/Framework (22 tareas), Gestión Usuarios | Active Directory (9 tareas), Cierre (9 tareas)
- Vista Gantt: se recorta visualmente desde la primera tarea asignada, **23-Feb-2026** (idx 11). Los datos base conservan sus índices globales para no afectar cálculos, tarjetas ni reportes.
- Milestone: Salida a Producción 🚩 (índice 99 = 7-Jul-26)
- Hitos de notas: índices 25, 26, 31, 50, 60, 61, 64, 71, 76, 78 y notas por tarea en idx 80
- **En Curso**: Pruebas UAT (32h, 4d: 26-29 may) finalizada y Elaboración documentación SDD (18h). Creación ticket BOT (40h, 5d: 17-18 mar + 03, 05 y 23-26 jun) queda ejecutada.
- **01-Jun (idx 76)**: día gris — sin avance (pendiente definición APIS)
- **03-Jun (idx 78)**: Re mapeo IDS salta — Creación ticket BOT finalizada en este día
- **05-Jun (idx 80) + 10-12 Jun (idx 82-84) + 16-Jun (idx 85)**: Validación y creación flujo principal API queda en **34.7h / 4.5d**, con duración en 05-Jun, 10, 11, 12 y 16-Jun. El 09-Jun (idx 81) se salta para esta tarea.
- **Cronograma posterior Robotina 2026-06-16**: Re mapeo ID SAP conserva `inProgress:true`, trabaja los días 2, 4, 9, 17 y 18 de junio, y cierra el 18-Jun (idx 87) con 40h/5d. Ajuste Migración Google se programa del 23-Jun al 26-Jun (idx 90-93) con nota en el 23-Jun; Aprobación y entrega quedan el 30-Jun (idx 94), paso a producción del 1-Jul al 6-Jul (idx 95-98), salida a producción el 7-Jul (idx 99) y soporte postproducción del 8-Jul al 14-Jul (idx 100-104), sin contar el festivo 29-Jun.
- **En Curso**: Pruebas UAT permanece con `inProgress:true`. Validación y creación flujo principal API, Re mapeo ID SAP, Creación ticket BOT y Creación de usuario en SUSI quedan ejecutadas.
- **Nota vigente ROBOTINA 2026-06-19**: la tarea **Re mapeo ID SAP a producción** queda ejecutada (`inProgress:false`) y la base SQLite local queda sincronizada.
- **Nota vigente ROBOTINA 2026-06-22**: la tarea **Creación ticket BOT** queda ejecutada (`inProgress:false`) y la base SQLite local queda sincronizada.
- **Nota vigente ROBOTINA 2026-06-30**: la tarea **Ajuste Migración Google** queda finalizada (`inProgress:false`) y **Pruebas unitarias** queda en curso (`inProgress:true`). La base SQLite local queda sincronizada.
- **Nota vigente ROBOTINA 2026-07-03**: el 30-Jun-2026 (idx 94) queda gris en todo el Gantt de Robotina. En **Pruebas unitarias** se agrega la alerta "No se cuenta con casos para realizar pruebas unitarias, se entregaron casos a las 4:00 pm". El cronograma posterior se corre un dia: Pruebas unitarias cierra el 01-Jul (idx 95), Pruebas UAT el 02-Jul (idx 96), aprobacion/entrega el 06-Jul (idx 98), salida a produccion el 07-Jul (idx 99) y soporte postproduccion del 08-Jul al 15-Jul (idx 100-104).
- **Nota vigente ROBOTINA 2026-07-03 / 01-Jul**: en **Pruebas unitarias** se agrega alerta en la duración del 01-Jul-2026 (idx 95): "Se requiere un día adicional para probar que todo esté funcionando correctamente despues de hacer los cambios y ajustes solicitados".
- **Nota vigente ROBOTINA 2026-07-03 / 02-Jul**: el 02-Jul-2026 (idx 96) queda gris en todo el Gantt de Robotina. En **Elaboración documentación SDD + manual usuario** se agrega la alerta "No se logra avanzar en las pruebas unitarias y UAT debido a que hay cambio de alcance (En la creación de usuarios se debe crear y asociar WO a la WO principal)". El cronograma posterior se corre un dia: documentación cierra el 06-Jul (idx 98), Pruebas UAT el 03-Jul (idx 97), aprobación/entrega el 07-Jul (idx 99), salida a producción el 08-Jul (idx 100) y soporte postproducción del 09-Jul al 16-Jul (idx 101-105).
- **Nota vigente ROBOTINA 2026-07-03 / 03-Jul**: en **Elaboración documentación SDD + manual usuario** se agrega duración el 03-Jul-2026 (idx 97), queda en curso y pasa a **32h / 4d**. El cronograma posterior se corre un dia: documentación cierra el 07-Jul (idx 99), Pruebas UAT el 06-Jul (idx 98), aprobación/entrega el 08-Jul (idx 100), salida a producción el 09-Jul (idx 101) y soporte postproducción del 10-Jul al 17-Jul (idx 102-106).
- **Nota vigente ROBOTINA 2026-07-03 / 06-Jul**: el 06-Jul-2026 (idx 98) queda gris en todo el Gantt de Robotina. En **Elaboración documentación SDD + manual usuario** se agrega la alerta "Dos días destinados a que el proveedor de Helix desarrolle la logica de asociación de WO". El cronograma posterior se corre un dia: documentación cierra el 08-Jul (idx 100), Pruebas UAT el 07-Jul (idx 99), aprobación/entrega el 09-Jul (idx 101), salida a producción el 10-Jul (idx 102) y soporte postproducción del 14-Jul al 20-Jul (idx 103-107). Se agrega 20-Jul-2026 al calendario del Gantt.
- **Nota vigente ROBOTINA 2026-07-03 / Logica de asociación de WO**: se agrega la tarea **Logica de asociación de WO** debajo de **Validación y creación flujo principal API**, con **40h / 5d** del 07-Jul al 14-Jul (idx 99-103). El cronograma posterior se corre 5 días: documentación cierra el 16-Jul (idx 105), Pruebas UAT el 15-Jul (idx 104), aprobación/entrega el 17-Jul (idx 106), salida a producción el 20-Jul (idx 107) y soporte postproducción del 21-Jul al 27-Jul (idx 108-112). Se agregan 21-Jul, 22-Jul, 23-Jul, 24-Jul y 27-Jul al calendario del Gantt.
- **Nota vigente ROBOTINA 2026-07-03 / alerta Logica de asociación de WO**: en **Logica de asociación de WO** se agrega alerta en la duración del 07-Jul-2026 (idx 99): "Se requieren 5 días adicionales para incluir la logica de asociación de WO en la API".
- **Nota vigente ROBOTINA 2026-07-03 / Pruebas unitarias 16-Jul**: en **Pruebas unitarias** se agrega duración el 16-Jul-2026 (idx 105), queda en **72h / 9d** y mantiene `inProgress:true`. La alerta ubicada en esa duración es "Se requiere un día adicional para probar que todo esté funcionando correctamente despues de hacer los cambios y ajustes solicitados".
- **Nota vigente ROBOTINA 2026-07-03 / ajuste pruebas 15-16 Jul**: se mueve la duración adicional de **Pruebas unitarias** al 15-Jul-2026 (idx 104) y **Pruebas UAT** al 16-Jul-2026 (idx 105). En **Pruebas UAT** se agrega la alerta "Dia adicional para probar nuevamente con la parte funcional todos los flujos correspondientes a Robotina, la duración de esta actividad se puede extender dependiendo de los ajustes que pueden surgir".
- **Nota vigente ROBOTINA 2026-07-03 / documentación 16-Jul**: se elimina la duración del 16-Jul-2026 (idx 105) de **Elaboración documentación SDD + manual usuario**. La tarea queda en **24h / 3d**, con `fixedEndIdx:104` y conserva las alertas de idx 96 e idx 98.
- **Nota vigente ROBOTINA 2026-07-03 / festivo 20-Jul**: se elimina el 20-Jul-2026 del calendario del Gantt por festivo y se agrega 28-Jul-2026 al final. Las tareas desde ese punto se corren un día hábil: salida a producción queda el 21-Jul (idx 107) y soporte postproducción del 22-Jul al 28-Jul (idx 108-112).
- **Nota vigente ROBOTINA 2026-07-07**: el 07-Jul-2026 (idx 99) queda gris en todo el Gantt de Robotina. En **Logica de asociación de WO** se agrega la alerta "Se destina este día para realizar sesión con el equipo operativo y de API para levantamiento de los casos de WO". El cronograma posterior se corre un día: Logica de asociación de WO queda del 08-Jul al 15-Jul (idx 100-104), Pruebas unitarias mueve su día adicional al 16-Jul (idx 105), Pruebas UAT al 17-Jul (idx 106), aprobación/entrega al 21-Jul (idx 107), salida a producción al 22-Jul (idx 108) y soporte postproducción del 23-Jul al 29-Jul (idx 109-113). Se agrega 29-Jul-2026 al calendario del Gantt.
- **Nota vigente ROBOTINA 2026-07-08**: el 08-Jul-2026 (idx 100) y 09-Jul-2026 (idx 101) quedan grises en todo el Gantt de Robotina. En **Logica de asociación de WO** se agrega la alerta "Tiempo desarrollo y entrega de la API" sobre ambas duraciones.
- **Nota vigente ROBOTINA 2026-07-08 / corrimiento 08-09 Jul**: el cronograma se corre dos días desde el 09-Jul-2026. **Logica de asociación de WO** conserva las alertas en idx 100-101 y mueve su duración real a 10-Jul, 14-Jul, 15-Jul, 16-Jul y 17-Jul (idx 102-106). Pruebas unitarias pasa al 21-Jul (idx 107), Pruebas UAT al 22-Jul (idx 108), aprobación/entrega al 23-Jul (idx 109), salida a producción al 24-Jul (idx 110) y soporte postproducción del 27-Jul al 31-Jul (idx 111-115). Se agregan 30-Jul-2026 y 31-Jul-2026 al calendario del Gantt.

## Reporte de Horas — Datos por Mes

Los datos alimentan tres gráficos al final del Reporte:
- **Dona**: distribución de horas totales por bloque (Desarrollo, Soporte, Actualización PDD, Actividades adicionales)
- **Barras**: total de horas por mes (estático, siempre muestra todos los meses sin importar el filtro)
- **Horas contratadas vs horas restantes**: compara `REPORTE_HORAS_CONTRATADAS = 4320` contra las horas totales acumuladas (`horas restantes = horas contratadas - horas totales`) mediante dona y barra apilada.

La gráfica **Horas de Desarrollo por Proyecto** de la pestaña **PROYECTOS ALPINA** reutiliza `botHours(key, 'all')` para los bots activos, por lo que muestra los mismos valores acumulados que el bloque **Desarrollo** del Reporte de horas. Ejemplo vigente: **NOVA = 550h**.

### Desarrollo — Activos
Los 3 bots activos calculan horas:
- **NOVA** y **ROBOTINA**: dinámicamente según `calcBotHoursMonth()` para meses sin bloqueo; pueden tener `locked_nova`/`locked_robotina` en `STATIC_MONTHLY` con valores fijos por mes y `_total` para el total acumulado
- **FELI**: usa `locked_feli` en `STATIC_MONTHLY` para todos los meses ≤ May 2026 (valores fijos)

Horas fijas de bots por mes:
| Bot | Feb 2026 | Mar 2026 | Abr 2026 | May 2026 | Jun 2026 | Total (Todos) |
|-----|----------|----------|----------|----------|----------|--------------|
| FELI | 99 | 137 | 128 | 152 | dinámico | dinámico |
| NOVA | — | — | 126 | dinámico | dinámico | 398 |
| ROBOTINA | — | 130 | 134 | 148 | 145.6 | 300 |

- Mayo usa cálculo dinámico desde Gantt para NOVA. FELI en mayo queda bloqueado en 152h mediante `locked_feli['2026-5']`. ROBOTINA en mayo queda bloqueado en 148h mediante `locked_robotina['2026-5']`; junio queda bloqueado en 145.6h mediante `locked_robotina['2026-6']`.
- Los meses futuros se ocultan del filtro hasta que inicien

### Desarrollo — Finalizados
Horas fijas por mes definidas en `STATIC_MONTHLY`:
| Proyecto | Nov 2025 | Dic 2025 | Ene 2026 | Feb 2026 |
|---|---|---|---|---|
| OPTIMUS | 57.5 | 182.5 | 46 | — |
| LA MONITA | 44.5 | 189.5 | 139 | — |
| HORAS EXTRA | 0 | 130 | 131 | 43 |

### Soporte
| Nov 2025 | Dic 2025 | Ene 2026 | Feb 2026 | Mar 2026 | Abr 2026 | May 2026 | Jun 2026 | Jul 2026 |
|---|---|---|---|---|---|---|---|---|
| 0 | 49 | 29.5 | 42 | 39 | 90 | 73 | 166 | 97 |

### Actualización PDD
| Proyecto | Nov 2025 | Dic 2025 | Ene 2026 | Feb 2026 | Mar 2026 | Abr 2026 | May 2026 | Jun 2026 | Jul 2026 |
|---|---|---|---|---|---|---|---|---|---|
| FELI | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 |
| ROBOTINA | 0 | 0 | 0 | 8 | 0 | 1.5 | 0 | 0 | 0.5 |
| OPTIMUS | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LA MONITA | 2 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| HORAS EXTRA | 6 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0 |

### Actividades adicionales
| Actividad | Nov | Dic | Ene | Feb | Mar | Abr | May | Jun | Jul |
|---|---|---|---|---|---|---|---|---|---|
| Sesión Dudas Feli | 0 | 0 | 1 | 6 | 1 | 2 | 0 | 0 | 1 |
| Sesión Dudas Nova | 0 | 0 | 0 | 3 | 2 | 1 | 0 | 0 | 0 |
| Sesión API Robotina | 0 | 0 | 0 | 0 | 1.5 | 2.8 | 5.3 | 0 | 5.5 |
| API Succes SAP Robotina | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| Ajustes adicionales Nova | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| Estimación Nova y Feli | 0 | 0 | 2 | 12 | 0 | 0 | 0 | 0 | 0 |
| Sesión con Infra. Alpina | 0 | 0 | 0 | 1.5 | 0 | 0 | 0 | 0 | 0 |
| Solución correos Feli | 0 | 0 | 0 | 0 | 0 | 0 | 4.5 | 0 | 0 |
| Sesión F2 La Monita | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0.5 |

## Convenciones de Código
- Sin comentarios en JS
- Sin punto y coma en JS
- Template literals para HTML strings
- Funciones flecha para callbacks
- Variables globales para datos compartidos (GANTT_DATES, etc.)
- La restauración de pestaña activa (`openTab`) se ejecuta al final del script, después de definir todos los datos (GANTT_DATES, etc.) para evitar ReferenceError por TDZ

## Bugfixes
- **Tab restoration TDZ**: La restauración de pestaña `tab-reporte` llamaba `renderReporte()` antes de que `GANTT_DATES` estuviera definido, causando un ReferenceError que detenía todo el script. Se movió al final del script, tras todas las declaraciones de datos/funciones.
- **calcBotHoursMonth inProgress**: Tareas con `inProgress:true` y fecha pasada se marcaban como completadas porque `donePct === 1`. Se corrigió cambiando `donePct === 1` por `donePct === 1 && !r.inProgress`.
- **-1 adjustment eliminado**: Se removieron los `hours.inProgress -= 1` en `renderNovaCard`, `if (k === 'nova') cur = Math.max(0, cur - 1)` en `renderReporte`, y similares en `exportReporte` y `blockTotal` que restaban 1h fantasmas a NOVA.
- **Doc. técnica movida a mayo**: Tarea "Documentación técnica (SDD)" de NOVA pasó de índices 45-46 (abril) a 57-58 (mayo) para que su cálculo dinámico (12h) se asigne a mayo.
- **NOVA Estabilización 56h**: Cambió de 40h a 56h (7 días).
- **calcBotHoursMonth exacto / sin Math.round**: Se eliminó `Math.round` del return en `calcBotHoursMonth`; ahora retorna valores decimales exactos. `renderReporte` muestra con `.toFixed(1)`.
- **PROYECTOS ALPINA exacto**: `calcBotHours` ya no redondea con `Math.round`. Todas las horas en chart y tarjetas estáticas se muestran con `.toFixed(1)`. Eliminado `h -= 1` para NOVA en el chart.
- **startDate/endDate persisten en SQLite**: `jsLiteralToJSON` convierte `new Date(y,m,d)` a ISO string en lugar de `null`, el INSERT almacena los valores reales, y `getProyectos()` los retorna al cliente. El render usa `new Date(val + 'T12:00:00')` para soportar tanto strings del servidor como Date objects locales.
- **ROBOTINA UAT extendida (32h/4d)**: UAT de ROBOTINA pasó de 24h/3d a 32h/4d, fin del 28-May al 29-May (idx 75). Tareas posteriores desplazadas +1. GANTT_DATES extendido a 92 fechas (0-91), agregado 23-Jun-26 y 24-Jun-26.
- **ROBOTINA gray day 76 (01-Jun-26)**: Día sin avance por pendiente definición APIS. Cronograma post-UAT desplazado +1 día. Re mapeo ID SAP inicia 02-Jun (idx 77).
- **getBotStatus fix inProgress**: Tareas con `inProgress:true` ahora evitan que el bot se marque como `finalizado` aunque su fecha ya haya pasado. Se agregó `r.inProgress ||` en la condición `allPast`.
- **Soporte mayo 73h**: Horas de soporte para mayo 2026 actualizadas de 0 a 73.
- **NOVA Estabilización completada**: Se eliminó `inProgress:true` de la tarea (fecha fin 29-May ya cumplida). Ahora se muestra como finalizada (barra verde) y sus horas cuentan como ejecutadas.
- **NOVA finalizado**: Se eliminó `inProgress:true` de "Aprobación de documentación" para que `getBotStatus` retorne `finalizado`. Nova aparece en "✅ Finalizados" de PROYECTOS ALPINA.
- **Progress bar verde en Finalizados**: La barra de progreso de proyectos dinámicos con status `finalizado` usa clase `completed` (verde) en lugar del color del bot.
- **Excel export UTF-8 BOM**: Se agregó `\uFEFF` (BOM) y `charset=utf-8` al Blob de exportReporte para que Excel interprete correctamente caracteres especiales (ó, í, á, ñ).
- **Prioridad grayDay sobre today**: En columnas Gantt, si un día está en GRAY_DAYS se pinta gris aunque sea el día actual (antes primaba el rojo de "hoy").
- **FELI UAT extendida a 10d/80h**: UAT de FELI pasó de 72h/9d a 80h/10d, fin del 01-Jun (idx 76) al 02-Jun (idx 77). Tareas posteriores desplazadas +1.
- **FELI Re mapeo IDS 5 días**: Ajustado a 5 días (fixedEndIdx 81→82). Cronograma posterior desplazado +1. Seguimiento postproducción termina en idx 91 (24-Jun-26).
- **FELI UAT gap 02-Jun + shift**: UAT extiende a idx 78 (03-Jun), salta idx 77 (02-Jun, sin avance). Tareas posteriores desplazadas +1. GANTT_DATES extendido a 93 fechas (0-92), agregado 25-Jun-26.
- **FELI gray day 77 + nota SAP**: 02-Jun (idx 77) agregado a GRAY_DAYS_FELI con nota "El ambiente de SAP Calidad se encuentra caido" y notesIdx en UAT.
- **ROBOTINA Creación ticket BOT extendido**: Ahora 40h/5d, abarca 17-18 mar (idx 27-28) + 03, 05 y 19-jun (idx 78, 80 y 88) con skipIndices. Marcado `inProgress:true`.
- **ROBOTINA Re mapeo IDS + skip 78**: Trabaja 02,04,05,09-jun (77,79,80,81) con skip en 78. Tareas posteriores desplazadas. GANTT_DATES extendido a 94 fechas (0-93), agregado 26-Jun-26.
- **FELI gray day 78 + shift**: 03-Jun (idx 78) agregado a GRAY_DAYS_FELI. UAT extiende a idx 79 (04-Jun) con skip 77+78. Tareas posteriores desplazadas +1.
- **FELI UAT extendida a 11d/88h**: UAT de FELI pasa a terminar el 05-Jun (idx 80). Re mapeo ID SAP y tareas posteriores se desplazan +1 día. GANTT_DATES extendido a 95 fechas (0-94), agregado 30-Jun-26 porque el 29-Jun es festivo y no se cuenta.
- **FELI UAT extendida a 12d/96h**: UAT de FELI suma el 09-Jun (idx 81), pasa a 96h/12d y tareas posteriores se desplazan +1 día. GANTT_DATES extendido a 96 fechas (0-95), agregado 01-Jul-26.
- **ROBOTINA Creación ticket BOT con ajuste de Google**: Mantiene `inProgress:true` y suma la nota del 23-Jun para la reasignación de WO; la barra sigue en curso.
- **ROBOTINA sin UAT 05-Jun + shift**: 05-Jun (idx 80) queda fuera de Re mapeo ID SAP mediante `skipIndices`, sin gris global. Re mapeo termina el 10-Jun (idx 82), tareas posteriores se desplazan +1, Salida a Producción queda el 19-Jun (idx 88) y soporte termina el 26-Jun (idx 93).
- **ROBOTINA duraciones adicionales 05-Jun**: idx 80 se agrega a Creación ticket BOT (40h/5d, con nota adicional en 19-Jun), Creación de usuario en SUSI (34.66h/5d) y a la nueva tarea Validación y creación flujo principal API (2.66h/0.5d), ubicada después de Pruebas unitarias, con notas independientes por tarea.
- **ROBOTINA tareas 05-Jun**: Creación ticket BOT y Creación de usuario en SUSI permanecen con `inProgress:true`; Validación y creación flujo principal API permanece `inProgress:true`.
- **ROBOTINA API flujo principal extendida**: Validación y creación flujo principal API pasa a **34.7h / 4.5d**. Mantiene idx 80 (05-Jun), agrega idx 82-85 (10, 11, 12 y 16-Jun) y salta idx 81 (09-Jun). El cronograma posterior se desplaza +1 día hábil adicional desde el 16-Jun: Re mapeo ID SAP cierra el 18-Jun, salida a producción queda el 26-Jun y soporte termina el 06-Jul.
## URLs
- **Dashboard**: https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard
- **Repositorio**: https://github.com/miguelbello650-design/migracion-alpina-f2-dashboard

## API Local - Reporte de Horas

El endpoint local `GET /api/data` mantiene los campos existentes (`ganttRows`, `staticMonthly`, `proyectos`, `ganttDates`) y agrega `reporteHoras` para automatizaciones externas.

`reporteHoras` usa el helper compartido `reporte-horas.js`, el mismo que consume la grafica **Horas Contratadas vs Horas Restantes** en la pestana **REPORTE DE HORAS ALPINA**. No recalcula con una logica distinta.

Ejemplo de respuesta:

```json
"reporteHoras": {
  "contratadas": 4320,
  "consumidas": 2994.5,
  "restantes": 1325.5,
  "porcentaje": 69.3
}
```

## Actualizacion - Migracion Google BOT NOVA (2026-06-09)

- El proyecto **Migracion Google - BOT NOVA** pasa de proximo a **En Proceso** en la pestana **PROYECTOS ALPINA**.
- Se agrega como proyecto activo en la pestana **% AVANCE** con tarjeta propia y navegacion al Gantt al hacer clic en el nombre.
- Se agrega el array `GANTT_ROWS_GOOGLE_NOVA` con las actividades tomadas de `GANTT MIGRACION NOVA.csv`.
- Se agrega soporte de persistencia para `googlenova` en `index.html`, `server.js` y `db.js`.
- La base SQLite local se sincronizo con 9 filas para `googlenova` (8 actividades con duracion + 1 hito de salida a produccion).

### Agenda cargada desde CSV

El CSV no incluye fechas de inicio/fin. Para esta version se asumio inicio el **10-Jun-2026** y se uso el calendario compartido `GANTT_DATES`, que ya excluye dias no laborables/festivos. Por eso la agenda salta los festivos/no laborables como **15-Jun-2026** y **29-Jun-2026**.

| Fase | Actividad | Horas | Dias | Fecha visual |
|------|-----------|-------|------|--------------|
| Gestion Gmail | Busqueda de correos + validacion de adjuntos SKU/FAMILIA/RUTAS | 6 | 0.75 | 10-Jun-2026 |
| Gestion Gmail | Flujo de aprobacion/rechazo | 4 | 0.5 | 11-Jun-2026 |
| Gestion Gmail | Descarga adjuntos + registro/control de casos | 2 | 0.25 | 11-Jun-2026 |
| Gestion Gmail | Guardado .MSG/.EML, correlacion y respuesta final | 4 | 0.5 | 12-Jun-2026 |
| Gestion Gmail | Notificaciones de respuesta al solicitante | 4 | 0.5 | 12-Jun-2026 |
| Reporte ejecucion + Insight | Envio correo final | 4 | 0.5 | 16-Jun-2026 |
| Pruebas | Salida a Produccion | 0 | 0 | 17-Jun-2026 |
| Pruebas | Funcionamiento operativo y monitorizacion | 8 | 1 | 17-Jun-2026 |
| Ajuste documentacion | Ajuste documentacion | 8 | 1 | 18-Jun-2026 |

Total cargado: **40 horas / 5 dias**. El hito **Salida a Produccion** se muestra como barra amarilla con bandera roja en el Gantt.

### Reporte de horas

El bloque **Desarrollo** de la pestana **REPORTE DE HORAS ALPINA** incluye `googlenova` en `botKeys`, por lo que las horas de Migracion Google - BOT NOVA aparecen en el reporte visual, los totales por mes, los graficos y el export a Excel.

## Actualizacion - Migracion Google BOT NOVA estados Gantt (2026-06-10)

- Se corrige el estado de las actividades del Gantt de **Migracion Google - BOT NOVA** para que el dashboard diferencie correctamente tareas finalizadas y tareas en curso.
- La tarea **1. Busqueda de correos + validacion de adjuntos SKU/FAMILIA/RUTAS** queda finalizada al tener fecha **10-Jun-2026**.
- Las tareas **2. Flujo de aprobacion/rechazo (incl. reintentos y timeouts)** y **3. Descarga adjuntos + registro/control de casos** quedan finalizadas al tener fecha **11-Jun-2026**.
- Las tareas **4. Guardado .MSG o .EML, correlacion (.xls y .msg), respuesta final en el mismo hilo y eliminacion .msg** y **5. Notificaciones de respuesta al solicitante** quedan con `inProgress:true`; ambas corresponden al **12-Jun-2026** y se muestran en curso.
- La base SQLite local se sincronizo para `googlenova`, evitando que el servidor restaure el estado anterior al abrir el dashboard.

**Nota vigente 2026-06-18**: las tareas del **17-Jun-2026** (`Salida a Produccion` y `1. Funcionamiento operativo y monitorizacion`) quedan ejecutadas, sin `inProgress`. La tarea del **18-Jun-2026** (`1. Ajuste documentacion`) queda con `inProgress:true`. La base SQLite local se sincronizo para `googlenova`.

**Nota vigente 2026-06-19**: todas las tareas de **Migracion Google - BOT NOVA** quedan finalizadas. `1. Ajuste documentacion` pasa a `inProgress:false`; `/api/data` no devuelve tareas `googlenova` en curso.

## Actualizacion - FELI pruebas Gmail (2026-06-09)

- Se agrega en el Gantt de **FELI**, dentro de la fase **Pruebas** y antes de **1. Pruebas unitarias e integracion tecnica**, la tarea **Ajuste de Correo Gmail y Notificaciones**.
- Duracion: **32 horas / 4 dias**.
- Fechas: **9-Jun-2026 al 12-Jun-2026**.
- Estado: **En curso** (`inProgress:true`).
- Nota en el 09-Jun (idx 81): **"Se necesita 4 días para realizar la configuración a Google"**. El icono se muestra sobre la duracion de la tarea.
- La base SQLite local queda sincronizada con **30 filas** para `feli`.
- La tarea **2. UAT con usuario funcional** queda en **88 horas / 11 dias**, termina el **5-Jun-2026** y sigue en curso aunque el **9-Jun-2026** no se trabaja en UAT.
- Las tareas pendientes se corren desde **Re mapeo ID SAP**, que ahora inicia el **16-Jun-2026** y termina el **22-Jun-2026**.
- El cronograma posterior queda asi: Ajustes finales **23-Jun al 24-Jun**, aprobacion y entrega **25-Jun**, salida a produccion **26-Jun**, seguimiento postproduccion **30-Jun al 6-Jul**.
- `GANTT_DATES` se extiende hasta **6-Jul-2026** para cubrir el seguimiento postproduccion de FELI.

## Actualizacion - Robotina pruebas y reporte (2026-07-22)

- **Pruebas unitarias** se extiende a **96 horas / 12 dias**, con dos jornadas adicionales el **23 y 24 de julio**.
- El cronograma posterior de ROBOTINA se desplaza dos dias: Pruebas UAT termina el **27-Jul**, aprobacion y entrega pasan al **28-Jul**, salida a produccion al **29-Jul** y soporte al **5-Aug**.
- Se registra una alerta el **22-Jul** en Pruebas unitarias: se requieren dos dias adicionales para ajustar reglas de flujo y SAP tras la sesion con el equipo operativo.
- El calendario compartido incluye **4-Aug-26** y **5-Aug-26** para representar el nuevo final de soporte.
- En **Actividades adicionales**, **Sesion API Robotina** queda en **8.5 h** para julio.
