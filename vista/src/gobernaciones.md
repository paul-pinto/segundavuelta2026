---
theme: dashboard
title: Gobernaciones 2026
toc: false
sidebar: false
---

<link
  rel="stylesheet"
  type="text/css"
  href="https://unpkg.com/maplibre-gl@4.0.2/dist/maplibre-gl.css"
>

<link
  rel="stylesheet"
  type="text/css"
  href="index.css"
>

<link
  rel="stylesheet"
  type="text/css"
  href="gobernaciones.css"
>

```js
import * as d3 from "npm:d3";
import * as Plot from "npm:@observablehq/plot";
import maplibregl from "npm:maplibre-gl";
import { getStorage } from "./components/definiciones.js";
import { obtenerDefinicionesDepartamento } from "./components/gobernaciones_definiciones.js";
import {
  circleHoverRadiusExpr,
  circleRadiusExpr,
  crearMapa,
  leerMapaInicial,
  limpiarResaltado,
  persistirMapa,
  resaltarFeature,
} from "./components/mapa.js";
```

```js
const DATA_BASE =
  "https://raw.githubusercontent.com/mauforonda/subnacionales2026/refs/heads/main/resultados/primera_vuelta/vista_gobernaciones/";
const TIMESTAMP_URL =
  "https://raw.githubusercontent.com/mauforonda/subnacionales2026/refs/heads/main/resultados/primera_vuelta/timestamp";
const STORAGE_DEPARTAMENTO_KEY = "subnacionales2026_gobernaciones_departamento";
const STORAGE_MAP_KEY = "subnacionales2026_gobernaciones_mapa";
const MAPA_FALLBACK = {
  center: [-63.2, -17.82],
  zoom: 6.4,
};
const DEPARTAMENTOS = {
  1: "Chuquisaca",
  2: "La Paz",
  3: "Cochabamba",
  4: "Oruro",
  5: "Potosí",
  6: "Tarija",
  7: "Santa Cruz",
  8: "Beni",
  9: "Pando",
};
const storage = getStorage();
const manifiesto = await d3.json(`${DATA_BASE}manifiesto.json`);
const timestampRaw = await d3.text(TIMESTAMP_URL).catch(() => "");
const timestamp = formatearTimestamp(timestampRaw);
const departamentoGuardado = storage?.getItem(STORAGE_DEPARTAMENTO_KEY);
const departamentoInicial =
  departamentoGuardado && manifiesto[departamentoGuardado]
    ? departamentoGuardado
    : "7";
const departamentoInput = Inputs.select(Object.keys(DEPARTAMENTOS), {
  value: departamentoInicial,
  format: (d) => DEPARTAMENTOS[d] ?? d,
  label: null,
});
const mapaInicial = leerMapaInicial(storage, STORAGE_MAP_KEY, MAPA_FALLBACK);
const datasetsCache = new Map();

function formatearTimestamp(value) {
  const timestamp = value?.trim();
  if (!timestamp) return null;
  const [fecha, hora] = timestamp.split(" ");
  if (!fecha || !hora) return null;
  const [year, month, day] = fecha.split("-");
  const [hours, minutes] = hora.split(":");
  return {
    fecha: `${day}/${month}/${year}`,
    hora: `${hours}:${minutes}`,
  };
}
```

<div class="app">
  <header class="header header--gobernaciones">
    <div class="header__eyebrow">Elecciones subnacionales 2026</div>
    <div class="header__subtitle">Resultados para gobernador</div>
    <div class="header__timestamp" id="timestamp-container"></div>
    <button
      class="header__toggle"
      id="header-toggle"
      type="button"
      aria-expanded="true"
      aria-label="Ocultar panel"
    ><span class="header__toggle_icon" aria-hidden="true"></span></button>
    <div class="header__collapsible" id="header-collapsible">
      <div class="header__selector">
        <div class="header__selector_label">Selecciona un departamento</div>
        ${departamentoInput}
      </div>
      <div class="header__summary" id="resumen-departamento"></div>
    </div>
  </header>

  <div id="mapa"></div>
  <div class="credito">
    <img
      class="credito__logo"
      src="https://mauforonda.github.io/images/icon.svg"
      alt=""
    >
    <span class="credito__text">Creado por Mauricio Foronda</span>
  </div>
</div>

```js
{
  const container = document.querySelector("#timestamp-container");
  container.textContent = timestamp
    ? `actualizado el ${timestamp.fecha} a las ${timestamp.hora}`
    : "";
}
```

