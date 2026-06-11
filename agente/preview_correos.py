#!/usr/bin/env python3
"""Muestra el contenido del correo consolidado que enviaría el agente."""

import os

os.environ["AI_PROVIDER"] = "mock"
os.environ["DRY_RUN"] = "true"
os.environ["DASHBOARD_TYPE"] = "api"
os.environ["LOG_LEVEL"] = "WARNING"

from src.dashboard_client import DashboardClient
from src.data_processor import DataProcessor
from src.email_generator import EmailGenerator

DESTINATARIOS = ["Jesus.c@2nv.co", "j.m@2nv.co"]

dashboard = DashboardClient()
tareas = dashboard.obtener_tareas_semana()
grupos = DataProcessor().procesar(tareas)
gen = EmailGenerator()
correo = gen.generar_consolidado(grupos, DESTINATARIOS)

print("=" * 70)
print(f"TO:      {correo['to']}")
print(f"CC:      {correo['cc']}")
print(f"SUBJECT: {correo['subject']}")
print("=" * 70)
print(correo["body_text"])
