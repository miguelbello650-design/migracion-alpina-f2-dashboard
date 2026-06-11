"""
Integración con Outlook para envío de correos.

Soporta dos modos:
  - graph: Microsoft Graph API (recomendado)
  - smtp : SMTP con autenticación
"""

from __future__ import annotations

import smtplib
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import httpx

from config.settings import settings
from src.logger import logger


# ────────────────────────────────────────────────
#  Estrategias de envío
# ────────────────────────────────────────────────


class OutlookStrategy(ABC):
    @abstractmethod
    def enviar(
        self,
        to: str,
        subject: str,
        body_text: str,
        body_html: str,
        cc: Optional[str] = None,
    ) -> bool:
        ...


class GraphAPIStrategy(OutlookStrategy):
    """Envía correos usando Microsoft Graph API."""

    TOKEN_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
    SEND_URL = "https://graph.microsoft.com/v1.0/users/{user}/sendMail"

    def __init__(self):
        self._access_token: Optional[str] = None

    def _autenticar(self) -> str:
        logger.info("Autenticando en Microsoft Graph API...")
        resp = httpx.post(
            self.TOKEN_URL.format(tenant=settings.outlook_tenant_id),
            data={
                "client_id": settings.outlook_client_id,
                "client_secret": settings.outlook_client_secret,
                "scope": "https://graph.microsoft.com/.default",
                "grant_type": "client_credentials",
            },
        )
        resp.raise_for_status()
        token = resp.json()["access_token"]
        logger.info("Autenticación exitosa")
        return token

    def _get_token(self) -> str:
        if self._access_token is None:
            self._access_token = self._autenticar()
        return self._access_token

    def enviar(
        self,
        to: str,
        subject: str,
        body_text: str,
        body_html: str,
        cc: Optional[str] = None,
    ) -> bool:
        token = self._get_token()
        message = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body_html,
                },
                "toRecipients": [
                    {"emailAddress": {"address": to}}
                ],
            }
        }
        if cc:
            message["message"]["ccRecipients"] = [
                {"emailAddress": {"address": cc}}
            ]

        resp = httpx.post(
            self.SEND_URL.format(user=settings.outlook_user_email),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=message,
        )
        if resp.is_success:
            logger.info("Correo enviado a %s (Graph API)", to)
            return True
        logger.error("Error Graph API: %s - %s", resp.status_code, resp.text)
        return False


class SMTPStrategy(OutlookStrategy):
    """Envía correos usando SMTP (Office 365 u otro)."""

    def enviar(
        self,
        to: str,
        subject: str,
        body_text: str,
        body_html: str,
        cc: Optional[str] = None,
    ) -> bool:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.smtp_user
        msg["To"] = to
        msg["Subject"] = subject
        if cc:
            msg["Cc"] = cc

        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        recipients = [to]
        if cc:
            recipients.append(cc)

        try:
            with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_user, recipients, msg.as_string())
            logger.info("Correo enviado a %s (SMTP)", to)
            return True
        except Exception as e:
            logger.error("Error SMTP al enviar a %s: %s", to, e)
            return False


class DryRunStrategy(OutlookStrategy):
    """Modo simulación: no envía realmente."""

    def enviar(
        self,
        to: str,
        subject: str,
        body_text: str,
        body_html: str,
        cc: Optional[str] = None,
    ) -> bool:
        logger.info("[DRY-RUN] Correo para: %s (CC: %s)", to, cc or "sin copia")
        logger.info("[DRY-RUN] Asunto: %s", subject)
        logger.debug("[DRY-RUN] Cuerpo:\n%s", body_text)
        return True


# ────────────────────────────────────────────────
#  Fachada
# ────────────────────────────────────────────────


class OutlookClient:
    """Punto de entrada para el envío de correos."""

    def __init__(self):
        if settings.dry_run:
            self._strategy = DryRunStrategy()
            logger.warning("*** MODO DRY-RUN ACTIVADO — No se enviarán correos reales ***")
        else:
            strategy_map = {
                "graph": GraphAPIStrategy,
                "smtp": SMTPStrategy,
            }
            cls = strategy_map.get(settings.outlook_provider)
            if cls is None:
                raise ValueError(
                    f"Proveedor Outlook desconocido: {settings.outlook_provider}"
                )
            self._strategy = cls()

    def enviar_correo(self, email_data: dict) -> bool:
        return self._strategy.enviar(
            to=email_data["to"],
            subject=email_data["subject"],
            body_text=email_data["body_text"],
            body_html=email_data["body_html"],
            cc=email_data.get("cc"),
        )
