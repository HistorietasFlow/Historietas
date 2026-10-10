import {
  TOP_FIVE_LIKES_STORAGE_KEY,
  TOP_FIVE_MAXIMO,
  TOP_FIVE_STORAGE_KEY,
} from "../constants";
import {
  criarChaveCurtidaTopFivePerfil,
  normalizarCurtidasTopFiveLocais,
} from "./library-normalizers";
import {
  carregarJsonUsuarioPerfilAutor,
  salvarJsonUsuarioPerfilAutor,
} from "./profile-local-storage-utils";

export function carregarTopFivePerfilAutor(userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return [] as string[];
  }

  try {
    const topFiveSalvo = carregarJsonUsuarioPerfilAutor(
      TOP_FIVE_STORAGE_KEY,
      userId,
    );

    return Array.isArray(topFiveSalvo)
      ? Array.from(
          new Set(
            topFiveSalvo.filter(
              (id): id is string =>
                typeof id === "string" && Boolean(id.trim()),
            ),
          ),
        ).slice(0, TOP_FIVE_MAXIMO)
      : [];
  } catch {
    return [] as string[];
  }
}

export function carregarCurtidasTopFiveLocais(
  perfilUserId: string,
  usuarioId = "",
) {
  const chavePerfil = criarChaveCurtidaTopFivePerfil(perfilUserId);
  const usuarioIdNormalizado = usuarioId.trim().toLowerCase();

  if (!chavePerfil || !usuarioIdNormalizado) {
    return { total: 0, curtiu: false };
  }

  try {
    const curtidasJson = carregarJsonUsuarioPerfilAutor(
      TOP_FIVE_LIKES_STORAGE_KEY,
      usuarioIdNormalizado,
    );
    const curtidasPorPerfil = normalizarCurtidasTopFiveLocais(curtidasJson);
    const curtidasPerfil = curtidasPorPerfil[chavePerfil] || [];

    return {
      total: curtidasPerfil.length,
      curtiu: Boolean(
        usuarioIdNormalizado && curtidasPerfil.includes(usuarioIdNormalizado),
      ),
    };
  } catch {
    return { total: 0, curtiu: false };
  }
}

export function salvarCurtidaTopFiveLocal(
  perfilUserId: string,
  usuarioId: string,
  curtir: boolean,
) {
  const chavePerfil = criarChaveCurtidaTopFivePerfil(perfilUserId);
  const usuarioIdNormalizado = usuarioId.trim().toLowerCase();

  if (!chavePerfil || !usuarioIdNormalizado) {
    return;
  }

  try {
    const curtidasJson = carregarJsonUsuarioPerfilAutor(
      TOP_FIVE_LIKES_STORAGE_KEY,
      usuarioIdNormalizado,
    );
    const curtidasPorPerfil = normalizarCurtidasTopFiveLocais(curtidasJson);
    const curtidasAtuais = curtidasPorPerfil[chavePerfil] || [];
    const curtidasSemUsuario = curtidasAtuais.filter(
      (curtidaUsuarioId) => curtidaUsuarioId !== usuarioIdNormalizado,
    );

    curtidasPorPerfil[chavePerfil] = curtir
      ? [...curtidasSemUsuario, usuarioIdNormalizado]
      : curtidasSemUsuario;

    salvarJsonUsuarioPerfilAutor(
      TOP_FIVE_LIKES_STORAGE_KEY,
      usuarioIdNormalizado,
      curtidasPorPerfil,
    );
  } catch {
    // Curtida local é fallback e não deve travar o perfil.
  }
}
