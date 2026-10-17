import { supabase } from "../../../lib/supabase/client";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../../lib/supabase/paginacao.mjs";
import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";

export type PerfilComentarioLeitor = {
  userId: string;
  nome: string;
  avatar: string;
};

export function obterTextoRegistroLeitor(
  registro: Record<string, unknown> | null | undefined,
  chave: string,
) {
  const valor = registro?.[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

function obterNomeProfileLeitor(profile: Record<string, unknown> | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistroLeitor(profile, "nome") ||
    obterTextoRegistroLeitor(profile, "nome_usuario") ||
    obterTextoRegistroLeitor(profile, "username") ||
    obterTextoRegistroLeitor(profile, "display_name") ||
    obterTextoRegistroLeitor(profile, "apelido")
  );
}

function obterAvatarProfileLeitor(profile: Record<string, unknown> | undefined) {
  if (!profile) {
    return "";
  }

  return (
    obterTextoRegistroLeitor(profile, "avatar_url") ||
    obterTextoRegistroLeitor(profile, "avatar") ||
    obterTextoRegistroLeitor(profile, "foto_url") ||
    obterTextoRegistroLeitor(profile, "imagem_url") ||
    obterTextoRegistroLeitor(profile, "photo_url")
  );
}

function obterMetadataUsuarioLeitor(metadata: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function obterNomeMetadataUsuarioLeitor(metadata: Record<string, unknown>) {
  return (
    obterTextoRegistroLeitor(metadata, "nome") ||
    obterTextoRegistroLeitor(metadata, "nome_usuario") ||
    obterTextoRegistroLeitor(metadata, "username") ||
    obterTextoRegistroLeitor(metadata, "display_name") ||
    obterTextoRegistroLeitor(metadata, "apelido") ||
    obterTextoRegistroLeitor(metadata, "name") ||
    obterTextoRegistroLeitor(metadata, "full_name")
  );
}

function obterAvatarMetadataUsuarioLeitor(metadata: Record<string, unknown>) {
  return (
    obterTextoRegistroLeitor(metadata, "avatar_url") ||
    obterTextoRegistroLeitor(metadata, "avatar") ||
    obterTextoRegistroLeitor(metadata, "foto_url") ||
    obterTextoRegistroLeitor(metadata, "imagem_url") ||
    obterTextoRegistroLeitor(metadata, "photo_url") ||
    obterTextoRegistroLeitor(metadata, "picture")
  );
}

function obterNomePorEmailLeitor(email: string) {
  const nomeEmail = email.trim().split("@")[0];

  return nomeEmail || "Usuário";
}


async function carregarProfilesPorUsuariosLeitor(userIds: string[]) {
  const idsValidos = Array.from(
    new Set(
      userIds
        .map((userId) => userId.trim())
        .filter((userId) => Boolean(userId))
    )
  );
  const profilesPorUsuario = new Map<string, Record<string, unknown>>();

  if (idsValidos.length === 0) {
    return profilesPorUsuario;
  }

  try {
    const profiles =
      await carregarTodasPaginasPorLotesSupabase<Record<string, unknown>, string>({
        nomeColecao: "perfis dos comentários por usuário",
        itens: idsValidos,
        buscarPaginaLote: async (usuarioIdsLote, inicio, fim) =>
          supabase
            .from("profiles")
            .select("id,user_id,nome,avatar_url")
            .in("user_id", usuarioIdsLote)
            .order("id", { ascending: true })
            .range(inicio, fim),
      });

    profiles.forEach((profile) => {
      const profileUserId = obterTextoRegistroLeitor(profile, "user_id");

      if (profileUserId) {
        profilesPorUsuario.set(profileUserId, profile);
      }
    });
  } catch {
    // Bases antigas podem usar id como chave do profile. O fallback vem abaixo.
  }

  const idsSemProfile = idsValidos.filter(
    (userId) => !profilesPorUsuario.has(userId)
  );

  if (idsSemProfile.length > 0) {
    try {
      const profiles =
        await carregarTodasPaginasPorLotesSupabase<Record<string, unknown>, string>({
          nomeColecao: "perfis dos comentários por id",
          itens: idsSemProfile,
          buscarPaginaLote: async (profileIdsLote, inicio, fim) =>
            supabase
              .from("profiles")
              .select("id,user_id,nome,avatar_url")
              .in("id", profileIdsLote)
              .order("id", { ascending: true })
              .range(inicio, fim),
        });

      profiles.forEach((profile) => {
        const profileUserId =
          obterTextoRegistroLeitor(profile, "user_id") ||
          obterTextoRegistroLeitor(profile, "id");

        if (profileUserId) {
          profilesPorUsuario.set(profileUserId, profile);
        }
      });
    } catch {
      // Profiles é complementar; comentários continuam com fallback.
    }
  }

  return profilesPorUsuario;
}

export async function carregarPerfilComentarioLeitor(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return { userId: "", nome: "Usuário", avatar: "" } satisfies PerfilComentarioLeitor;
  }

  const profilesPorUsuario = await carregarProfilesPorUsuariosLeitor([userIdLimpo]);
  const profile = profilesPorUsuario.get(userIdLimpo);
  let nome = obterNomeProfileLeitor(profile);
  let avatar = obterAvatarProfileLeitor(profile);

  try {
    const { data } = await supabase.auth.getUser();
    const usuario = data.user;

    if (usuario?.id === userIdLimpo) {
      const metadata = obterMetadataUsuarioLeitor(usuario.user_metadata);

      nome =
        nome ||
        obterNomeMetadataUsuarioLeitor(metadata) ||
        obterNomePorEmailLeitor(usuario.email || "");
      avatar = avatar || obterAvatarMetadataUsuarioLeitor(metadata);
    }
  } catch {
    // O fallback de autenticação não deve travar os comentários.
  }

  return {
    userId: userIdLimpo,
    nome: (nome || "Usuário").slice(0, 80),
    avatar,
  } satisfies PerfilComentarioLeitor;
}


export async function carregarComentariosCapituloSupabase(
  capituloId: string,
  usuarioLogadoId: string,
  {
    aplicarCurtidasComentariosCapitulosLocais,
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,
  }: {
    aplicarCurtidasComentariosCapitulosLocais: (
      comentarios: ComentarioCapituloPublico[],
      userId: string,
    ) => ComentarioCapituloPublico[];
    TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas";
  },
): Promise<ComentarioCapituloPublico[]> {
  const capituloIdLimpo = capituloId.trim();

  if (!capituloIdLimpo) {
    return [];
  }

  try {
    let data: Record<string, unknown>[] | null = null;
    let error: unknown = null;

    const consultasComentarios = [
      async (inicio: number, fim: number) =>
        supabase
          .from("comentarios_capitulos")
          .select(
            "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em"
          )
          .eq("capitulo_id", capituloIdLimpo)
          .order("atualizado_em", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
      async (inicio: number, fim: number) =>
        supabase
          .from("comentarios_capitulos")
          .select("id,user_id,comentario,comentario_pai_id,criado_em")
          .eq("capitulo_id", capituloIdLimpo)
          .order("criado_em", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
      async (inicio: number, fim: number) =>
        supabase
          .from("comentarios_capitulos")
          .select("id,user_id,comentario,atualizado_em,criado_em")
          .eq("capitulo_id", capituloIdLimpo)
          .order("atualizado_em", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
      async (inicio: number, fim: number) =>
        supabase
          .from("comentarios_capitulos")
          .select("id,user_id,comentario,criado_em")
          .eq("capitulo_id", capituloIdLimpo)
          .order("criado_em", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, fim),
    ];

    for (const consultar of consultasComentarios) {
      try {
        data = await carregarTodasPaginasSupabase<Record<string, unknown>>({
          nomeColecao: "comentários do capítulo",
          buscarPagina: consultar,
        });
        error = null;
        break;
      } catch (erroConsulta) {
        error = erroConsulta;
      }
    }

    if (error || !Array.isArray(data)) {
      return [];
    }

    const registros = data.filter((registro) =>
      Boolean(obterTextoRegistroLeitor(registro, "comentario"))
    );
    const comentarioIds = registros
      .map((registro) => obterTextoRegistroLeitor(registro, "id"))
      .filter(Boolean);
    const usuariosIds = registros
      .map((registro) => obterTextoRegistroLeitor(registro, "user_id"))
      .filter(Boolean);
    const profilesPorUsuario = await carregarProfilesPorUsuariosLeitor(usuariosIds);
    const perfilUsuarioLogado = usuarioLogadoId.trim()
      ? await carregarPerfilComentarioLeitor(usuarioLogadoId)
      : null;
    const curtidasPorComentario = new Map<string, string[]>();

    if (comentarioIds.length > 0) {
      try {
        const curtidasData = await carregarTodasPaginasPorLotesSupabase<
          { comentario_id: string; usuario_id: string },
          string
        >({
          nomeColecao: "curtidas dos comentários do capítulo",
          itens: comentarioIds,
          buscarPaginaLote: async (comentarioIdsLote, inicio, fim) =>
            supabase
              .from(TABELA_COMENTARIOS_CAPITULOS_CURTIDAS)
              .select("comentario_id,usuario_id")
              .in("comentario_id", comentarioIdsLote)
              .order("comentario_id", { ascending: true })
              .order("usuario_id", { ascending: true })
              .range(inicio, fim),
        });

        curtidasData.forEach(
          (curtida) => {
            const comentarioId = curtida.comentario_id;
            const usuarioId = curtida.usuario_id;

            if (!comentarioId || !usuarioId) {
              return;
            }

            const curtidasAtuais = curtidasPorComentario.get(comentarioId) || [];

            if (!curtidasAtuais.includes(usuarioId)) {
              curtidasPorComentario.set(comentarioId, [
                ...curtidasAtuais,
                usuarioId,
              ]);
            }
          }
        );
      } catch {
        // Curtidas são complementares; os comentários continuam visíveis.
      }
    }

    const comentariosMapeados = registros
      .map((registro, index) => {
        const idComentario =
          obterTextoRegistroLeitor(registro, "id") ||
          `${capituloIdLimpo}-${index}`;
        const userId = obterTextoRegistroLeitor(registro, "user_id");
        const profile = profilesPorUsuario.get(userId);
        const nomeProfile = obterNomeProfileLeitor(profile);
        const nomeUsuarioLogado =
          perfilUsuarioLogado?.userId === userId ? perfilUsuarioLogado.nome : "";
        const avatarUsuarioLogado =
          perfilUsuarioLogado?.userId === userId ? perfilUsuarioLogado.avatar : "";
        const nome = nomeProfile || nomeUsuarioLogado || "Usuário";
        const textoComentario = obterTextoRegistroLeitor(registro, "comentario");

        if (!userId || !textoComentario) {
          return null;
        }

        return {
          id: idComentario,
          userId,
          nome: nome.slice(0, 80),
          avatar: obterAvatarProfileLeitor(profile) || avatarUsuarioLogado,
          texto: textoComentario.slice(0, 420),
          criadoEm:
            obterTextoRegistroLeitor(registro, "atualizado_em") ||
            obterTextoRegistroLeitor(registro, "criado_em"),
          comentarioPaiId: obterTextoRegistroLeitor(
            registro,
            "comentario_pai_id"
          ),
          meuComentario: Boolean(usuarioLogadoId && usuarioLogadoId === userId),
          curtidas: curtidasPorComentario.get(idComentario) || [],
        } satisfies ComentarioCapituloPublico;
      })
      .filter(
        (comentario): comentario is ComentarioCapituloPublico =>
          Boolean(comentario)
      );

    return aplicarCurtidasComentariosCapitulosLocais(
      comentariosMapeados,
      usuarioLogadoId
    );
  } catch {
    return [];
  }
}
