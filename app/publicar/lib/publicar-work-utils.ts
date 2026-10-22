import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { CLASSIFICACOES_INDICATIVAS_OBRA } from "./publicar-static-options";
import type { CapituloLocal, ObraLocal } from "./publicar-models";

export function normalizarClassificacaoIndicativaPublicar(valor: string) {
  const valorLimpo = valor.trim();
  const valorNormalizado = normalizarTexto(valorLimpo);

  if (valorNormalizado === "livre" || valorNormalizado === "l") {
    return "Livre";
  }

  const classificacaoEncontrada = CLASSIFICACOES_INDICATIVAS_OBRA.find(
    (classificacao) =>
      normalizarTexto(classificacao) === valorNormalizado ||
      normalizarTexto(classificacao.replace("+", "")) === valorNormalizado,
  );

  return classificacaoEncontrada || "";
}

export function criarSlugUnico(titulo: string, obrasExistentes: ObraLocal[]) {
  const slugBase = criarSlugBase(titulo);
  const slugsUsados = new Set(
    obrasExistentes
      .map((obra) => obra.slug || criarSlugBase(obra.titulo))
      .filter(Boolean)
  );

  if (!slugsUsados.has(slugBase)) {
    return slugBase;
  }

  let contador = 2;
  let slugFinal = `${slugBase}-${contador}`;

  while (slugsUsados.has(slugFinal)) {
    contador += 1;
    slugFinal = `${slugBase}-${contador}`;
  }

  return slugFinal;
}

export function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}
