import * as d3 from "../../_npm/d3@7.9.0/66d82917.js";
import { feature as topojsonFeature } from "../../_npm/topojson-client@3.1.0/edd9ee95.js";

async function cargarJsonConFallbacks(urls, fallbackValue = null) {
  let ultimoError = null;
  for (const url of urls.filter(Boolean)) {
    try {
      return await d3.json(url);
    } catch (error) {
      ultimoError = error;
    }
  }
  if (fallbackValue != null) return fallbackValue;
  throw ultimoError ?? new Error("No se pudo cargar JSON");
}

async function cargarTextoConFallbacks(urls, fallbackValue = null) {
  let ultimoError = null;
  for (const url of urls.filter(Boolean)) {
    try {
      return await d3.text(url);
    } catch (error) {
      ultimoError = error;
    }
  }
  if (fallbackValue != null) return fallbackValue;
  throw ultimoError ?? new Error("No se pudo cargar texto");
}

function rutasLocalesPartidos(archivoPartidos, baseLocal) {
  return rutasLocalesArchivo(archivoPartidos, baseLocal);
}

function rutasLocalesArchivo(archivo, baseLocal) {
  const rutas = [];
  if (baseLocal) rutas.push(`${baseLocal}${archivo}`);
  rutas.push(new URL(`../data/primera_vuelta/${archivo}`, import.meta.url).href);
  rutas.push(`./data/primera_vuelta/${archivo}`);
  rutas.push(`/data/primera_vuelta/${archivo}`);
  if (typeof window !== "undefined") {
    const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
    if (firstSegment) {
      rutas.push(`/${firstSegment}/data/primera_vuelta/${archivo}`);
    }
  }
  return rutas;
}

export async function cargarDatos(
  base,
  archivoResultados,
  archivoPartidos,
  baseLocal = null,
  partidosLocales = null,
  dataLocales = null,
) {
  const resultadoLocal = dataLocales?.resultados?.[archivoResultados] ?? null;
  const partidosLocal = dataLocales?.partidos?.[archivoPartidos] ?? null;
  const municipiosLocal = dataLocales?.municipios ?? null;
  const departamentosLocal = dataLocales?.departamentos ?? null;
  const topoLocal = dataLocales?.municipiosTopo ?? null;
  const timestampLocal = dataLocales?.timestamp ?? null;

  const [
    resultadosRawOriginal,
    partidosRawOriginal,
    municipiosOriginal,
    departamentosOriginal,
    territoriosTopo,
    timestampRaw,
  ] =
    await Promise.all([
      resultadoLocal ??
        (await cargarJsonConFallbacks([
          ...rutasLocalesArchivo(archivoResultados, baseLocal),
          `${base}${archivoResultados}`,
        ])),
      partidosLocal ??
        (await cargarJsonConFallbacks(
          [
            ...rutasLocalesPartidos(archivoPartidos, baseLocal),
            `${base}${archivoPartidos}`,
          ],
          partidosLocales ?? {partidos: [], recintos: {}, scopes: {}},
        )),
      municipiosLocal ??
        (await cargarJsonConFallbacks([
          ...rutasLocalesArchivo("municipios.json", baseLocal),
          `${base}municipios.json`,
        ])),
      departamentosLocal ??
        (await cargarJsonConFallbacks([
          ...rutasLocalesArchivo("departamentos.json", baseLocal),
          `${base}departamentos.json`,
        ])),
      topoLocal ??
        (await cargarJsonConFallbacks([
          ...rutasLocalesArchivo("municipios.topo.json", baseLocal),
          `${base}municipios.topo.json`,
        ])),
      timestampLocal ??
        (await cargarTextoConFallbacks([
          ...rutasLocalesArchivo("timestamp", baseLocal),
          `${base}timestamp`,
        ], "")),
    ]);

  const resultadosRaw = filtrarResultadosABeni(resultadosRawOriginal);
  const municipios = filtrarMunicipiosABeni(municipiosOriginal);
  const departamentos = filtrarDepartamentosABeni(departamentosOriginal);
  const territoriosRaw = filtrarTerritoriosABeni(
    topojsonAFeatureCollection(territoriosTopo),
  );
  const partidosRaw = filtrarPartidosABeni(
    partidosRawOriginal,
    resultadosRaw,
    Object.keys(municipios),
  );

  return {
    resultadosRaw,
    partidosRaw,
    municipios,
    departamentos,
    territoriosRaw,
    timestamp: formatearTimestamp(timestampRaw),
  };
}

