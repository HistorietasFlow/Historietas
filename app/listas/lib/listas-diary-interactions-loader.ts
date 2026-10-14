import { supabase } from "../../../lib/supabase/client";
import {
  criarInteracaoAnotacaoListasVazia,
  type InteracaoAnotacaoListas,
} from "./listas-diary-comment-utils";
import { pegarTexto } from "./listas-value-utils";

type PerfilComentarioDiarioListas = {
  nome: string;
  username: string;
  avatar: string;
};

export type InteracoesAnotacoesListasEstado = Record<
  string,
  InteracaoAnotacaoListas
>;

export async function carregarPerfisComentariosAnotacoesListas(
  userIds: string[],
) {
  const ids = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
  const perfis = new Map<string, PerfilComentarioDiarioListas>();

  if (ids.length === 0) {
    return perfis;
  }

  for (const coluna of ["user_id", "id"] as const) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,nome,username,avatar_url")
        .in(coluna, ids)
        .limit(Math.max(ids.length, 1));

      if (error || !Array.isArray(data)) {
        continue;
      }

      data.forEach((registro) => {
        const perfil: PerfilComentarioDiarioListas = {
          nome:
            pegarTexto(registro.nome) ||
            pegarTexto(registro.username) ||
            "Leitor",
          username: pegarTexto(registro.username),
          avatar: pegarTexto(registro.avatar_url),
        };
        const userId = pegarTexto(registro.user_id);
        const id = pegarTexto(registro.id);

        if (userId) perfis.set(userId, perfil);
        if (id) perfis.set(id, perfil);
      });
    } catch {
      // Tenta buscar pelo identificador alternativo.
    }
  }

  return perfis;
}

export async function carregarInteracoesAnotacoesListas(
  anotacaoIds: string[],
  usuarioAtualId: string,
): Promise<InteracoesAnotacoesListasEstado> {
  const ids = Array.from(
    new Set(anotacaoIds.map((id) => id.trim()).filter(Boolean)),
  );
  const resultado = ids.reduce<InteracoesAnotacoesListasEstado>(
    (estado, id) => {
      estado[id] = criarInteracaoAnotacaoListasVazia();
      return estado;
    },
    {},
  );

  if (ids.length === 0) {
    return resultado;
  }

  const [curtidasResposta, comentariosResposta] = await Promise.all([
    supabase
      .from("diario_anotacao_curtidas")
      .select("id,anotacao_id,user_id")
      .in("anotacao_id", ids)
      .limit(2000),
    supabase
      .from("diario_anotacao_comentarios")
      .select(
        "id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em",
      )
      .in("anotacao_id", ids)
      .order("criado_em", { ascending: true })
      .limit(2000),
  ]);

  if (Array.isArray(curtidasResposta.data)) {
    curtidasResposta.data.forEach((item) => {
      const registro = item;
      const anotacaoId = pegarTexto(registro.anotacao_id);
      const interacao = resultado[anotacaoId];

      if (!interacao) return;
      interacao.totalCurtidas += 1;
      if (pegarTexto(registro.user_id) === usuarioAtualId) {
        interacao.curtiu = true;
      }
    });
  }

  const comentarios = Array.isArray(comentariosResposta.data)
    ? comentariosResposta.data
    : [];
  const comentarioIds = comentarios
    .map((registro) => pegarTexto(registro.id))
    .filter(Boolean);
  const [perfis, curtidasComentariosResposta] = await Promise.all([
    carregarPerfisComentariosAnotacoesListas(
      comentarios
        .map((registro) => pegarTexto(registro.user_id))
        .filter(Boolean),
    ),
    comentarioIds.length > 0
      ? supabase
          .from("diario_comentario_curtidas")
          .select("comentario_id,user_id")
          .in("comentario_id", comentarioIds)
          .limit(4000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const curtidasPorComentario = new Map<string, string[]>();

  if (Array.isArray(curtidasComentariosResposta.data)) {
    curtidasComentariosResposta.data.forEach((item) => {
      const registro = item;
      const comentarioId = pegarTexto(registro.comentario_id);
      const userId = pegarTexto(registro.user_id);

      if (!comentarioId || !userId) return;
      const atuais = curtidasPorComentario.get(comentarioId) || [];
      atuais.push(userId);
      curtidasPorComentario.set(comentarioId, atuais);
    });
  }

  comentarios.forEach((registro) => {
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const interacao = resultado[anotacaoId];
    const id = pegarTexto(registro.id);
    const textoComentario = pegarTexto(registro.texto);
    const userId = pegarTexto(registro.user_id);
    const perfil = perfis.get(userId);

    if (!interacao || !id || !textoComentario) return;

    interacao.comentarios.push({
      id,
      anotacaoId,
      userId,
      autorNome: perfil?.nome || "Leitor",
      autorUsername: perfil?.username || "",
      autorAvatar: perfil?.avatar || "",
      texto: textoComentario,
      criadoEm: pegarTexto(registro.criado_em ?? registro.atualizado_em),
      atualizadoEm: pegarTexto(registro.atualizado_em ?? registro.criado_em),
      parentId: pegarTexto(registro.parent_id),
      curtidas: curtidasPorComentario.get(id) || [],
    });
  });

  return resultado;
}
