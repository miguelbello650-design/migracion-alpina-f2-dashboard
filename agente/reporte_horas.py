print("Script iniciado...", flush=True)

import sys
import os
import json
import traceback
import getpass
from datetime import datetime

BASE = r"C:\Users\2NV\Desktop\Prueba de IPM\agente"
LOG = os.path.join(BASE, "reporte_horas.log")
API_URL = "http://127.0.0.1:3000/api/data"

os.makedirs(BASE, exist_ok=True)

def log_msg(msg):
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write("[%s] %s\n" % (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg))
    except Exception as e:
        print("  [log_msg fallo]: %s" % e, flush=True)

log_msg("=== INICIO ===")
log_msg("Usuario ejecutando: %s" % getpass.getuser())
log_msg("Python ejecutable: %s" % sys.executable)
log_msg("Directorio actual: %s" % os.getcwd())
log_msg("API_URL: %s" % API_URL)

data = None

try:
    import requests
    log_msg("Intentando con requests...")
    resp = requests.get(API_URL, timeout=15)
    log_msg("Status Code: %s" % resp.status_code)
    resp.raise_for_status()
    data = resp.json()
    log_msg("requests OK")
except Exception as e1:
    log_msg("requests fallo: %s" % str(e1))
    try:
        import urllib.request
        log_msg("Fallback con urllib...")
        with urllib.request.urlopen(API_URL, timeout=15) as f:
            data = json.loads(f.read().decode("utf-8"))
        log_msg("urllib OK")
    except Exception as e2:
        log_msg("urllib tambien fallo: %s" % str(e2))
        data = None

if data is None:
    log_msg("ERROR: data es None")
    print("ERROR: No se pudieron obtener datos de la API. Revisa %s" % LOG)
    sys.exit(1)

try:
    # =========================
    # DATOS DIRECTOS DEL DASHBOARD
    # Grafica: Horas Contratadas vs Horas Restantes
    # =========================

    rh = data.get("reporteHoras", {})

    contratadas = float(rh.get("contratadas", 0))
    total = float(rh.get("consumidas", 0))
    restantes = float(rh.get("restantes", 0))
    pct = float(rh.get("porcentaje", 0))

    if contratadas <= 0:
        raise Exception("La API no devolvio reporteHoras.contratadas valido")

    log_msg("Datos tomados directamente de reporteHoras")
    log_msg("HORAS_CONTRATADAS=%.1f" % contratadas)
    log_msg("HORAS_CONSUMIDAS=%.1f" % total)
    log_msg("HORAS_RESTANTES=%.1f" % restantes)
    log_msg("PORCENTAJE=%.1f%%" % pct)

    now = datetime.now().strftime("%d/%m/%Y")

    if pct >= 100:
        titulo = "Alerta: horas contratadas agotadas"
        color_titulo = "#d9534f"
        mensaje = '<p style="color:#d9534f;font-weight:700;font-size:14px;margin:16px 0 0">Las horas contratadas se han agotado. Exceso: %.1f h.</p>' % (total - contratadas)
    elif pct >= 80:
        titulo = "Alerta de consumo de horas"
        color_titulo = "#f0ad4e"
        mensaje = '<p style="color:#f0ad4e;font-weight:700;font-size:14px;margin:16px 0 0">El consumo supera el 80%%. Quedan %.1f h disponibles.</p>' % restantes
    else:
        titulo = "Reporte de consumo de horas RPA Alpina"
        color_titulo = "#1e3a5f"
        mensaje = ""

    html = """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fc;font-family:Arial,sans-serif">

<div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);padding:32px 24px;text-align:center">

<h2 style="font-size:20px;color:%s;font-weight:700;margin:0 0 4px">%s</h2>

<p style="font-size:13px;color:#94a3b8;margin:0 0 20px">%s</p>

<div style="max-width:100%%;margin:20px auto">
<div style="height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;display:flex">
<div style="height:100%%;width:%.1f%%;background:#0033a0"></div>
<div style="height:100%%;width:%.1f%%;background:#10b981"></div>
</div>
</div>

<div style="display:flex;justify-content:center;gap:24px;font-size:13px;color:#475569;margin:12px 0;flex-wrap:wrap">

<div>
<span style="display:inline-block;width:10px;height:10px;border-radius:50%%;background:#1e3a5f;margin-right:6px;vertical-align:middle"></span>
Contratadas <strong style="color:#1e293b">%.1f h</strong>
</div>

<div>
<span style="display:inline-block;width:10px;height:10px;border-radius:50%%;background:#0033a0;margin-right:6px;vertical-align:middle"></span>
Consumidas <strong style="color:#1e293b">%.1f h</strong>
</div>

<div>
<span style="display:inline-block;width:10px;height:10px;border-radius:50%%;background:#10b981;margin-right:6px;vertical-align:middle"></span>
Restantes <strong style="color:#1e293b">%.1f h</strong>
</div>

</div>

%s

<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0 14px">

<p style="font-size:12px;color:#94a3b8;margin:0">
Seguimiento: El detalle de horas se actualiza semanalmente en el Dashboard.
</p>

<p style="font-size:12px;color:#94a3b8;margin:8px 0 0">
Quedo atento a los comentarios,<br>
<b>PMAUTOMATION</b>
</p>

</div>
</body>
</html>""" % (
        color_titulo,
        titulo,
        now,
        pct,
        max(0, 100 - pct),
        contratadas,
        total,
        restantes,
        mensaje
    )

    asunto = "[IMPORTANTE] %s | %.1f%% consumido" % (titulo, pct)

    log_msg("ASUNTO_GENERADO=%s" % asunto)

    archivo_asunto = os.path.join(BASE, "asunto_horas.txt")
    archivo_html = os.path.join(BASE, "reporte_horas.html")

    if os.path.exists(archivo_asunto):
        os.remove(archivo_asunto)

    if os.path.exists(archivo_html):
        os.remove(archivo_html)

    with open(archivo_asunto, "w", encoding="utf-8") as f:
        f.write(asunto)

    with open(archivo_html, "w", encoding="utf-8") as f:
        f.write(html)

    log_msg("Archivo asunto escrito: %s" % archivo_asunto)
    log_msg("Archivo html escrito: %s" % archivo_html)
    log_msg("=== FIN OK ===")

    print("OK | %.1f%% consumido (%.1f/%.1f h)" % (pct, total, contratadas))
    sys.exit(0)

except Exception as e:
    log_msg("ERROR en procesamiento: %s" % str(e))
    log_msg("TRACEBACK:\n%s" % traceback.format_exc())
    print("ERROR: %s - Revisa %s" % (e, LOG))
    sys.exit(1)