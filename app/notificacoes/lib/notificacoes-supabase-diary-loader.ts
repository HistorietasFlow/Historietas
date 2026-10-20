import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { supabase } from "../../../lib/supabase/client";
import {
  criarSlugBase,
  obterNumeroSeguro,
} from "../../../lib/utils";
import { dataNotificacao } from "./notificacoes-filter-utils";
import {
  pegarBooleano,
  pegarTexto,
} from "./notificacoes-data-normalizers";
import type { NotificacaoLocal } from "./notificacoes-models";
import {
  criarDiarioPerfilHrefNotificacao,
} from "./notificacoes-navigation-utils";
import { obterPerfilNotificacao } from "./notificacoes-profile-utils";
import { carregarPerfisNotificacoes } from "./notificacoes-supabase-profile-loader";
import { obterRotuloTipoAnotacaoDiarioNotificacao } from "./notificacoes-status-text-utils";

export async function carregarNotificacoesDiarioSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  if (!userId) {
    return [];
  }

  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesDiario: NotificacaoLocal[] = [];
  const anotacoesDoUsuario: Record<string, unknown>[] = [];
  const curtidasAnotacoes: Record<string, unknown>[] = [];
  const comentariosAnotacoes: Record<string, unknown>[] = [];
  const atividadesSeguidos: Record<string, unknown>[] = [];
  const usuariosParaPerfil = new Set<string>();
  const obrasIds = new Set<string>();

  try {
    const { data: anotacoesData } = await supabase
      .from("diario_anotacoes")
      .select("id, user_id, obra_id, tipo, texto, visibilidade, criado_em, atualizado_em")
      .eq("user_id", userId)
      .order("atualizado_em", { ascending: false })
      .limit(120);

    if (Array.isArray(anotacoesData)) {
      anotacoesData.forEach((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return;
        }

        const registro = item as Record<string, unknown>;
        const anotacaoId = pegarTexto(registro.id);
        const obraId = pegarTexto(registro.obra_id);

        if (!anotacaoId) {
          return;
        }

        anotacoesDoUsuario.push(registro);

        if (obraId) {
          obrasIds.add(obraId);
        }
      });
    }
  } catch {
    // O Diário continua sem notificações de interação se a consulta falhar.
  }

  const anotacoesPorId = new Map(
    anotacoesDoUsuario
      .map((anotacao) => [pegarTexto(anotacao.id), anotacao] as const)
      .filter(([anotacaoId]) => Boolean(anotacaoId))
  );
  const anotacaoIds = Array.from(anotacoesPorId.keys());

  if (anotacaoIds.length > 0) {
    try {
      const [curtidasResposta, comentariosResposta] = await Promise.all([
        supabase
          .from("diario_anotacao_curtidas")
          .select("id, anotacao_id, user_id, criado_em")
          .in("anotacao_id", anotacaoIds)
          .neq("user_id", userId)
          .order("criado_em", { ascending: false })
          .limit(160),
        supabase
          .from("diario_anotacao_comentarios")
          .select("id, anotacao_id, user_id, texto, criado_em, atualizado_em")
          .in("anotacao_id", anotacaoIds)
          .neq("user_id", userId)
          .order("criado_em", { ascending: false })
          .limit(160),
      ]);

      if (Array.isArray(curtidasResposta.data)) {
        curtidasResposta.data.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);

          curtidasAnotacoes.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }
        });
      }

      if (Array.isArray(comentariosResposta.data)) {
        comentariosResposta.data.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);

          comentariosAnotacoes.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }
        });
      }
    } catch {
      // Interações do Diário são complementares às demais notificações.
    }
  }

  try {
    const { data: seguindoData } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id")
      .eq("seguidor_id", userId)
      .limit(120);

    const usuariosSeguidos = Array.isArray(seguindoData)
      ? seguindoData
          .map((item) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? pegarTexto((item as Record<string, unknown>).seguido_id)
              : ""
          )
          .filter(Boolean)
      : [];

    usuariosSeguidos.forEach((seguidoId) => usuariosParaPerfil.add(seguidoId));

    if (usuariosSeguidos.length > 0) {
      const { data: atividadesData } = await supabase
        .from("diario_atividades")
        .select(
          "id, user_id, tipo, obra_id, capitulo_id, texto, nota, visibilidade, metadata, criado_em, atualizado_em"
        )
        .in("user_id", usuariosSeguidos)
        .eq("visibilidade", "publico")
        .in("tipo", ["concluiu_obra", "avaliou_obra"])
        .order("criado_em", { ascending: false })
        .limit(100);

      if (Array.isArray(atividadesData)) {
        atividadesData.forEach((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const autorId = pegarTexto(registro.user_id);
          const obraId = pegarTexto(registro.obra_id);

          atividadesSeguidos.push(registro);

          if (autorId) {
            usuariosParaPerfil.add(autorId);
          }

          if (obraId) {
            obrasIds.add(obraId);
          }
        });
      }
    }
  } catch {
    // Atividades públicas de perfis seguidos não bloqueiam as demais notificações.
  }

  const obrasPorId = new Map<
    string,
    { id: string; titulo: string; slug: string; publicado: boolean }
  >();

  if (obrasIds.size > 0) {
    try {
      const { data: obrasData } = await supabase
        .from("obras")
        .select("id, titulo, slug, publicado, classificacao_indicativa")
        .in("id", Array.from(obrasIds))
        .limit(200);

      if (Array.isArray(obrasData)) {
        obrasData.forEach((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const obraId = pegarTexto(registro.id);

          if (!obraId) {
            return;
          }

          const classificacaoIndicativa = pegarTexto(
            registro.classificacao_indicativa
          );

          if (ehClassificacao18(classificacaoIndicativa)) {
            return;
          }

          const titulo = pegarTexto(registro.titulo, `Obra ${index + 1}`);

          obrasPorId.set(obraId, {
            id: obraId,
            titulo,
            slug: pegarTexto(registro.slug, criarSlugBase(titulo)),
            publicado: pegarBooleano(registro.publicado, true),
          });
        });
      }
    } catch {
      // O texto da anotação continua permitindo identificar a notificação.
    }
  }

  const perfis = await carregarPerfisNotificacoes(
    Array.from(usuariosParaPerfil)
  );
  const linkDiarioProprio = criarDiarioPerfilHrefNotificacao(userId);

  curtidasAnotacoes.forEach((registro) => {
    const curtidaId = pegarTexto(registro.id);
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const anotacao = anotacoesPorId.get(anotacaoId);

    if (!curtidaId || !anotacao) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const obraId = pegarTexto(anotacao.obra_id);
    const obra = obrasPorId.get(obraId);
    const tipoAnotacao = obterRotuloTipoAnotacaoDiarioNotificacao(
      pegarTexto(anotacao.tipo)
    );
    const id = `diario-curtida-${curtidaId}`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: linkDiarioProprio,
      titulo: "Nova curtida no Diário",
      mensagem: `${perfilAutor.nome} curtiu sua ${tipoAnotacao}${
        obra?.titulo ? ` sobre ${obra.titulo}` : ""
      }.`,
      tipo: "curtida-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(registro.criado_em, new Date().toISOString()),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  comentariosAnotacoes.forEach((registro) => {
    const comentarioId = pegarTexto(registro.id);
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const anotacao = anotacoesPorId.get(anotacaoId);

    if (!comentarioId || !anotacao) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Leitor");
    const obraId = pegarTexto(anotacao.obra_id);
    const obra = obrasPorId.get(obraId);
    const comentario = pegarTexto(registro.texto);
    const tipoAnotacao = obterRotuloTipoAnotacaoDiarioNotificacao(
      pegarTexto(anotacao.tipo)
    );
    const id = `diario-comentario-${comentarioId}`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: linkDiarioProprio,
      titulo: "Novo comentário no Diário",
      mensagem: `${perfilAutor.nome} comentou na sua ${tipoAnotacao}${
        obra?.titulo ? ` sobre ${obra.titulo}` : ""
      }${comentario ? `: ${comentario.slice(0, 120)}` : "."}`,
      tipo: "comentario-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  atividadesSeguidos.forEach((registro) => {
    const atividadeId = pegarTexto(registro.id);

    if (!atividadeId) {
      return;
    }

    const autorId = pegarTexto(registro.user_id);
    const perfilAutor = obterPerfilNotificacao(perfis, autorId, "Usuário");
    const tipoAtividade = pegarTexto(registro.tipo);
    const obraId = pegarTexto(registro.obra_id);

    if (!obraId) {
      return;
    }

    const obra = obrasPorId.get(obraId);
    const tituloObra = obra?.titulo || "uma obra";
    const nota = obterNumeroSeguro(registro.nota, 0);
    const id = `diario-atividade-${atividadeId}`;
    const mensagem =
      tipoAtividade === "avaliou_obra"
        ? `${perfilAutor.nome} avaliou ${tituloObra}${
            nota > 0 ? ` com ${nota.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} estrelas` : ""
          }.`
        : `${perfilAutor.nome} concluiu ${tituloObra}.`;

    notificacoesDiario.push({
      id,
      obraId,
      capituloId: "",
      link: criarDiarioPerfilHrefNotificacao(autorId, perfilAutor.nome),
      titulo:
        tipoAtividade === "avaliou_obra"
          ? "Nova avaliação no Diário"
          : "Obra concluída no Diário",
      mensagem,
      tipo: "atividade-diario",
      lida: idsLidos.has(id),
      criadaEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
        new Date().toISOString()
      ),
      autorId,
      autorNome: perfilAutor.nome,
      autorAvatar: perfilAutor.avatar,
    });
  });

  return notificacoesDiario.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}
