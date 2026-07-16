# Especificación frontend: Dashboard Alpina

Estado: **Implementado visualmente en `codex/frontend-dashboard-2nv`**  
Referencia visual: [2NV](https://2nv.co/)

## Objetivo

Actualizar la presentación del dashboard para que tenga una vista organizada como un framework moderno, sin agregar React, Svelte ni nuevas dependencias. La implementación usará componentes nativos de HTML, CSS y JavaScript, manteniendo intactos los datos, cálculos, Gantt, API y automatizaciones existentes.

## Alcance aprobado para implementación

- Reorganizar la UI en componentes visuales nativos:
  - `AppShell`: encabezado, navegación y contenido.
  - `Topbar`: logos, proyecto activo, fecha y estado.
  - `Tabs`: navegación entre Proyectos, Avance y Reporte de horas.
  - `ProjectCard`: resumen de proyecto y acceso a detalle.
  - `MetricCard`: horas, avance y estados.
  - `ChartPanel`: gráficos existentes.
  - `GanttPanel`: cronograma existente.
  - `StatusBadge`, `ProgressBar`, `AlertBanner` y `Modal`.
- Mantener las funciones de render actuales y cambiar únicamente su estructura visual cuando sea necesario.
- Usar clases CSS consistentes en lugar de estilos inline nuevos.
- No agregar compilador, bundler, librería de componentes, icon pack ni framework.

## Dirección visual basada en 2NV

La referencia se usa como lenguaje visual, no como copia de código o contenido:

- Fondo base oscuro para la navegación y superficies claras para el área operativa.
- Azul 2NV como color institucional y azul/cian como acentos de acción y avance.
- Tipografía sans-serif limpia, títulos de alto contraste y textos secundarios discretos.
- Encabezados con jerarquía editorial y espacios amplios.
- Métricas grandes y legibles para lectura rápida.
- Tarjetas sobrias, con borde fino, sombra ligera y radio máximo de `8px`.
- Estados visuales consistentes: verde finalizado, azul en curso, amarillo próximo, rojo alerta.
- Animaciones cortas solo para hover, expansión y actualización de barras; sin efectos decorativos que distraigan del seguimiento operativo.

## Tokens CSS propuestos

```css
:root {
  --navy-950: #07111f;
  --navy-900: #0d1b2a;
  --blue-700: #1e3a5f;
  --blue-600: #2563eb;
  --cyan-500: #0891b2;
  --surface: #ffffff;
  --surface-muted: #f4f7fb;
  --line: #d7e0ea;
  --text: #122033;
  --text-muted: #64748b;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --radius: 8px;
  --shadow: 0 4px 16px rgba(7, 17, 31, .08);
}
```

Los colores existentes por proyecto se conservan para no cambiar el significado operativo de Nova, Feli, Robotina y Migración Google - BOT NOVA.

### Paleta verificada en 2NV

La implementación usa los tokens computados de `2nv.co` y no una paleta estimada:

| Uso | Valor |
| --- | --- |
| Base oscura y texto principal | `#0F172A` |
| Indigo principal | `#4F46E5` |
| Indigo secundario | `#6366F1` |
| Violeta | `#7C3AED` |
| Cian | `#06B6D4` |
| Sky | `#0EA5E9` |
| Superficie de pagina | `#F8FAFF` |
| Superficie de enfasis | `#EEF2FF` |
| Texto secundario | `#64748B` |
| Borde | `rgba(148,163,184,0.18)` |
| Exito / advertencia / alerta | `#10B981` / `#F59E0B` / `#F43F5E` |

La cabecera replica el tratamiento real de navegacion de 2NV: una superficie clara
translucida (`rgba(255,255,255,.55)` como referencia) con texto `#0F172A`. Los
logos se mantienen en una capsula oscura compacta para conservar su legibilidad
sin convertir toda la cabecera en una franja oscura.

## Estructura de pantalla

```text
AppShell
├── Topbar
│   ├── Logos 2NV + Alpina
│   ├── Proyecto / fase
│   └── Fecha + estado
├── PageHeader
│   ├── Título de vista
│   └── Contexto corto
├── Tabs
└── TabContent
    ├── Proyectos Alpina
    │   ├── Section: Finalizados / En proceso / Próximos
    │   └── ProjectCard grid
    ├── % Avance
    │   ├── ProjectCard grid
    │   └── GanttPanel bajo demanda
    └── Reporte de horas
        ├── ChartPanel: Distribución por bloque
        ├── ChartPanel: Horas por mes
        ├── MetricCard: Contratadas vs restantes
        └── tablas / bloques de detalle
```

## Responsive

- Escritorio: contenido centrado con ancho máximo de `1440px`; tarjetas en grid de 2 o 3 columnas según espacio.
- Tableta: grid de 2 columnas y navegación con desplazamiento horizontal controlado.
- Móvil: una columna; encabezado compacto; tablas y Gantt con scroll horizontal; botones con área táctil mínima de `44px`.
- No usar `font-size` escalado con viewport. La tipografía tendrá tamaños definidos por breakpoint.
- El texto largo debe envolver sin romper tarjetas, botones ni columnas.

## Interacción

- Las pestañas mantienen su estado actual y solo una vista queda activa.
- Las tarjetas de proyecto muestran el detalle mediante expansión o modal, según el flujo ya existente.
- Las tarjetas de avance abren el Gantt correspondiente sin duplicar datos.
- Las barras, alertas, festivos y estados del Gantt conservan su comportamiento y colores actuales.
- Tooltips solo para iconos o alertas cuyo significado no sea evidente.
- `prefers-reduced-motion` desactiva transiciones no esenciales.

## Accesibilidad

- Usar botones reales para pestañas, expansión, cierre y navegación.
- Mantener `aria-selected`, `aria-controls` y foco visible en tabs y controles.
- Todos los logos e imágenes tendrán `alt` descriptivo.
- No depender únicamente del color para comunicar estado: usar texto o icono.
- Contraste mínimo WCAG AA para textos y controles.

## Restricciones técnicas

- No modificar la lógica de negocio ni recalcular horas en la capa visual.
- Reutilizar `PROYECTOS`, `GANTT_ROWS*`, `renderReporte`, `renderProyectos`, `renderGantt*` y los datos entregados por `/api/data`.
- Mantener `/api/data` y todos sus campos actuales.
- Mantener la compatibilidad con el servidor local `http://127.0.0.1:3000`.
- No modificar `main` durante la implementación.

## Plan de implementación

1. Crear rama nueva desde `main`, con nombre `codex/frontend-dashboard-2nv`.
2. Extraer tokens y estilos compartidos dentro de `index.html`, sin dependencias.
3. Ajustar `Topbar`, tabs, grids, tarjetas, reporte y Gantt por bloques pequeños.
4. Validar navegación, estados, datos del reporte, Gantt y `/api/data`.
5. Revisar escritorio y móvil en el ambiente local.
6. Entregar la rama para revisión. No hacer merge ni push a `main` sin solicitud explícita.

## Criterios de aceptación

- El dashboard conserva todos los datos y acciones actuales.
- La vista se percibe coherente con la identidad visual de 2NV: oscura en navegación, azul/cian institucional, tipografía clara, métricas visibles y tarjetas sobrias.
- No se agregan dependencias a `package.json` ni cambios a `package-lock.json`.
- No hay regresiones en Proyectos Alpina, % Avance, Reporte de horas, Gantt ni `/api/data`.
- La interfaz funciona en escritorio y móvil sin solapamientos ni texto cortado.
- La implementación queda únicamente en la rama nueva.

## Fuera de alcance

- Reescribir el dashboard en React o Svelte.
- Crear un pipeline de build o migrar a TypeScript.
- Cambiar la base de datos, los cálculos de horas o el contrato de la API.
- Copiar HTML, CSS, imágenes o contenido propietario de `2nv.co`.
- Publicar, hacer merge o tocar directamente `main`.

## Resultado de la primera implementacion

- Se aplico una capa visual nativa en `index.html`: encabezado institucional oscuro, navegacion clara, tarjetas y paneles con bordes sobrios, contenedor de ancho controlado y comportamiento responsive.
- Se conservaron los renderizados actuales, los datos del Gantt, los calculos del reporte, el endpoint `/api/data` y las dependencias existentes.
- Las tabs principales ahora exponen roles y estados ARIA para que su estado activo tambien sea accesible.
- Validado en `http://127.0.0.1:3000` para escritorio y movil. La implementacion no se ha publicado ni mezclado con `main`.
