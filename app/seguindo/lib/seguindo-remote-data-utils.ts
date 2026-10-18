import type { ObraLocalConversao } from "./seguindo-work-converter-utils";
import { carregarSeguindoSupabase } from "./seguindo-work-loader";
import {
  carregarIdsSolicitacoesEnviadasSupabase,
  carregarSolicitacoesSeguidoresSupabase,
  carregarUsuariosSeguidoresSupabase,
  carregarUsuariosSeguidosSupabase,
} from "./seguindo-social-query-utils";

export async function carregarDadosRemotosSeguindo({
  obrasLocais,
  obrasSeguidasLocais,
  obrasFavoritasLocais,
  obrasConcluidasLocais,
  perfilSocialId,
  usuarioLogadoId,
}: {
  obrasLocais: ObraLocalConversao[];
  obrasSeguidasLocais: string[];
  obrasFavoritasLocais: string[];
  obrasConcluidasLocais: string[];
  perfilSocialId: string;
  usuarioLogadoId: string;
}) {
  const perfilIdParaListaSocial = perfilSocialId || usuarioLogadoId;
  const listaSocialEhDoUsuarioLogado =
    !perfilSocialId || perfilSocialId === usuarioLogadoId;

  const [
    dadosSupabase,
    usuariosSeguidosSupabase,
    usuariosSeguidoresSupabase,
    solicitacoesSeguidoresSupabase,
    solicitacoesEnviadasSupabase,
  ] = await Promise.all([
    carregarSeguindoSupabase(
      obrasLocais,
      perfilSocialId ? [] : obrasSeguidasLocais,
      obrasFavoritasLocais,
      obrasConcluidasLocais,
      perfilSocialId,
    ),
    carregarUsuariosSeguidosSupabase(perfilIdParaListaSocial),
    carregarUsuariosSeguidoresSupabase(perfilIdParaListaSocial),
    listaSocialEhDoUsuarioLogado
      ? carregarSolicitacoesSeguidoresSupabase(usuarioLogadoId)
      : Promise.resolve([]),
    listaSocialEhDoUsuarioLogado
      ? carregarIdsSolicitacoesEnviadasSupabase(usuarioLogadoId)
      : Promise.resolve([] as string[]),
  ]);

  return {
    dadosSupabase,
    usuariosSeguidosSupabase,
    usuariosSeguidoresSupabase,
    solicitacoesSeguidoresSupabase,
    solicitacoesEnviadasSupabase,
  };
}
