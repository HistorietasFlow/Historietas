import { carregarRegistrosAtividadesTabelaSeguindo } from "./seguindo-activity-query-utils";
import { deduplicarAtividadesSeguindo } from "./seguindo-activity-list-utils";
import {
  criarAtividadeSeguindoDeObra,
  criarAtividadeSeguindoDoDiario,
} from "./seguindo-activity-utils";
import { idUsuarioSupabaseValido } from "./seguindo-route-utils";

type UsuarioFeedSeguindo = {
  id: string;
  nome: string;
  handle: string;
  avatar: string;
};

type ObraFeedSeguindo = {
  id: string;
  titulo: string;
  slug: string;
  link: string;
  criadaEm: string;
};

type AtividadeFeedSeguindo = NonNullable<
  ReturnType<typeof criarAtividadeSeguindoDoDiario>
>;

export async function carregarAtividadesSeguindoSupabase(
  usuariosSeguidosBase: UsuarioFeedSeguindo[],
  obrasDisponiveis: ObraFeedSeguindo[],
  usuarioLogadoId: string,
) {
  const usuariosIds = usuariosSeguidosBase
    .map((usuarioSeguido) => usuarioSeguido.id)
    .filter((id) => idUsuarioSupabaseValido(id) && id !== usuarioLogadoId);

  if (usuariosIds.length === 0) {
    return [] as AtividadeFeedSeguindo[];
  }

  const usuariosPorId = new Map(
    usuariosSeguidosBase.map((usuarioSeguido) => [
      usuarioSeguido.id,
      usuarioSeguido,
    ]),
  );
  const obrasPorId = new Map(
    obrasDisponiveis
      .filter((obra) => Boolean(obra.id))
      .map((obra) => [obra.id, obra]),
  );

  const [diarioAtividades, favoritos, concluidas, avaliacoes] =
    await Promise.all([
      carregarRegistrosAtividadesTabelaSeguindo("diario_atividades", usuariosIds),
      carregarRegistrosAtividadesTabelaSeguindo("favoritos", usuariosIds),
      carregarRegistrosAtividadesTabelaSeguindo("concluidas", usuariosIds),
      carregarRegistrosAtividadesTabelaSeguindo("obra_avaliacoes", usuariosIds),
    ]);

  const atividadesDiario = diarioAtividades
    .map((registro) =>
      criarAtividadeSeguindoDoDiario({
        registro,
        usuariosPorId,
        obrasPorId,
      }),
    )
    .filter(
      (atividade): atividade is AtividadeFeedSeguindo => Boolean(atividade),
    );

  const atividadesFavoritos = favoritos
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "favoritou_obra",
        fallbackVisibilidade: "parcial",
      }),
    )
    .filter(
      (atividade): atividade is AtividadeFeedSeguindo => Boolean(atividade),
    );

  const atividadesConcluidas = concluidas
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "concluiu_obra",
        fallbackVisibilidade: "parcial",
      }),
    )
    .filter(
      (atividade): atividade is AtividadeFeedSeguindo => Boolean(atividade),
    );

  const atividadesAvaliacoes = avaliacoes
    .map((registro) =>
      criarAtividadeSeguindoDeObra({
        registro,
        usuariosPorId,
        obrasPorId,
        tipo: "avaliou_obra",
        fallbackVisibilidade: "publico",
      }),
    )
    .filter(
      (atividade): atividade is AtividadeFeedSeguindo => Boolean(atividade),
    );

  return deduplicarAtividadesSeguindo([
    ...atividadesDiario,
    ...atividadesFavoritos,
    ...atividadesConcluidas,
    ...atividadesAvaliacoes,
  ]).slice(0, 30);
}
