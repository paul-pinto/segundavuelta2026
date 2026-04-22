---
theme: dashboard
title: Subnacionales 2026
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

```js
import maplibregl from "npm:maplibre-gl";
import {
  DATA_BASE,
  MAPA_FALLBACK,
  STORAGE_ELECCION_KEY,
  STORAGE_MAP_KEY,
  STORAGE_PROVINCIA_KEY,
  STORAGE_MUNICIPIO_KEY,
  STORAGE_GOBERNADOR_VISTA_KEY,
  elecciones,
  getStorage,
  metricaGanador,
} from "./components/definiciones.js";
import {
  cargarDatos,
  crearRecintosConDepartamentos,
  crearTerritorios,
} from "./components/datos.js";
import {
  aplicarMetricaMapa,
  limpiarResaltado,
  crearCapasBase,
  crearMapa,
  leerMapaInicial,
  persistirMapa,
  resaltarFeature,
} from "./components/mapa.js";
import { popupHTML } from "./components/ui.js";
```

```js
const storage = getStorage();
const LOCAL_DATA_BASE = "./data/segunda_vuelta/";
const eleccionInicial = storage?.getItem(STORAGE_ELECCION_KEY) ?? "gobernador";
const eleccionInput = Inputs.select(Object.keys(elecciones), {
  value: elecciones[eleccionInicial] ? eleccionInicial : "gobernador",
  format: (d) => elecciones[d].nombre,
  label: null,
});
const provinciaInput = document.createElement("select");
provinciaInput.className = "provincia-input";
const municipioInput = document.createElement("select");
municipioInput.className = "municipio-input";
const gobernadorVistaInput = document.createElement("select");
gobernadorVistaInput.className = "gobernador-vista-input";
const GOBERNADOR_VISTAS = [
  {value: "provincia", label: "Vista por provincia"},
  {value: "municipio", label: "Vista por municipio"},
];
const vistaGuardada = storage?.getItem(STORAGE_GOBERNADOR_VISTA_KEY);
const vistaInicial = GOBERNADOR_VISTAS.some((v) => v.value === vistaGuardada)
  ? vistaGuardada
  : "provincia";
for (const opcion of GOBERNADOR_VISTAS) {
  const option = document.createElement("option");
  option.value = opcion.value;
  option.textContent = opcion.label;
  gobernadorVistaInput.append(option);
}
gobernadorVistaInput.value = vistaInicial;
const PARTIDOS_LOCALES = {
  gobernador: await FileAttachment("./data/segunda_vuelta/partidos_gobernador.json").json(),
};
const DATA_LOCALES = {
  resultados: {
    "resultados_gobernador.json": await FileAttachment("./data/segunda_vuelta/resultados_gobernador.json").json(),
  },
  partidos: {
    "partidos_gobernador.json": PARTIDOS_LOCALES.gobernador,
  },
  municipios: await FileAttachment("./data/segunda_vuelta/municipios.json").json(),
  departamentos: await FileAttachment("./data/segunda_vuelta/departamentos.json").json(),
  municipiosTopo: await FileAttachment("./data/segunda_vuelta/municipios.topo.json").json(),
  timestamp: await FileAttachment("./data/segunda_vuelta/timestamp").text(),
};

function obtenerEleccionActual() {
  return elecciones[eleccionInput.value] ?? elecciones.gobernador;
}

function obtenerVistaGobernadorActual() {
  return gobernadorVistaInput.value === "municipio" ? "municipio" : "provincia";
}

function esEleccionDepartamental(eleccion) {
  return ["gobernador"].includes(eleccion);
}

function sincronizarControlVistaGobernador() {
  gobernadorVistaInput.style.display =
    esEleccionDepartamental(eleccionInput.value) ? "" : "none";
}

function obtenerCodigoProvincia(codigoMunicipio) {
  return `${codigoMunicipio ?? ""}`.replace(/^0+/, "").slice(1, 3);
}

function labelProvincia(codigoProvincia) {
  const labels = {
    "01": "Cercado",
    "02": "Vaca Diez",
    "03": "Ballivian",
    "04": "Yacuma",
    "05": "Moxos",
    "06": "Marban",
    "07": "Mamore",
    "08": "Itenez",
  };
  return labels[codigoProvincia] ?? `Provincia ${codigoProvincia}`;
}
```

