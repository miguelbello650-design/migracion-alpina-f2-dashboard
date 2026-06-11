"""Tests para email_generator.py"""

from src.ai_assistant import MockAIProvider, AIAssistant
from src.dashboard_client import Tarea
from src.data_processor import GrupoDesarrollador
from src.email_generator import EmailGenerator


def _ai_mock() -> AIAssistant:
    assistant = AIAssistant()
    assistant._provider = MockAIProvider()
    return assistant


def _grupo():
    t1 = Tarea(id="1", desarrollador="Ana", email="ana@test.com",
               bot="NOVA", titulo="Login", prioridad="Alta",
               fecha_estimada="12/06", estado="Planificado")
    return GrupoDesarrollador(
        nombre="Ana",
        email="ana@test.com",
        bots={"NOVA": [t1]},
        tareas=[t1],
    )


def test_generar_estructura():
    gen = EmailGenerator(ai=_ai_mock())
    grupo = _grupo()
    correo = gen.generar(grupo)
    assert correo["to"] == "ana@test.com"
    assert "Ana" in correo["subject"]
    assert "Ana" in correo["body_text"]
    assert "Login" in correo["body_text"]
    assert "Equipo de Desarrollo" in correo["body_text"]


def test_generar_asunto():
    gen = EmailGenerator(ai=_ai_mock())
    grupo = _grupo()
    asunto = gen._generar_asunto(grupo)
    assert "Ana" in asunto
    assert "plan de trabajo" in asunto.lower()
