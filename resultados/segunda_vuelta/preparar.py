#!/usr/bin/env python3

import json
from pathlib import Path

import pandas as pd

ADMIN = [
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
PARTICIPACION_COLUMNAS = [
    "VotoBlanco",
    "VotoNulo",
    "VotoEmitido",
    "InscritosHabilitados",
]
DEPARTAMENTO_CODIGO = "8"
DEPARTAMENTO_NOMBRE = "Beni"
ELECCION = "gobernador"

BASE = Path(__file__).resolve().parent
REPO_ROOT = BASE.parent.parent
PRIMERA_VUELTA = REPO_ROOT / "resultados" / "primera_vuelta"


def identificar(df, codigo_localidad, codigo_recinto):
    return df[codigo_localidad].astype(str) + "." + df[codigo_recinto].astype(str)


def redondear_partidos(resultados):
    redondeados = {}
    for codigo, row in resultados.items():
        redondeados[codigo] = {
            partido: round(float(valor), 4)
            for partido, valor in row.items()
            if pd.notna(valor) and float(valor) > 0
        }
    return redondeados


def resolver_folder_gobernador():
    candidatos = [
        BASE / "beni" / "gobernador-a",
        BASE / "beni" / "gobernador_a",
    ]
    for folder in candidatos:
        if (folder / "participacion.csv").exists() and (folder / "validos.csv").exists():
            return folder
    raise FileNotFoundError(
        "No se encontro carpeta de gobernador en segunda vuelta (gobernador-a o gobernador_a)."
    )


def cargar_xy_recintos():
    path = PRIMERA_VUELTA / "resultados_gobernador.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        codigo: {"x": row.get("x"), "y": row.get("y")}
        for codigo, row in data.items()
        if str(row.get("municipio", "")).startswith(DEPARTAMENTO_CODIGO)
    }


