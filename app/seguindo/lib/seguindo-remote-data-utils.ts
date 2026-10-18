import { carregarAtividadesSeguindoSupabase } from "./seguindo-activity-feed-utils";
import { normalizarListaTexto } from "./seguindo-format-utils";
import { normalizarObraSalva } from "./seguindo-saved-work-utils";
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

type ObraSalvaEntrada = Parameters<typeof normalizarObraSalva>[0];

export async function prepararDadosRemotosSeguindo({
  dadosSupabase,
  usuariosSeguidosSupabase,
  usuarioLogadoId,
}: {
  dadosSupabase: Awaited<ReturnType<typeof carregarSeguindoSupabase>>;
  usuariosSeguidosSupabase: Awaited<
    ReturnType<typeof carregarUsuariosSeguidosSupabase>
  >;
  usuarioLogadoId: string;
}) {
  const obras = dadosSupabase.obras.map((obra, index) =>
    normalizarObraSalva(obra as unknown as ObraSalvaEntrada, index),
  );
  const atividades = await carregarAtividadesSeguindoSupabase(
    usuariosSeguidosSupabase,
    obras,
    usuarioLogadoId,
  );

  return {
    obras,
    obrasSeguidas: normalizarListaTexto(dadosSupabase.obrasSeguidas),
    obrasFavoritas: normalizarListaTexto(dadosSupabase.obrasFavoritas),
    obrasConcluidas: normalizarListaTexto(dadosSupabase.obrasConcluidas),
    atividades,
  };
}
