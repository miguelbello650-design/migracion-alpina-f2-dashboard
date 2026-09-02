# Documentacion tecnica y funcional del Dashboard

## 1. Proposito

El Dashboard de Seguimiento Alpina centraliza cronogramas RPA, estados, responsables, avances, horas consumidas y soporte operativo.

Permite:

- Consultar NOVA, FELI, ROBOTINA y Migracion Google - BOT NOVA.
- Revisar el Gantt individual de cada proyecto.
- Diferenciar tareas finalizadas, en curso, planificadas, hitos y dias sin avance.
- Consultar horas por proyecto, bloque, mes y actividad adicional.
- Comparar horas contratadas, consumidas y restantes.
- Cargar un HTML de soporte y adaptar su informacion al Dashboard.
- Generar el reporte semanal para Outlook.
- Exportar el reporte de horas.
- Trabajar localmente con SQLite y publicar cambios estaticos en GitHub Pages.

## Estado vigente (2026-08-06)

- El Dashboard tiene cuatro pestanas principales: GENERALIDADES, RESUMEN, SEGUIMIENTO A DESARROLLO y SEGUIMIENTO A SOPORTE.
- SEGUIMIENTO A DESARROLLO conserva PROYECTOS, % AVANCE y REPORTE DE HORAS.
- GENERALIDADES y RESUMEN reutilizan las vistas del HTML de soporte sin mostrar sus pestanas internas como pestanas principales de soporte.
- El HTML de soporte se carga, valida y persiste desde localhost:3000; el archivo versionado en assets/support es el que se publica despues del commit y push.
- Las graficas y porcentajes tienen animaciones de entrada al cambiar de pestana o recargar, mantienen sus filtros independientes y se adaptan a pantallas pequenas.
- Los Gantt mantienen estados, festivos, alertas, hitos y tooltips responsive; las alertas cercanas al final se anclan hacia el interior para que su texto no se corte.
- Existen dos correos automatizados independientes: el reporte semanal RPA y el reporte de consumo de horas.

## 2. Navegacion y funcionalidades

### 2.1 Pestañas principales

La interfaz tiene GENERALIDADES, RESUMEN, SEGUIMIENTO A DESARROLLO y SEGUIMIENTO A SOPORTE.

SEGUIMIENTO A DESARROLLO contiene PROYECTOS, % AVANCE y REPORTE DE HORAS. La seleccion de pestaña se conserva en localStorage durante una recarga.

### 2.2 Generalidades y Resumen

GENERALIDADES muestra la vista Generalidades del HTML de soporte cuando existe. Esta vista se controla desde la pestana principal y no se repite como subpestana de soporte.

RESUMEN muestra:

- CONSUMO DE HORAS.
- Horas Contratadas vs Horas Restantes.
- Distribucion por bloque.
- Horas por mes.
- Horas de desarrollo por proyecto.
- Resumen de soporte proveniente del HTML cargado.

La subpestana Resumen del HTML se visualiza en esta pestana principal. El filtro de desarrollo inicia en Todos los meses al recargar y no modifica las graficas independientes de soporte ni las graficas de consumo.

### 2.3 Proyectos
### 2.3 Proyectos

Las tarjetas se agrupan en Finalizados, En proceso y Proximos. Muestran nombre, icono, responsable, estado y detalle. Al seleccionar el nombre de un proyecto con Gantt se abre su cronograma.

Las tarjetas tienen movimiento vertical, sombra y transicion suave al pasar el cursor.

### 2.4 Porcentaje de avance

Las tarjetas muestran porcentaje total, responsable, hito de salida a produccion, fases, porcentaje por fase, horas ejecutadas, horas en curso y horas totales.

Los porcentajes se animan desde 0 hasta el valor calculado al cargar la pagina o volver a la pestaña. Se respeta prefers-reduced-motion.

Una tarea con inProgress:true permanece en curso aunque su fecha ya haya pasado.

### 2.5 Reporte de horas

