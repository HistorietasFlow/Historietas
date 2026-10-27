export type PerfilModeracao = {
  id?: string | null;
  user_id?: string | null;
  nome: string | null;
};

export function obterNomePerfilModeracao(perfil: PerfilModeracao) {
  return typeof perfil.nome === "string" && perfil.nome.trim()
    ? perfil.nome.trim()
    : "Usuário sem nome";
}

export function criarMapaNomesPerfisModeracao(perfis: PerfilModeracao[]) {
  const mapa = new Map<string, string>();

  perfis.forEach((perfil) => {
    const nome = obterNomePerfilModeracao(perfil);
    const userId = perfil.user_id?.trim() || "";
    const id = perfil.id?.trim() || "";

    if (userId) {
      mapa.set(userId, nome);
    }

    if (id) {
      mapa.set(id, nome);
    }
  });

  return mapa;
}
