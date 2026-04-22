#!/usr/bin/env python3

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd
from slugify import slugify

ELECCIONES = {
    "alcalde": {
        "slug": "alcaldesaalcalde",
        "scope": "municipio",
    },
    "concejales": {
        "slug": "concejales",
        "scope": "municipio",
    },
    "corregidor": {
        "slug": "corregidor-a",
        "scope": "municipio",
    },
    "gobernador": {
        "slug": "gobernador-a",
        "scope": "departamento",
    },
    "asambleista": {
        "slug": "asambleista-territorio",
        "scope": "departamento",
    },
    "subgobernador": {
        "slug": "subgobernador-a",
        "scope": "departamento",
    },
}
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
PARTICIPACION = [
    "VotoBlanco",
    "VotoNulo",
    "VotoEmitido",
    "InscritosHabilitados",
]

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

BASE = Path(__file__).resolve().parent
REPO_ROOT = BASE.parent.parent
GEO = REPO_ROOT / "geo" / "2026" / "recintos.gpkg"


def identificar(df, codigo_localidad, codigo_recinto):
    return df[codigo_localidad].astype(str) + "." + df[codigo_recinto].astype(str)


def procesar_recintos():
    recintos = gpd.read_file(GEO)
    recintos["codigo"] = identificar(recintos, "asiento", "recinto")
    recintos["x"] = recintos.geometry.x
    recintos["y"] = recintos.geometry.y
    return recintos.set_index("codigo")[["x", "y"]]


def procesar_validos(path, codigo_depto, scope_por_codigo):
    df = pd.read_csv(path)
    partidos = [col for col in df.columns if col not in ADMIN]
    df["codigo"] = identificar(df, "CodigoLocalidad", "CodigoRecinto")
    df = df.join(scope_por_codigo.rename("scope"), on="codigo")

    resultados_scope = df.groupby("scope")[partidos].sum()
    porcentajes_scope = resultados_scope.div(resultados_scope.sum(axis=1), axis=0)
    ganador_scope = pd.DataFrame(
        {
            "partido_ganador": porcentajes_scope.idxmax(axis=1),
            "porcentaje_ganador": porcentajes_scope.max(axis=1),
        }
    )

    resultados_recinto = df.groupby("codigo")[partidos].sum()
    porcentajes_recinto = resultados_recinto.div(resultados_recinto.sum(axis=1), axis=0)
    scope_recinto = df.groupby("codigo")["scope"].first().reindex(porcentajes_recinto.index)
    partido_por_codigo = ganador_scope["partido_ganador"].reindex(scope_recinto).set_axis(
        porcentajes_recinto.index
    )
    indice_partidos = {partido: i for i, partido in enumerate(porcentajes_recinto.columns)}
    partido_idx = partido_por_codigo.map(indice_partidos)
    porcentaje_ganador = pd.Series(
        porcentajes_recinto.to_numpy()[
            range(len(porcentajes_recinto)),
            partido_idx.to_numpy(),
        ],
        index=porcentajes_recinto.index,
    )
    porcentaje_ganador.rename("ganador", inplace=True)

    voto_valido_recinto = resultados_recinto.sum(axis=1).rename("voto_valido")
    voto_valido_scope = resultados_scope.sum(axis=1).rename("voto_valido")

    return (
        ganador_scope,
        porcentaje_ganador,
        porcentajes_recinto,
        porcentajes_scope,
        voto_valido_recinto,
        voto_valido_scope,
    )


def procesar_participacion(path, codigo_depto):
    df = pd.read_csv(path)
    df["codigo"] = identificar(df, "CodigoLocalidad", "CodigoRecinto")

    df["municipio"] = (
        str(codigo_depto)
        + df.CodigoProvincia.astype(str).str.rjust(2, "0")
        + df.CodigoSeccion.astype(str).str.rjust(2, "0")
    )

    recintos_admin = df.groupby("codigo")[["municipio", "NombreRecinto"]].first()
    recintos_admin.columns = ["municipio", "recinto"]

    participacion_agregada = df.groupby("codigo")[PARTICIPACION].sum()
    participacion_agregada.rename(
        columns={
            "VotoBlanco": "voto_blanco",
            "VotoNulo": "voto_nulo",
            "VotoEmitido": "voto_emitido",
            "InscritosHabilitados": "habilitados",
        },
        inplace=True,
    )
    participacion_agregada["voto_valido"] = 0
    participacion_agregada["validos"] = 0.0

    participacion = pd.concat(
        [
            recintos_admin,
            participacion_agregada[
                [
                    "voto_valido",
                    "voto_blanco",
                    "voto_nulo",
                    "voto_emitido",
                    "validos",
                    "habilitados",
                ]
            ],
        ],
        axis=1,
    )

    municipios = df.groupby("municipio")[["NombreMunicipio"]].first()
    municipios.rename(columns={"NombreMunicipio": "nombre_municipio"}, inplace=True)

    return municipios, participacion