Muestra filtro mensual, distribucion por bloque, horas por mes, horas de desarrollo por proyecto, horas contratadas versus restantes, detalle de Desarrollo, Soporte, Actualizacion PDD y Actividades adicionales, y exportacion a Excel.

La constante actual de horas contratadas es 4320. La logica comun esta en reporte-horas.js y es reutilizada por la grafica y por el endpoint /api/data.

### 2.6 Gantt

El Gantt se construye con HTML, CSS y JavaScript nativo. Contiene fases, actividades, responsables, horas, dias, fechas, barras, hitos, notas, alertas y dias omitidos.

Colores: verde finalizada, azul en curso, amarillo hito o salida a produccion y gris dia sin avance o bloqueado.

Las alertas se ubican sobre la duracion. El calendario excluye fines de semana y festivos definidos en dateStrs. Las tareas finalizadas pueden detener el calendario en su ultima actividad.

## 3. Arquitectura

### 3.1 Frontend

El frontend es monolitico y no usa framework. index.html contiene la interfaz, CSS y JavaScript. No usa React, Svelte, Vue, bundler ni librerias externas de graficas. Usa SVG, CSS, Grid, Flexbox, media queries y APIs nativas del navegador.

Los logos estan en assets/logos y el video en assets/video.

### 3.2 Backend local

server.js es un servidor HTTP Node para localhost:3000. Sirve la pagina y assets permitidos, expone la API, sincroniza SQLite y guarda el HTML de soporte.

db.js encapsula SQLite, crea tablas, siembra datos iniciales y expone operaciones de lectura, reemplazo y actualizacion.

reporte-horas.js es un modulo reutilizable de calculo.

### 3.3 Persistencia

database.db contiene gantt_rows, static_monthly, proyectos, gantt_notes y configuracion auxiliar.

La base local no es una fuente publica compartida y esta excluida del repositorio junto con sus archivos WAL.

Al iniciar el servidor se crea la estructura y se siembran datos desde index.html cuando la base aun no esta inicializada. Luego el navegador puede cargar el estado desde /api/data.
## 4. Modelo de datos

### 4.1 Tarea de Gantt

Una fila de Gantt usa estos campos:

- phase: fase.
- task: actividad.
- resp: responsable.
- hours y days: esfuerzo.
- fixedIdx y fixedEndIdx: indices de inicio y fin en GANTT_DATES.
- skipIndices: fechas que no cuentan.
- notesIdx: fechas con alerta.
- milestone: hito.
- inProgress: estado en curso.

La jornada definida es de 8 horas. Por eso 16 dias equivalen a 128 horas y 200 horas equivalen a 25 dias laborales.

### 4.2 Horas mensuales

STATIC_MONTHLY almacena valores que no siempre se derivan directamente de una fila de Gantt:

- Soporte.
- Actualizacion PDD.
- Actividades adicionales.
- Horas fijas o historicas.
- Proyectos finalizados con valores bloqueados.

### 4.3 Proyectos

Un proyecto puede tener key, name, icon, responsable, color, status, progress, hours, desc, startDate y endDate.

Los proyectos estaticos y las filas de Gantt se combinan al renderizar las tarjetas.

## 5. API local

URL base: http://127.0.0.1:3000

### GET /api/data

Devuelve ganttRows, staticMonthly, proyectos, ganttNotes, ganttDates y reporteHoras.

reporteHoras usa la misma funcion de calculo de la grafica y contiene contratadas, consumidas, restantes, porcentaje, desarrollo y soporte.

### GET /api/dates

Devuelve las fechas actuales del calendario.

### GET /api/data/gantt/:bot

Devuelve filas de nova, feli, robotina o googlenova.

### POST /api/sync/gantt

Reemplaza las filas de Gantt recibidas.

### POST /api/sync/static

Reemplaza horas mensuales estaticas.

### POST /api/sync

Sincroniza Gantt y horas mensuales en una sola llamada.

### POST /api/support-html

Guarda el HTML recibido en assets/support/dashboard_alpina_2.html. Acepta hasta 1 MB y valida que exista una etiqueta html.