<div class="app">
  <header class="header">
    <div class="header__eyebrow">Segunda vuelta subnacionales 2026 · Beni</div>
    <div class="header__subtitle">Votos para <span class="header__eleccion">${eleccionInput}</span></div>
    <div class="header__timestamp" id="timestamp-container"></div>
    <div class="header__controls">
      <div class="control control--legend">
        <div class="control__input">${gobernadorVistaInput}</div>
        <div class="control__input">${provinciaInput}</div>
        <div class="control__input">${municipioInput}</div>
      </div>
    </div>
  </header>

  <div id="mapa"></div>
  <div class="credito">
    <img
      class="credito__logo"
      src="https://paulpinto.com.bo/images/logo.png"
      alt=""
    >
    <span class="credito__text">Creado por Paul Pinto con créditos a Mau Foronda</span>
  </div>
</div>

```js
const state = await cargarDatos(
  DATA_BASE,
  obtenerEleccionActual().archivo,
  obtenerEleccionActual().partidos,
  LOCAL_DATA_BASE,
  PARTIDOS_LOCALES[eleccionInput.value] ?? null,
  DATA_LOCALES,
);

function poblarSelectorProvincias(municipios, preferido = null) {
  const codigos = [
    ...new Set(
      Object.keys(municipios ?? {})
        .map(obtenerCodigoProvincia)
        .filter((codigo) => codigo.length === 2),
    ),
  ].sort();
  const opciones = [
    {value: "todas", label: "Todas las provincias"},
    ...codigos.map((codigo) => ({
      value: codigo,
      label: labelProvincia(codigo),
    })),
  ];
  provinciaInput.replaceChildren();
  for (const opcion of opciones) {
    const option = document.createElement("option");
    option.value = opcion.value;
    option.textContent = opcion.label;
    provinciaInput.append(option);
  }
  const almacenado = storage?.getItem(STORAGE_PROVINCIA_KEY);
  const valor = [preferido, almacenado, "todas"].find((value) =>
    opciones.some((opcion) => opcion.value === value),
  );
  provinciaInput.value = valor ?? "todas";
}

poblarSelectorProvincias(state.municipios);
sincronizarControlVistaGobernador();

function poblarSelectorMunicipios(municipios, provinciaCodigo, preferido = null) {
  const entries = Object.entries(municipios ?? {})
    .filter(([codigo]) =>
      provinciaCodigo === "todas" || obtenerCodigoProvincia(codigo) === provinciaCodigo,
    )
    .sort((a, b) =>
      (a[1]?.nombre_municipio ?? "").localeCompare(b[1]?.nombre_municipio ?? ""),
    );

  const opciones = [
    {value: "todos", label: "Todos los municipios"},
    ...entries.map(([codigo, value]) => ({
      value: codigo,
      label: value?.nombre_municipio ?? codigo,
    })),
  ];

  municipioInput.replaceChildren();
  for (const opcion of opciones) {
    const option = document.createElement("option");
    option.value = opcion.value;
    option.textContent = opcion.label;
    municipioInput.append(option);
  }

  const almacenado = storage?.getItem(STORAGE_MUNICIPIO_KEY);
  const valor = [preferido, almacenado, "todos"].find((value) =>
    opciones.some((opcion) => opcion.value === value),
  );
  municipioInput.value = valor ?? "todos";
}

function obtenerProvinciaActual() {
  return provinciaInput.value || "todas";
}

function obtenerMunicipioActual() {
  return municipioInput.value || "todos";
}

function obtenerMetricaActual() {
  return metricaGanador;
}

poblarSelectorMunicipios(state.municipios, obtenerProvinciaActual());

function aplicarFiltroGeografico(data, provinciaCodigo, municipioCodigo) {
  return {
    ...data,
    features: data.features.filter(
      (feature) =>
        (provinciaCodigo === "todas" ||
          feature?.properties?.provincia_codigo === provinciaCodigo) &&
        (municipioCodigo === "todos" ||
          feature?.properties?.municipio_codigo === municipioCodigo),
    ),
  };
}

function reconstruirDatosMapa() {
  state.recintos = crearRecintosConDepartamentos(
    state.resultadosRaw,
    state.municipios,
    state.departamentos,
    eleccionInput.value,
    state.partidosRaw,
    null,
    null,
    obtenerVistaGobernadorActual(),
  );
  state.territorios = crearTerritorios(
    state.territoriosRaw,
    state.municipios,
    state.departamentos,
    eleccionInput.value,
    state.partidosRaw,
    state.resultadosRaw,
    obtenerVistaGobernadorActual(),
    null,
    null,
  );
  state.recintosFiltrados = aplicarFiltroGeografico(
    state.recintos,
    obtenerProvinciaActual(),
    obtenerMunicipioActual(),
  );
  state.territoriosFiltrados = aplicarFiltroGeografico(
    state.territorios,
    obtenerProvinciaActual(),
    obtenerMunicipioActual(),
  );
}

reconstruirDatosMapa();
const mapaInicialLeido = leerMapaInicial(storage, STORAGE_MAP_KEY, MAPA_FALLBACK);
const mapaInicial =
  mapaInicialLeido.center[0] < -68.5 ||
  mapaInicialLeido.center[0] > -62.5 ||
  mapaInicialLeido.center[1] < -17.8 ||
  mapaInicialLeido.center[1] > -9.2
    ? MAPA_FALLBACK
    : mapaInicialLeido;
```

