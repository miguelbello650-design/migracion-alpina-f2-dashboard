"""
Scheduler semanal para ejecución automatizada del agente.

Usa 'schedule' (librería Python) para ejecución en primer plano,
o APScheduler para mayor robustez en producción.
"""

from __future__ import annotations

import time
import threading
from datetime import datetime
from typing import Callable, Optional

import schedule as lib_schedule

from config.settings import settings
from src.logger import logger


DIAS = {
    "mon": schedule.MONDAY,
    "tue": schedule.TUESDAY,
    "wed": schedule.WEDNESDAY,
    "thu": schedule.THURSDAY,
    "fri": schedule.FRIDAY,
    "sat": schedule.SATURDAY,
    "sun": schedule.SUNDAY,
}


class WeeklyScheduler:
    """Configura y ejecuta el schedule semanal del agente."""

    def __init__(self, job_func: Callable[[], None]):
        self._job_func = job_func
        self._thread: Optional[threading.Thread] = None
        self._running = False

    def iniciar(self) -> None:
        """Configura el job en el día/hora indicados y arranca el loop."""
        dia = DIAS.get(settings.scheduler_day.lower())
        if dia is None:
            logger.warning(
                "Día '%s' no válido. Se usará lunes.",
                settings.scheduler_day,
            )
            dia = schedule.MONDAY

        hora = f"{settings.scheduler_hour:02d}:{settings.scheduler_minute:02d}"

        # ── Programar el job semanal ───────────────────────────
        lib_schedule.every().week.at(hora).do(self._ejecutar_job).tag(
            "agente-semanal"
        )
        logger.info(
            "Scheduler configurado: %s a las %s (tz: %s)",
            settings.scheduler_day,
            hora,
            settings.scheduler_timezone,
        )

        # ── Iniciar loop en un hilo ────────────────────────────
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        logger.info("Scheduler iniciado en segundo plano.")

    def _loop(self) -> None:
        while self._running:
            lib_schedule.run_pending()
            time.sleep(30)  # verificar cada 30 segundos

    def _ejecutar_job(self) -> None:
        logger.info("⏰ Ejecutando job semanal programado...")
        try:
            self._job_func()
            logger.info("✅ Job semanal completado exitosamente.")
        except Exception as e:
            logger.error("❌ Error en job semanal: %s", e, exc_info=True)

    def detener(self) -> None:
        """Detiene el scheduler de forma segura."""
        self._running = False
        lib_schedule.clear("agente-semanal")
        logger.info("Scheduler detenido.")


def ejecutar_una_vez(job_func: Callable[[], None]) -> None:
    """Ejecuta el job inmediatamente (útil para pruebas o CLI)."""
    logger.info("Ejecutando job inmediatamente...")
    try:
        job_func()
        logger.info("✅ Ejecución completada.")
    except Exception as e:
        logger.error("❌ Error en ejecución: %s", e, exc_info=True)
