import * as d3 from "../../_npm/d3@7.9.0/66d82917.js";
import * as Plot from "../../_npm/@observablehq/plot@0.6.17/a96a6bbb.js";
import { colorPartido } from "./definiciones.e08fdf72.js";

export function popupHTML(feature, metrica) {
  const p = feature.properties ?? {};
  const valor = p[metrica.campo];
  const color = d3
    .scaleLinear()
    .domain([
      metrica.dominio[0],
      (metrica.dominio[0] + metrica.dominio[1]) / 2,
      metrica.dominio[1],
    ])
    .range(metrica.colores)
    .clamp(true)(valor ?? metrica.dominio[0]);
  const titulo =
    p.nivel === "recinto"
      ? p.recinto ?? "Recinto sin nombre"
      : p.nombre_territorio ?? "Territorio sin nombre";
  const placeHTML =
    p.nivel === "departamento"
      ? `<div class="popup__place">
          <div class="popup__municipio">${p.departamento ?? "s/d"}</div>
        </div>`
      : p.nivel === "provincia"
      ? `<div class="popup__place">
          <div class="popup__provincia">${p.provincia_nombre ?? "s/d"}</div>
          <div class="popup__departamento">${p.departamento ?? "s/d"}</div>
        </div>`
      : `<div class="popup__place">
          <div class="popup__municipio">${p.municipio_nombre ?? "s/d"}</div>
          <div class="popup__provincia">${p.provincia_nombre ?? "s/d"}</div>
          <div class="popup__departamento">${p.departamento ?? "s/d"}</div>
        </div>`;

  const partidos = leerDetallePartidos(p);
  const votoValido = Number(p.voto_valido ?? 0);
  const votoBlanco = Number(p.voto_blanco ?? 0);
  const votoNulo = Number(p.voto_nulo ?? 0);
  const votoEmitido =
    Number(p.voto_emitido ?? 0) || votoValido + votoBlanco + votoNulo;
  const porcentajeBlanco = votoEmitido > 0 ? votoBlanco / votoEmitido : 0;
  const porcentajeNulo = votoEmitido > 0 ? votoNulo / votoEmitido : 0;
  const listaPartidos = partidos.length
    ? `<div class="popup__partidos">
      ${partidos
        .map(
          (item, index) => `
        <div class="popup__partido">
          <div class="popup__partido_head">
            <span class="popup__partido_sigla_wrap">
              ${avatarPartidoHTML(item.sigla)}
              <span class="popup__partido_sigla">${item.sigla}</span>
            </span>
            <span class="popup__partido_pct">${d3.format(".2%")(item.porcentaje)}</span>
          </div>
          <div class="popup__partido_meta">${d3.format(",")(item.votos)} votos</div>
          <div class="popup__partido_bar">
            <span class="popup__partido_fill" style="width:${Math.max(0, Math.min(100, item.porcentaje * 100))}%; --partido-color:${colorPartido(item.sigla)};"></span>
          </div>
        </div>`,
        )
        .join("")}
    </div>`
    : `<div class="popup__partido_meta">Sin detalle de partidos</div>`;
  const resumenFinal = `
    <div class="popup__partidos popup__partidos--extras">
      <div class="popup__partido">
        <div class="popup__partido_head">
          <span class="popup__partido_sigla_wrap">
            <span class="popup__partido_avatar" style="--partido-color:#9E9E9E;">B</span>
            <span class="popup__partido_sigla">BLANCOS</span>
          </span>
          <span class="popup__partido_pct">${d3.format(".2%")(porcentajeBlanco)}</span>
        </div>
        <div class="popup__partido_meta">${d3.format(",")(Math.max(0, Math.round(votoBlanco)))} votos</div>
      </div>
      <div class="popup__partido">
        <div class="popup__partido_head">
          <span class="popup__partido_sigla_wrap">
            <span class="popup__partido_avatar" style="--partido-color:#757575;">N</span>
            <span class="popup__partido_sigla">NULOS</span>
          </span>
          <span class="popup__partido_pct">${d3.format(".2%")(porcentajeNulo)}</span>
        </div>
        <div class="popup__partido_meta">${d3.format(",")(Math.max(0, Math.round(votoNulo)))} votos</div>
      </div>
    </div>`;
  const separadorNoValidos = `<div class="popup__divider" role="separator" aria-label="Separador de votos no válidos"></div>`;

  return `
    <div class="popup" style="--popup-accent:${color}">
      <div class="popup__title">${titulo}</div>
      <div class="popup__subtitle">${d3.format(",")(p.habilitados ?? 0)} votantes habilitados</div>
      <div class="popup__subtitle">${d3.format(",")(Math.max(0, Math.round(votoEmitido)))} votos emitidos</div>
      ${listaPartidos}
      ${separadorNoValidos}
      ${resumenFinal}
      ${placeHTML}
    </div>
  `;
}

function avatarPartidoHTML(sigla) {
  const iniciales = `${sigla ?? ""}`
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
  return `<span class="popup__partido_avatar" style="--partido-color:${colorPartido(sigla)};">${iniciales || "?"}</span>`;
}

function leerDetallePartidos(properties) {
  if (Array.isArray(properties?.partidos_detalle)) {
    return properties.partidos_detalle;
  }
  const raw = properties?.partidos_detalle_json;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function renderizarLeyenda(metrica) {
  const description = document.querySelector("#legend-description");
  const container = document.querySelector("#legend-container");
  if (!description || !container) return;

  description.textContent = metrica.descripcion;
  container.replaceChildren(
    Plot.legend({
      margin: 0,
      width: 260,
      height: 46,
      className: "leyenda",
      color: {
        type: "linear",
        domain: metrica.dominio,
        range: metrica.colores,
        ticks: metrica.ticks,
        tickFormat: metrica.format,
      },
    })
  );
}
