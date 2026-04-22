#!/usr/bin/env python3

import base64
import os
from io import BytesIO
from pathlib import Path

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

        response = requests.post(
            "https://computo.oep.org.bo/api/v1/descargar",
            headers=headers,
            json={"tipoArchivo": "excel", "idDepartamento": codigo_departamento},
            timeout=120,
        )
        response.raise_for_status()

        payload = response.json()
        data = pd.ExcelFile(
            BytesIO(base64.b64decode(payload["archivo"])),
            engine="calamine",
        )
        date = payload["fecha"]

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
        for sheet in excel.sheet_names:
            data = parsear_sheet(excel, sheet)
            formar_eleccion(date, data, sheet, departamento)


actualizar()