```js
{
  const header = document.querySelector(".header--gobernaciones");
  const scrollContainer = document.querySelector("#header-collapsible");
  const toggle = document.querySelector("#header-toggle");
  if (header) {
    const actualizarIndicadorScroll = () => {
      if (!scrollContainer) return;
      const scrollable =
        scrollContainer.scrollHeight - scrollContainer.clientHeight > 12;
      const atBottom =
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 4;
      header.classList.toggle("header--scrollable", scrollable);
      header.classList.toggle("header--at-bottom", !scrollable || atBottom);
    };

    const rafActualizar = () => requestAnimationFrame(actualizarIndicadorScroll);
    header.__updateScrollIndicator = rafActualizar;

    scrollContainer?.addEventListener("scroll", actualizarIndicadorScroll);
    window.addEventListener("resize", rafActualizar);

    const actualizarColapso = () => {
      if (!toggle) return;
      const collapsed = header.classList.contains("header--collapsed");
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute(
        "aria-label",
        collapsed ? "Expandir panel" : "Ocultar panel",
      );
      rafActualizar();
    };

    const alternarColapso = () => {
      if (window.innerWidth > 720) return;
      header.classList.toggle("header--collapsed");
      actualizarColapso();
    };

    toggle?.addEventListener("click", alternarColapso);
    rafActualizar();
    actualizarColapso();

    invalidation.then(() => {
      scrollContainer?.removeEventListener("scroll", actualizarIndicadorScroll);
      window.removeEventListener("resize", rafActualizar);
      toggle?.removeEventListener("click", alternarColapso);
      delete header.__updateScrollIndicator;
    });
  }
}
```

```js
const map = crearMapa("#mapa", mapaInicial);
const popup = new maplibregl.Popup({
  closeButton: true,
  closeOnClick: false,
});
persistirMapa(map, storage, STORAGE_MAP_KEY);

invalidation.then(() => {
  popup.remove();
  map.remove();
});
```

