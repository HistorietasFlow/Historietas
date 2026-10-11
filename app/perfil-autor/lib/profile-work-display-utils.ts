import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { normalizarTexto } from "../../../lib/utils";
import { TOP_FIVE_MAXIMO } from "../constants";
import type { AutorPerfil, ObraLocal } from "../types";
import {
  mesclarObrasPorIdSlug,
  obterTotalConcluidasObraPerfilAutor,
} from "./data-normalizers";
import {
  colecaoTemObraPerfilBiblioteca,
  encontrarObraPorIdentificadorTopFivePerfil,
} from "./library-normalizers";
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


export function obterTotalObrasConcluidasPerfilAutor({
  perfilParaMostrar,
  totaisInteracoesObras,
  obrasConcluidas,
}: {
  perfilParaMostrar: AutorPerfil | null;
  totaisInteracoesObras: Parameters<
    typeof obterTotalConcluidasObraPerfilAutor
  >[1];
  obrasConcluidas: string[];
}) {
  if (!perfilParaMostrar) {
    return 0;
  }

  return perfilParaMostrar.obras.reduce((total, obra) => {
    const totalConcluidasReais = obterTotalConcluidasObraPerfilAutor(
      obra,
      totaisInteracoesObras,
    );
    const concluidaLocal = colecaoTemObraPerfilBiblioteca(
      obrasConcluidas,
      obra,
    )
      ? 1
      : 0;

    return total + Math.max(totalConcluidasReais, concluidaLocal);
  }, 0);
}


export function obterObraMenuAbertaPerfilAutor(
  obrasDoPerfilFiltradas: ObraLocal[],
  obraMenuAbertoId: string,
) {
  if (!obraMenuAbertoId) {
    return null;
  }

  return (
    obrasDoPerfilFiltradas.find((obra) => obra.id === obraMenuAbertoId) ||
    null
  );
}


export function obterVisibilidadeDestaquesPerfilAutor({
  obrasPerfilVisivel,
  podeEditarPerfil,
  mostrarDestaquesAutor,
  mostrarDestaquesVisitante,
  totalObrasEmDestaque,
}: {
  obrasPerfilVisivel: boolean;
  podeEditarPerfil: boolean;
  mostrarDestaquesAutor: boolean;
  mostrarDestaquesVisitante: boolean;
  totalObrasEmDestaque: number;
}) {
  const destaquesPerfilVisivel =
    obrasPerfilVisivel &&
    (podeEditarPerfil
      ? mostrarDestaquesAutor
      : mostrarDestaquesVisitante);

  return {
    destaquesPerfilVisivel,
    exibirSecaoDestaques:
      destaquesPerfilVisivel &&
      (totalObrasEmDestaque > 0 ||
        podeEditarPerfil ||
        mostrarDestaquesVisitante),
  };
}