```js
{
  const container = document.querySelector("#timestamp-container");
  container.textContent = state.timestamp
    ? `actualizado el ${state.timestamp.fecha} a las ${state.timestamp.hora}`
    : "";
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
const ready = new Promise((resolve) => {
  map.on("load", () => {
    crearCapasBase(
      map,
      state.territoriosFiltrados,
      state.recintosFiltrados,
      obtenerMetricaActual(),
    );
    resolve();
  });
});
```

```js
{
  await ready;
  aplicarMetricaMapa(map, obtenerMetricaActual());
}
```

```js
{
  await ready;
  let eleccionRequestId = 0;
  const actualizarEleccion = async () => {
    eleccionRequestId += 1;
    const requestId = eleccionRequestId;
    const eleccionSiguiente = obtenerEleccionActual();
    if (storage) storage.setItem(STORAGE_ELECCION_KEY, eleccionInput.value);
    const data = await cargarDatos(
      DATA_BASE,
      eleccionSiguiente.archivo,
      eleccionSiguiente.partidos,
      LOCAL_DATA_BASE,
      PARTIDOS_LOCALES[eleccionInput.value] ?? null,
      DATA_LOCALES,
    );
    if (requestId !== eleccionRequestId) return;

    Object.assign(state, data);

    poblarSelectorProvincias(state.municipios, obtenerProvinciaActual());
    poblarSelectorMunicipios(
      state.municipios,
      obtenerProvinciaActual(),
      obtenerMunicipioActual(),
    );
    reconstruirDatosMapa();
    sincronizarControlVistaGobernador();
    limpiarResaltado(map);
    map.__activePopupFeature = null;
    map.getSource("recintos")?.setData(state.recintosFiltrados);
    map.getSource("territorios")?.setData(state.territoriosFiltrados);

    const metricaSiguiente = obtenerMetricaActual();
    aplicarMetricaMapa(map, metricaSiguiente);

    const container = document.querySelector("#timestamp-container");
    container.textContent = state.timestamp
      ? `actualizado el ${state.timestamp.fecha} a las ${state.timestamp.hora}`
      : "";
  };
  eleccionInput.addEventListener("input", actualizarEleccion);
  invalidation.then(() =>
    eleccionInput.removeEventListener("input", actualizarEleccion),
  );
}
```