Estas rutas POST son locales y no tienen autenticacion propia; no deben exponerse a Internet.



En GitHub Pages no existe server.js ni esta API; el ambiente publico consume los archivos estaticos versionados. /api/support-html, /api/sync/gantt, /api/sync/static y /api/sync son rutas locales de administracion.
## 6. HTML de soporte

El HTML de soporte es una fuente externa de informacion operativa que conserva una estructura de datos compatible, principalmente MESES y DATA. Los registros pueden incluir nombre, fecha, estado, descripcion, horas y observaciones; tambien puede incluir vistas Generalidades, Bots 2NV y Proyecto Makro.

Al cargarlo en localhost:3000, el Dashboard:

1. Valida que exista una etiqueta html y que se puedan leer las estructuras de datos esperadas.
2. Guarda el contenido en assets/support/dashboard_alpina_2.html mediante POST /api/support-html.
3. Conserva una copia de conveniencia en localStorage para la sesion local.
4. Renderiza el contenido dentro de un iframe con sandbox y fondo transparente.
5. Fuerza el tema claro y oculta header, navegacion y footer originales para mantener el look and feel del Dashboard.
6. Mantiene las subpestanas del Dashboard y envia postMessage al iframe para abrir la vista solicitada.
7. Calcula las horas de la pestana seleccionada y sincroniza el valor del mes con STATIC_MONTHLY.soporte.
8. Reutiliza el HTML para GENERALIDADES y para la vista Resumen de la pestana principal.

Las subpestanas de SEGUIMIENTO A SOPORTE son los meses disponibles, Bots 2NV y Proyecto Makro. La vista Resumen del HTML se muestra en RESUMEN y Generalidades se muestra en la pestana principal GENERALIDADES.

Los botones Cargar HTML y Restablecer solo se muestran y funcionan en localhost:3000. En el ambiente publico se ocultan y el visitante solo consume el archivo versionado que se publico.

### Estructura y restricciones

- El payload tiene un limite de 1 MB.
- El HTML debe ser confiable y conservar las variables esperadas.
- El contenido se escapa cuando se genera HTML nativo del Dashboard.
- El iframe se ejecuta con sandbox y comunica horas mediante postMessage.
- La carga local no publica por si sola: requiere validar, versionar el archivo, hacer commit y hacer push a main.
## 7. Calculo de horas

El flujo comun es:

1. Convertir fechas.
2. Identificar meses.
3. Distribuir horas por dias efectivos.
4. Excluir skipIndices.
5. Separar ejecutadas y en curso.
6. Aplicar valores estaticos.
7. Sumar Desarrollo, Soporte, Actualizacion PDD y Actividades adicionales.
8. Calcular consumidas.
9. Calcular restantes.
10. Calcular porcentaje.

Reglas:

- inProgress evita que una tarea pasada se marque automaticamente como completada.
- Los valores bloqueados prevalecen cuando existen.
- La presentacion usa una decimal.
- La jornada es de 8 horas por dia.
- Horas contratadas es 4320.

## 8. Correos automatizados

El proyecto maneja dos correos independientes. Ambos pueden ejecutarse semanalmente desde tareas del PC, Outlook o el agente, pero tienen fuentes, asuntos y objetivos diferentes.

### 8.1 Reporte de consumo de horas

- Script: agente/reporte_horas.py.
- Fuente: GET del `public-state.json` publicado en GitHub Pages, con parámetro de cache para obtener la versión más reciente.
- Usa directamente reporteHoras, que contiene contratadas, consumidas, restantes, porcentaje, desarrollo y soporte.
- Valida que desarrollo + soporte coincida con consumidas; no recalcula esos valores con una logica paralela.
- Genera logos 2NV y Alpina, barra de consumo, KPIs de Desarrollo y Soporte, mensaje de umbral y cierre del correo.
- Si el consumo llega al 80 por ciento, genera el asunto y mensaje de alerta; si no, genera el reporte informativo.
- Escribe agente/asunto_horas.txt, agente/reporte_horas.html y agente/reporte_horas.log.
- El script prepara el asunto y el cuerpo; la entrega depende del flujo de Outlook configurado en el entorno.

