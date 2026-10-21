export function limparDadosLocaisContaExcluida(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const sufixoUsuario = `:${userId.trim()}`;

  try {
    for (let indice = localStorage.length - 1; indice >= 0; indice -= 1) {
      const chave = localStorage.key(indice);

      if (chave?.endsWith(sufixoUsuario)) {
        localStorage.removeItem(chave);
      }
    }
  } catch {
    // A exclusão remota já foi concluída; falhas locais não devem bloquear a saída.
  }

  try {
    for (let indice = sessionStorage.length - 1; indice >= 0; indice -= 1) {
      const chave = sessionStorage.key(indice);

      if (chave?.endsWith(sufixoUsuario)) {
        sessionStorage.removeItem(chave);
      }
    }
  } catch {
    // A sessão do navegador será encerrada em seguida.
  }
}