```js
function fotoPartido(meta, id) {
  const foto = meta?.[id]?.foto;
  if (typeof foto === "string" && foto) return foto;
  const color = meta?.[id]?.color ?? "#b8b8b8";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.38" stroke-width="1.5"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function ordenarResultados(resultado, meta) {
  const total = Object.values(resultado ?? {}).reduce(
    (acc, value) => acc + value,
    0,
  );
  const partidos = Object.entries(resultado ?? {})
    .map(([id, votos]) => ({
      id,
      votos,
      porcentaje: total ? votos / total : 0,
      ...(meta[id] ?? {
        nombre: id,
        color: "#b8b8b8",
        candidato: "",
        foto: null,
      }),
    }))
    .sort((a, b) => {
      if (a.id === "otros") return 1;
      if (b.id === "otros") return -1;
      return b.votos - a.votos;
    });
  return { total, partidos };
}

function plotResultado(resultado, meta, { fontSizeMultiplier = 1 } = {}) {
  const { partidos } = ordenarResultados(resultado, meta);
  if (!partidos.length) return document.createElement("div");
  const data = partidos.map((partido) => ({
    ...partido,
    foto: fotoPartido(meta, partido.id),
  }));
  const chart = Plot.plot({
    className: "resultado-chart",
    margin: 0,
    marginLeft: 78,
    marginRight: 10,
    height: data.length * 70,
    x: { axis: null, domain: [0, 1] },
    y: { axis: null, domain: data.map((d) => d.id) },
    marks: [
      Plot.image(data, {
        x: 0,
        y: "id",
        src: "foto",
        dx: -42,
        dy: 5,
        r: 22,
        width: 56,
      }),
      Plot.barX(data, {
        x: 1,
        y: "id",
        fill: "var(--chart-bar-bg)",
        insetTop: 30,
        insetBottom: 8,
        r: 12,
      }),
      Plot.barX(data, {
        x: "porcentaje",
        y: "id",
        fill: (d) => d.color ?? "#b8b8b8",
        fillOpacity: (d) => (d.id === "otros" ? .5 : 0.82),
        insetTop: 30,
        insetBottom: 8,
        r: 12,
      }),
      Plot.barX(data, {
        x: 1,
        y: "id",
        fill: null,
        stroke: "rgba(17,17,17,0.16)",
        strokeWidth: 1,
        insetTop: 30,
        insetBottom: 8,
        r: 12,
      }),
      Plot.text(data, {
        x: 0,
        y: "id",
        text: (d) => d.candidato ?? d.id,
        fill: "var(--text-soft)",
        fontSize: 17 * fontSizeMultiplier,
        fontWeight: 600,
        fillOpacity: 0.9,
        textAnchor: "start",
        lineAnchor: "bottom",
        dx: 6,
        dy: -12,
      }),
      Plot.text(data, {
        x: 1,
        y: "id",
        text: (d) => d3.format(".2%")(d.porcentaje),
        fill: "var(--text-soft)",
        fontSize: 15 * fontSizeMultiplier,
        fontWeight: 500,
        textAnchor: "end",
        lineAnchor: "bottom",
        dx: -6,
        dy: -12,
      }),
    ],
  });
  chart.removeAttribute("height");
  chart.style.width = "100%";
  chart.style.height = "auto";
  return chart;
}

function popupNode(recinto, meta, departamentoNombre) {
  const node = document.createElement("div");
  node.className = "popup popup--gobernaciones";
  const votosEmitidos = Object.values(recinto.resultados ?? {}).reduce(
    (sum, value) => sum + (Number.isFinite(+value) ? +value : 0),
    0,
  );

  const title = document.createElement("div");
  title.className = "popup__title";
  title.textContent = recinto.recinto ?? "Recinto sin nombre";

  const subtitle = document.createElement("div");
  subtitle.className = "popup__subtitle";
  subtitle.textContent = recinto.municipio ?? departamentoNombre ?? "";

  const info = document.createElement("div");
  info.className = "popup__meta";
  info.textContent = `${d3.format(",")(recinto.habilitados ?? 0)} votantes habilitados`;

  const emitidos = document.createElement("div");
  emitidos.className = "popup__meta";
  emitidos.textContent = `${d3.format(",")(votosEmitidos)} votos emitidos`;

  const ganador = document.createElement("div");
  ganador.className = "popup__meta";
  ganador.textContent = `Ganó: ${meta?.[recinto.ganador]?.nombre ?? recinto.ganador ?? "s/d"}`;

  const chartWrap = document.createElement("div");
  chartWrap.className = "popup__chart";
  chartWrap.append(
    plotResultado(recinto.resultados, meta, { fontSizeMultiplier: 1.2 }),
  );

  node.append(title, subtitle, info, emitidos, chartWrap);
  return node;
}

function resumenNode(metaDepartamento) {
  const container = document.createElement("div");
  const definiciones = obtenerDefinicionesDepartamento(
    metaDepartamento.codigo,
    metaDepartamento.partidos,
  );
  container.append(
    plotResultado(metaDepartamento.partidos, definiciones, {
      fontSizeMultiplier: 1.1,
    }),
  );
  return container;
}

function boundsFromRecintos(recintos) {
  const bounds = new maplibregl.LngLatBounds();
  Object.values(recintos).forEach((recinto) => {
    bounds.extend([+recinto.x, +recinto.y]);
  });
  return bounds;
}

async function cargarDepartamento(codigo) {
  if (datasetsCache.has(codigo)) return datasetsCache.get(codigo);
  const recintos = await d3.json(`${DATA_BASE}${codigo}.json`);
  const departamentoNombre =
    manifiesto[codigo]?.nombre ?? DEPARTAMENTOS[codigo] ?? codigo;
  const features = Object.entries(recintos).map(([codigoRecinto, recinto]) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [+recinto.x, +recinto.y],
    },
    properties: {
      codigo: codigoRecinto,
      codigo_hover: codigoRecinto,
      recinto: recinto.recinto,
      municipio: recinto.municipio,
      departamento: departamentoNombre,
      habilitados: +recinto.habilitados || 0,
      ganador: recinto.ganador,
    },
  }));
  const data = {
    codigo,
    recintos,
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
    bounds: boundsFromRecintos(recintos),
  };
  datasetsCache.set(codigo, data);
  return data;
}

function colorExpr(partidos) {
  const pares = Object.entries(partidos).map(([id, meta]) => [
    id,
    meta.color ?? "#b8b8b8",
  ]);
  return ["match", ["get", "ganador"], ...pares.flat(), "#b8b8b8"];
}
```

```js
const ready = new Promise((resolve) => {
  map.on("load", () => {
    map.addSource("recintos", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "codigo_hover",
    });
    map.addSource("etiquetas", {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
    });
    map.addLayer({
      id: "recintos",
      type: "circle",
      source: "recintos",
      paint: {
        "circle-radius": circleRadiusExpr("habilitados"),
        "circle-color": "#b8b8b8",
        "circle-opacity": 0.68,
      },
    });
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
    map.addLayer({
      id: "etiquetas",
      type: "raster",
      source: "etiquetas",
      paint: { "raster-opacity": 0.8 },
    });
    map.addLayer({
      id: "recintos_hover",
      type: "circle",
      source: "recintos",
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": circleHoverRadiusExpr("habilitados"),
      },
    });
    resolve();
  });
});
```

