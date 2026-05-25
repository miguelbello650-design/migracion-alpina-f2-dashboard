# Dashboard Migración Alpina F2 - RPA

## Descripción
Dashboard web para tracking de proyectos RPA (NOVA, FELI, ROBOTINA) con tres vistas:
- **% AVANCE** — Progreso por fase y total por bot
- **GANTT NOVA / FELI / ROBOTINA** — Diagramas Gantt con barras, notas y columnas especiales

## Stack
- **Lenguaje**: HTML + CSS + JavaScript (vanilla, un solo archivo `index.html`)
- **Hosting**: GitHub Pages (`https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard`)
- **Sincronización**: Windows Task Scheduler (script `sync-github.ps1`, diario 8:00 AM)

## Estructura del Proyecto

```
C:\Users\2NV\Desktop\Prueba de IPM\
├── index.html              # Dashboard completo (único archivo)
├── server.js               # Servidor local Node.js (persistencia bidireccional)
├── start.ps1               # Atajo para iniciar el servidor
├── state.json              # Estado persistente (se genera automáticamente)
├── .gitignore              # Ignora state.json
├── GANTT NOVA.csv          # Datos fuente NOVA (not usado directamente)
├── GANTT FELI.csv          # Datos fuente FELI (notas extraídas manualmente)
├── GANTT ROBOTINA.csv      # Datos fuente ROBOTINA (notas extraídas manualmente)
├── % De Avance.csv         # Porcentajes de avance (referencia)
├── proyectos.json          # Datos auxiliares
├── sync-github.ps1         # Script de sincronización automática
├── sync-log.txt            # Log de sincronización
└── DOCUMENTACION.md        # Este archivo
```

## Datos Compartidos

### GANTT_DATES
Array de fechas (índice 0-87, 88 fechas total) compartido por los 3 Gantts:

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
  - Si `todayIdx === endIdx` (tarea en curso que finaliza hoy), se descuenta 1 día completado para no dar 100% prematuro

### Cálculo por Fase
- Promedio simple de los % de todas las tareas en esa fase (redondeado con `Math.round`)

### Cálculo Total
- Promedio simple de los % de todas las fases (truncado con `Math.floor` para no mostrar 100% anticipadamente)

### Horas (por Bot, en tarjeta de % Avance)
- **Ejecutadas**: horas completas de tareas finalizadas (`GANTT_DATES[end] <= today && !inProgress`)
- **En Curso**: horas prorrateadas de tareas en progreso (`hours * (completed / effectiveDays)` redondeado con `Math.round`)
- **Total**: suma de Ejecutadas + En Curso
- **NOVA**: se resta 1h al subtotal "En Curso" como ajuste manual para que coincida con el cierre esperado del cliente (482h en vez de 483h)

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
cellClass(d, isToday, grayDays)  // CSS class para celda
cellBg(d, isToday, isWeekend, grayDays)  // Color de fondo para celda
```

### Tarjetas (% Avance)
Cada tarjeta renderiza:
1. **Fases** con barra de progreso (porcentaje individual)
2. **Footer línea 1**: Ejecutadas N h | En Curso N h | Total N h
3. **Footer línea 2**: Fases N | % Total de Avance N%
4. **Sección 🔄 En Curso**: lista de tareas en progreso (nombre + badge)

## Persistencia

### Pestaña activa
Se guarda en `localStorage('activeTab')` al hacer click en una pestaña.
Se restaura al cargar la página.

### Día actual
Usa `new Date()` en cada carga. No hay fechas fijas.

## Admin Chat

Panel protegido con contraseña para modificar tareas desde el navegador.

### Acceso
- Click en **⚙** (esquina superior derecha del dashboard)
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

## Servidor Local (Node.js)

Para que los cambios del admin chat persistan en disco y se reflejen en GitHub:

### Inicio
```powershell
# Doble click en start.ps1, o:
C:\nodejs\node-v22.9.0-win-x64\node.exe server.js
```
Luego abrir: `http://localhost:3000`

### Qué hace
- Sirve `index.html` con el estado más reciente
- `GET /api/state` → devuelve las tareas actuales
- `POST /api/sync` → recibe cambios, escribe `index.html` y `state.json`, hace `git push`
- Cuando se abre `localhost:3000`, `IS_SERVER=true` activa:
  - `loadServerState()`: carga desde el servidor al iniciar (sin usar localStorage)
  - `saveState()`: además de localStorage, hace POST a `/api/sync`

### Flujo de trabajo
1. Abrir `http://localhost:3000`
2. Usar admin chat (⚙) para modificar fechas/estados
3. Los cambios se guardan **automáticamente** en disco + GitHub (no necesita `/save` manual)
4. Recargar la página → los cambios persisten
5. La versión pública en GitHub Pages se actualiza con cada push automático

> **Nota**: `state.json` se genera automáticamente y está en `.gitignore` para no subirse a GitHub.  
> Si existe un `state.json` corrupto o con datos viejos, simplemente borrarlo y reiniciar el servidor.

### Archivos
| Archivo | Descripción |
|---------|-------------|
| `server.js` | Servidor Node.js (puerto 3000) |
| `state.json` | Estado persistente (se crea automáticamente, ignorado por git) |
| `start.ps1` | Atajo para iniciar el servidor |
| `.gitignore` | Ignora `state.json` para no contaminar el repo |

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

### NOVA (GANTT_ROWS)
- 39 tareas en 12 fases
- Fases: Levantamiento, Estructura Base, Gestión Outlook, Gestión documental, SAP VA01, SAP ZSD, SAP VA02, SAP VF01, Grabación+Consolidado, Reporte ejecución, Cierre
- **En Curso**: Estabilización (40h), Aprobación documentación (2h) → 18h total (ajuste -1h)
- **Total ejecutadas + en curso**: 482h

### FELI (GANTT_ROWS_FELI)
- 29 tareas en 5 fases
- Fases: Estructura Base, FELI, Pruebas, Documentación, Producción
- **En Curso**: UAT usuario funcional (40h, 11-13 may + 25-26 may), Documentación técnica (14h), Documentación funcional (20h) → 74h total

### ROBOTINA (GANTT_ROWS_ROBOTINA)
- 38 tareas en 3 fases
- Fases: Estructura Base | Core/Framework (22 tareas), Gestión Usuarios | Active Directory (9 tareas), Cierre (7 tareas)
- Milestone: Salida a Producción 🚩 (índice 82 = 10-Jun-26)
- Hitos de notas: índices 25, 26, 31, 50, 60, 61, 64, 71
- **En Curso**: Pruebas unitarias (56h), Elaboración documentación SDD (18h) → 74h total

## Convenciones de Código
- Sin comentarios en JS
- Sin punto y coma en JS
- Template literals para HTML strings
- Funciones flecha para callbacks
- Variables globales para datos compartidos (GANTT_DATES, etc.)

## URLs
- **Dashboard**: https://miguelbello650-design.github.io/migracion-alpina-f2-dashboard
- **Repositorio**: https://github.com/miguelbello650-design/migracion-alpina-f2-dashboard