function formatearTimestamp(timestampRaw) {
  const timestamp = timestampRaw?.trim();
  if (!timestamp) return null;

  const [fecha, hora] = timestamp.split(" ");
  if (!fecha || !hora) return null;

  const [year, month, day] = fecha.split("-");
  const [hours, minutes] = hora.split(":");
  if (!year || !month || !day || !hours || !minutes) return null;

  return {
    fecha: `${day}/${month}/${year}`,
    hora: `${hours}:${minutes}`,
  };
}

function topojsonAFeatureCollection(topology) {
  const objectName = Object.keys(topology?.objects ?? {})[0];
  if (!objectName) {
    return {type: "FeatureCollection", features: []};
  }
  return topojsonFeature(topology, topology.objects[objectName]);
}

const ELECCIONES_MUNICIPALES = new Set(["alcalde", "corregidor", "concejales"]);
const ELECCIONES_DEPARTAMENTALES = new Set([
  "gobernador",
  "asambleista",
  "subgobernador",
]);

function esEleccionMunicipal(eleccion) {
  return ELECCIONES_MUNICIPALES.has(eleccion);
}

function esEleccionDepartamental(eleccion) {
  return ELECCIONES_DEPARTAMENTALES.has(eleccion);
}

export function crearRecintos(
  resultadosRaw,
  municipios,
  eleccion,
  partidosRaw,
  partido,
  ganadorSiglaGlobal = null,
  vistaDepartamental = "provincia",
) {
  return crearRecintosConDepartamentos(
    resultadosRaw,
    municipios,
    {},
    eleccion,
    partidosRaw,
    partido,
    ganadorSiglaGlobal,
    vistaDepartamental,
  );
}

export function crearRecintosConDepartamentos(
  resultadosRaw,
  municipios,
  departamentos,
  eleccion,
  partidosRaw,
  partido = null,
  ganadorSiglaGlobal = null,
  vistaDepartamental = "provincia",
) {
  const recintosPartidos = partidosRaw?.recintos ?? {};
  const ganadorScopePorRecinto = esEleccionDepartamental(eleccion)
    ? construirGanadorScopePorRecinto(
        resultadosRaw,
        recintosPartidos,
        vistaDepartamental === "municipio" ? "municipio" : "provincia",
      )
    : {};
  return {
    type: "FeatureCollection",
    features: Object.entries(resultadosRaw)
      .map(([codigo, value]) => {
        const municipio = municipios[value.municipio] ?? null;
        const departamento = municipio?.departamento ?? null;
        const provinciaCodigo = obtenerProvinciaCodigo(value.municipio);
        const provinciaNombre = nombreProvinciaBeni(provinciaCodigo);
        const departamentoCodigo = normalizarDepartamentoCodigo(value.municipio);
        const eleccionMunicipal = esEleccionMunicipal(eleccion);
        const partidoGanador =
          eleccionMunicipal
            ? municipio?.[eleccion]?.nombre ?? null
            : ganadorScopePorRecinto[codigo] ??
              departamentos[departamentoCodigo]?.[eleccion]?.nombre ??
              null;
        const partidosRecinto = recintosPartidos[codigo] ?? {};
        const votoValido = obtenerVotoValido(value);
        const votoBlanco = obtenerConteoVotos(value?.voto_blanco);
        const votoNulo = obtenerConteoVotos(value?.voto_nulo);
        const votoEmitido =
          obtenerConteoVotos(value?.voto_emitido) ?? votoValido + votoBlanco + votoNulo;
        const baseVotos = votoValido;
        const partidosDetalle = construirDetallePartidos(partidosRecinto, baseVotos);
        const ganadorSigla = normalizarSigla(
          ganadorSiglaGlobal ?? partidosDetalle[0]?.sigla ?? partidoGanador,
        );
        const partidoValor = Number(partidosRecinto[partido] ?? 0);
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [+value.x, +value.y],
          },
          properties: {
            codigo,
            codigo_hover: codigo,
            nivel: "recinto",
            municipio_codigo: value.municipio,
            provincia_codigo: provinciaCodigo,
            provincia_nombre: provinciaNombre,
            departamento_codigo: departamentoCodigo,
            municipio_nombre: municipio?.nombre_municipio ?? null,
            departamento,
            recinto: value.recinto,
            habilitados: +value.habilitados || 0,
            voto_valido: votoValido,
            voto_blanco: votoBlanco,
            voto_nulo: votoNulo,
            voto_emitido: votoEmitido,
            validos: +value.validos,
            invalido: 1 - +value.validos,
            ganador: +value.ganador,
            ganador_sigla: ganadorSigla,
            partido: partidoValor,
            partidos_detalle_json: JSON.stringify(partidosDetalle),
            partido_ganador_scope: partidoGanador,
          },
        };
      })
      .filter(
        (feature) =>
          Number.isFinite(feature.geometry.coordinates[0]) &&
          Number.isFinite(feature.geometry.coordinates[1])
      ),
  };
}

