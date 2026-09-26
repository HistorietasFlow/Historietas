import type { UsuarioBuscaComunidade } from "./community-user";

export function mesclarUsuariosBuscaComunidade(
  usuariosSupabase: UsuarioBuscaComunidade[],
  usuariosLocais: UsuarioBuscaComunidade[]
) {
  const usuariosPorId = new Map<string, UsuarioBuscaComunidade>();

  [...usuariosSupabase, ...usuariosLocais].forEach((usuarioBusca) => {
    const usuarioExistente = usuariosPorId.get(usuarioBusca.id);

    usuariosPorId.set(usuarioBusca.id, {
      id: usuarioBusca.id,
      nome: usuarioBusca.nome || usuarioExistente?.nome || "Usuário",
      username: usuarioBusca.username || usuarioExistente?.username || "",
      avatar: usuarioBusca.avatar || usuarioExistente?.avatar || "",
    });
  });

  return Array.from(usuariosPorId.values());
}