```js
{
  await ready;
  const actualizarProvincia = () => {
    if (storage) storage.setItem(STORAGE_PROVINCIA_KEY, obtenerProvinciaActual());
    poblarSelectorMunicipios(state.municipios, obtenerProvinciaActual(), "todos");
    if (storage) storage.setItem(STORAGE_MUNICIPIO_KEY, obtenerMunicipioActual());
    limpiarResaltado(map);
    map.__activePopupFeature = null;
    popup.remove();
    reconstruirDatosMapa();
    map.getSource("recintos")?.setData(state.recintosFiltrados);
    map.getSource("territorios")?.setData(state.territoriosFiltrados);
  };
  provinciaInput.addEventListener("input", actualizarProvincia);
  invalidation.then(() =>
    provinciaInput.removeEventListener("input", actualizarProvincia),
  );
}
```

```js
{
  await ready;
  const actualizarMunicipio = () => {
    if (storage) storage.setItem(STORAGE_MUNICIPIO_KEY, obtenerMunicipioActual());
    limpiarResaltado(map);
    map.__activePopupFeature = null;
    popup.remove();
    reconstruirDatosMapa();
    map.getSource("recintos")?.setData(state.recintosFiltrados);
    map.getSource("territorios")?.setData(state.territoriosFiltrados);
  };
  municipioInput.addEventListener("input", actualizarMunicipio);
  invalidation.then(() =>
    municipioInput.removeEventListener("input", actualizarMunicipio),
  );
}
```

```js
{
  await ready;
  const actualizarVistaDepartamental = () => {
    if (storage) {
      storage.setItem(STORAGE_GOBERNADOR_VISTA_KEY, obtenerVistaGobernadorActual());
    }
    limpiarResaltado(map);
    map.__activePopupFeature = null;
    popup.remove();
    reconstruirDatosMapa();
    map.getSource("recintos")?.setData(state.recintosFiltrados);
    map.getSource("territorios")?.setData(state.territoriosFiltrados);
  };
  gobernadorVistaInput.addEventListener("input", actualizarVistaDepartamental);
  invalidation.then(() =>
    gobernadorVistaInput.removeEventListener("input", actualizarVistaDepartamental),
  );
}
```