export function crearTerritorios(
  territoriosRaw,
  municipios,
  departamentos,
  eleccion,
  partidosRaw,
  resultadosRaw = {},
  vistaGobernador = "provincia",
  partido = null,
  ganadorSiglaGlobal = null,
) {
  const partidosScope = partidosRaw?.scopes ?? {};
  const agregadosDepartamentales =
    esEleccionDepartamental(eleccion)
      ? construirAgregadosDepartamentales(resultadosRaw, partidosRaw)
      : {porProvincia: {}, porMunicipio: {}};
  return {
    type: "FeatureCollection",
    features: territoriosRaw.features
      .map((feature, index) => {
        const municipioCodigo = normalizarMunicipioCodigo(
          feature.properties?.municipio,
        );
        const provinciaCodigo = obtenerProvinciaCodigo(municipioCodigo);
        const provinciaNombre = nombreProvinciaBeni(provinciaCodigo);
        const departamentoCodigo = `${feature.properties?.departamento ?? ""}`;
        const municipio = municipios[municipioCodigo] ?? null;
        const departamento = departamentos[departamentoCodigo] ?? null;
        const eleccionMunicipal = esEleccionMunicipal(eleccion);
        const esVistaProvinciaDepartamental =
          esEleccionDepartamental(eleccion) && vistaGobernador !== "municipio";
        const agregadoDepartamental = esVistaProvinciaDepartamental
          ? agregadosDepartamentales.porProvincia[provinciaCodigo] ?? null
          : agregadosDepartamentales.porMunicipio[municipioCodigo] ?? null;
        const agregado =
          eleccionMunicipal ? municipio?.[eleccion] ?? null : agregadoDepartamental;
        const nombreTerritorio =
          eleccionMunicipal
            ? municipio?.nombre_municipio ?? null
            : esVistaProvinciaDepartamental
            ? provinciaNombre ?? null
            : municipio?.nombre_municipio ?? null;
        const nombreDepartamento =
          eleccionMunicipal
            ? municipio?.departamento ?? null
            : departamento?.nombre_departamento ?? null;

        const scopeCodigo = eleccionMunicipal ? municipioCodigo : departamentoCodigo;
        const partidosDetalle =
          eleccionMunicipal
            ? construirDetallePartidos(
                partidosScope[scopeCodigo] ?? {},
                obtenerVotoValido(agregado),
              )
            : agregadoDepartamental?.partidos_detalle ?? [];
        const partidoValor =
          eleccionMunicipal
            ? Number((partidosScope[scopeCodigo] ?? {})[partido] ?? 0)
            : Number(agregadoDepartamental?.partidos_por_sigla?.[partido] ?? 0);
        const ganadorSigla =
          ganadorSiglaGlobal != null
            ? normalizarSigla(ganadorSiglaGlobal)
            : esEleccionDepartamental(eleccion)
            ? normalizarSigla(agregadoDepartamental?.ganador_sigla)
            : normalizarSigla(partidosDetalle[0]?.sigla ?? agregado?.nombre);
        return {
          type: "Feature",
          id: `territorio-${municipioCodigo || index}`,
          geometry: feature.geometry,
          properties: {
            feature_id: `territorio-${municipioCodigo || index}`,
            codigo_hover: eleccionMunicipal
              ? municipioCodigo
              : esVistaProvinciaDepartamental
              ? provinciaCodigo
              : municipioCodigo,
            municipio_codigo: municipioCodigo,
            provincia_codigo: provinciaCodigo,
            provincia_nombre: provinciaNombre,
            departamento_codigo: departamentoCodigo,
            nivel: eleccionMunicipal
              ? "municipio"
              : esVistaProvinciaDepartamental
              ? "provincia"
              : "municipio",
            nombre_territorio: nombreTerritorio,
            municipio_nombre:
              eleccionMunicipal || !esVistaProvinciaDepartamental
                ? municipio?.nombre_municipio
                : null,
            departamento: nombreDepartamento,
            habilitados: agregado?.habilitados ?? null,
            voto_valido: obtenerVotoValido(agregado),
            voto_blanco: obtenerConteoVotos(agregado?.voto_blanco),
            voto_nulo: obtenerConteoVotos(agregado?.voto_nulo),
            voto_emitido:
              obtenerConteoVotos(agregado?.voto_emitido) ??
              (obtenerVotoValido(agregado) +
                (obtenerConteoVotos(agregado?.voto_blanco) ?? 0) +
                (obtenerConteoVotos(agregado?.voto_nulo) ?? 0)),
            validos: agregado?.validos ?? null,
            invalido:
              agregado?.validos != null ? 1 - Number(agregado.validos) : null,
            ganador: agregado?.ganador ?? null,
            ganador_sigla: ganadorSigla,
            partido: partidoValor,
            partidos_detalle_json: JSON.stringify(partidosDetalle),
            partido_ganador_scope:
              eleccionMunicipal
                ? agregado?.nombre ?? null
                : agregadoDepartamental?.ganador_sigla ?? null,
          },
        };
      })
      .filter((feature) => feature.properties.nombre_territorio != null),
  };
}

