# Snapshot Engram + Codebase Memory

## Identificación

- Proyecto: `migracion-alpina-f2-dashboard`
- Ruta original: `C:\Users\2NV\Desktop\Prueba de IPM`
- Rama indexada: `main`
- HEAD registrado al indexar: `204f85e9a03a3bd448ded31728f948d6c9ed0f49`
- Fecha de snapshot: `2026-08-05`
- Alcance Engram: `scope=project`, filtrado por `migracion-alpina-f2-dashboard`

## Índice Codebase Memory

- Modo: `full`
- Persistencia: activada
- Nodos: `536`
- Relaciones: `1.677`
- Archivos: `41`
- Archivos Python: `20`
- Archivos JavaScript: `5`
- Archivos HTML: `3`
- Archivos YAML: `1`
- Directorios excluidos: `.git`, `backups`, `node_modules`, `output` y cachés Python
- Artefacto original: `.codebase-memory/graph.db.zst`

### Arquitectura detectada

- Frontend monolítico: `index.html`
- Servidor y API local: `server.js`
- Persistencia SQLite: `db.js`
- Cálculo compartido de horas: `reporte-horas.js`
- Generación del correo semanal: `generar-correo-semanal.js`
- Automatización Python: `agente/src`
- Respaldo: `backup-database.js`
- Endpoint principal: `GET http://127.0.0.1:3000/api/data`
- Entry points: `agente.src.main.main` y `backup-database.main`
- Función central de reporte: `calculateReporteHoras`
- Orquestador de correo: `ejecutar_ciclo_completo`

## Memorias Engram filtradas

Las memorias completas permanecen en Engram. Esta copia conserva los registros más relevantes para reconstruir el contexto del proyecto.

### Arquitectura, datos y soporte HTML

- `#684` — Mapa codebase-memory del Dashboard Alpina.
- `#685` — Resumen de sesión de indexación y persistencia.
- `#122` — Seguimiento a Soporte con carga HTML independiente.
- `#123` — Integración del HTML adjunto como vista de Soporte.
- `#136` — Sincronización del contenido completo del HTML cargado.
- `#145` — Resumen de soporte en la pestaña principal.
- `#273` — Sincronización de horas de soporte desde el HTML.
- `#274` — Vinculación de las horas del HTML con la tarjeta Soporte.
- `#278` — Sincronización automática de soporte y Gantt.
- `#470` — Publicación del HTML de soporte en `main`.
- `#471` — Verificación de despliegue en GitHub Pages.
- `#508` — Pestaña principal Generalidades alimentada por el HTML.

### Reportes, horas y correos

- `#203` — Desglose de Desarrollo y Soporte en el correo automático.
- `#205` — Publicación del desglose manteniendo igualdad con `reporteHoras.consumidas`.
- `#208` — Inclusión de logos 2NV y Alpina en el correo de consumo.
- `#213` — Publicación de logos en los generadores de correo.
- `#274` — Horas de soporte provenientes del HTML cargado.

### Seguimiento visual y navegación

- `#35` — Animación progresiva de porcentajes en tarjetas.
- `#39` — Animación de la dona Horas de Desarrollo por Proyecto.
- `#40` — Animación unitaria de la dona respetando el anillo completo.
- `#41` — Corrección de la revelación de la dona mediante máscara SVG.
- `#165` — Movimiento de Horas de Desarrollo por Proyecto a Resumen.
- `#169` — Restitución del título DESARROLLO.
- `#171` — Gráfica independiente Ritmo de Desarrollo.
- `#199` — Nota para abrir el cronograma desde el nombre del proyecto.
- `#259` — Renombre de La Monita a Requisiciones Internas - La Monita.

### Seguridad, documentación y operación

- `#234` — Base de seguridad y respaldos locales.
- `#236` — Seguridad y respaldos publicados.
- `#243` — Documentación operativa publicada.
- `#676` — Documentación maestra del Dashboard.
- `#678` — Documento Word independiente para presentación.
- `#679` — Resumen de sesión de documentación.

### Estado de Engram al generar la copia

El diagnóstico de Engram reportó 3 comprobaciones correctas y 1 bloqueo: existen 40 mutaciones pendientes de sincronización cloud con observaciones antiguas sin campo `title`. No se repararon porque el diagnóstico indica que requiere revisión explícita antes de cualquier modificación.

## Restauración de esta copia

1. Copiar `codebase-memory-graph.db.zst` a `.codebase-memory/graph.db.zst` dentro del repositorio.
2. Mantener este archivo como referencia portable del contexto filtrado.
3. Para consultar el contenido completo de una memoria, buscar su ID en Engram, por ejemplo `#684`.

> Esta copia no reemplaza el almacén sincronizado de Engram; es una exportación de contexto filtrada y portable junto con el índice del código.
