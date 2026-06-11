"""
Genera el contenido de los correos usando plantillas y datos procesados.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from src.ai_assistant import AIAssistant
from src.data_processor import GrupoDesarrollador
from src.logger import logger


class EmailGenerator:
    """Construye el asunto y cuerpo del correo para cada desarrollador."""

    PLANTILLA_PATH = Path(__file__).parent.parent / "templates" / "email_template.html"

    def __init__(self, ai: Optional[AIAssistant] = None):
        self.ai = ai or AIAssistant()
        self._html_template = self._cargar_template_html()

    def generar(self, grupo: GrupoDesarrollador) -> dict:
        logger.info("Generando correo para %s <%s>", grupo.nombre, grupo.email)

        subject = self._generar_asunto(grupo)
        tareas_formateadas = self._formatear_por_bot(grupo)
        riesgo = self.ai.detectar_riesgos(grupo)

        body_text = self._generar_cuerpo_texto(grupo, tareas_formateadas, riesgo)
        body_html = self._generar_cuerpo_html(grupo, tareas_formateadas, riesgo)

        return {
            "to": grupo.email,
            "subject": subject,
            "body_text": body_text,
            "body_html": body_html,
            "cc": self._get_cc(),
        }

    # ────────────────────────────────────────────
    #  Asunto
    # ────────────────────────────────────────────

    def _generar_asunto(self, grupo: GrupoDesarrollador) -> str:
        bots_str = " · ".join(grupo.bots.keys())
        return f"Plan de trabajo semanal - {grupo.nombre} ({bots_str})"

    # ────────────────────────────────────────────
    #  Formateo por bot
    # ────────────────────────────────────────────

    def _formatear_por_bot(self, grupo: GrupoDesarrollador) -> str:
        """Usa IA para formatear, o formatea manualmente agrupando por bot."""
        tareas_ia = self.ai.formatear_tareas(grupo)
        if "mock" not in str(type(self.ai._provider)).lower():
            return tareas_ia

        # Fallback: formateo manual agrupando por bot
        lines = []
        for bot_label, tareas in grupo.bots.items():
            lines.append(f"\n  {bot_label}:")
            for t in tareas:
                estado = f" [{t.estado}]" if t.estado else ""
                prioridad = f" (Prioridad: {t.prioridad})" if t.prioridad != "Media" else ""
                fecha = f" — {t.fecha_estimada}" if t.fecha_estimada else ""
                lines.append(f"    • {t.titulo}{fecha}{estado}{prioridad}")
        return "\n".join(lines)

    # ────────────────────────────────────────────
    #  Cuerpo en texto plano
    # ────────────────────────────────────────────

    def _generar_cuerpo_texto(
        self,
        grupo: GrupoDesarrollador,
        tareas_fmt: str,
        riesgo: Optional[str],
    ) -> str:
        lines = [
            f"Hola {grupo.nombre},",
            "",
            "A continuación se detalla la planificación de actividades para esta semana:",
            "",
            tareas_fmt,
        ]
        if riesgo:
            lines.extend(["", riesgo])
        lines.extend([
            "",
            "Por favor asegúrate de cumplir con los tiempos establecidos",
            "y reportar cualquier bloqueo.",
            "",
            "Saludos,",
            "Equipo de Desarrollo",
        ])
        return "\n".join(lines)

    # ────────────────────────────────────────────
    #  Cuerpo en HTML
    # ────────────────────────────────────────────

    def _generar_cuerpo_html(
        self,
        grupo: GrupoDesarrollador,
        tareas_fmt: str,
        riesgo: Optional[str],
    ) -> str:
        tareas_html = tareas_fmt.replace("\n", "<br>")
        riesgo_html = f"<p style='color: #d9534f;'>{riesgo}</p>" if riesgo else ""

        contexto = {
            "nombre": grupo.nombre,
            "tareas": tareas_html,
            "riesgo": riesgo_html,
        }

        if self._html_template:
            return self._render_template(self._html_template, contexto)
        return self._generar_html_fallback(contexto)

    def _generar_html_fallback(self, ctx: dict) -> str:
        return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color: #2c3e50;">Plan de trabajo semanal</h2>
  <p>Hola <strong>{ctx["nombre"]}</strong>,</p>
  <p>A continuación se detalla la planificación de actividades para esta semana:</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
    {ctx["tareas"]}
  </div>
  {ctx["riesgo"]}
  <p>Por favor asegúrate de cumplir con los tiempos establecidos y reportar cualquier bloqueo.</p>
  <p>Saludos,<br><strong>Equipo de Desarrollo</strong></p>
</body>
</html>"""

    # ────────────────────────────────────────────
    #  Utilidades
    # ────────────────────────────────────────────

    def _cargar_template_html(self) -> Optional[str]:
        path = self.PLANTILLA_PATH
        if path.exists():
            logger.debug("Template HTML cargado desde %s", path)
            return path.read_text(encoding="utf-8")
        logger.debug("No se encontró template HTML en %s", path)
        return None

    def _render_template(self, template: str, ctx: dict) -> str:
        for key, val in ctx.items():
            template = template.replace(f"{{{{{key}}}}}", val)
        return template

    def _get_cc(self) -> Optional[str]:
        from config.settings import settings
        if settings.enviar_copia_lider and settings.lider_tecnico_email:
            return settings.lider_tecnico_email
        return None


    # ────────────────────────────────────────────
    #  Correo consolidado (un solo correo para todos)
    # ────────────────────────────────────────────

    def generar_consolidado(
        self, grupos: list[GrupoDesarrollador], destinatarios: list[str]
    ) -> dict:
        """Genera un único correo con la planificación de todos los desarrolladores."""
        logger.info("Generando correo consolidado para %d desarrolladores", len(grupos))

        # Asunto: semana actual
        from datetime import datetime
        hoy = datetime.now()
        week_start = hoy - __import__("datetime").timedelta(days=hoy.weekday())
        week_end = week_start + __import__("datetime").timedelta(days=4)
        subject = (
            f"Plan semanal RPA Alpina | "
            f"Semana del {week_start.day}/{week_start.month} "
            f"al {week_end.day}/{week_end.month}"
        )

        # Cuerpo: agrupar por desarrollador y bot
        sections_text = []
        sections_html = []
        riesgos_totales = []

        for grupo in grupos:
            tareas_fmt = self._formatear_por_bot(grupo)
            riesgo = self.ai.detectar_riesgos(grupo)
            if riesgo:
                riesgos_totales.append(riesgo)

            sections_text.append(f"── {grupo.nombre} ({grupo.email}) ──")
            sections_text.append(tareas_fmt)

            sections_html.append(
                f'<div style="margin:16px 0;padding:12px;border-left:4px solid #0033a0;'
                f'background:#f0f4f8;border-radius:4px;">'
                f'<h3 style="margin:0 0 4px;color:#1e3a5f;">{grupo.nombre}</h3>'
                f'<div style="font-size:12px;color:#64748b;">{grupo.email}</div>'
                f'<pre style="font-family:Consolas,monospace;font-size:13px;margin:8px 0 0;'
                f'white-space:pre-wrap;">{tareas_fmt}</pre>'
                f'</div>'
            )

        riesgos_text = "\n".join(riesgos_totales) if riesgos_totales else ""
        riesgos_html = (
            "<hr>".join(
                f'<p style="color:#d9534f;">{r}</p>' for r in riesgos_totales
            )
            if riesgos_totales else ""
        )

        body_text = (
            "Buen día equipo,\n\n"
            "Comparto el plan general de trabajo para esta semana "
            "según las actividades registradas en el dashboard:\n\n"
            + "\n\n".join(sections_text)
            + "\n\n"
            + (riesgos_text + "\n\n" if riesgos_text else "")
            + "Seguimiento: el avance será actualizado en el Dashboard durante la semana. "
            "Cualquier bloqueo crítico será informado oportunamente.\n\n"
            "Quedo atento a los comentarios,\n"
            "Equipo de Desarrollo"
        )

        body_html = (
            "<h2>Plan semanal RPA Alpina</h2>"
            + "".join(sections_html)
            + riesgos_html
            + '<p style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:4px;font-size:13px;">'
            "<strong>Seguimiento:</strong> el avance será actualizado en el Dashboard durante la semana. "
            "Cualquier bloqueo crítico será informado oportunamente.</p>"
            "<p>Quedo atento a los comentarios,<br><strong>Equipo de Desarrollo</strong></p>"
        )

        return {
            "to": ";".join(destinatarios),
            "subject": subject,
            "body_text": body_text,
            "body_html": body_html,
            "cc": self._get_cc(),
        }