function normalizarMunicipioCodigo(value) {
  return `${value ?? ""}`.replace(/^0+/, "");
}

const DEPARTAMENTO_BENI_CODIGO = "8";

function esCodigoMunicipioBeni(codigoMunicipio) {
  return normalizarMunicipioCodigo(codigoMunicipio).startsWith(DEPARTAMENTO_BENI_CODIGO);
}

function esCodigoDepartamentoBeni(codigoDepartamento) {
  return normalizarDepartamentoCodigo(codigoDepartamento) === DEPARTAMENTO_BENI_CODIGO;
}

function filtrarResultadosABeni(resultadosRaw = {}) {
  return Object.fromEntries(
    Object.entries(resultadosRaw).filter(([, value]) => esCodigoMunicipioBeni(value?.municipio)),
  );
}

function filtrarMunicipiosABeni(municipios = {}) {
  return Object.fromEntries(
    Object.entries(municipios).filter(([codigo]) => esCodigoMunicipioBeni(codigo)),
  );
}

function filtrarDepartamentosABeni(departamentos = {}) {
  return Object.fromEntries(
    Object.entries(departamentos).filter(([codigo]) => esCodigoDepartamentoBeni(codigo)),
  );
}

function filtrarTerritoriosABeni(territoriosRaw = {type: "FeatureCollection", features: []}) {
  return {
    ...territoriosRaw,
    features: (territoriosRaw.features ?? []).filter((feature) => {
      const municipioCodigo = normalizarMunicipioCodigo(feature?.properties?.municipio);
      const departamentoCodigo = normalizarDepartamentoCodigo(feature?.properties?.departamento);
      return (
        municipioCodigo.startsWith(DEPARTAMENTO_BENI_CODIGO) ||
        departamentoCodigo === DEPARTAMENTO_BENI_CODIGO
      );
    }),
  };
}

