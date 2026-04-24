#!/usr/bin/env python3

import base64
import os
import time
from io import BytesIO
from pathlib import Path
from datetime import datetime, timezone

import pandas as pd
import requests
from slugify import slugify

DEPARTAMENTOS = {
    1: "Chuquisaca",
    4: "Oruro",
    6: "Tarija",
    7: "Santa Cruz",
    8: "Beni",
}


def actualizar():
    def descargar(codigo_departamento):
        headers = {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json",
        }

        payload = None
        for attempt in range(3):
            try:
                response = requests.post(
                    "https://computo.oep.org.bo/api/v1/descargar",
                    headers=headers,
                    json={"tipoArchivo": "excel", "idDepartamento": codigo_departamento},
                    timeout=30,
                )
                response.raise_for_status()
                payload = response.json()
                break
            except requests.RequestException as exc:
                if attempt == 2:
                    print(
                        f"[WARN] No se pudo descargar departamento {codigo_departamento}: {exc}"
                    )
                    return None, None
                time.sleep(2)

        if not isinstance(payload, dict):
            print(
                f"[WARN] Respuesta inesperada para departamento {codigo_departamento}: {payload}"
            )
            return None, None

        archivo_b64 = payload.get("archivo")
        if not archivo_b64 and isinstance(payload.get("data"), dict):
            archivo_b64 = payload["data"].get("archivo")
        if not archivo_b64:
            print(
                f"[WARN] Sin archivo para departamento {codigo_departamento}. "
                f"Claves disponibles: {sorted(payload.keys())}"
            )
            return None, None

        try:
            data = pd.ExcelFile(
                BytesIO(base64.b64decode(archivo_b64)),
                engine="calamine",
            )
        except Exception as exc:
            print(f"[WARN] Archivo invalido para departamento {codigo_departamento}: {exc}")
            return None, None

        date = payload.get("fecha") or datetime.now(timezone.utc).isoformat()

        return date, data

    def parsear_sheet(excel, sheet):
        def segment_df(df_rows):
            segment = df_rows.copy()
            columnas = segment.iloc[0][segment.iloc[0].notna()].tolist()
            segment = segment.iloc[:, : len(columnas)]
            segment.columns = columnas
            return segment.iloc[1:]

        df = pd.read_excel(excel, sheet, header=None)
        header_positions = df[df[0] == "CodigoMesa"].index.values
        clean_df = pd.concat(
            (
                [
                    segment_df(df.iloc[header_positions[i] : header_positions[i + 1]])
                    for i in range(0, len(header_positions[:-1]))
                ]
                + [segment_df(df.iloc[header_positions[-1] :])]
            )
        )
        clean_df = clean_df[clean_df.CodigoMesa.notna()].copy()
        return clean_df

    def formar_eleccion(date, data, eleccion, departamento):
        base = Path(os.path.dirname(__file__))
        indice = [
            "CodigoProvincia",
            "NombreProvincia",
            "CodigoSeccion",
            "NombreMunicipio",
            "CodigoLocalidad",
            "NombreLocalidad",
            "CodigoRecinto",
            "NombreRecinto",
            "CodigoMesa",
            "NumeroMesa",
        ]
        participacion = [
            "InscritosHabilitados",
            "VotoValido",
            "VotoBlanco",
            "VotoNulo",
            "VotoEmitido",
            "VotoValidoReal",
            "VotoEmitidoReal",
        ]
        discard = [
            "CodigoDepartamento",
            "NombreDepartamento",
            "Descripcion",
            "CodigoPais",
            "NombrePais",
        ]
        validos = [
            col for col in data.columns if col not in participacion + indice + discard
        ]

        folder_depto = base / slugify(departamento)
        folder = folder_depto / slugify(eleccion)
        folder.mkdir(parents=True, exist_ok=True)

        for nombre, recorte in zip(
            ["participacion", "validos"],
            [participacion, validos],
        ):
            data_recorte = data.set_index(indice)[recorte].copy()
            data_recorte.sort_values(indice).to_csv(folder / f"{nombre}.csv")

        (folder_depto / "timestamp").write_text(date)

    for codigo_departamento, departamento in DEPARTAMENTOS.items():
        print(departamento)
        date, excel = descargar(codigo_departamento)
        if excel is None:
            print(f"[WARN] Se omite {departamento} por falta de archivo descargable.")
            continue
        for sheet in excel.sheet_names:
            data = parsear_sheet(excel, sheet)
            formar_eleccion(date, data, sheet, departamento)


actualizar()
