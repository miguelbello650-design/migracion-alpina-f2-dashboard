import os
import yaml
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv


load_dotenv()


class Settings:
    """Carga y expone la configuración del agente."""

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, config_path: str = None):
        if hasattr(self, '_initialized') and self._initialized:
            return
        self._initialized = True

        path = config_path or os.path.join(
            os.path.dirname(__file__), "config.yaml"
        )
        with open(path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)

        self._raw = raw
        self._resolve_env(raw)

    def _resolve_env(self, obj: Any) -> Any:
        """Reemplaza ${VAR} por el valor de entorno."""
        if isinstance(obj, dict):
            return {k: self._resolve_env(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._resolve_env(i) for i in obj]
        if isinstance(obj, str) and obj.startswith("${") and obj.endswith("}"):
            env_var = obj[2:-1]
            return os.getenv(env_var, "")
        return obj

    def _get(self, *keys: str) -> Any:
        value = self._raw
        for key in keys:
            value = value.get(key, {})
        return value

    def _env_override(self, key: str, default: Any) -> Any:
        """Permite sobreescribir config yaml con variables de entorno."""
        env_key = key.upper().replace(".", "_")
        return os.getenv(env_key, default)

    # ── Dashboard ──────────────────────────────────────────────
    @property
    def dashboard_type(self) -> str:
        return self._env_override("dashboard.type", self._get("dashboard", "type"))

    @property
    def dashboard_url(self) -> str:
        return self._get("dashboard", "url")

    @property
    def dashboard_api_key(self) -> str:
        return self._get("dashboard", "api_key")

    @property
    def dashboard_timeout(self) -> int:
        return int(self._get("dashboard", "timeout_seconds"))

    # ── Base de datos ──────────────────────────────────────────
    @property
    def db_host(self) -> str:
        return self._get("database", "host")

    @property
    def db_port(self) -> int:
        return int(self._get("database", "port"))

    @property
    def db_name(self) -> str:
        return self._get("database", "name")

    @property
    def db_user(self) -> str:
        return self._get("database", "user")

    @property
    def db_password(self) -> str:
        return self._get("database", "password")

    @property
    def db_query(self) -> str:
        return self._get("database", "query")

    # ── Outlook ────────────────────────────────────────────────
    @property
    def outlook_provider(self) -> str:
        return self._get("outlook", "provider")

    @property
    def outlook_client_id(self) -> str:
        return self._get("outlook", "client_id")

    @property
    def outlook_client_secret(self) -> str:
        return self._get("outlook", "client_secret")

    @property
    def outlook_tenant_id(self) -> str:
        return self._get("outlook", "tenant_id")

    @property
    def outlook_user_email(self) -> str:
        return self._get("outlook", "user_email")

    @property
    def smtp_server(self) -> str:
        return self._get("outlook", "smtp_server")

    @property
    def smtp_port(self) -> int:
        return int(self._get("outlook", "smtp_port"))

    @property
    def smtp_user(self) -> str:
        return self._get("outlook", "smtp_user")

    @property
    def smtp_password(self) -> str:
        return self._get("outlook", "smtp_password")

    # ── IA ─────────────────────────────────────────────────────
    @property
    def ai_provider(self) -> str:
        return self._env_override("ai.provider", self._get("ai", "provider"))

    @property
    def ai_api_key(self) -> str:
        return self._get("ai", "api_key")

    @property
    def ai_model(self) -> str:
        return self._get("ai", "model")

    @property
    def ai_temperature(self) -> float:
        return float(self._get("ai", "temperature"))

    @property
    def ai_max_tokens(self) -> int:
        return int(self._get("ai", "max_tokens"))

    # ── Scheduler ──────────────────────────────────────────────
    @property
    def scheduler_day(self) -> str:
        return self._get("scheduler", "day_of_week")

    @property
    def scheduler_hour(self) -> int:
        return int(self._get("scheduler", "hour"))

    @property
    def scheduler_minute(self) -> int:
        return int(self._get("scheduler", "minute"))

    @property
    def scheduler_timezone(self) -> str:
        return self._get("scheduler", "timezone")

    # ── General ────────────────────────────────────────────────
    @property
    def lider_tecnico_email(self) -> str:
        return self._env_override("general.lider_tecnico_email", self._get("general", "lider_tecnico_email"))

    @property
    def enviar_copia_lider(self) -> bool:
        return bool(self._get("general", "enviar_copia_lider"))

    @property
    def max_tareas_resumen_ia(self) -> int:
        return int(self._get("general", "max_tareas_resumen_ia"))

    @property
    def dry_run(self) -> bool:
        override = os.getenv("DRY_RUN")
        if override is not None:
            return override.lower() in ("true", "1", "yes")
        return bool(self._get("general", "dry_run"))

    @property
    def log_level(self) -> str:
        return self._env_override("general.log_level", self._get("general", "log_level"))

    @property
    def log_file(self) -> str:
        return self._get("general", "log_file")

    # ── Bots ──────────────────────────────────────────────────
    def bot_config(self, bot_key: str) -> Optional[Dict[str, Any]]:
        """Retorna la config de un bot (label, developer, email, color)."""
        bots = self._raw.get("bots", {})
        return bots.get(bot_key)

    @property
    def bots_disponibles(self) -> List[str]:
        return list(self._raw.get("bots", {}).keys())


settings = Settings()
