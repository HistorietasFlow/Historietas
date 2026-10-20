"use client";

import { normalizarTexto } from "../../../lib/utils";
import { useSeguindoAuthorsBase } from "./use-seguindo-authors-base";
import { useSeguindoFilteredAuthors } from "./use-seguindo-filtered-authors";
import { useSeguindoFilteredFollowerRequests } from "./use-seguindo-filtered-follower-requests";
import { useSeguindoFilteredUsers } from "./use-seguindo-filtered-users";
import { useSeguindoFilteredWorks } from "./use-seguindo-filtered-works";
import { useSeguindoVisibleWorks } from "./use-seguindo-visible-works";
import { calcularTotaisSeguindo } from "../lib/seguindo-list-counts";
import { obterOpcoesOrdenacaoSeguindo } from "../lib/seguindo-sort-options";
import { obterContextoListaSocial } from "../lib/seguindo-social-list-context";
import { selecionarUsuariosBaseSocial } from "../lib/seguindo-social-users-selector";
import { buscaSugestoesUsuariosEstaAtiva } from "../lib/seguindo-social-search-eligibility";
import { obterPermissoesListaSocial } from "../lib/seguindo-social-list-permissions";
import { obterRotulosListaSocial } from "../lib/seguindo-social-list-labels";
import type {
  AbaConteudoSeguindo,
  FiltroSeguindo,
  ObraLocal,
  OrdenacaoSeguindo,
  SolicitacaoSeguidor,
  UsuarioSeguido,
} from "../lib/seguindo-page-types";

type UseSeguindoDerivedContentParams = {
  obras: ObraLocal[];
  obrasSeguidas: string[];
  autoresSeguidos: string[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  busca: string;
  buscaSeguindoAberta: boolean;
  abaConteudo: AbaConteudoSeguindo;
  filtro: FiltroSeguindo;
  ordenacao: OrdenacaoSeguindo;
  usuarioLogadoId: string;
  perfilSocialId: string;
  perfilSocialNome: string;
  usuariosSeguidos: UsuarioSeguido[];
  usuariosSeguidores: UsuarioSeguido[];
  solicitacoesSeguidores: SolicitacaoSeguidor[];
};

export function useSeguindoDerivedContent({
  obras,
  obrasSeguidas,
  autoresSeguidos,
  obrasFavoritas,
  obrasConcluidas,
  busca,
  buscaSeguindoAberta,
  abaConteudo,
  filtro,
  ordenacao,
  usuarioLogadoId,
  perfilSocialId,
  perfilSocialNome,
  usuariosSeguidos,
  usuariosSeguidores,
  solicitacoesSeguidores,
}: UseSeguindoDerivedContentParams) {
  const termoBusca = normalizarTexto(busca);
  const { listaSocialEhDoUsuarioLogado, visualizandoListaSocialDoPerfil } =
    obterContextoListaSocial(usuarioLogadoId, perfilSocialId);
  const buscaSugestoesUsuariosAtiva = buscaSugestoesUsuariosEstaAtiva(
    buscaSeguindoAberta,
    termoBusca,
    visualizandoListaSocialDoPerfil,
    abaConteudo,
  );
  const usuariosBaseSocial = selecionarUsuariosBaseSocial(
    abaConteudo,
    usuariosSeguidores,
    usuariosSeguidos,
  );
  const { descricaoListaSocial } = obterRotulosListaSocial(
    abaConteudo,
    perfilSocialNome,
  );
  const { podeRemoverUsuariosDaLista, podeRemoverSeguidoresDaLista } =
    obterPermissoesListaSocial(listaSocialEhDoUsuarioLogado, abaConteudo);
  const { obrasVisiveisSeguindo, obrasSeguidasBase } =
    useSeguindoVisibleWorks(obras, obrasSeguidas);
  const autoresBase = useSeguindoAuthorsBase(
    obrasVisiveisSeguindo,
    autoresSeguidos,
    obrasFavoritas,
    obrasConcluidas,
  );
  const obrasFiltradas = useSeguindoFilteredWorks(
    obrasSeguidasBase,
    termoBusca,
    filtro,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
    abaConteudo,
  );
  const autoresFiltrados = useSeguindoFilteredAuthors(
    autoresBase,
    termoBusca,
    filtro,
    ordenacao,
    abaConteudo,
    visualizandoListaSocialDoPerfil,
  );
  const usuariosFiltrados = useSeguindoFilteredUsers(
    usuariosBaseSocial,
    termoBusca,
    filtro,
    ordenacao,
    abaConteudo,
    visualizandoListaSocialDoPerfil,
  );
  const solicitacoesSeguidoresFiltradas =
    useSeguindoFilteredFollowerRequests(
      abaConteudo,
      listaSocialEhDoUsuarioLogado,
      solicitacoesSeguidores,
      termoBusca,
    );
  const { totalDisponivelGeral, totalSemFiltros, totalSeguindo } =
    calcularTotaisSeguindo({
      abaConteudo,
      listaSocialEhDoUsuarioLogado,
      visualizandoListaSocialDoPerfil,
      obrasSeguidasBase,
      usuariosSeguidos,
      usuariosSeguidores,
      solicitacoesSeguidores,
      autoresBase,
      usuariosFiltrados,
      solicitacoesSeguidoresFiltradas,
      obrasFiltradas,
      autoresFiltrados,
    });
  const opcoesOrdenacao = obterOpcoesOrdenacaoSeguindo(abaConteudo);

  return {
    listaSocialEhDoUsuarioLogado,
    visualizandoListaSocialDoPerfil,
    buscaSugestoesUsuariosAtiva,
    descricaoListaSocial,
    podeRemoverUsuariosDaLista,
    podeRemoverSeguidoresDaLista,
    obrasSeguidasBase,
    obrasFiltradas,
    autoresFiltrados,
    usuariosFiltrados,
    solicitacoesSeguidoresFiltradas,
    totalDisponivelGeral,
    totalSemFiltros,
    totalSeguindo,
    opcoesOrdenacao,
  };
}
