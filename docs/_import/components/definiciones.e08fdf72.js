import * as d3 from "../../_npm/d3@7.9.0/66d82917.js";

export const DATA_BASE =
  "https://raw.githubusercontent.com/mauforonda/subnacionales2026/refs/heads/main/resultados/primera_vuelta/";

export const STORAGE_KEY = "subnacionales2026_metrica";
export const STORAGE_MAP_KEY = "subnacionales2026_mapa";
export const STORAGE_ELECCION_KEY = "subnacionales2026_eleccion";
export const STORAGE_PROVINCIA_KEY = "subnacionales2026_provincia";
export const STORAGE_MUNICIPIO_KEY = "subnacionales2026_municipio";
export const STORAGE_GOBERNADOR_VISTA_KEY = "subnacionales2026_gobernador_vista";

export const PARTIDO_COLORES = {
  LIBRE: "#D32F2F",
  "PATRIA-UNIDOS": "#F57C00",
  DESPIERTA: "#1B8F4D",
  MTS: "#2E7D32",
  "APB-SUMATE": "#7B1FA2",
  VAMOS: "#1F3A5F",
  "CPEM-B": "#FDD835",
  NGP: "#29B6F6",
  TUFE: "#A5D6A7",
  "A-UPP": "#FBC02D",
  MNR: "#F48FB1",
  "F.S.D.": "#2E7D32",
  AVANZAR: "#66BB6A",
};

export function colorPartido(sigla, fallback = "#9E9E9E") {
  const normalizada = normalizarSigla(sigla);
  return PARTIDO_COLORES[normalizada] ?? fallback;
}

function normalizarSigla(value) {
  return `${value ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export const MAPA_FALLBACK = {
  center: [-64.9, -14.8],
  zoom: 6.3,
};

export const metricaGanador = {
  nombre: "Voto al ganador",
  descripcion: "Porcentaje de votos para el partido ganador",
  campo: "ganador",
  dominio: [0.15, 0.75],
  ticks: [0.15, 0.35, 0.55, 0.75],
  colores: ["#f0efe7", "#f2ac50", "#d94b2b"],
  format: d3.format(".0%"),
};

export function metricaPartido(partido) {
  return {
    nombre: `Votos de ${partido}`,
    descripcion: `Porcentaje de votos válidos para ${partido}`,
    campo: "partido",
    dominio: [0, 0.7],
    ticks: [0, 0.2, 0.4, 0.7],
    colores: ["#f0efe7", "#f2ac50", "#d94b2b"],
    format: d3.format(".0%"),
  };
}

export const elecciones = {
  gobernador: {
    nombre: "gobernador",
    archivo: "resultados_gobernador.json",
    partidos: "partidos_gobernador.json",
  },
  asambleista: {
    nombre: "asambleísta",
    archivo: "resultados_asambleista.json",
    partidos: "partidos_asambleista.json",
  },
  subgobernador: {
    nombre: "subgobernador",
    archivo: "resultados_subgobernador.json",
    partidos: "partidos_subgobernador.json",
  },
  alcalde: {
    nombre: "alcalde",
    archivo: "resultados_alcalde.json",
    partidos: "partidos_alcalde.json",
  },
  corregidor: {
    nombre: "corregidor",
    archivo: "resultados_corregidor.json",
    partidos: "partidos_corregidor.json",
  },
  concejales: {
    nombre: "concejales",
    archivo: "resultados_concejales.json",
    partidos: "partidos_concejales.json",
  },
};

export function getStorage() {
  return typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : null;
}
