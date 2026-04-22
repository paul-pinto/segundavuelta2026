import maplibregl from "npm:maplibre-gl";
import { PARTIDO_COLORES } from "./definiciones.js";

const TERRITORIOS_FADE_START = 8.6;
const TERRITORIOS_FADE_END = 9;

export function circleColorExpr(metrica) {
  if (metrica?.campo === "ganador") {
    return colorPorPartidoGanadorExpr();
  }
  const { campo, dominio, colores } = metrica;
  const medio = (dominio[0] + dominio[1]) / 2;
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["to-number", ["get", campo]], dominio[0]],
    dominio[0],
    colores[0],
    medio,
    colores[1],
    dominio[1],
    colores[2],
  ];
}

function colorPorPartidoGanadorExpr() {
  const expr = ["match", ["coalesce", ["get", "ganador_sigla"], ""]];
  for (const [sigla, color] of Object.entries(PARTIDO_COLORES)) {
    expr.push(sigla, color);
  }
  expr.push("#bdbdbd");
  return expr;
}

export function circleRadiusExpr(campo) {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    ["min", 2, ["max", 1, ["*", 0.03, ["to-number", ["get", campo]]]]],
    12,
    ["min", 7, ["max", 2, ["*", 0.02, ["to-number", ["get", campo]]]]],
    16,
    ["min", 21, ["max", 3, ["*", 0.08, ["to-number", ["get", campo]]]]],
  ];
}

export function circleHoverRadiusExpr(campo) {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    [
      "*",
      1.3,
      ["min", 2, ["max", 1, ["*", 0.03, ["to-number", ["get", campo]]]]],
    ],
    12,
    [
      "*",
      1.3,
      ["min", 7, ["max", 2, ["*", 0.02, ["to-number", ["get", campo]]]]],
    ],
    16,
    [
      "*",
      1.3,
      ["min", 21, ["max", 3, ["*", 0.08, ["to-number", ["get", campo]]]]],
    ],
  ];
}

export function crearMapa(selector, mapaInicial) {
  const map = new maplibregl.Map({
    container: document.querySelector(selector),
    style:
      "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
    center: mapaInicial.center,
    zoom: mapaInicial.zoom,
    minZoom: 4.2,
    maxZoom: 15,
    scrollZoom: true,
    attributionControl: false,
  });

  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: false,
      showUserHeading: true,
      showAccuracyCircle: false,
    }),
    "bottom-right",
  );
  map.addControl(new maplibregl.NavigationControl(), "bottom-right");
  return map;
}

export function aplicarMetricaMapa(map, metrica) {
  if (map.getLayer("territorios_fill")) {
    map.setPaintProperty(
      "territorios_fill",
      "fill-color",
      circleColorExpr(metrica),
    );
  }
  if (!map.getLayer("recintos")) return;
  map.setPaintProperty("recintos", "circle-color", colorPorPartidoGanadorExpr());
  map.triggerRepaint();
}

export function resaltarFeature(map, source, feature) {
  const id =
    source === "territorios"
      ? feature?.id ?? feature?.properties?.feature_id
      : feature?.properties?.codigo_hover ?? feature?.id;
  if (id == null) return;
  limpiarResaltado(map);
  map.setFeatureState({source, id}, {hover: true});
  map.__hoverState = {source, id};
}

export function limpiarResaltado(map) {
  const previous = map.__hoverState;
  if (!previous) return;
  map.setFeatureState(previous, {hover: false});
  map.__hoverState = null;
}

export function persistirMapa(map, storage, key) {
  map.on("moveend", () => {
    if (!storage) return;
    const center = map.getCenter();
    storage.setItem(
      key,
      JSON.stringify({
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
      }),
    );
  });
}

export function leerMapaInicial(storage, key, fallback) {
  if (!storage) return fallback;
  try {
    const value = JSON.parse(storage.getItem(key));
    if (
      value &&
      Array.isArray(value.center) &&
      value.center.length === 2 &&
      Number.isFinite(value.center[0]) &&
      Number.isFinite(value.center[1]) &&
      Number.isFinite(value.zoom)
    ) {
      return value;
    }
  } catch {}
  return fallback;
}

export function crearCapasBase(map, territorios, recintos, metrica) {
  if (!map.getSource("territorios")) {
    map.addSource("territorios", {
      type: "geojson",
      data: territorios,
      promoteId: "feature_id",
    });
  }

  if (!map.getLayer("territorios_fill")) {
    map.addLayer({
      id: "territorios_fill",
      type: "fill",
      source: "territorios",
      paint: {
        "fill-color": circleColorExpr(metrica),
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          TERRITORIOS_FADE_START,
          0.35,
          TERRITORIOS_FADE_END,
          0,
        ],
      },
    });
  }

  if (!map.getLayer("territorios_line")) {
    map.addLayer({
      id: "territorios_line",
      type: "line",
      source: "territorios",
      paint: {
        "line-color": "rgba(245, 242, 235, 0.22)",
        "line-width": 0.55,
        "line-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          TERRITORIOS_FADE_START,
          1,
          TERRITORIOS_FADE_END,
          0,
        ],
      },
    });
  }

  if (!map.getLayer("territorios_selected")) {
    map.addLayer({
      id: "territorios_selected",
      type: "line",
      source: "territorios",
      paint: {
        "line-color": "rgba(255, 255, 255, 0.9)",
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          ["case", ["==", ["get", "nivel"], "departamento"], 1, 2.6],
          0,
        ],
        "line-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          TERRITORIOS_FADE_START,
          1,
          TERRITORIOS_FADE_END,
          0,
        ],
      },
    });
  }

  if (!map.getLayer("territorios_hover")) {
    map.addLayer({
      id: "territorios_hover",
      type: "fill",
      source: "territorios",
      maxzoom: TERRITORIOS_FADE_END,
      paint: {
        "fill-color": "rgba(0,0,0,0)",
        "fill-opacity": 0.01,
      },
    });
  }

  if (!map.getSource("recintos")) {
    map.addSource("recintos", {
      type: "geojson",
      data: recintos,
      promoteId: "codigo_hover",
    });
  }

  if (!map.getLayer("recintos")) {
    map.addLayer({
      id: "recintos",
      type: "circle",
      source: "recintos",
      paint: {
        "circle-radius": circleRadiusExpr("habilitados"),
        "circle-color": colorPorPartidoGanadorExpr(),
        "circle-opacity": 0.62,
      },
    });
  }

  if (!map.getLayer("recintos_selected")) {
    map.addLayer({
      id: "recintos_selected",
      type: "circle",
      source: "recintos",
      paint: {
        "circle-radius": circleHoverRadiusExpr("habilitados"),
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": "rgba(68, 67, 66, 0.5)",
        "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          1,
          0,
        ],
      },
    });
  }

  if (!map.getSource("etiquetas")) {
    map.addSource("etiquetas", {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
    });
  }

  if (!map.getLayer("etiquetas")) {
    map.addLayer({
      id: "etiquetas",
      type: "raster",
      source: "etiquetas",
      paint: { "raster-opacity": 0.8 },
    });
  }

  if (!map.getLayer("recintos_hover")) {
    map.addLayer({
      id: "recintos_hover",
      type: "circle",
      source: "recintos",
      minzoom: TERRITORIOS_FADE_END,
      filter: ["!=", ["get", "municipio_nombre"], null],
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": circleHoverRadiusExpr("habilitados"),
      },
    });
  }
}