def agregar_participacion_scope(participacion, scope_por_codigo):
    scope_participacion = participacion.join(scope_por_codigo.rename("scope"))
    agregada = scope_participacion.groupby("scope")[
        ["voto_valido", "voto_blanco", "voto_nulo", "voto_emitido", "habilitados"]
    ].sum()
    agregada["validos"] = agregada["voto_valido"] / agregada["voto_emitido"]
    return agregada[
        [
            "voto_valido",
            "voto_blanco",
            "voto_nulo",
            "voto_emitido",
            "validos",
            "habilitados",
        ]
    ]


def actualizar_validos_desde_partidos(participacion, voto_valido_recinto):
    participacion_corregida = participacion.copy()
    voto_valido_recinto = voto_valido_recinto.reindex(participacion_corregida.index).fillna(0)
    participacion_corregida["voto_valido"] = voto_valido_recinto.astype(int)
    participacion_corregida["validos"] = (
        participacion_corregida["voto_valido"] / participacion_corregida["voto_emitido"]
    )
    participacion_corregida["validos"] = participacion_corregida["validos"].fillna(0)
    return participacion_corregida


def guardar_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def redondear_metricas(resultados):
    for row in resultados.values():
        for campo in ("validos", "ganador"):
            if campo in row and pd.notna(row[campo]):
                row[campo] = round(float(row[campo]), 4)
    return resultados


def redondear_partidos(resultados):
    redondeados = {}
    for codigo, row in resultados.items():
        redondeados[codigo] = {
            partido: round(float(valor), 4)
            for partido, valor in row.items()
            if pd.notna(valor)
        }
    return redondeados


def guardar_timestamp_agregado():
    timestamps = []
    for departamento in DEPARTAMENTOS:
        timestamp_path = BASE / slugify(departamento) / "timestamp"
        if timestamp_path.exists():
            timestamps.append(timestamp_path.read_text().strip())

    if not timestamps:
        return

    (BASE / "timestamp").write_text(f"{max(timestamps)}\n")


