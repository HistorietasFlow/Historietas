import {
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "./obra-user-storage";
import type { ComentarioObraPublico } from "./obra-comment-utils";

export const WORK_COMMENTS_STORAGE_KEY = "historietas-comentarios-obras";

export function carregarComentariosObraLocais(userId: string, obraId: string) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();

  if (!userIdLimpo || !obraIdLimpo) {
    return [] as ComentarioObraPublico[];
  }

  try {
    const textoComentarios = lerStorageUsuarioObraPublica(
      WORK_COMMENTS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = textoComentarios ? JSON.parse(textoComentarios) : {};
    const comentariosPorObra =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    const comentarios = comentariosPorObra[obraIdLimpo];

    if (!Array.isArray(comentarios)) {
      return [] as ComentarioObraPublico[];
    }

    return comentarios
      .map((comentario): ComentarioObraPublico | null => {
        if (
          !comentario ||
          typeof comentario !== "object" ||
          Array.isArray(comentario)
        ) {
          return null;
        }

        const registro = comentario as Partial<ComentarioObraPublico> &
          Record<string, unknown>;
        const id = typeof registro.id === "string" ? registro.id.trim() : "";
        const texto =
          typeof registro.texto === "string" ? registro.texto.trim() : "";

        if (!id || !texto) {
          return null;
        }

        return {
          id,
          obraId: obraIdLimpo,
          userId:
            typeof registro.userId === "string"
              ? registro.userId.trim()
              : userIdLimpo,
          nome:
            typeof registro.nome === "string" && registro.nome.trim()
              ? registro.nome.trim()
              : "Você",
          avatar:
            typeof registro.avatar === "string" ? registro.avatar.trim() : "",
          texto,
          criadoEm:
            typeof registro.criadoEm === "string" && registro.criadoEm.trim()
              ? registro.criadoEm
              : new Date().toISOString(),
          comentarioPaiId:
            typeof registro.comentarioPaiId === "string"
              ? registro.comentarioPaiId.trim()
              : typeof registro.comentario_pai_id === "string"
                ? registro.comentario_pai_id.trim()
                : "",
          local: true,
          curtidas: Array.isArray(registro.curtidas)
            ? Array.from(
                new Set(
                  registro.curtidas
                    .filter((id): id is string => typeof id === "string")
                    .map((id) => id.trim())
                    .filter(Boolean)
                )
              )
            : [],
        };
      })
      .filter(
        (comentario): comentario is ComentarioObraPublico => Boolean(comentario)
      );
  } catch {
    return [] as ComentarioObraPublico[];
  }
}

export function salvarComentariosObraLocais(
  userId: string,
  obraId: string,
  comentarios: ComentarioObraPublico[]
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();

  if (!userIdLimpo || !obraIdLimpo) {
    return;
  }

  try {
    const textoComentarios = lerStorageUsuarioObraPublica(
      WORK_COMMENTS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = textoComentarios ? JSON.parse(textoComentarios) : {};
    const comentariosPorObra =
      json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : {};
    const comentariosLocais = comentarios
      .filter((comentario) => comentario.local)
      .slice(0, 120);

    salvarStorageUsuarioObraPublica(WORK_COMMENTS_STORAGE_KEY, userIdLimpo, {
      ...comentariosPorObra,
      [obraIdLimpo]: comentariosLocais,
    });
  } catch {
    salvarStorageUsuarioObraPublica(WORK_COMMENTS_STORAGE_KEY, userIdLimpo, {
      [obraIdLimpo]: comentarios
        .filter((comentario) => comentario.local)
        .slice(0, 120),
    });
  }
}
