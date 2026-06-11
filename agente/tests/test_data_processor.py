"""Tests para data_processor.py"""

from src.dashboard_client import Tarea
from src.data_processor import DataProcessor


def _tarea(desarrollador, prioridad, email="a@a.com", bot="NOVA"):
    return Tarea(
        id="1", desarrollador=desarrollador, email=email, bot=bot,
        titulo="Test", prioridad=prioridad, fecha_estimada="12/06",
        estado="Planificado",
    )


def test_agrupa_por_desarrollador():
    tareas = [
        _tarea("Ana", "Alta"),
        _tarea("Ana", "Media"),
        _tarea("Luis", "Baja"),
    ]
    proc = DataProcessor()
    grupos = proc.procesar(tareas)
    assert len(grupos) == 2


def test_orden_prioridad():
    tareas = [
        _tarea("Ana", "Baja"),
        _tarea("Ana", "Alta"),
        _tarea("Ana", "Media"),
    ]
    proc = DataProcessor()
    grupos = proc.procesar(tareas)
    ana = grupos[0]
    assert ana.tareas[0].prioridad == "Alta"
    assert ana.tareas[1].prioridad == "Media"
    assert ana.tareas[2].prioridad == "Baja"


def test_prioridad_mas_alta():
    tareas = [
        _tarea("Ana", "Baja"),
        _tarea("Ana", "Media"),
    ]
    proc = DataProcessor()
    grupos = proc.procesar(tareas)
    assert grupos[0].prioridad_mas_alta == "Media"


def test_sobrecargado():
    tareas = [_tarea("Ana", "Media", "a@a.com") for _ in range(10)]
    proc = DataProcessor()
    grupos = proc.procesar(tareas)
    assert grupos[0].sobrecargado is True


def test_agrupa_por_bot():
    tareas = [
        _tarea("Ana", "Alta", bot="NOVA"),
        _tarea("Ana", "Media", bot="FELI"),
    ]
    proc = DataProcessor()
    grupos = proc.procesar(tareas)
    ana = grupos[0]
    assert "NOVA" in ana.bots
    assert "FELI" in ana.bots
    assert len(ana.bots["NOVA"]) == 1
    assert len(ana.bots["FELI"]) == 1
