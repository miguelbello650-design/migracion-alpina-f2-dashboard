"""Tests para dashboard_client.py"""

from datetime import datetime

from src.dashboard_client import Tarea


MESES = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
         "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12}


def test_tarea_from_dict_style():
    """Tarea puede construirse directamente con kwargs."""
    t = Tarea(
        id="1",
        desarrollador="Ana Gómez",
        email="ana@test.com",
        bot="NOVA",
        titulo="Tarea de prueba",
        prioridad="Alta",
        fecha_estimada="12/06",
    )
    assert t.desarrollador == "Ana Gómez"
    assert t.email == "ana@test.com"
    assert t.bot == "NOVA"
    assert t.prioridad == "Alta"


def test_tarea_descripcion_completa():
    t = Tarea(
        id="1", desarrollador="Ana", email="a@a.com", bot="NOVA",
        titulo="Hacer X", fase="Fase 1", horas=8
    )
    assert "[Fase 1]" in t.descripcion_completa
    assert "Hacer X" in t.descripcion_completa
    assert "(8h)" in t.descripcion_completa


def test_tarea_dates():
    t = Tarea(
        id="1", desarrollador="Ana", email="a@a.com", bot="NOVA",
        titulo="Test", fecha_inicio=datetime(2026, 6, 10),
        fecha_fin=datetime(2026, 6, 12)
    )
    assert t.fecha_inicio is not None
    assert t.fecha_fin is not None
