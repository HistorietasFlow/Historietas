import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { normalizarTexto } from "../../../lib/utils";
import { TOP_FIVE_MAXIMO } from "../constants";
import type { AutorPerfil, ObraLocal } from "../types";
import { mesclarObrasPorIdSlug } from "./data-normalizers";
import { encontrarObraPorIdentificadorTopFivePerfil } from "./library-normalizers";
import { obterTimestampData } from "./profile-formatters";

export function obterObrasVisiveisPerfilAutor({
  perfilParaMostrar,
  perfilPertenceAoUsuario,
}: {
  perfilParaMostrar: AutorPerfil | null;
  perfilPertenceAoUsuario: boolean;
}) {
  if (!perfilParaMostrar) {
    return [] as ObraLocal[];
  }

  const obrasVisiveis = perfilPertenceAoUsuario
    ? perfilParaMostrar.obras
    : perfilParaMostrar.obras.filter(
        (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
      );

  return [...obrasVisiveis].sort(
    (obraA, obraB) =>
      obterTimestampData(obraB.criadaEm) - obterTimestampData(obraA.criadaEm),
  );
}

export function obterObrasDestaquePerfilAutor({
  topFiveObraIds,
  obras,
  obrasPerfil,
  perfilPertenceAoUsuario,
}: {
  topFiveObraIds: string[];
  obras: ObraLocal[];
  obrasPerfil: ObraLocal[];
  perfilPertenceAoUsuario: boolean;
}) {
  if (topFiveObraIds.length === 0) {
    return [] as ObraLocal[];
  }

  const obrasDisponiveis = mesclarObrasPorIdSlug(obras, obrasPerfil).filter(
    (obra) =>
      perfilPertenceAoUsuario ||
      !ehClassificacao18(obra.classificacaoIndicativa),
  );
  const obrasSelecionadas = new Map<string, ObraLocal>();

  topFiveObraIds.forEach((obraId) => {
    const obraEncontrada = encontrarObraPorIdentificadorTopFivePerfil(
      obrasDisponiveis,
      obraId,
    );

    if (!obraEncontrada) {
      return;
    }

    const chaveObra =
      obraEncontrada.id.trim() ||
      obraEncontrada.slug.trim() ||
      normalizarTexto(obraEncontrada.titulo);

    if (chaveObra && !obrasSelecionadas.has(chaveObra)) {
      obrasSelecionadas.set(chaveObra, obraEncontrada);
    }
  });

  return Array.from(obrasSelecionadas.values()).slice(0, TOP_FIVE_MAXIMO);
}