### 8.2 Reporte semanal RPA

- Script Node: generar-correo-semanal.js.
- Fuente: Gantt del Dashboard y su calendario vigente.
- Los generadores Python consultan `http://127.0.0.1:3000/api/data` en cada ejecución, con cache deshabilitada, y regeneran el HTML antes de preparar el correo.
- Calcula la semana laboral, filtra actividades por fecha, agrupa por desarrollador y bot, y genera el asunto con el rango de lunes a viernes.
- El cuerpo HTML incluye logos, bloques por desarrollador, bot, tareas, fechas, estados En curso, Planificado o Hito, y el texto de seguimiento.
- Las tareas adicionales se resumen cuando exceden el limite visible de cada bloque.
- El agente Python equivalente usa dashboard_client.py, data_processor.py, email_generator.py, outlook_client.py y scheduler.py.

### 8.3 Outlook, scheduler y firma

- outlook_client.py soporta Microsoft Graph, SMTP Office 365 y Dry Run.
- email_generator.py usa una plantilla HTML si existe y un fallback HTML si no existe.
- scheduler.py configura el dia, hora, minuto y zona horaria desde agente/config/config.yaml y revisa trabajos pendientes cada 30 segundos.
- Las tareas programadas de Windows, Power Automate y el scheduler Python son capas independientes; se debe definir un unico responsable del envio para evitar duplicados o diferencias de horario.
- La plantilla agrega el cierre Quedo atento a los comentarios; la firma nativa depende de la configuracion de Outlook.
- Las credenciales de Graph o SMTP se cargan por variables de entorno y nunca se versionan.
## 9. Persistencia y sincronizacion

Al iniciar server.js:

1. Se abre database.db.
2. Se crean tablas si no existen.
3. Se siembran datos desde index.html en la primera ejecucion.
4. El navegador consulta /api/data.
5. El estado SQLite puede reemplazar los arreglos iniciales del HTML.

Los comandos administrativos pueden cambiar fechas, estados, horas, alertas, dias omitidos y horas estaticas. El estado se guarda en localStorage y SQLite.

La fuente publicable debe conservar los cambios en archivos versionados. No depender unicamente de localStorage o database.db.
## 10. Respaldos

Ejecutar:

    node backup-database.js

El script copia database.db con la API de backup de SQLite, guarda el archivo en backups, usa timestamp y elimina respaldos con mas de 30 dias.

Hacer respaldo antes de cambios masivos o sincronizaciones de datos.

## 11. Seguridad y limitaciones

Medidas actuales:

- Secretos por variables de entorno.
- Limite de 1 MB para HTML recibido.
- Escape de valores del soporte.
- iframe sandbox.
- Servidor local atado a 127.0.0.1.
- Restriccion de rutas servidas.
- Respaldos con retencion.

Limitaciones:

- Los POST locales no tienen autenticacion.
- La contrasena administrativa local usa localStorage y no reemplaza un sistema de identidad.
- GitHub Pages es estatico y no ejecuta server.js.
- SQLite y localStorage no se comparten entre ambientes.
- El HTML de soporte debe ser confiable.
- Los cambios solo guardados en SQLite no se publican automaticamente.
- El scheduler depende de la zona horaria y del proceso que lo mantenga activo.

## 12. Local versus publico

### Local

- http://localhost:3000
- Ejecuta server.js.
- Usa SQLite.
- Permite cargar y restablecer HTML.
- Permite sincronizar datos.
- Puede ejecutar el agente y probar el API.

### Publico

- GitHub Pages desde main.
- Sirve archivos estaticos.
- No ejecuta Node ni SQLite.
- No comparte localStorage con el ambiente local.
- Requiere commit y push de archivos versionados.
- Puede necesitar recarga sin cache despues de un despliegue.

Para publicar un HTML de soporte:

