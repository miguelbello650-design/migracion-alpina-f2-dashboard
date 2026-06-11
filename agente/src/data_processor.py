"""
Procesa y estructura las tareas del dashboard IPM.

- Las tareas ya vienen asociadas a un desarrollador vía bot→developer mapping
- Ordena por prioridad y agrupa
"""

from dataclasses import dataclass, field
from typing import Dict, List

from src.dashboard_client import Tarea
from src.logger import logger


# ────────────────────────────────────────────────
#  Modelo de salida
# ────────────────────────────────────────────────


@dataclass
class GrupoDesarrollador:
    nombre: str
    email: str
    bots: Dict[str, List[Tarea]] = field(default_factory=dict)  # bot_label → [tareas]
    tareas: List[Tarea] = field(default_factory=list)
    prioridad_mas_alta: str = "Baja"
    sobrecargado: bool = False


ORDEN_PRIORIDAD = {"Alta": 0, "Media": 1, "Baja": 2}


# ────────────────────────────────────────────────
#  Procesador
# ────────────────────────────────────────────────


class DataProcessor:
    """Agrupa y ordena las tareas por desarrollador y por bot."""

    UMBRAL_SOBRECARGA = 8

    def procesar(self, tareas: List[Tarea]) -> List[GrupoDesarrollador]:
        logger.info("Procesando %d tareas...", len(tareas))

        grupos: Dict[str, GrupoDesarrollador] = {}

        for tarea in tareas:
            nombre = tarea.desarrollador.strip()
            if nombre not in grupos:
                grupos[nombre] = GrupoDesarrollador(
                    nombre=nombre,
                    email=tarea.email,
                )
            grupo = grupos[nombre]

            # Agrupar por bot
            bot_label = tarea.bot
            if bot_label not in grupo.bots:
                grupo.bots[bot_label] = []
            grupo.bots[bot_label].append(tarea)
            grupo.tareas.append(tarea)

            # Prioridad más alta del grupo
            if ORDEN_PRIORIDAD.get(tarea.prioridad, 99) < ORDEN_PRIORIDAD.get(
                grupo.prioridad_mas_alta, 99
            ):
                grupo.prioridad_mas_alta = tarea.prioridad

        # Ordenar tareas dentro de cada grupo por prioridad y fecha
        for grupo in grupos.values():
            grupo.tareas.sort(
                key=lambda t: (
                    ORDEN_PRIORIDAD.get(t.prioridad, 99),
                    t.fecha_inicio or "",
                )
            )
            for bot_label in grupo.bots:
                grupo.bots[bot_label].sort(
                    key=lambda t: (
                        ORDEN_PRIORIDAD.get(t.prioridad, 99),
                        t.fecha_inicio or "",
                    )
                )
            grupo.sobrecargado = len(grupo.tareas) >= self.UMBRAL_SOBRECARGA

        resultado = list(grupos.values())
        for g in resultado:
            bots_str = ", ".join(f"{b}({len(ts)})" for b, ts in g.bots.items())
            logger.info("  %s (%s): %d tareas - %s", g.nombre, g.email, len(g.tareas), bots_str)

        return resultado
