import { carregarPerfisPublicosObra } from "./obra-public-profile-loader";
import { carregarCurtidasComentariosObraSupabase } from "./obra-supabase-comment-likes-query";
import type {
  ComentarioObraPublico,
  SupabaseComentarioObraRow,
} from "./obra-comment-utils";

export async function normalizarComentariosObraSupabase(
  comentarios: SupabaseComentarioObraRow[]
) {
  const usuariosIds = Array.from(
    new Set(
      comentarios
        .map((comentario) => comentario.user_id?.trim() || "")
        .filter(Boolean)
    )
  );
  const comentariosIds = Array.from(
    new Set(
      comentarios
        .map((comentario) => comentario.id?.trim() || "")
        .filter(Boolean)
    )
  );
  const perfisPorUsuario = await carregarPerfisPublicosObra(usuariosIds);
  const curtidasPorComentario = new Map<string, string[]>();

  if (comentariosIds.length > 0) {
    try {
      const curtidas = await carregarCurtidasComentariosObraSupabase(
        comentariosIds
      );

      curtidas.forEach(
        (curtida) => {
          const comentarioId = curtida.comentario_id?.trim() || "";
          const usuarioId = curtida.usuario_id?.trim() || "";

          if (!comentarioId || !usuarioId) {
            return;
          }

          const usuarios = curtidasPorComentario.get(comentarioId) || [];

          if (!usuarios.includes(usuarioId)) {
            curtidasPorComentario.set(comentarioId, [...usuarios, usuarioId]);
          }
        }
      );
    } catch {
      // Curtidas são complementares; os comentários continuam visíveis.
    }
  }

  return comentarios
    .map((comentario): ComentarioObraPublico | null => {
      const id = comentario.id?.trim() || "";
      const obraId = comentario.obra_id?.trim() || "";
      const userId = comentario.user_id?.trim() || "";
      const texto = comentario.comentario?.trim() || "";

      if (!id || !obraId || !userId || !texto) {
        return null;
      }

      const perfil = perfisPorUsuario.get(userId) || null;

      return {
        id,
        obraId,
        userId,
        nome: perfil?.nome || "Usuário",
        avatar: perfil?.avatar || "",
        texto,
        criadoEm: comentario.criado_em || new Date().toISOString(),
        comentarioPaiId: comentario.comentario_pai_id?.trim() || "",
        local: false,
        curtidas: curtidasPorComentario.get(id) || [],
      };
    })
    .filter(
      (comentario): comentario is ComentarioObraPublico => Boolean(comentario)
    );
}
