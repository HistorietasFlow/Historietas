import { contarLetrasNumeros } from "./adicionar-capitulo-text-utils";

type CapituloComLeitura = {
  lido?: boolean;
};

export function calcularEstatisticasCapitulo(
  titulo: string,
  texto: string,
  numeroCapitulo: number
) {
  const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo}`;
  const textoLimpo = texto.trim();
  const palavras = textoLimpo ? textoLimpo.split(/\s+/).filter(Boolean).length : 0;
  const caracteres = texto.length;
  const caracteresValidos = contarLetrasNumeros(textoLimpo);
  const minutosLeitura = palavras > 0 ? Math.max(1, Math.ceil(palavras / 220)) : 0;
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
    prontoParaCriar: tituloValido && textoValido,
  };
}

export function calcularProgressoLeitura(capitulos: CapituloComLeitura[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}
