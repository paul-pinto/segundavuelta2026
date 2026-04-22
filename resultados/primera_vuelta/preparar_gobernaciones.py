#!/usr/bin/env python3

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd
from slugify import slugify

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
PARTICIPACION = ["VotoValido", "VotoEmitido", "InscritosHabilitados"]
DEPARTAMENTOS = [
    "Chuquisaca",
    "La Paz",
    "Cochabamba",
    "Oruro",
    "Potosí",
    "Tarija",
    "Santa Cruz",
    "Beni",
    "Pando",
]
TOP_PARTIDOS_POR_DEPARTAMENTO = {
    "2": 8,
    "4": 5,
}
BASE = Path(__file__).resolve().parent
REPO_ROOT = BASE.parent.parent
GEO = REPO_ROOT / "geo" / "2026" / "recintos.gpkg"
SALIDA_DIR = BASE / "vista_gobernaciones"
SALIDA_MANIFIESTO = SALIDA_DIR / "manifiesto.json"


def identificar(df, codigo_localidad, codigo_recinto):
    return df[codigo_localidad].astype(str) + "." + df[codigo_recinto].astype(str)


def guardar_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False)


def limpiar_salida():
    SALIDA_DIR.mkdir(parents=True, exist_ok=True)
    for path in SALIDA_DIR.glob("*.json"):
        path.unlink()


def cargar_recintos_geo():
    recintos = gpd.read_file(GEO)
    recintos["codigo"] = identificar(recintos, "asiento", "recinto")
    recintos["x"] = recintos.geometry.x
    recintos["y"] = recintos.geometry.y
    return recintos.set_index("codigo")[["geometry", "x", "y"]]


def cargar_participacion(path_participacion, codigo_depto):
    df = pd.read_csv(path_participacion)
    df["codigo"] = identificar(df, "CodigoLocalidad", "CodigoRecinto")
    df["municipio"] = (
        str(codigo_depto)
        + df.CodigoProvincia.astype(str).str.rjust(2, "0")
        + df.CodigoSeccion.astype(str).str.rjust(2, "0")
    )

    admin = df.groupby("codigo")[["NombreRecinto", "NombreMunicipio", "municipio"]].first()
    admin.columns = ["recinto", "municipio_nombre", "municipio_codigo"]

    agregada = df.groupby("codigo")[PARTICIPACION].sum()
    agregada.rename(
        columns={
            "VotoValido": "voto_valido",
            "VotoEmitido": "voto_emitido",
            "InscritosHabilitados": "habilitados",
        },
        inplace=True,
    )
    return pd.concat([admin, agregada], axis=1)


def cargar_validos(path_validos):
    df = pd.read_csv(path_validos)
    partidos = [col for col in df.columns if col not in ADMIN]
    df["codigo"] = identificar(df, "CodigoLocalidad", "CodigoRecinto")
    return df.groupby("codigo")[partidos].sum()


def top_partidos_por_departamento(resultados_departamento, n=3):
    return (
        resultados_departamento.sort_values(ascending=False)
        .head(n)
        .index.tolist()
    )


def compactar_resultados(serie_resultados, partidos_destacados):
    data = {
        partido: int(serie_resultados.get(partido, 0))
        for partido in partidos_destacados
    }
    otros = int(serie_resultados.drop(labels=partidos_destacados, errors="ignore").sum())
    data["otros"] = otros
    return data


def ganador_compactado(resultados_compactados):
    return max(resultados_compactados, key=resultados_compactados.get)


def estimar_centro(recintos_geo):
    geometrias = gpd.GeoSeries(recintos_geo["geometry"])
    union = geometrias.union_all()
    centroid = union.convex_hull.centroid
    return [round(float(centroid.x), 5), round(float(centroid.y), 5)]


def ganador_real(resultados_departamento):
    return resultados_departamento.sort_values(ascending=False).index[0]


def preparar_departamento(codigo_depto, nombre_depto, recintos_geo):
    depto_slug = slugify(nombre_depto)
    folder = BASE / depto_slug / "gobernador-a"

    participacion = cargar_participacion(folder / "participacion.csv", codigo_depto)
    validos = cargar_validos(folder / "validos.csv")
    tabla = participacion.join(validos, how="inner").join(recintos_geo, how="inner")
    tabla = tabla.dropna(subset=["x", "y"])

    partidos = validos.columns.tolist()
    resultados_departamento = tabla[partidos].sum()
    n_partidos = TOP_PARTIDOS_POR_DEPARTAMENTO.get(codigo_depto, 3)
    partidos_destacados = top_partidos_por_departamento(
        resultados_departamento, n=n_partidos
    )
    resultados_depto = compactar_resultados(
        resultados_departamento, partidos_destacados
    )

    recintos = {}
    for codigo, row in tabla.iterrows():
        resultados_recinto = compactar_resultados(row[partidos], partidos_destacados)
        recintos[codigo] = {
            "habilitados": int(row["habilitados"]),
            "ganador": ganador_real(row[partidos]),
            "recinto": row["recinto"],
            "municipio": row["municipio_nombre"],
            "x": round(float(row["x"]), 5),
            "y": round(float(row["y"]), 5),
            "resultados": resultados_recinto,
        }

    manifiesto = {
        "nombre": nombre_depto,
        "center": estimar_centro(tabla),
        "partidos": resultados_depto,
        "ganador": ganador_real(resultados_departamento),
    }

    return manifiesto, recintos


def main():
    limpiar_salida()
    recintos_geo = cargar_recintos_geo()
    manifiesto = {}

    for i, nombre_depto in enumerate(DEPARTAMENTOS, start=1):
        codigo_depto = str(i)
        manifiesto_depto, recintos_depto = preparar_departamento(
            codigo_depto,
            nombre_depto,
            recintos_geo,
        )
        manifiesto[codigo_depto] = manifiesto_depto
        guardar_json(SALIDA_DIR / f"{codigo_depto}.json", recintos_depto)

    guardar_json(SALIDA_MANIFIESTO, manifiesto)


if __name__ == "__main__":
    main()
