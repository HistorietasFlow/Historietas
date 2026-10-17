import type { ComentarioCapituloPublico } from "../components/ler-capitulo-comments-sheet";
import { normalizarObra, type ObraLocal } from "./ler-capitulo-work-normalization";

const STORAGE_KEY = "historietas-obras";
const CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY = "historietas-comentarios-capitulos-curtidas";

function criarStorageKeyUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export function lerStorageUsuarioLeitor(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioLeitor(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioLeitor(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioLeitor(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; a leitura continua com estado em memória.
  }
}

function carregarCurtidasComentariosCapitulosLocais(
  userId: string
): Record<string, boolean> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const texto = lerStorageUsuarioLeitor(
      CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY,
      userIdLimpo
    );
    const json: unknown = texto ? JSON.parse(texto) : {};

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(json as Record<string, unknown>).filter(
        (entrada): entrada is [string, boolean] =>
          typeof entrada[0] === "string" && typeof entrada[1] === "boolean"
      )
    );
  } catch {
    return {};
  }
}

export function salvarCurtidaComentarioCapituloLocal(
  userId: string,
  comentarioId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const comentarioIdLimpo = comentarioId.trim();

  if (!userIdLimpo || !comentarioIdLimpo) {
    return;
  }

  const curtidasLocais = carregarCurtidasComentariosCapitulosLocais(userIdLimpo);

  salvarJsonStorageUsuarioLeitor(
    CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY,
    userIdLimpo,
    {
      ...curtidasLocais,
      [comentarioIdLimpo]: ativo,
    }
  );
}

export function aplicarCurtidasComentariosCapitulosLocais(
  comentarios: ComentarioCapituloPublico[],
  userId: string
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return comentarios;
  }

  const curtidasLocais = carregarCurtidasComentariosCapitulosLocais(userIdLimpo);

  return comentarios.map((comentario) => {
    const estadoLocal = curtidasLocais[comentario.id];

    if (estadoLocal === true) {
      return {
        ...comentario,
        curtidas: Array.from(new Set([...comentario.curtidas, userIdLimpo])),
      };
    }

    if (estadoLocal === false) {
      return {
        ...comentario,
        curtidas: comentario.curtidas.filter(
          (curtidaId) => curtidaId !== userIdLimpo
        ),
      };
    }

    return comentario;
  });
}

export function carregarObrasLocaisNormalizadas(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraLocal[];
  }

  const obrasSalvasTexto = lerStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo);
  const obrasSalvasJson: unknown = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as Partial<ObraLocal>, index)
      )
    : [];

  salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo, obrasNormalizadas);

  return obrasNormalizadas;
}

export function obterAutorIdSeguro(obra: Pick<ObraLocal, "autorId">) {
  return typeof obra.autorId === "string" ? obra.autorId.trim() : "";
}

export function usuarioPodeAbrirObraNoLeitor(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdSeguro(obra);

  return obra.publicado || !autorId || Boolean(userId && autorId === userId);
}

function usuarioPodePersistirObraNoStorage(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdSeguro(obra);

  return !autorId || Boolean(userId && autorId === userId);
}

export function salvarObrasPreservandoContas(
  obrasAtualizadas: ObraLocal[],
  userId: string
) {
  try {
    const userIdLimpo = userId.trim();

    if (!userIdLimpo) {
      return;
    }

    const obrasAtuais = carregarObrasLocaisNormalizadas(userIdLimpo);
    const obrasAtualizadasPorId = new Map(
      obrasAtualizadas.map((obra, index) => [
        obra.id,
        normalizarObra(obra, index),
      ])
    );
    const idsPersistidos = new Set<string>();

    const obrasMescladas = obrasAtuais.map((obraAtual, index) => {
      const obraNormalizada = normalizarObra(obraAtual, index);
      const obraAtualizada = obrasAtualizadasPorId.get(obraNormalizada.id);

      idsPersistidos.add(obraNormalizada.id);

      if (!obraAtualizada) {
        return obraNormalizada;
      }

      return usuarioPodePersistirObraNoStorage(obraAtualizada, userIdLimpo)
        ? obraAtualizada
        : obraNormalizada;
    });

    obrasAtualizadas.forEach((obra, index) => {
      const obraNormalizada = normalizarObra(obra, index);

      if (
        idsPersistidos.has(obraNormalizada.id) ||
        !usuarioPodePersistirObraNoStorage(obraNormalizada, userIdLimpo)
      ) {
        return;
      }

      obrasMescladas.unshift(obraNormalizada);
      idsPersistidos.add(obraNormalizada.id);
    });

    salvarJsonStorageUsuarioLeitor(STORAGE_KEY, userIdLimpo, obrasMescladas);
  } catch {
    // A leitura deve continuar mesmo se o armazenamento local estiver indisponível.
  }
}
