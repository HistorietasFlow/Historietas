import { normalizarTexto } from "../../../lib/utils";
import type { PostComunidade } from "./community-post-model";
import type { UsuarioBuscaComunidade } from "./community-user";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";

export function buscarUsuariosComunidadeNosPosts(
  posts: PostComunidade[],
  termo: string
) {
  const termoNormalizado = normalizarTexto(termo.replace(/^@+/, "").trim());

  if (termoNormalizado.length < 2) {
    return [] as UsuarioBuscaComunidade[];
  }

  const usuariosPorId = new Map<string, UsuarioBuscaComunidade>();

  posts.forEach((post) => {
    const candidatos = [
      {
        id: post.autorId,
        nome: post.autorNome,
        avatar: post.autorAvatar,
      },
      ...post.comentarios.map((comentario) => ({
        id: comentario.autorId,
        nome: comentario.autorNome,
        avatar: comentario.autorAvatar,
      })),
    ];

    candidatos.forEach((candidato) => {
      const id = candidato.id.trim();
      const nome = candidato.nome.trim();

      if (
        !idSupabaseValidoComunidade(id) ||
        !nome ||
        !normalizarTexto(nome).includes(termoNormalizado)
      ) {
        return;
      }

      usuariosPorId.set(id, {
        id,
        nome: nome.slice(0, 80),
        username: "",
        avatar: candidato.avatar.trim(),
      });
    });
  });

  return Array.from(usuariosPorId.values()).slice(0, 12);
}