def main():
    municipios_data = {}
    departamentos_data = {}
    resultados_por_eleccion = {eleccion: {} for eleccion in ELECCIONES}
    partidos_por_eleccion = {
        eleccion: {
            "scope_nivel": config["scope"],
            "partidos_totales": {},
            "scopes": {},
            "recintos": {},
        }
        for eleccion, config in ELECCIONES.items()
    }
    recintos = procesar_recintos()

    for i, departamento in enumerate(DEPARTAMENTOS):
        codigo_depto = str(i + 1)
        depto_slug = slugify(departamento)
        municipios_depto = None

        for eleccion, config in ELECCIONES.items():
            folder = BASE / depto_slug / config["slug"]
            if not (folder / "participacion.csv").exists() or not (folder / "validos.csv").exists():
                continue
            municipios, participacion = procesar_participacion(
                folder / "participacion.csv", i + 1
            )

            if municipios_depto is None:
                municipios_depto = municipios.copy()
                municipios_depto["departamento"] = departamento
            else:
                municipios_depto = municipios_depto.join(
                    municipios[["nombre_municipio"]].rename(
                        columns={"nombre_municipio": "nombre_municipio_nuevo"}
                    ),
                    how="outer",
                )
                municipios_depto["nombre_municipio"] = municipios_depto[
                    "nombre_municipio"
                ].fillna(municipios_depto.pop("nombre_municipio_nuevo"))
                municipios_depto["departamento"] = municipios_depto[
                    "departamento"
                ].fillna(departamento)

            if config["scope"] == "departamento":
                scope_por_codigo = pd.Series(
                    codigo_depto, index=participacion.index, name="scope"
                )
                (
                    ganador_scope,
                    porcentaje_ganador,
                    porcentajes_recinto,
                    porcentajes_scope,
                    voto_valido_recinto,
                    _,
                ) = procesar_validos(folder / "validos.csv", i + 1, scope_por_codigo)
                participacion = actualizar_validos_desde_partidos(
                    participacion, voto_valido_recinto
                )
                participacion_scope = agregar_participacion_scope(
                    participacion, scope_por_codigo
                )
                departamentos_data.setdefault(
                    codigo_depto,
                    {"nombre_departamento": departamento},
                )[eleccion] = {
                    "nombre": ganador_scope.loc[codigo_depto, "partido_ganador"],
                    "voto_valido": int(
                        participacion_scope.loc[codigo_depto, "voto_valido"]
                    ),
                    "voto_blanco": int(
                        participacion_scope.loc[codigo_depto, "voto_blanco"]
                    ),
                    "voto_nulo": int(
                        participacion_scope.loc[codigo_depto, "voto_nulo"]
                    ),
                    "voto_emitido": int(
                        participacion_scope.loc[codigo_depto, "voto_emitido"]
                    ),
                    "validos": round(
                        float(participacion_scope.loc[codigo_depto, "validos"]), 4
                    ),
                    "habilitados": int(
                        participacion_scope.loc[codigo_depto, "habilitados"]
                    ),
                    "ganador": round(
                        float(ganador_scope.loc[codigo_depto, "porcentaje_ganador"]),
                        4,
                    ),
                }
            else:
                scope_por_codigo = participacion["municipio"]
                (
                    ganador_scope,
                    porcentaje_ganador,
                    porcentajes_recinto,
                    porcentajes_scope,
                    voto_valido_recinto,
                    _,
                ) = procesar_validos(folder / "validos.csv", i + 1, scope_por_codigo)
                participacion = actualizar_validos_desde_partidos(
                    participacion, voto_valido_recinto
                )
                participacion_scope = agregar_participacion_scope(
                    participacion, scope_por_codigo
                )
                for municipio_codigo, row in ganador_scope.iterrows():
                    municipios_data.setdefault(
                        municipio_codigo,
                        {
                            "nombre_municipio": municipios_depto.loc[
                                municipio_codigo, "nombre_municipio"
                            ],
                            "departamento": departamento,
                        },
                    )[eleccion] = {
                        "nombre": row["partido_ganador"],
                        "voto_valido": int(
                            participacion_scope.loc[municipio_codigo, "voto_valido"]
                        ),
                        "voto_blanco": int(
                            participacion_scope.loc[municipio_codigo, "voto_blanco"]
                        ),
                        "voto_nulo": int(
                            participacion_scope.loc[municipio_codigo, "voto_nulo"]
                        ),
                        "voto_emitido": int(
                            participacion_scope.loc[municipio_codigo, "voto_emitido"]
                        ),
                        "validos": round(
                            float(participacion_scope.loc[municipio_codigo, "validos"]),
                            4,
                        ),
                        "habilitados": int(
                            participacion_scope.loc[municipio_codigo, "habilitados"]
                        ),
                        "ganador": round(float(row["porcentaje_ganador"]), 4),
                    }

            partidos_eleccion = partidos_por_eleccion[eleccion]
            for partido, total in porcentajes_recinto.sum(axis=0).items():
                partidos_eleccion["partidos_totales"][partido] = (
                    partidos_eleccion["partidos_totales"].get(partido, 0.0) + float(total)
                )
            partidos_eleccion["recintos"].update(
                redondear_partidos(
                    {
                        codigo: {
                            partido: valor
                            for partido, valor in row.items()
                            if pd.notna(valor) and valor > 0
                        }
                        for codigo, row in porcentajes_recinto.to_dict(orient="index").items()
                    }
                )
            )
            partidos_eleccion["scopes"].update(
                redondear_partidos(
                    {
                        str(scope): {
                            partido: valor
                            for partido, valor in row.items()
                            if pd.notna(valor) and valor > 0
                        }
                        for scope, row in porcentajes_scope.to_dict(orient="index").items()
                    }
                )
            )

            resultados_eleccion = pd.concat(
                [participacion, porcentaje_ganador, recintos], axis=1
            ).dropna()[
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
            resultados_por_eleccion[eleccion].update(
                redondear_metricas(resultados_eleccion.to_dict(orient="index"))
            )

        for municipio_codigo, row in municipios_depto.to_dict(orient="index").items():
            municipios_data.setdefault(
                municipio_codigo,
                {
                    "nombre_municipio": row["nombre_municipio"],
                    "departamento": row["departamento"],
                },
            )

    guardar_json(BASE / "municipios.json", municipios_data)
    guardar_json(BASE / "departamentos.json", departamentos_data)
    for eleccion, resultados in resultados_por_eleccion.items():
        guardar_json(BASE / f"resultados_{eleccion}.json", resultados)
    for eleccion, data in partidos_por_eleccion.items():
        partidos_ordenados = [
            partido
            for partido, _ in sorted(
                data["partidos_totales"].items(), key=lambda item: item[1], reverse=True
            )
        ]
        guardar_json(
            BASE / f"partidos_{eleccion}.json",
            {
                "scope_nivel": data["scope_nivel"],
                "partidos": partidos_ordenados,
                "scopes": data["scopes"],
                "recintos": data["recintos"],
            },
        )
    guardar_timestamp_agregado()


if __name__ == "__main__":
    main()