def preparar():
    folder = resolver_folder_gobernador()
    participacion_raw = pd.read_csv(folder / "participacion.csv")
    validos_raw = pd.read_csv(folder / "validos.csv")

    partidos = [col for col in validos_raw.columns if col not in ADMIN]
    if not partidos:
        raise ValueError("No se encontraron columnas de partidos en validos.csv")

    participacion_raw["codigo"] = identificar(participacion_raw, "CodigoLocalidad", "CodigoRecinto")
    validos_raw["codigo"] = identificar(validos_raw, "CodigoLocalidad", "CodigoRecinto")

    participacion = participacion_raw.groupby("codigo")[
        ["CodigoProvincia", "CodigoSeccion", "NombreMunicipio", "NombreRecinto", *PARTICIPACION_COLUMNAS]
    ].agg(
        {
            "CodigoProvincia": "first",
            "CodigoSeccion": "first",
            "NombreMunicipio": "first",
            "NombreRecinto": "first",
            "VotoBlanco": "sum",
            "VotoNulo": "sum",
            "VotoEmitido": "sum",
            "InscritosHabilitados": "sum",
        }
    )

    resultados_recinto = validos_raw.groupby("codigo")[partidos].sum()
    voto_valido = resultados_recinto.sum(axis=1).rename("voto_valido")

    porcentajes_recinto = resultados_recinto.div(
        resultados_recinto.sum(axis=1).replace(0, pd.NA),
        axis=0,
    ).fillna(0)

    resultados_depto = resultados_recinto.sum(axis=0)
    partido_ganador = resultados_depto.idxmax()
    porcentaje_ganador_depto = float(
        resultados_depto.max() / resultados_depto.sum()
    ) if float(resultados_depto.sum()) > 0 else 0.0

    porcentaje_ganador_recinto = porcentajes_recinto[partido_ganador].rename("ganador")

    xy_por_recinto = cargar_xy_recintos()
    recintos_xy = pd.DataFrame.from_dict(xy_por_recinto, orient="index")

    municipio_codigo = (
        DEPARTAMENTO_CODIGO
        + participacion["CodigoProvincia"].astype(int).astype(str).str.rjust(2, "0")
        + participacion["CodigoSeccion"].astype(int).astype(str).str.rjust(2, "0")
    )

    resultados = pd.DataFrame(
        {
            "municipio": municipio_codigo,
            "recinto": participacion["NombreRecinto"],
            "voto_valido": voto_valido,
            "voto_blanco": participacion["VotoBlanco"],
            "voto_nulo": participacion["VotoNulo"],
            "voto_emitido": participacion["VotoEmitido"],
            "habilitados": participacion["InscritosHabilitados"],
            "ganador": porcentaje_ganador_recinto,
        }
    ).join(recintos_xy, how="left")

    resultados["voto_valido"] = resultados["voto_valido"].fillna(0).astype(int)
    resultados["voto_blanco"] = resultados["voto_blanco"].fillna(0).astype(int)
    resultados["voto_nulo"] = resultados["voto_nulo"].fillna(0).astype(int)
    resultados["voto_emitido"] = resultados["voto_emitido"].fillna(0).astype(int)
    resultados["habilitados"] = resultados["habilitados"].fillna(0).astype(int)
    resultados["validos"] = (
        resultados["voto_valido"].div(resultados["voto_emitido"].replace(0, pd.NA)).fillna(0)
    )
    resultados["ganador"] = resultados["ganador"].fillna(0)

    resultados = resultados[
        [
            "municipio",
            "recinto",
            "voto_valido",
            "voto_blanco",
            "voto_nulo",
            "voto_emitido",
            "validos",
            "habilitados",
            "ganador",
            "x",
            "y",
        ]
    ]

    resultados_json = {}
    for codigo, row in resultados.to_dict(orient="index").items():
        resultados_json[codigo] = {
            "municipio": str(row["municipio"]),
            "recinto": row["recinto"],
            "voto_valido": int(row["voto_valido"]),
            "voto_blanco": int(row["voto_blanco"]),
            "voto_nulo": int(row["voto_nulo"]),
            "voto_emitido": int(row["voto_emitido"]),
            "validos": round(float(row["validos"]), 4),
            "habilitados": int(row["habilitados"]),
            "ganador": round(float(row["ganador"]), 4),
            "x": round(float(row["x"]), 5) if pd.notna(row["x"]) else None,
            "y": round(float(row["y"]), 5) if pd.notna(row["y"]) else None,
        }

    municipios_df = (
        participacion.assign(municipio=municipio_codigo)
        .groupby("municipio")[["NombreMunicipio"]]
        .first()
    )
    municipios_json = {
        str(codigo): {
            "nombre_municipio": row["NombreMunicipio"],
            "departamento": DEPARTAMENTO_NOMBRE,
        }
        for codigo, row in municipios_df.to_dict(orient="index").items()
    }

    scope_codigo = DEPARTAMENTO_CODIGO
    porcentajes_scope = resultados_depto / resultados_depto.sum() if float(resultados_depto.sum()) > 0 else resultados_depto * 0
    partidos_json = {
        "scope_nivel": "departamento",
        "partidos": [
            partido
            for partido, _ in sorted(resultados_depto.items(), key=lambda item: item[1], reverse=True)
        ],
        "scopes": {
            scope_codigo: redondear_partidos({scope_codigo: porcentajes_scope.to_dict()})[scope_codigo]
        },
        "recintos": redondear_partidos(porcentajes_recinto.to_dict(orient="index")),
    }

    departamentos_json = {
        DEPARTAMENTO_CODIGO: {
            "nombre_departamento": DEPARTAMENTO_NOMBRE,
            ELECCION: {
                "nombre": partido_ganador,
                "voto_valido": int(resultados["voto_valido"].sum()),
                "voto_blanco": int(resultados["voto_blanco"].sum()),
                "voto_nulo": int(resultados["voto_nulo"].sum()),
                "voto_emitido": int(resultados["voto_emitido"].sum()),
                "validos": round(
                    float(resultados["voto_valido"].sum()) / float(resultados["voto_emitido"].sum()),
                    4,
                )
                if int(resultados["voto_emitido"].sum()) > 0
                else 0.0,
                "habilitados": int(resultados["habilitados"].sum()),
                "ganador": round(porcentaje_ganador_depto, 4),
            },
        }
    }

    timestamp_value = ""
    for candidate in [BASE / "beni" / "timestamp", BASE / "beni" / "timestamp.txt", BASE / "timestamp", BASE / "timestamp.txt"]:
        if candidate.exists():
            timestamp_value = candidate.read_text(encoding="utf-8").strip()
            if timestamp_value:
                break

    (BASE / "resultados_gobernador.json").write_text(
        json.dumps(resultados_json, ensure_ascii=False),
        encoding="utf-8",
    )
    (BASE / "partidos_gobernador.json").write_text(
        json.dumps(partidos_json, ensure_ascii=False),
        encoding="utf-8",
    )
    (BASE / "municipios.json").write_text(
        json.dumps(municipios_json, ensure_ascii=False),
        encoding="utf-8",
    )
    (BASE / "departamentos.json").write_text(
        json.dumps(departamentos_json, ensure_ascii=False),
        encoding="utf-8",
    )

    municipios_topo_origen = PRIMERA_VUELTA / "municipios.topo.json"
    if municipios_topo_origen.exists():
        (BASE / "municipios.topo.json").write_text(
            municipios_topo_origen.read_text(encoding="utf-8"),
            encoding="utf-8",
        )

    if timestamp_value:
        (BASE / "timestamp").write_text(f"{timestamp_value}\n", encoding="utf-8")


if __name__ == "__main__":
    preparar()
