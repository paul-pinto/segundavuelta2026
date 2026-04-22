import { FileAttachment } from "../../_observablehq/stdlib.73a8ec5a.js";

function partido(
  nombre,
  { candidato = "Otros", color = "#b8b8b8", foto = null } = {},
) {
  return { nombre, candidato, color, foto };
}

export const gobernacionesPartidos = {
  1: {
    AGN: partido("AGN", {
      candidato: "Luis Ayllon",
      color: "#41dada",
      foto: await FileAttachment({"name":"../../imagenes/luis_ayllon.png","mimeType":"image/png","path":"../../_file/imagenes/luis_ayllon.e810666c.png","lastModified":1776054213665,"size":19164}, import.meta.url).url(),
    }),
    "PATRIA-UNIDOS": partido("PATRIA-UNIDOS", {
      candidato: "Franz García",
      color: "#ec8e4f",
      foto: await FileAttachment({"name":"../../imagenes/franz_garcia.png","mimeType":"image/png","path":"../../_file/imagenes/franz_garcia.9c682ca1.png","lastModified":1776054213663,"size":18474}, import.meta.url).url(),
    }),
    LIBRE: partido("LIBRE", {
      candidato: "Ricardo Zarate",
      color: "#df3333",
      foto: await FileAttachment({"name":"../../imagenes/ricardo_zarate.png","mimeType":"image/png","path":"../../_file/imagenes/ricardo_zarate.7b71a562.png","lastModified":1776054213668,"size":16079}, import.meta.url).url(),
    }),
    "XS-CH": partido("XS-CH"),
  },
  2: {
    "PATRIA-SOL": partido("PATRIA-SOL", {
      candidato: "Luis Revilla",
      color: "#ffc826",
      foto: await FileAttachment({"name":"../../imagenes/luis_revilla.png","mimeType":"image/png","path":"../../_file/imagenes/luis_revilla.d295e337.png","lastModified":1776054213666,"size":17860}, import.meta.url).url(),
    }),
    NGP: partido("NGP", {
      candidato: "René Yahuasi  ",
      color: "#48b7dc",
      foto: await FileAttachment({"name":"../../imagenes/rene_yahuasi.png","mimeType":"image/png","path":"../../_file/imagenes/rene_yahuasi.89593413.png","lastModified":1776054213668,"size":20140}, import.meta.url).url(),
    }),
    MTS: partido("MTS", {
      candidato: "Félix Patzi",
      color: "#529c7c",
      foto: await FileAttachment({"name":"../../imagenes/felix_patzi.png","mimeType":"image/png","path":"../../_file/imagenes/felix_patzi.b391e84e.png","lastModified":1776054213662,"size":17087}, import.meta.url).url(),
    }),
    IH: partido("IH", {
      candidato: "Antonio Riveros",
      color: "#b357b3",
      foto: await FileAttachment({"name":"../../imagenes/antonio_riveros.png","mimeType":"image/png","path":"../../_file/imagenes/antonio_riveros.449859d7.png","lastModified":1776054213661,"size":11640}, import.meta.url).url(),
    }),
    VENCEREMOS: partido("VENCEREMOS", {
      candidato: "Andrés Gomez",
      color: "#e34011",
      foto: await FileAttachment({"name":"../../imagenes/andres_gomez.png","mimeType":"image/png","path":"../../_file/imagenes/andres_gomez.22a0fdfc.png","lastModified":1776054213661,"size":16967}, import.meta.url).url(),
    }),
    UPC: partido("UPC", {
      candidato: "Santos Quispe",
      color: "#b03b10",
      foto: await FileAttachment({"name":"../../imagenes/santos_quispe.png","mimeType":"image/png","path":"../../_file/imagenes/santos_quispe.01035daa.png","lastModified":1776054213669,"size":18776}, import.meta.url).url(),
    }),
    ASLP: partido("ASLP", {
      candidato: "Ingvar Ellefsen ",
      color: "#002780",
      foto: await FileAttachment({"name":"../../imagenes/ingvar_ellefsen.png","mimeType":"image/png","path":"../../_file/imagenes/ingvar_ellefsen.f35dc357.png","lastModified":1776054213664,"size":13730}, import.meta.url).url(),
    }),
    VIDA: partido("VIDA", {
      candidato: "Gregorio Merlo",
      color: "#f98f2e",
      foto: await FileAttachment({"name":"../../imagenes/gregorio_merlo.png","mimeType":"image/png","path":"../../_file/imagenes/gregorio_merlo.15e72078.png","lastModified":1776054213663,"size":18313}, import.meta.url).url(),
    }),
  },
  3: {
    "A-UPP": partido("A-UPP", {
      candidato: "Leonardo Loza",
      color: "#ccc16a",
      foto: await FileAttachment({"name":"../../imagenes/leonardo_loza.png","mimeType":"image/png","path":"../../_file/imagenes/leonardo_loza.d034b416.png","lastModified":1776054213665,"size":15715}, import.meta.url).url(),
    }),
    "APB-SUMATE": partido("APB-SUMATE", {
      color: "#9f6bb2",
      candidato: "Sergio Rodriguez",
      foto: await FileAttachment({"name":"../../imagenes/sergio_rodriguez.png","mimeType":"image/png","path":"../../_file/imagenes/sergio_rodriguez.0035a4c2.png","lastModified":1776054213669,"size":15315}, import.meta.url).url(),
    }),
    MTS: partido("MTS", {
      candidato: "Alejandro Mostajo",
      color: "#529c7c",
      foto: await FileAttachment({"name":"../../imagenes/alejandro_mostajo.png","mimeType":"image/png","path":"../../_file/imagenes/alejandro_mostajo.381152f1.png","lastModified":1776054213661,"size":15118}, import.meta.url).url(),
    }),
  },
  4: {
    JACHAJAKISASOLFESORC: partido("JACHAJAKISASOLFESORC", {
      candidato: "Edgar Sánchez",
      color: "#d93033",
      foto: await FileAttachment({"name":"../../imagenes/edgar_sanchez.png","mimeType":"image/png","path":"../../_file/imagenes/edgar_sanchez.a8db6bcf.png","lastModified":1776054213662,"size":21760}, import.meta.url).url(),
    }),
    "PATRIA-ORURO": partido("PATRIA-ORURO", {
      candidato: "Oscar Chambi",
      color: "#ec8e4f",
      foto: await FileAttachment({"name":"../../imagenes/oscar_chambi.png","mimeType":"image/png","path":"../../_file/imagenes/oscar_chambi.45843e87.png","lastModified":1776054213667,"size":14097}, import.meta.url).url(),
    }),
    "A-UPP": partido("A-UPP", {
      candidato: "Johnny Franklin Vedia",
      color: "#ccc16a",
      foto: await FileAttachment({"name":"../../imagenes/johnny_vedia.png","mimeType":"image/png","path":"../../_file/imagenes/johnny_vedia.9fe04609.png","lastModified":1776054213664,"size":19958}, import.meta.url).url(),
    }),
    NGP: partido("NGP", {
      candidato: "Juan Saul García",
      color: "#48b7dc",
      foto: await FileAttachment({"name":"../../imagenes/juan_garcia.png","mimeType":"image/png","path":"../../_file/imagenes/juan_garcia.a3fcbe36.png","lastModified":1776054213665,"size":19469}, import.meta.url).url(),
    }),
    AORA: partido("AORA", {
      candidato: "Rubén Gutiérrez Carrizo ",
      color: "#4ca689",
      foto: await FileAttachment({"name":"../../imagenes/ruben_gutierrez.png","mimeType":"image/png","path":"../../_file/imagenes/ruben_gutierrez.03935a81.png","lastModified":1776054213669,"size":14535}, import.meta.url).url(),
    }),
  },
  5: {
    "A.S.": partido("A.S.", {
      candidato: "René Joaquino",
      color: "#35a150",
      foto: await FileAttachment({"name":"../../imagenes/rene_joaquino.png","mimeType":"image/png","path":"../../_file/imagenes/rene_joaquino.f7df71e8.png","lastModified":1776054213667,"size":17569}, import.meta.url).url(),
    }),
    "PATRIA-UNIDOS": partido("PATRIA-UNIDOS", {
      candidato: "Marco Antonio Copa",
      color: "#ec8e4f",
      foto: await FileAttachment({"name":"../../imagenes/marco_antonio_copa.png","mimeType":"image/png","path":"../../_file/imagenes/marco_antonio_copa.13282c9e.png","lastModified":1776054213666,"size":18522}, import.meta.url).url(),
    }),
    APP: partido("APP", {
      candidato: "Marco Antonio Pumari",
      color: "#ed2316",
      foto: await FileAttachment({"name":"../../imagenes/marco_antonio_pumari.png","mimeType":"image/png","path":"../../_file/imagenes/marco_antonio_pumari.fa3025d3.png","lastModified":1776054213666,"size":17776}, import.meta.url).url(),
    }),
  },
  6: {
    PATRIA: partido("PATRIA", {
      candidato: "Adrián Oliva Alcázar",
      color: "#ec8e4f",
      foto: await FileAttachment({"name":"../../imagenes/adrian_alcazar.png","mimeType":"image/png","path":"../../_file/imagenes/adrian_alcazar.f99bde71.png","lastModified":1776054213660,"size":16735}, import.meta.url).url(),
    }),
    CDC: partido("CDC", {
      candidato: "María René Soruco",
      color: "#41dada",
      foto: await FileAttachment({"name":"../../imagenes/maria_renee_soruco.png","mimeType":"image/png","path":"../../_file/imagenes/maria_renee_soruco.57d7356d.png","lastModified":1776054213666,"size":17295}, import.meta.url).url(),
    }),
    PDC: partido("PDC", {
      candidato: "Richard Rocha",
      color: "#016167",
      foto: await FileAttachment({"name":"../../imagenes/richard_rocha.png","mimeType":"image/png","path":"../../_file/imagenes/richard_rocha.860af837.png","lastModified":1776054213668,"size":11750}, import.meta.url).url(),
    }),
  },
  7: {
    LIBRE: partido("LIBRE", {
      candidato: "Juan Pablo Velasco",
      color: "#df3333",
      foto: await FileAttachment({"name":"../../imagenes/jp_velasco.png","mimeType":"image/png","path":"../../_file/imagenes/jp_velasco.9fb08e68.png","lastModified":1776054213665,"size":22808}, import.meta.url).url(),
    }),
    SPT: partido("SPT", {
      candidato: "Otto Ritter Méndez ",
      color: "#d2bc6d",
      foto: await FileAttachment({"name":"../../imagenes/otto_ritter.png","mimeType":"image/png","path":"../../_file/imagenes/otto_ritter.51ee106c.png","lastModified":1776054213667,"size":14205}, import.meta.url).url(),
    }),
    "CREEMOS - PATRIA": partido("CREEMOS - PATRIA", {
      candidato: "Luis Fernando Camacho",
      color: "#a077a1",
      foto: await FileAttachment({"name":"../../imagenes/fernando_camacho.png","mimeType":"image/png","path":"../../_file/imagenes/fernando_camacho.d782370c.png","lastModified":1776054213663,"size":18956}, import.meta.url).url(),
    }),
  },
  8: {
    "PATRIA-UNIDOS": partido("PATRIA-UNIDOS", {
      candidato: "Jesús Egüez Rivero",
      color: "#ec8e4f",
      foto: await FileAttachment({"name":"../../imagenes/jesus_eguez.png","mimeType":"image/png","path":"../../_file/imagenes/jesus_eguez.c5bde04e.png","lastModified":1776054213664,"size":19237}, import.meta.url).url(),
    }),
    MNR: partido("MNR", {
      candidato: "Hugo Vargas Roca",
      color: "#e689d7",
      foto: await FileAttachment({"name":"../../imagenes/hugo_vargas.png","mimeType":"image/png","path":"../../_file/imagenes/hugo_vargas.5092fef5.png","lastModified":1776054213664,"size":16400}, import.meta.url).url(),
    }),
    DESPIERTA: partido("DESPIERTA", {
      candidato: "Alejandro Unzueta",
      color: "#57b752",
      foto: await FileAttachment({"name":"../../imagenes/alejandro_unzueta.png","mimeType":"image/png","path":"../../_file/imagenes/alejandro_unzueta.4d0dff7a.png","lastModified":1776054213661,"size":14887}, import.meta.url).url(),
    }),
  },
  9: {
    "LIBRE-PANDO": partido("LIBRE-PANDO", {
      candidato: "Gabriela de Paiva",
      color: "#df3333",
      foto: await FileAttachment({"name":"../../imagenes/gabriela_de_paiva.png","mimeType":"image/png","path":"../../_file/imagenes/gabriela_de_paiva.e1249502.png","lastModified":1776054213663,"size":20347}, import.meta.url).url(),
    }),
    MDA: partido("MDA", {
      candidato: "Eva Luz Humerez",
      color: "#d5d54c",
      foto: await FileAttachment({"name":"../../imagenes/eva_luz_humerez.png","mimeType":"image/png","path":"../../_file/imagenes/eva_luz_humerez.0357b0ce.png","lastModified":1776054213662,"size":17935}, import.meta.url).url(),
    }),
    UPP: partido("UPP", {
      candidato: "Regis Richter",
      color: "#2c8e7f",
      foto: await FileAttachment({"name":"../../imagenes/regis_richter.png","mimeType":"image/png","path":"../../_file/imagenes/regis_richter.1102215f.png","lastModified":1776054213667,"size":13414}, import.meta.url).url(),
    }),
  },
};

export const otrosPartidos = partido("Otros partidos");

export function obtenerDefinicionesDepartamento(
  codigo,
  resultadoPartidos = {},
) {
  const definiciones = gobernacionesPartidos[codigo] ?? {};
  const merged = Object.fromEntries(
    Object.keys(resultadoPartidos).map((id) => [
      id,
      id === "otros"
        ? otrosPartidos
        : {
            nombre: id,
            candidato: "",
            color: "#b8b8b8",
            foto: null,
            ...(definiciones[id] ?? {}),
          },
    ]),
  );
  if (!merged.otros && resultadoPartidos.otros != null)
    merged.otros = otrosPartidos;
  return merged;
}
