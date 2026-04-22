#!/usr/bin/env python3

from pathlib import Path

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
DEPARTAMENTOS = {
    "Chuquisaca": ("AGN", "PATRIA-UNIDOS"),
    "Oruro": ("JACHAJAKISASOLFESORC", "PATRIA-ORURO"),
    "Tarija": ("PATRIA", "CDC"),
    "Santa Cruz": ("LIBRE", "SPT"),
    "Beni": ("PATRIA-UNIDOS", "MNR"),
}

BASE = Path(__file__).resolve().parent
PRIMERA_VUELTA = BASE.parent / "primera_vuelta"
SEGUNDA_VUELTA = BASE


def distribuir_validos(validos_df, participacion_df, candidaturas):
    seleccion = validos_df[ADMIN + list(candidaturas)].copy()
    votos_validos = participacion_df["VotoValido"].fillna(0).astype(float)

    base = seleccion[list(candidaturas)].fillna(0).astype(float)
    total_base = base.sum(axis=1)

    depto_totales = base.sum(axis=0)
    if float(depto_totales.sum()) > 0:
        fallback = depto_totales / float(depto_totales.sum())
    else:
        fallback = pd.Series(
            [0.5, 0.5],
            index=list(candidaturas),
            dtype=float,
        )

    shares = base.div(total_base.replace(0, pd.NA), axis=0).astype(float)
    fallback_df = pd.DataFrame([fallback.to_dict()] * len(shares), index=shares.index)
    shares = shares.where(shares.notna(), fallback_df)
    redistribuidos = shares.mul(votos_validos, axis=0)

    # Enteros consistentes con el total de voto válido por fila.
    enteros = redistribuidos.round().astype(int)
    diferencia = votos_validos.astype(int) - enteros.sum(axis=1)
    primer_candidato = candidaturas[0]
    enteros[primer_candidato] = enteros[primer_candidato] + diferencia

    return pd.concat([seleccion[ADMIN], enteros[list(candidaturas)]], axis=1)


def copiar_timestamp(origen, destino):
    timestamp_origen = origen / "timestamp"
    if timestamp_origen.exists():
        destino.write_text(timestamp_origen.read_text())


def preparar_departamento(nombre_departamento, candidaturas):
    slug = slugify(nombre_departamento)
    origen = PRIMERA_VUELTA / slug / "gobernador-a"
    destino = SEGUNDA_VUELTA / slug / "gobernador-a"
    destino.mkdir(parents=True, exist_ok=True)

    participacion = pd.read_csv(origen / "participacion.csv")
    validos = pd.read_csv(origen / "validos.csv")
    faltantes = [c for c in candidaturas if c not in validos.columns]
    if faltantes:
        raise ValueError(
            f"Faltan candidaturas {faltantes} en {origen / 'validos.csv'}"
        )

    participacion.to_csv(destino / "participacion.csv", index=False)
    validos_mock = distribuir_validos(validos, participacion, candidaturas)
    validos_mock.to_csv(destino / "validos.csv", index=False)

    copiar_timestamp(PRIMERA_VUELTA / slug, SEGUNDA_VUELTA / slug / "timestamp")


def main():
    for nombre_departamento, candidaturas in DEPARTAMENTOS.items():
        preparar_departamento(nombre_departamento, candidaturas)


if __name__ == "__main__":
    main()
