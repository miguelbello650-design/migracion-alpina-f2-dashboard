"""
Cliente para consultar el dashboard de planificación (Prueba de IPM).

Obtiene datos de:
  - GET /api/data  → ganttRows, proyectos, ganttDates
  - GET /api/dates → fechas del Gantt
"""

from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from config.settings import settings
from src.logger import logger


MESES = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}


# ────────────────────────────────────────────────
#  Modelos de datos
# ────────────────────────────────────────────────


@dataclass
class Tarea:
    id: str
    desarrollador: str
    email: str
    bot: str
    titulo: str
    fase: str = ""
    prioridad: str = "Media"
    fecha_estimada: str = ""
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: str = "Planificado"
    horas: float = 0
    milestone: bool = False
    en_curso: bool = False

    @property
    def descripcion_completa(self) -> str:
        parts = []
        if self.fase:
            parts.append(f"[{self.fase}]")
        parts.append(self.titulo)
        if self.horas:
            parts.append(f"({self.horas}h)")
        return " ".join(parts)


# ────────────────────────────────────────────────
#  Estrategias de obtención de datos
# ────────────────────────────────────────────────


class DashboardStrategy(ABC):
    @abstractmethod
    def fetch(self) -> Dict[str, Any]:
        ...


class ApiDashboardStrategy(DashboardStrategy):
    """Obtiene datos del dashboard vía API REST."""

    def fetch(self) -> Dict[str, Any]:
        logger.info("Consultando dashboard: %s", settings.dashboard_url)
        headers = {}
        if settings.dashboard_api_key:
            headers["Authorization"] = f"Bearer {settings.dashboard_api_key}"
        resp = httpx.get(
            settings.dashboard_url,
            headers=headers,
            timeout=settings.dashboard_timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        logger.info(
            "Dashboard respondió: %d bots, %d proyectos, %d fechas",
            len(data.get("ganttRows", {})),
            len(data.get("proyectos", [])),
            len(data.get("ganttDates", [])),
        )
        return data


# ────────────────────────────────────────────────
#  Fachada principal
# ────────────────────────────────────────────────


class DashboardClient:
    """Punto de entrada unificado para el dashboard de IPM."""

    def __init__(self):
        self._strategy = ApiDashboardStrategy()
        self._raw_data: Optional[Dict] = None
        self._dates: List[datetime] = []

    def obtener_tareas_semana(self, fecha_ref: Optional[datetime] = None) -> List[Tarea]:
        """
        Obtiene tareas del Gantt que caen dentro de la semana de `fecha_ref`.
        """
        fecha_ref = fecha_ref or datetime.now()
        week_start = self._inicio_semana(fecha_ref)
        week_end = week_start + timedelta(days=4)

        logger.info(
            "Filtrando tareas para semana: %s al %s",
            week_start.strftime("%d/%m"),
            week_end.strftime("%d/%m"),
        )

        self._raw_data = self._strategy.fetch()
        self._parse_dates(self._raw_data.get("ganttDates", []))

        tareas = []
        gantt_rows = self._raw_data.get("ganttRows", {})

        for bot_key, rows in gantt_rows.items():
            bot_cfg = settings.bot_config(bot_key)
            if not bot_cfg:
                logger.warning("Bot '%s' no configurado, saltando", bot_key)
                continue

            for idx, row in enumerate(rows):
                if not row.get("task"):
                    continue

                tarea = self._row_to_tarea(row, bot_key, bot_cfg, idx)

                # Verificar si cae en la semana actual
                if self._en_semana(tarea, week_start, week_end):
                    tareas.append(tarea)

        # También extraer tareas de proyectos (si tienen responsables)
        proyectos = self._raw_data.get("proyectos", [])
        for proy in proyectos:
            responsable = proy.get("responsable", "")
            sd = proy.get("staticData", {})
            if responsable and sd.get("status") == "en_proceso":
                tareas.append(Tarea(
                    id=f"proy_{proy.get('key', '')}",
                    desarrollador=responsable,
                    email=self._email_por_responsable(responsable),
                    bot=proy.get("name", proy.get("key", "")),
                    titulo=sd.get("desc", proy.get("name", "")),
                    prioridad="Media",
                    estado="En Progreso",
                    horas=sd.get("hours", 0),
                ))

        logger.info("Total tareas en semana: %d", len(tareas))
        return tareas

    # ────────────────────────────────────────────
    #  helpers
    # ────────────────────────────────────────────

    def _parse_dates(self, date_strs: List[str]):
        self._dates = []
        for s in date_strs:
            parts = s.split("-")
            if len(parts) == 3:
                day = int(parts[0])
                month = MESES.get(parts[1], 1)
                year = int(parts[2]) if len(parts[2]) == 4 else 2000 + int(parts[2])
                self._dates.append(datetime(year, month, day))

    def _inicio_semana(self, dt: datetime) -> datetime:
        """Lunes de la semana."""
        d = dt.weekday()  # 0=Monday
        return dt - timedelta(days=d)

    def _row_to_tarea(self, row: dict, bot_key: str, bot_cfg: dict, idx: int) -> Tarea:
        fecha_est = ""
        fecha_ini: Optional[datetime] = None
        fecha_fin: Optional[datetime] = None

        fi = row.get("fixedIdx")
        fe = row.get("fixedEndIdx", fi)
        if fi is not None and fi < len(self._dates):
            fecha_ini = self._dates[fi]
        if fe is not None and fe < len(self._dates):
            fecha_fin = self._dates[fe]

        if fecha_ini:
            fecha_est = fecha_ini.strftime("%d/%m")
        elif fecha_fin:
            fecha_est = fecha_fin.strftime("%d/%m")

        estado = "En Progreso" if row.get("inProgress") else "Planificado"
        if row.get("milestone"):
            estado = "Hito"

        return Tarea(
            id=f"{bot_key}_{idx}",
            desarrollador=bot_cfg["developer"],
            email=bot_cfg["email"],
            bot=bot_cfg["label"],
            titulo=row.get("task", ""),
            fase=row.get("phase", ""),
            prioridad="Alta" if row.get("milestone") or row.get("inProgress") else "Media",
            fecha_estimada=fecha_est,
            fecha_inicio=fecha_ini,
            fecha_fin=fecha_fin,
            estado=estado,
            horas=row.get("hours", 0),
            milestone=row.get("milestone", False),
            en_curso=row.get("inProgress", False),
        )

    def _en_semana(self, tarea: Tarea, week_start: datetime, week_end: datetime) -> bool:
        if tarea.en_curso:
            return True
        if tarea.fecha_inicio and tarea.fecha_fin:
            if tarea.fecha_inicio <= week_end and tarea.fecha_fin >= week_start:
                return True
        return False

    def _email_por_responsable(self, nombre: str) -> str:
        """Mapeo básico de responsable a email."""
        mapping = {
            "Johan Sabino": "johan.sabino@2nv.co",
            "Cristian Bonilla": "cristian.bonilla@2nv.co",
            "Javier Gonzalez": "javier.gonzalez@2nv.co",
        }
        # Búsqueda parcial
        for key, email in mapping.items():
            if key.lower() in nombre.lower() or nombre.lower() in key.lower():
                return email
        return ""