function construirAgregadosDepartamentales(resultadosRaw = {}, partidosRaw = {}) {
  const recintosPartidos = partidosRaw?.recintos ?? {};
  const provinciaAcumulada = {};
  const municipioAcumulado = {};

  for (const [codigoRecinto, value] of Object.entries(resultadosRaw ?? {})) {
    const municipioCodigo = normalizarMunicipioCodigo(value?.municipio);
    const provinciaCodigo = obtenerProvinciaCodigo(municipioCodigo);
    if (!provinciaCodigo) continue;

    const habilitados = Number(value?.habilitados ?? 0);
    const votoValido = obtenerVotoValido(value);
    const votoBlanco = obtenerConteoVotos(value?.voto_blanco) ?? 0;
    const votoNulo = obtenerConteoVotos(value?.voto_nulo) ?? 0;
    const votoEmitido =
      obtenerConteoVotos(value?.voto_emitido) ?? votoValido + votoBlanco + votoNulo;
    if (!Number.isFinite(habilitados) || habilitados < 0) continue;
    if (!provinciaAcumulada[provinciaCodigo]) {
      provinciaAcumulada[provinciaCodigo] = {
        habilitados: 0,
        votos_validos: 0,
        voto_blanco: 0,
        voto_nulo: 0,
        voto_emitido: 0,
        votos_por_sigla: {},
      };
    }
    if (!municipioAcumulado[municipioCodigo]) {
      municipioAcumulado[municipioCodigo] = {
        habilitados: 0,
        votos_validos: 0,
        voto_blanco: 0,
        voto_nulo: 0,
        voto_emitido: 0,
        votos_por_sigla: {},
      };
    }
    provinciaAcumulada[provinciaCodigo].habilitados += habilitados;
    municipioAcumulado[municipioCodigo].habilitados += habilitados;
    if (Number.isFinite(votoValido) && votoValido >= 0) {
      provinciaAcumulada[provinciaCodigo].votos_validos += votoValido;
      municipioAcumulado[municipioCodigo].votos_validos += votoValido;
      provinciaAcumulada[provinciaCodigo].voto_blanco += votoBlanco;
      municipioAcumulado[municipioCodigo].voto_blanco += votoBlanco;
      provinciaAcumulada[provinciaCodigo].voto_nulo += votoNulo;
      municipioAcumulado[municipioCodigo].voto_nulo += votoNulo;
      provinciaAcumulada[provinciaCodigo].voto_emitido += votoEmitido;
      municipioAcumulado[municipioCodigo].voto_emitido += votoEmitido;
    } else {
      continue;
    }
    if (votoValido <= 0) continue;

    const partidosRecinto = recintosPartidos[codigoRecinto] ?? {};
    for (const [sigla, porcentaje] of Object.entries(partidosRecinto)) {
      const porcentajeNumero = Number(porcentaje ?? 0);
      if (!Number.isFinite(porcentajeNumero) || porcentajeNumero <= 0) continue;
      const siglaNormalizada = normalizarSigla(sigla);
      if (!siglaNormalizada) continue;
      provinciaAcumulada[provinciaCodigo].votos_por_sigla[siglaNormalizada] =
        (provinciaAcumulada[provinciaCodigo].votos_por_sigla[siglaNormalizada] ?? 0) +
        votoValido * porcentajeNumero;
      municipioAcumulado[municipioCodigo].votos_por_sigla[siglaNormalizada] =
        (municipioAcumulado[municipioCodigo].votos_por_sigla[siglaNormalizada] ?? 0) +
        votoValido * porcentajeNumero;
    }
  }

  return {
    porProvincia: construirAgregadosNormalizados(provinciaAcumulada),
    porMunicipio: construirAgregadosNormalizados(municipioAcumulado),
  };
}

function construirAgregadosNormalizados(acumulado) {
  return Object.fromEntries(
    Object.entries(acumulado).map(([codigo, data]) => {
      const partidos_detalle = Object.entries(data.votos_por_sigla)
        .map(([sigla, votos]) => ({
          sigla,
          votos: Math.max(0, Math.round(votos)),
          porcentaje:
            data.votos_validos > 0 ? Number(votos) / Number(data.votos_validos) : 0,
        }))
        .filter((item) => item.porcentaje > 0)
        .sort((a, b) => b.porcentaje - a.porcentaje);

      const partidos_por_sigla = Object.fromEntries(
        partidos_detalle.map((item) => [item.sigla, item.porcentaje]),
      );
      const ganador = partidos_detalle[0]?.porcentaje ?? null;
      const ganador_sigla = partidos_detalle[0]?.sigla ?? null;
      const validos =
        data.habilitados > 0 ? Number(data.votos_validos) / Number(data.habilitados) : null;
      const voto_blanco = Math.max(0, Math.round(data.voto_blanco ?? 0));
      const voto_nulo = Math.max(0, Math.round(data.voto_nulo ?? 0));
      const voto_emitido = Math.max(0, Math.round(data.voto_emitido ?? 0));

      return [
        codigo,
        {
          habilitados: Math.round(data.habilitados),
          voto_valido: Math.max(0, Math.round(data.votos_validos)),
          voto_blanco,
          voto_nulo,
          voto_emitido,
          validos,
          ganador,
          ganador_sigla,
          partidos_detalle,
          partidos_por_sigla,
        },
      ];
    }),
  );
}

