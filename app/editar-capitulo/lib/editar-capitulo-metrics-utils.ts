import {
  contarLetrasNumeros,
  contarPalavras,
} from "./editar-capitulo-text-utils";

type CapituloComLeitura = {
  lido?: boolean;
};

export function normalizarNumeroEditarCapitulo(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return Math.max(0, Math.round(fallback));
}

export function calcularEstatisticasCapitulo(
  titulo: string,
  texto: string,
  numeroCapitulo: number,
) {
  const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
  const textoLimpo = texto.trim();
  const palavras = contarPalavras(textoLimpo);
  const caracteres = texto.length;
  const caracteresValidos = contarLetrasNumeros(textoLimpo);
  const minutosLeitura =
    palavras > 0 ? Math.max(1, Math.ceil(palavras / 220)) : 0;
  const tituloValido = contarLetrasNumeros(tituloFinal) >= 3;
  const textoValido = caracteresValidos >= 20;

  return {
    tituloFinal,
    palavras,
    caracteres,
    caracteresValidos,
    minutosLeitura,
    tituloValido,
    textoValido,
    prontoParaSalvar: tituloValido && textoValido,
  };
}

export function calcularProgressoLeitura(
  capitulos: readonly CapituloComLeitura[],
) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}