```js
{
  await ready;
  let locked = false;
  let suppressPopupClose = false;
  let currentCodigo = null;
  let currentData = null;
  let requestId = 0;

  const actualizarInteractividadPopup = () => {
    const el = popup.getElement();
    if (!el) return;
    el.classList.toggle("popup--interactive", locked);
  };

  const limpiarInteraccion = () => {
    locked = false;
    map.__activePopupFeature = null;
    limpiarResaltado(map);
    popup.remove();
  };

  const renderResumen = (codigo) => {
    const container = document.querySelector("#resumen-departamento");
    if (!container) return;
    container.replaceChildren(resumenNode({ codigo, ...manifiesto[codigo] }));
    document.querySelector(".header--gobernaciones")
      ?.__updateScrollIndicator?.();
  };

  const aplicarDepartamento = async (codigo, { ajustarVista = false } = {}) => {
    requestId += 1;
    const currentRequestId = requestId;
    const data = await cargarDepartamento(codigo);
    if (currentRequestId !== requestId) return;
    currentCodigo = codigo;
    currentData = data;
    map.getSource("recintos")?.setData(data.featureCollection);
    map.setPaintProperty(
      "recintos",
      "circle-color",
      colorExpr(
        obtenerDefinicionesDepartamento(codigo, manifiesto[codigo].partidos),
      ),
    );
    renderResumen(codigo);
    if (storage) storage.setItem(STORAGE_DEPARTAMENTO_KEY, codigo);
    if (ajustarVista && !data.bounds.isEmpty()) {
      map.fitBounds(data.bounds, {
        padding: { top: 120, right: 40, bottom: 40, left: 40 },
        duration: 900,
        maxZoom: 10,
      });
    }
  };

  const codigoInicial = departamentoInput.value;
  const savedDepartamento = storage?.getItem(STORAGE_DEPARTAMENTO_KEY);
  await aplicarDepartamento(codigoInicial, {
    ajustarVista: !savedDepartamento || savedDepartamento !== codigoInicial,
  });

  const actualizarPopup = (feature) => {
    const codigo = feature?.properties?.codigo;
    if (!codigo || !currentData?.recintos?.[codigo]) return;
    popup.setDOMContent(
      popupNode(
        currentData.recintos[codigo],
        obtenerDefinicionesDepartamento(
          currentCodigo,
          manifiesto[currentCodigo].partidos,
        ),
        manifiesto[currentCodigo].nombre,
      ),
    );
    actualizarInteractividadPopup();
  };

  const sameHoverTarget = (feature) =>
    map.__activePopupFeature?.properties?.codigo_hover ===
    feature?.properties?.codigo_hover;

  const mousemoveRecintos = (e) => {
    if (locked) return;
    map.getCanvas().style.cursor = "pointer";
    const feature = e.features?.[0];
    if (!feature) return;
    if (sameHoverTarget(feature)) return;
    map.__activePopupFeature = feature;
    resaltarFeature(map, "recintos", feature);
    suppressPopupClose = true;
    popup.setLngLat(feature.geometry.coordinates);
    actualizarPopup(feature);
    popup.addTo(map);
    suppressPopupClose = false;
  };

  const mouseleaveRecintos = () => {
    map.getCanvas().style.cursor = "";
    if (!locked) limpiarInteraccion();
  };

  const clickRecintos = (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    locked = true;
    map.__activePopupFeature = feature;
    resaltarFeature(map, "recintos", feature);
    suppressPopupClose = true;
    popup.setLngLat(feature.geometry.coordinates);
    actualizarPopup(feature);
    popup.addTo(map);
    suppressPopupClose = false;
  };

  const clickAny = (e) => {
    const hit = map.queryRenderedFeatures(e.point, {
      layers: ["recintos_hover"],
    }).length;
    if (!hit) limpiarInteraccion();
  };

  const closePopup = () => {
    if (suppressPopupClose) return;
    limpiarInteraccion();
  };

  map.on("mousemove", "recintos_hover", mousemoveRecintos);
  map.on("mouseleave", "recintos_hover", mouseleaveRecintos);
  map.on("click", "recintos_hover", clickRecintos);
  map.on("click", clickAny);
  popup.on("close", closePopup);

  const actualizarDepartamento = async () => {
    limpiarInteraccion();
    await aplicarDepartamento(departamentoInput.value, { ajustarVista: true });
  };

  departamentoInput.addEventListener("input", actualizarDepartamento);

  invalidation.then(() => {
    departamentoInput.removeEventListener("input", actualizarDepartamento);
    map.off("mousemove", "recintos_hover", mousemoveRecintos);
    map.off("mouseleave", "recintos_hover", mouseleaveRecintos);
    map.off("click", "recintos_hover", clickRecintos);
    map.off("click", clickAny);
    popup.off("close", closePopup);
  });
}
```
