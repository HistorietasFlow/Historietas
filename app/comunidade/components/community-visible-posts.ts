import type { CategoriaComunidade } from "./community-category";
import type { AbaFeedComunidade } from "./community-feed-tab";
import {
  compararPrioridadesAutoresSeguidosComunidade,
  devePriorizarAutoresSeguidosComunidade,
  obterPrioridadeAutorSeguidoComunidade,
  prioridadesAutoresSeguidosSaoDiferentesComunidade,
} from "./community-followed-post-priority";
import {
  deveOcultarPostPorFiltrosBasicosEContextuaisComunidade,
  postCombinaAbaFeedComunidade,
  postCombinaCategoriaComunidade,
  postCombinaGrupoPublicacaoComunidade,
  postCombinaObraRelacionadaComunidade,
  postCombinaTipoPublicacaoComunidade,
} from "./community-post-basic-filter-matches";
import type { PostComunidade } from "./community-post-model";
import {
  compararDatasOrdenacaoPostsComunidade,
  compararPostsFixadosPorDataComunidade,
  compararPostsPorComentariosComunidade,
  compararPostsPorPontuacaoComunidade,
  deveOrdenarPostsPorComentariosComunidade,
  deveOrdenarPostsPorPontuacaoComunidade,
  obterPrioridadeFixacaoPostComunidade,
  postsEstaoFixadosComunidade,
  postsPossuemFixacaoDiferenteComunidade,
} from "./community-post-order-comparators";
import { obterDataOrdenacaoPostComunidade } from "./community-post-order-dates";
import { postCombinaTermoBuscaComunidade } from "./community-post-search-match";
import type { GrupoPublicacaoObra } from "./community-publication-group";
import type { TipoPublicacaoFiltro } from "./community-publication-filter";
import { obterTipoVisualPublicacao } from "./community-publication-visual-type";
import { deveOcultarPostPorFiltroSalvosComunidade } from "./community-saved-post-filter";
import type { OrdenacaoComunidade } from "./community-sort-order";

type ObterPostsVisiveisComunidadeParams = {
  posts: PostComunidade[];
  categoriaAtiva: CategoriaComunidade | "Todos";
  tipoPublicacaoAtiva: TipoPublicacaoFiltro;
  obraRelacionadaFiltro: string;
  grupoPublicacaoObra: GrupoPublicacaoObra;
  abaFeedAtiva: AbaFeedComunidade;
  usuariosSeguidosIds: string[];
  mostrarApenasSalvos: boolean;
  postsSalvosIds: string[];
  termoBuscaNormalizado: string;
  ordenacaoAtiva: OrdenacaoComunidade;
};

export function obterPostsVisiveisComunidade({
  posts,
  categoriaAtiva,
  tipoPublicacaoAtiva,
  obraRelacionadaFiltro,
  grupoPublicacaoObra,
  abaFeedAtiva,
  usuariosSeguidosIds,
  mostrarApenasSalvos,
  postsSalvosIds,
  termoBuscaNormalizado,
  ordenacaoAtiva,
}: ObterPostsVisiveisComunidadeParams): PostComunidade[] {
  const postsFiltrados = posts.filter((post) => {
    const categoriaCombina = postCombinaCategoriaComunidade(
      post,
      categoriaAtiva
    );
    const tipoVisualPublicacao = obterTipoVisualPublicacao(post);
    const tipoPublicacaoCombina = postCombinaTipoPublicacaoComunidade(
      tipoVisualPublicacao,
      tipoPublicacaoAtiva
    );
    const obraRelacionadaCombina = postCombinaObraRelacionadaComunidade(
      post,
      obraRelacionadaFiltro
    );
    const grupoPublicacaoCombina = postCombinaGrupoPublicacaoComunidade(
      tipoVisualPublicacao,
      grupoPublicacaoObra
    );
    const abaFeedCombina = postCombinaAbaFeedComunidade(
      post,
      tipoVisualPublicacao,
      abaFeedAtiva,
      usuariosSeguidosIds
    );

    if (
      deveOcultarPostPorFiltrosBasicosEContextuaisComunidade(
        categoriaCombina,
        tipoPublicacaoCombina,
        obraRelacionadaCombina,
        grupoPublicacaoCombina,
        abaFeedCombina
      )
    ) {
      return false;
    }

    if (
      deveOcultarPostPorFiltroSalvosComunidade(
        post,
        mostrarApenasSalvos,
        postsSalvosIds
      )
    ) {
      return false;
    }

    return postCombinaTermoBuscaComunidade(post, termoBuscaNormalizado);
  });

  return [...postsFiltrados].sort((postA, postB) => {
    const dataOrdenacaoA = obterDataOrdenacaoPostComunidade(postA);
    const dataOrdenacaoB = obterDataOrdenacaoPostComunidade(postB);

    if (postsPossuemFixacaoDiferenteComunidade(postA, postB)) {
      return obterPrioridadeFixacaoPostComunidade(postA);
    }

    if (postsEstaoFixadosComunidade(postA, postB)) {
      return compararPostsFixadosPorDataComunidade(
        postA,
        postB,
        dataOrdenacaoA,
        dataOrdenacaoB
      );
    }

    if (
      devePriorizarAutoresSeguidosComunidade(
        abaFeedAtiva,
        ordenacaoAtiva
      )
    ) {
      const seguindoA = obterPrioridadeAutorSeguidoComunidade(
        postA,
        usuariosSeguidosIds
      );
      const seguindoB = obterPrioridadeAutorSeguidoComunidade(
        postB,
        usuariosSeguidosIds
      );

      if (
        prioridadesAutoresSeguidosSaoDiferentesComunidade(
          seguindoA,
          seguindoB
        )
      ) {
        return compararPrioridadesAutoresSeguidosComunidade(
          seguindoA,
          seguindoB
        );
      }

      return compararPostsPorPontuacaoComunidade(
        postA,
        postB,
        dataOrdenacaoA,
        dataOrdenacaoB
      );
    }

    if (deveOrdenarPostsPorComentariosComunidade(ordenacaoAtiva)) {
      return compararPostsPorComentariosComunidade(
        postA,
        postB,
        dataOrdenacaoA,
        dataOrdenacaoB
      );
    }

    if (deveOrdenarPostsPorPontuacaoComunidade(ordenacaoAtiva)) {
      return compararPostsPorPontuacaoComunidade(
        postA,
        postB,
        dataOrdenacaoA,
        dataOrdenacaoB
      );
    }

    return compararDatasOrdenacaoPostsComunidade(
      dataOrdenacaoA,
      dataOrdenacaoB
    );
  });
}