1. Cargarlo localmente.
2. Validar vista, datos y horas.
3. Confirmar cambio en assets/support/dashboard_alpina_2.html.
4. Confirmar que los datos necesarios estan en archivos versionados.
5. Hacer commit.
6. Hacer push a main.
7. Esperar GitHub Pages.
8. Validar la URL publica.

## 13. Ejecucion

Requisitos:

- Node.js.
- better-sqlite3.
- Python 3.12 o compatible para el agente.
- Dependencias de agente/requirements.txt.

Instalar Node:

    npm install

Levantar servidor:

    node server.js

o:

    .\start.ps1

Abrir:

    http://localhost:3000

API:

    http://127.0.0.1:3000/api/data

Pruebas Python:

    cd agente
    python -m pytest

## 14. Archivos principales

| Archivo | Responsabilidad |
|---|---|
| index.html | Interfaz completa, datos iniciales, Gantt, graficas y logica del navegador |
| reporte-horas.js | Calculo compartido de consumo |
| server.js | Servidor local y API |
| db.js | Persistencia y sincronizacion SQLite |
| database.db | Estado local de ejecucion |
| backup-database.js | Respaldos |
| generar-correo-semanal.js | Correo semanal Node |
| agente/src/dashboard_client.py | Cliente Python del API |
| agente/src/data_processor.py | Agrupacion de tareas |
| agente/src/email_generator.py | Generacion del correo |
| agente/src/outlook_client.py | Graph API, SMTP y Dry Run |
| agente/src/scheduler.py | Programacion semanal |
| agente/config/config.yaml | Configuracion del agente |
| assets/support/dashboard_alpina_2.html | HTML de soporte publicado |
| assets/logos | Logos |
| assets/video | Video de fondo |
| DOCUMENTACION.md | Historial cronologico |
| DOCUMENTACION_DASHBOARD.md | Documento funcional y tecnico maestro |

## 15. Convenciones de mantenimiento

- Trabajar primero en local.
- No hacer push a main sin solicitud explicita.
- Mantener la misma funcion de calculo para UI y API.
- Revisar indices de fechas despues de mover tareas.
- Mantener inProgress cuando el dia aun no termina.
- No contar festivos como trabajo.
- Guardar archivos en UTF-8.
- No versionar secretos, logs, bases locales ni archivos generados.
- Ejecutar git diff --check antes del commit.
- Validar local, API, graficas y correo antes de publicar.

## 16. Checklist previo a publicar

- [ ] localhost:3000 carga.
- [ ] La vista modificada abre.
- [ ] Gantt, fechas, horas y estados son correctos.
- [ ] Tareas en curso aparecen azules.
- [ ] Tareas terminadas aparecen verdes.
- [ ] Festivos no cuentan.
- [ ] Porcentajes y animaciones funcionan.
- [ ] El filtro inicia en Todos los meses.
- [ ] Horas contratadas coincide con distribucion por bloque.
- [ ] /api/data entrega reporteHoras.
- [ ] HTML de soporte carga en local.
- [ ] Las horas de soporte se reflejan.
- [ ] El correo genera asunto y cuerpo.
- [ ] No hay secretos ni archivos generados en el commit.
- [ ] git diff --check no reporta errores.
- [ ] Se reviso el commit antes del push.

## 17. Flujo operativo

1. Recibir el cambio solicitado.
2. Actualizar el ambiente local.
3. Verificar visual y funcionalmente.
4. Actualizar DOCUMENTACION.md con el historial.
5. Actualizar este documento solo si cambia la arquitectura o una funcionalidad transversal.
6. Esperar solicitud explicita de push.
7. Publicar en main.
8. Validar el ambiente publico.


## Actualización reciente (2026-09-02)

- Robotina: Pruebas UAT se extendió hasta el 2 de septiembre de 2026, con 14 días y 103.3 horas.
- Las actividades posteriores se desplazan un día conservando alertas, estados y datos históricos.
- Se actualizó la alerta de UAT para indicar una extensión de 8 días.
