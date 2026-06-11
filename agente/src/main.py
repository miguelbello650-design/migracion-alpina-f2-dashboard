"""
Punto de entrada principal del agente de planificación semanal.

Flujo:
  1. Consultar dashboard IPM
  2. Procesar y agrupar datos por desarrollador/bot
  3. Generar un único correo consolidado
  4. Enviar por Outlook
"""

from __future__ import annotations

import sys
import time
from typing import List

from config.settings import settings
from src.logger import logger
from src.dashboard_client import DashboardClient, Tarea
from src.data_processor import DataProcessor, GrupoDesarrollador
from src.email_generator import EmailGenerator
from src.outlook_client import OutlookClient


# Destinatarios del correo consolidado
DESTINATARIOS = ["Jesus.c@2nv.co", "j.m@2nv.co"]


def ejecutar_ciclo_completo() -> int:
    logger.info("=" * 60)
    logger.info("INICIANDO CICLO DEL AGENTE DE PLANIFICACIÓN SEMANAL")
    logger.info("=" * 60)

    try:
        # 1. Consultar dashboard
        logger.info("Paso 1/4: Consultando dashboard IPM...")
        dashboard = DashboardClient()
        tareas: List[Tarea] = dashboard.obtener_tareas_semana()
        if not tareas:
            logger.warning("No se encontraron tareas para la semana actual.")
            return 0

        # 2. Procesar datos
        logger.info("Paso 2/4: Procesando datos...")
        processor = DataProcessor()
        grupos: List[GrupoDesarrollador] = processor.procesar(tareas)

        # 3. Generar correo consolidado (único para todos)
        logger.info("Paso 3/4: Generando correo consolidado...")
        email_gen = EmailGenerator()
        correo = email_gen.generar_consolidado(grupos, DESTINATARIOS)

        # 4. Enviar correo
        logger.info("Paso 4/4: Enviando correo por Outlook...")
        outlook = OutlookClient()
        exito = outlook.enviar_correo(correo)

        logger.info("=" * 60)
        if exito:
            logger.info("CORREO ENVIADO exitosamente a %s", "; ".join(DESTINATARIOS))
        else:
            logger.error("FALLO al enviar el correo")
        return 0 if exito else 1

    except Exception as e:
        logger.error("Error crítico: %s", e, exc_info=True)
        return 1


def main():
    args = sys.argv[1:]

    if "--schedule" in args:
        from src.scheduler import WeeklyScheduler
        scheduler = WeeklyScheduler(ejecutar_ciclo_completo)
        scheduler.iniciar()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            scheduler.detener()
            logger.info("Agente detenido por el usuario.")
    elif "--once" in args:
        return ejecutar_ciclo_completo()
    else:
        print("Uso: python -m src.main [--once | --schedule]")
        print("  --once      Ejecuta el ciclo una vez")
        print("  --schedule  Ejecuta el scheduler semanal")
        return 1


if __name__ == "__main__":
    sys.exit(main())
