"""
Módulo de inteligencia artificial para formatear y enriquecer
el contenido de los correos.

Soporta múltiples proveedores (OpenAI, Anthropic) y un modo
mock para desarrollo sin API key.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional

from openai import OpenAI
from anthropic import Anthropic

from config.settings import settings
from src.data_processor import GrupoDesarrollador
from src.logger import logger


# ────────────────────────────────────────────────
#  Estrategia IA
# ────────────────────────────────────────────────


class AIProvider(ABC):
    @abstractmethod
    def formatear_tareas(self, grupo: GrupoDesarrollador) -> str:
        ...

    @abstractmethod
    def detectar_riesgos(self, grupo: GrupoDesarrollador) -> Optional[str]:
        ...


class OpenAIProvider(AIProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.ai_api_key)

    def _system_prompt(self) -> str:
        return (
            "Eres un asistente experto en gestión de proyectos. "
            "Debes formatear las tareas de forma clara y profesional "
            "para incluirlas en un correo de planificación semanal."
        )

    def formatear_tareas(self, grupo: GrupoDesarrollador) -> str:
        prompt = self._build_format_prompt(grupo)
        resp = self.client.chat.completions.create(
            model=settings.ai_model,
            temperature=settings.ai_temperature,
            max_tokens=settings.ai_max_tokens,
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": prompt},
            ],
        )
        return resp.choices[0].message.content.strip()

    def detectar_riesgos(self, grupo: GrupoDesarrollador) -> Optional[str]:
        if len(grupo.tareas) < settings.max_tareas_resumen_ia:
            return None
        prompt = (
            f"El desarrollador {grupo.nombre} tiene {len(grupo.tareas)} tareas "
            f"asignadas esta semana. Las tareas son:\n"
        )
        for t in grupo.tareas:
            prompt += f"- {t.titulo} (Prioridad: {t.prioridad}, Fecha: {t.fecha_estimada})\n"
        prompt += (
            "\n¿Detectas algún riesgo como sobrecarga, dependencias o "
            "posibles bloqueos? Responde en 1-2 oraciones o 'Sin riesgos detectados'."
        )
        resp = self.client.chat.completions.create(
            model=settings.ai_model,
            temperature=0.2,
            max_tokens=300,
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": prompt},
            ],
        )
        return resp.choices[0].message.content.strip()

    def _build_format_prompt(self, grupo: GrupoDesarrollador) -> str:
        lines = [f"Desarrollador: {grupo.nombre}"]
        for t in grupo.tareas:
            lines.append(
                f"- {t.titulo} (Prioridad: {t.prioridad}, "
                f"Fecha: {t.fecha_estimada}, Estado: {t.estado})"
            )
        lines.append(
            "\nFormatea estas tareas en una lista profesional y clara "
            "para incluir en un correo de planificación semanal. "
            "Agrupa por prioridad si es posible. "
            "Usa un tono formal pero cordial."
        )
        return "\n".join(lines)


class AnthropicProvider(AIProvider):
    def __init__(self):
        self.client = Anthropic(api_key=settings.ai_api_key)

    def formatear_tareas(self, grupo: GrupoDesarrollador) -> str:
        prompt = self._build_tasks_text(grupo)
        resp = self.client.messages.create(
            model=settings.ai_model,
            max_tokens=settings.ai_max_tokens,
            temperature=settings.ai_temperature,
            system="Eres un asistente experto en gestión de proyectos.",
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.content[0].text.strip()

    def detectar_riesgos(self, grupo: GrupoDesarrollador) -> Optional[str]:
        return None  # Placeholder - misma lógica que OpenAI

    def _build_tasks_text(self, grupo: GrupoDesarrollador) -> str:
        return (
            f"Formatea estas tareas del desarrollador {grupo.nombre} "
            f"en una lista profesional para un correo semanal:\n"
            + "\n".join(
                f"- {t.titulo} (Prioridad: {t.prioridad}, "
                f"Fecha: {t.fecha_estimada})"
                for t in grupo.tareas
            )
        )


class MockAIProvider(AIProvider):
    """Modo simulación: no requiere API key."""

    def formatear_tareas(self, grupo: GrupoDesarrollador) -> str:
        logger.info("[MOCK] Formateando tareas para %s", grupo.nombre)
        lines = []
        for bot_label, tareas in grupo.bots.items():
            lines.append(f"\n  {bot_label}:")
            for t in tareas:
                estado = f" [{t.estado}]" if t.estado else ""
                prioridad = f" (Prioridad: {t.prioridad})" if t.prioridad != "Media" else ""
                fecha = f" — {t.fecha_estimada}" if t.fecha_estimada else ""
                lines.append(f"    • {t.titulo}{fecha}{estado}{prioridad}")
        return "\n".join(lines) if lines else "  Sin tareas asignadas."

    def detectar_riesgos(self, grupo: GrupoDesarrollador) -> Optional[str]:
        if grupo.sobrecargado:
            return (
                f"{grupo.nombre} tiene {len(grupo.tareas)} tareas asignadas. "
                "Se recomienda revisar la carga de trabajo."
            )
        return None


# ────────────────────────────────────────────────
#  Fachada
# ────────────────────────────────────────────────


class AIAssistant:
    """Punto de entrada para funcionalidades de IA."""

    def __init__(self):
        provider_map = {
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
            "mock": MockAIProvider,
        }
        cls = provider_map.get(settings.ai_provider)
        if cls is None:
            logger.warning(
                "Proveedor IA '%s' no reconocido. Usando mock.",
                settings.ai_provider,
            )
            cls = MockAIProvider
        self._provider = cls()
        logger.info("IA Assistant inicializado con proveedor: %s", settings.ai_provider)

    def formatear_tareas(self, grupo: GrupoDesarrollador) -> str:
        return self._provider.formatear_tareas(grupo)

    def detectar_riesgos(self, grupo: GrupoDesarrollador) -> Optional[str]:
        return self._provider.detectar_riesgos(grupo)
