import {
  criarStorageObrasUsuarioLoginKey,
  criarStorageUsuarioLoginKey,
} from "./login-storage-key-utils";
import {
  lerJsonStorageLogin,
  normalizarListaStringsLogin,
  salvarJsonStorageLogin,
} from "./login-storage-utils";
import {
  normalizarObrasStorageLogin,
  obterAutorIdObraLogin,
  obraPertenceAoUsuarioLogin,
} from "./login-work-storage-utils";

const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";

export function sincronizarStorageUsuarioLogin(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || typeof window === "undefined") {
    return;
  }

  try {
    const chaveObrasUsuario = criarStorageObrasUsuarioLoginKey(userIdLimpo);
    const obrasUsuarioAtuais = normalizarObrasStorageLogin(
      lerJsonStorageLogin(chaveObrasUsuario),
    );
    const obrasUsuarioFiltradas = obrasUsuarioAtuais
      .filter((obra) => {
        const autorId = obterAutorIdObraLogin(obra);

        return !autorId || obraPertenceAoUsuarioLogin(obra, userIdLimpo);
      })
      .map((obra) => {
        return obterAutorIdObraLogin(obra)
          ? obra
          : {
              ...obra,
              autorId: userIdLimpo,
            };
      });

    salvarJsonStorageLogin(chaveObrasUsuario, obrasUsuarioFiltradas);

    [
      FAVORITES_STORAGE_KEY,
      COMPLETED_STORAGE_KEY,
      FOLLOW_STORAGE_KEY,
      AUTHOR_FOLLOW_STORAGE_KEY,
    ].forEach((chave) => {
      const chaveUsuario = criarStorageUsuarioLoginKey(chave, userIdLimpo);
      const listaUsuario = normalizarListaStringsLogin(
        lerJsonStorageLogin(chaveUsuario),
      );

      salvarJsonStorageLogin(chaveUsuario, listaUsuario);
    });
  } catch {
    // A sincronização local não pode bloquear autenticação.
  }
}
