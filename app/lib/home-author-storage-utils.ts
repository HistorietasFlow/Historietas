import {
  lerStorageUsuarioHome,
  salvarJsonStorageUsuarioHome,
} from "./home-storage-utils";
import {
  normalizarChaveAutor,
  normalizarPerfisAutoresSalvos,
} from "./home-author-profile-utils";
import type {
  PerfilAutorSalvo,
  PerfisAutoresSalvos,
  PerfilSupabaseHome,
} from "./home-author-profile-utils";

const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";

export function carregarPerfisAutoresHomeSalvos(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const perfisAutoresTexto = lerStorageUsuarioHome(
      AUTHOR_PROFILE_STORAGE_KEY,
      userIdLimpo
    );
    const perfisAutoresJson: unknown = perfisAutoresTexto
      ? JSON.parse(perfisAutoresTexto)
      : {};

    return normalizarPerfisAutoresSalvos(perfisAutoresJson);
  } catch {
    return {};
  }
}

export function salvarPerfisSupabaseHomeNoStorage(
  perfis: PerfilSupabaseHome[],
  userId = ""
) {
  const userIdLimpo = userId.trim();

  if (perfis.length === 0 || !userIdLimpo) {
    return;
  }

  try {
    const perfisSalvos = carregarPerfisAutoresHomeSalvos(userIdLimpo);
    const perfisAtualizados: PerfisAutoresSalvos = { ...perfisSalvos };

    perfis.forEach((perfil) => {
      const perfilAutor: PerfilAutorSalvo = {
        avatar: perfil.avatar,
        avatarNome: "",
        bio: perfil.bio,
      };
      const chaves = [
        perfil.userId,
        perfil.nome,
        normalizarChaveAutor(perfil.nome),
        perfil.nome.trim().replace(/\s+/g, " ").toLowerCase(),
      ];

      chaves.forEach((chave) => {
        const chaveLimpa = chave.trim();

        if (chaveLimpa) {
          perfisAtualizados[chaveLimpa] = perfilAutor;
        }
      });
    });

    salvarJsonStorageUsuarioHome(
      AUTHOR_PROFILE_STORAGE_KEY,
      userIdLimpo,
      perfisAtualizados
    );
  } catch {
    // Profiles são apoio visual. A Home continua funcionando com os dados da obra.
  }
}