```js
let locked = false;

{
  await ready;
  let suppressPopupClose = false;

  const actualizarInteractividadPopup = () => {
    const el = popup.getElement();
    if (!el) return;
    el.classList.toggle("popup--interactive", locked);
  };

  const limpiarInteraccion = () => {
    locked = false;
    map.__activePopupFeature = null;
    map.__activePopupSource = null;
    limpiarResaltado(map);
    popup.remove();
  };

  if (map.__hoverHandlers) {
    const {
      mousemoveRecintos,
      mouseleaveRecintos,
      clickRecintos,
      mousemoveTerritorios,
      mouseleaveTerritorios,
      clickTerritorios,
      clickAny,
      closePopup,
    } = map.__hoverHandlers;
    map.off("mousemove", "recintos_hover", mousemoveRecintos);
    map.off("mouseleave", "recintos_hover", mouseleaveRecintos);
    map.off("click", "recintos_hover", clickRecintos);
    map.off("mousemove", "territorios_hover", mousemoveTerritorios);
    map.off("mouseleave", "territorios_hover", mouseleaveTerritorios);
    map.off("click", "territorios_hover", clickTerritorios);
    map.off("click", clickAny);
    popup.off("close", closePopup);
  }

  const sameHoverTarget = (feature, source) => {
    if (map.__activePopupSource !== source) return false;
    if (source === "territorios") {
      return (
        (map.__activePopupFeature?.id ??
          map.__activePopupFeature?.properties?.feature_id) ===
        (feature?.id ?? feature?.properties?.feature_id)
      );
    }
    return (
      map.__activePopupFeature?.properties?.codigo_hover ===
      feature?.properties?.codigo_hover
    );
  };

  const mousemoveRecintos = (e) => {
    if (locked) return;
    map.getCanvas().style.cursor = "pointer";
    const feature = e.features?.[0];
    if (!feature) return;
    if (sameHoverTarget(feature, "recintos")) return;
    map.__activePopupFeature = feature;
    map.__activePopupSource = "recintos";
    resaltarFeature(map, "recintos", feature);
    suppressPopupClose = true;
    popup
      .setLngLat(feature.geometry.coordinates)
      .setHTML(popupHTML(feature, obtenerMetricaActual()))
      .addTo(map);
    suppressPopupClose = false;
    actualizarInteractividadPopup();
  };

  const mouseleaveRecintos = () => {
    map.getCanvas().style.cursor = "";
    if (!locked) {
      limpiarInteraccion();
    }
  };

  const clickRecintos = (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    locked = true;
    map.__activePopupFeature = feature;
    map.__activePopupSource = "recintos";
    resaltarFeature(map, "recintos", feature);
    suppressPopupClose = true;
    popup
      .setLngLat(feature.geometry.coordinates)
      .setHTML(popupHTML(feature, obtenerMetricaActual()))
      .addTo(map);
    suppressPopupClose = false;
    actualizarInteractividadPopup();
  };

  const mousemoveTerritorios = (e) => {
    if (locked) return;
    map.getCanvas().style.cursor = "pointer";
    const feature = e.features?.[0];
    if (!feature) return;
    if (sameHoverTarget(feature, "territorios")) {
      popup.setLngLat(e.lngLat ?? map.getCenter());
      return;
    }
    map.__activePopupFeature = feature;
    map.__activePopupSource = "territorios";
    resaltarFeature(map, "territorios", feature);
    suppressPopupClose = true;
    popup
      .setLngLat(e.lngLat ?? map.getCenter())
      .setHTML(popupHTML(feature, obtenerMetricaActual()))
      .addTo(map);
    suppressPopupClose = false;
    actualizarInteractividadPopup();
  };

  const mouseleaveTerritorios = () => {
    map.getCanvas().style.cursor = "";
    if (!locked) {
      limpiarInteraccion();
    }
  };

  const clickTerritorios = (e) => {
    const feature = e.features?.[0];
    if (!feature) return;
    locked = true;
    map.__activePopupFeature = feature;
    map.__activePopupSource = "territorios";
    resaltarFeature(map, "territorios", feature);
    suppressPopupClose = true;
    popup
      .setLngLat(e.lngLat ?? map.getCenter())
      .setHTML(popupHTML(feature, obtenerMetricaActual()))
      .addTo(map);
    suppressPopupClose = false;
    actualizarInteractividadPopup();
  };

  const clickAny = (e) => {
    const hit = map.queryRenderedFeatures(e.point, {
      layers: ["recintos_hover", "territorios_hover"],
    }).length;
    if (!hit) {
      limpiarInteraccion();
    }
  };

  const closePopup = () => {
    if (suppressPopupClose) return;
    limpiarInteraccion();
  };

  map.on("mousemove", "recintos_hover", mousemoveRecintos);
  map.on("mouseleave", "recintos_hover", mouseleaveRecintos);
  map.on("click", "recintos_hover", clickRecintos);
  map.on("mousemove", "territorios_hover", mousemoveTerritorios);
  map.on("mouseleave", "territorios_hover", mouseleaveTerritorios);
  map.on("click", "territorios_hover", clickTerritorios);
  map.on("click", clickAny);
  popup.on("close", closePopup);

  map.__hoverHandlers = {
    mousemoveRecintos,
    mouseleaveRecintos,
    clickRecintos,
    mousemoveTerritorios,
    mouseleaveTerritorios,
    clickTerritorios,
    clickAny,
    closePopup,
  };
}
```
