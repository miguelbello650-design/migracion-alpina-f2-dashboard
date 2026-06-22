print("Script semanal iniciado...", flush=True)

import sys
import os
import json
import traceback
import getpass
import html as html_escape
from datetime import datetime, timedelta

BASE = r"C:\Users\2NV\Desktop\Prueba de IPM\agente"
LOG = os.path.join(BASE, "reporte_semanal.log")
API_URL = "http://127.0.0.1:3000/api/data"

os.makedirs(BASE, exist_ok=True)

def log_msg(msg):
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write("[%s] %s\n" % (
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                msg
            ))
    except Exception as e:
        print("  [log_msg fallo]: %s" % e, flush=True)

log_msg("=== INICIO REPORTE SEMANAL ===")
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
    MESES = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
        "May": 5, "Jun": 6, "Jul": 7, "Aug": 8,
        "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
    }

    fechas = []

    for s in data.get("ganttDates", []):
        try:
            partes = s.split("-")
            dia = int(partes[0])
            mes = MESES[partes[1]]
            anio = 2000 + int(partes[2])
            fechas.append(datetime(anio, mes, dia))
        except Exception:
            fechas.append(None)

    BOTS = {
        "nova": (
            "Johan Sabino",
            "johan.sabino@2nv.co",
            "NOVA",
            "#2563eb"
        ),
        "feli": (
            "Cristian Bonilla",
            "cristian.bonilla@2nv.co",
            "FELI",
            "#7c3aed"
        ),
        "robotina": (
            "Javier Gonzalez",
            "javier.gonzalez@2nv.co",
            "ROBOTINA",
            "#0891b2"
        ),
        "googlenova": (
            "Johan Sabino",
            "johan.sabino@2nv.co",
            "Migración Google - NOVA",
            "#4285F4"
        )
    }

    hoy = datetime.now()
    lunes = hoy - timedelta(days=hoy.weekday())
    viernes = lunes + timedelta(days=4)

    lunes = lunes.replace(hour=0, minute=0, second=0, microsecond=0)
    viernes = viernes.replace(hour=23, minute=59, second=59, microsecond=999999)

    log_msg("Semana desde: %s" % lunes.strftime("%Y-%m-%d"))
    log_msg("Semana hasta: %s" % viernes.strftime("%Y-%m-%d"))

    grupos = {}

    for bk, rows in data.get("ganttRows", {}).items():
        config = BOTS.get(bk)

        if not config:
            continue

        nombre, email, bot_label, color = config

        if nombre not in grupos:
            grupos[nombre] = {
                "email": email,
                "bots": {}
            }

        for r in rows:
            tarea = r.get("task")

            if not tarea:
                continue

            fixed_ini = r.get("fixedIdx")
            fixed_fin = r.get("fixedEndIdx", fixed_ini)

            inicio = fechas[fixed_ini] if fixed_ini is not None and fixed_ini < len(fechas) else None
            fin = fechas[fixed_fin] if fixed_fin is not None and fixed_fin < len(fechas) else None

            if inicio and fin and inicio <= viernes and fin >= lunes:
                if bot_label not in grupos[nombre]["bots"]:
                    grupos[nombre]["bots"][bot_label] = {
                        "color": color,
                        "tareas": []
                    }

                grupos[nombre]["bots"][bot_label]["tareas"].append(tarea)

    total_tareas = 0

    for _, info in grupos.items():
        for _, bot_info in info["bots"].items():
            total_tareas += len(bot_info["tareas"])

    log_msg("Total responsables: %s" % len(grupos))
    log_msg("Total tareas semana: %s" % total_tareas)

    asunto = "Plan semanal RPA Alpina | Semana del %s al %s" % (
        lunes.strftime("%-d/%-m") if os.name != "nt" else lunes.strftime("%#d/%#m"),
        viernes.strftime("%-d/%-m") if os.name != "nt" else viernes.strftime("%#d/%#m")
    )

    if total_tareas == 0:
        contenido_html = """
<p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">
Buen día equipo,
</p>

<p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">
No se encontraron actividades programadas para esta semana en el Dashboard.
</p>
"""
    else:
        bloques = ""

        for nombre, info in grupos.items():
            if not info["bots"]:
                continue

            bloques += """
<div style="margin:20px 0;padding:20px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;text-align:left">

<h3 style="font-size:16px;color:#1e3a5f;margin:0 0 14px;font-weight:700">
%s
</h3>
""" % html_escape.escape(nombre)

            for bot_label, bot_info in info["bots"].items():
                color = bot_info["color"]
                tareas = bot_info["tareas"]

                bloques += """
<p style="font-size:14px;color:%s;font-weight:800;margin:10px 0 8px">
%s
</p>

<ul style="margin:0 0 10px 18px;padding:0;color:#334155;font-size:14px;line-height:1.7">
""" % (
                    color,
                    html_escape.escape(bot_label)
                )

                for tarea in tareas:
                    bloques += """
<li>%s</li>
""" % html_escape.escape(tarea)

                bloques += """
</ul>
"""

            bloques += """
</div>
"""

        contenido_html = """
<p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">
Buen día equipo,
</p>

<p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px">
Comparto el plan general de trabajo para esta semana:
</p>

%s
""" % bloques

    html = """<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fc;font-family:Arial,sans-serif">

<div style="max-width:760px;margin:30px auto;background:#ffffff;border-radius:14px;box-shadow:0 3px 14px rgba(15,23,42,0.10);overflow:hidden">

<div style="background:#1e3a5f;padding:26px 24px;text-align:center">
<h2 style="font-size:23px;color:#ffffff;font-weight:800;margin:0">
Plan semanal RPA Alpina
</h2>

<p style="font-size:14px;color:#dbeafe;margin:8px 0 0">
Semana del %s al %s
</p>
</div>

<div style="padding:28px 24px;text-align:center">
%s

<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px">

<p style="font-size:12px;color:#94a3b8;margin:0">
Seguimiento: El avance será actualizado en el Dashboard durante la semana.
</p>

<p style="font-size:12px;color:#94a3b8;margin:8px 0 0">
Cualquier bloqueo crítico será informado oportunamente.
</p>

<p style="font-size:12px;color:#94a3b8;margin:10px 0 0">
Quedo atento a los comentarios,<br>
<b style="color:#1e3a5f">PMAUTOMATION</b>
</p>

</div>
</div>
</body>
</html>""" % (
        lunes.strftime("%d/%m/%Y"),
        viernes.strftime("%d/%m/%Y"),
        contenido_html
    )

    archivo_asunto = os.path.join(BASE, "asunto_semanal.txt")
    archivo_html = os.path.join(BASE, "reporte_semanal.html")

    if os.path.exists(archivo_asunto):
        os.remove(archivo_asunto)

    if os.path.exists(archivo_html):
        os.remove(archivo_html)

    with open(archivo_asunto, "w", encoding="utf-8") as f:
        f.write(asunto)

    with open(archivo_html, "w", encoding="utf-8") as f:
        f.write(html)

    log_msg("ASUNTO_GENERADO=%s" % asunto)
    log_msg("Archivo asunto escrito: %s" % archivo_asunto)
    log_msg("Archivo html escrito: %s" % archivo_html)
    log_msg("=== FIN OK REPORTE SEMANAL ===")

    print("OK | Reporte semanal generado con %s tareas" % total_tareas)
    sys.exit(0)

except Exception as e:
    log_msg("ERROR en procesamiento: %s" % str(e))
    log_msg("TRACEBACK:\n%s" % traceback.format_exc())
    print("ERROR: %s - Revisa %s" % (e, LOG))
    sys.exit(1)