function filtrarPartidosABeni(partidosRaw = {}, resultadosRaw = {}, codigosMunicipio = []) {
  const recintosPermitidos = new Set(Object.keys(resultadosRaw));
  const municipiosPermitidos = new Set(codigosMunicipio.map(normalizarMunicipioCodigo));

  const recintos = Object.fromEntries(
    Object.entries(partidosRaw?.recintos ?? {}).filter(([codigoRecinto]) =>
      recintosPermitidos.has(codigoRecinto),
    ),
  );

  const scopes = Object.fromEntries(
    Object.entries(partidosRaw?.scopes ?? {}).filter(([scopeCodigo]) => {
      const normalizado = normalizarMunicipioCodigo(scopeCodigo);
      return normalizado === DEPARTAMENTO_BENI_CODIGO || municipiosPermitidos.has(normalizado);
    }),
  );

  const partidosDisponibles = new Set();
  for (const valores of Object.values(recintos)) {
    for (const [partido, votos] of Object.entries(valores ?? {})) {
      if (Number(votos) > 0) partidosDisponibles.add(partido);
    }
  }
  for (const valores of Object.values(scopes)) {
    for (const [partido, votos] of Object.entries(valores ?? {})) {
      if (Number(votos) > 0) partidosDisponibles.add(partido);
    }
  }

  const partidos = (partidosRaw?.partidos ?? []).filter((partido) =>
    partidosDisponibles.has(partido),
  );

  return {
    ...partidosRaw,
    partidos,
    recintos,
    scopes,
  };
}

function normalizarDepartamentoCodigo(municipioCodigo) {
  return normalizarMunicipioCodigo(municipioCodigo).slice(0, 1);
}

function obtenerProvinciaCodigo(municipioCodigo) {
  return normalizarMunicipioCodigo(municipioCodigo).slice(1, 3);
}

const PROVINCIAS_BENI = {
  "01": "Cercado",
  "02": "Vaca Diez",
  "03": "Ballivian",
  "04": "Yacuma",
  "05": "Moxos",
  "06": "Marban",
  "07": "Mamore",
  "08": "Itenez",
};

function nombreProvinciaBeni(codigoProvincia) {
  return PROVINCIAS_BENI[codigoProvincia] ?? null;
}

function construirDetallePartidos(partidosScope, baseVotos) {
  return Object.entries(partidosScope ?? {})
    .map(([sigla, porcentaje]) => {
      const porcentajeNumero = Number(porcentaje ?? 0);
      return {
        sigla,
        porcentaje: porcentajeNumero,
        votos: Math.max(0, Math.round(baseVotos * porcentajeNumero)),
      };
    })
    .filter((item) => item.porcentaje > 0)
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

function construirGanadorScopePorRecinto(
  resultadosRaw = {},
  recintosPartidos = {},
  scope = "provincia",
) {
  const acumuladoScope = {};
  const scopePorRecinto = {};

  for (const [codigoRecinto, row] of Object.entries(resultadosRaw ?? {})) {
    const municipioCodigo = normalizarMunicipioCodigo(row?.municipio);
    const scopeCodigo =
      scope === "municipio" ? municipioCodigo : obtenerProvinciaCodigo(municipioCodigo);
    if (!scopeCodigo) continue;
    scopePorRecinto[codigoRecinto] = scopeCodigo;
    const votoValido = obtenerVotoValido(row);
    if (!Number.isFinite(votoValido) || votoValido <= 0) continue;
    if (!acumuladoScope[scopeCodigo]) acumuladoScope[scopeCodigo] = {};
    for (const [sigla, pct] of Object.entries(recintosPartidos[codigoRecinto] ?? {})) {
      const porcentaje = Number(pct ?? 0);
      if (!Number.isFinite(porcentaje) || porcentaje <= 0) continue;
      acumuladoScope[scopeCodigo][sigla] =
        (acumuladoScope[scopeCodigo][sigla] ?? 0) + votoValido * porcentaje;
    }
  }

  const ganadorPorScope = Object.fromEntries(
    Object.entries(acumuladoScope).map(([scopeCodigo, votosPorSigla]) => {
      const ganador =
        Object.entries(votosPorSigla).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return [scopeCodigo, ganador];
    }),
  );

  return Object.fromEntries(
    Object.entries(scopePorRecinto).map(([codigoRecinto, scopeCodigo]) => [
      codigoRecinto,
      ganadorPorScope[scopeCodigo] ?? null,
    ]),
  );
}

function obtenerConteoVotos(value) {
  const numero = Number(value);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(numero);
}

function obtenerVotoValido(value) {
  const votoValido = obtenerConteoVotos(value?.voto_valido);
  if (votoValido != null) return votoValido;
  // Sin fallback estimado: si backend no envía voto_valido, no se infla el dato.
  return 0;
}

function normalizarSigla(value) {
  return `${value ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}
