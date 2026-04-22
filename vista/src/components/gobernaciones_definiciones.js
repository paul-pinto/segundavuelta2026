import { FileAttachment } from "observablehq:stdlib";

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
      foto: await FileAttachment("../imagenes/luis_ayllon.png").url(),
    }),
    "PATRIA-UNIDOS": partido("PATRIA-UNIDOS", {
      candidato: "Franz García",
      color: "#ec8e4f",
      foto: await FileAttachment("../imagenes/franz_garcia.png").url(),
    }),
    LIBRE: partido("LIBRE", {
      candidato: "Ricardo Zarate",
      color: "#df3333",
      foto: await FileAttachment("../imagenes/ricardo_zarate.png").url(),
    }),
    "XS-CH": partido("XS-CH"),
  },
  2: {
    "PATRIA-SOL": partido("PATRIA-SOL", {
      candidato: "Luis Revilla",
      color: "#ffc826",
      foto: await FileAttachment("../imagenes/luis_revilla.png").url(),
    }),
    NGP: partido("NGP", {
      candidato: "René Yahuasi  ",
      color: "#48b7dc",
      foto: await FileAttachment("../imagenes/rene_yahuasi.png").url(),
    }),
    MTS: partido("MTS", {
      candidato: "Félix Patzi",
      color: "#529c7c",
      foto: await FileAttachment("../imagenes/felix_patzi.png").url(),
    }),
    IH: partido("IH", {
      candidato: "Antonio Riveros",
      color: "#b357b3",
      foto: await FileAttachment("../imagenes/antonio_riveros.png").url(),
    }),
    VENCEREMOS: partido("VENCEREMOS", {
      candidato: "Andrés Gomez",
      color: "#e34011",
      foto: await FileAttachment("../imagenes/andres_gomez.png").url(),
    }),
    UPC: partido("UPC", {
      candidato: "Santos Quispe",
      color: "#b03b10",
      foto: await FileAttachment("../imagenes/santos_quispe.png").url(),
    }),
    ASLP: partido("ASLP", {
      candidato: "Ingvar Ellefsen ",
      color: "#002780",
      foto: await FileAttachment("../imagenes/ingvar_ellefsen.png").url(),
    }),
    VIDA: partido("VIDA", {
      candidato: "Gregorio Merlo",
      color: "#f98f2e",
      foto: await FileAttachment("../imagenes/gregorio_merlo.png").url(),
    }),
  },
  3: {
    "A-UPP": partido("A-UPP", {
      candidato: "Leonardo Loza",
      color: "#ccc16a",
      foto: await FileAttachment("../imagenes/leonardo_loza.png").url(),
    }),
    "APB-SUMATE": partido("APB-SUMATE", {
      color: "#9f6bb2",
      candidato: "Sergio Rodriguez",
      foto: await FileAttachment("../imagenes/sergio_rodriguez.png").url(),
    }),
    MTS: partido("MTS", {
      candidato: "Alejandro Mostajo",
      color: "#529c7c",
      foto: await FileAttachment("../imagenes/alejandro_mostajo.png").url(),
    }),
  },
  4: {
    JACHAJAKISASOLFESORC: partido("JACHAJAKISASOLFESORC", {
      candidato: "Edgar Sánchez",
      color: "#d93033",
      foto: await FileAttachment("../imagenes/edgar_sanchez.png").url(),
    }),
    "PATRIA-ORURO": partido("PATRIA-ORURO", {
      candidato: "Oscar Chambi",
      color: "#ec8e4f",
      foto: await FileAttachment("../imagenes/oscar_chambi.png").url(),
    }),
    "A-UPP": partido("A-UPP", {
      candidato: "Johnny Franklin Vedia",
      color: "#ccc16a",
      foto: await FileAttachment("../imagenes/johnny_vedia.png").url(),
    }),
    NGP: partido("NGP", {
      candidato: "Juan Saul García",
      color: "#48b7dc",
      foto: await FileAttachment("../imagenes/juan_garcia.png").url(),
    }),
    AORA: partido("AORA", {
      candidato: "Rubén Gutiérrez Carrizo ",
      color: "#4ca689",
      foto: await FileAttachment("../imagenes/ruben_gutierrez.png").url(),
    }),
  },
  5: {
    "A.S.": partido("A.S.", {
      candidato: "René Joaquino",
      color: "#35a150",
      foto: await FileAttachment("../imagenes/rene_joaquino.png").url(),
    }),
    "PATRIA-UNIDOS": partido("PATRIA-UNIDOS", {
      candidato: "Marco Antonio Copa",
      color: "#ec8e4f",
      foto: await FileAttachment("../imagenes/marco_antonio_copa.png").url(),
    }),
    APP: partido("APP", {
      candidato: "Marco Antonio Pumari",
      color: "#ed2316",
      foto: await FileAttachment("../imagenes/marco_antonio_pumari.png").url(),
    }),
  },
  6: {
    PATRIA: partido("PATRIA", {
      candidato: "Adrián Oliva Alcázar",
      color: "#ec8e4f",
      foto: await FileAttachment("../imagenes/adrian_alcazar.png").url(),
    }),
    CDC: partido("CDC", {
      candidato: "María René Soruco",
      color: "#41dada",
      foto: await FileAttachment("../imagenes/maria_renee_soruco.png").url(),
    }),
    PDC: partido("PDC", {
      candidato: "Richard Rocha",
      color: "#016167",
      foto: await FileAttachment("../imagenes/richard_rocha.png").url(),
    }),
  },
  7: {
    LIBRE: partido("LIBRE", {
      candidato: "Juan Pablo Velasco",
      color: "#df3333",
      foto: await FileAttachment("../imagenes/jp_velasco.png").url(),
    }),
    SPT: partido("SPT", {
      candidato: "Otto Ritter Méndez ",
      color: "#d2bc6d",
      foto: await FileAttachment("../imagenes/otto_ritter.png").url(),
    }),
    "CREEMOS - PATRIA": partido("CREEMOS - PATRIA", {
      candidato: "Luis Fernando Camacho",
      color: "#a077a1",
      foto: await FileAttachment("../imagenes/fernando_camacho.png").url(),
    }),
  },
  8: {
    "PATRIA-UNIDOS": partido("PATRIA-UNIDOS", {
      candidato: "Jesús Egüez Rivero",
      color: "#ec8e4f",
      foto: await FileAttachment("../imagenes/jesus_eguez.png").url(),
    }),
    MNR: partido("MNR", {
      candidato: "Hugo Vargas Roca",
      color: "#e689d7",
      foto: await FileAttachment("../imagenes/hugo_vargas.png").url(),
    }),
    DESPIERTA: partido("DESPIERTA", {
      candidato: "Alejandro Unzueta",
      color: "#57b752",
      foto: await FileAttachment("../imagenes/alejandro_unzueta.png").url(),
    }),
  },
  9: {
    "LIBRE-PANDO": partido("LIBRE-PANDO", {
      candidato: "Gabriela de Paiva",
      color: "#df3333",
      foto: await FileAttachment("../imagenes/gabriela_de_paiva.png").url(),
    }),
    MDA: partido("MDA", {
      candidato: "Eva Luz Humerez",
      color: "#d5d54c",
      foto: await FileAttachment("../imagenes/eva_luz_humerez.png").url(),
    }),
    UPP: partido("UPP", {
      candidato: "Regis Richter",
      color: "#2c8e7f",
      foto: await FileAttachment("../imagenes/regis_richter.png").url(),
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
