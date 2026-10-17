import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import {
  criarChavesBackupObra,
  normalizarArquivoObra,
} from "./explorar-work-normalizers";
import type { ArquivoObraLocal, ObraLocal } from "./explorar-work-normalizers";

const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

export function criarStorageKeyUsuarioExplorar(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : "";
}

export function lerStorageUsuarioExplorar(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioExplorar(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

export function salvarJsonStorageUsuarioExplorar(
  chave: string,
  userId: string,
  valor: unknown
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioExplorar(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é apoio; a página continua com o estado em memória.
  }
}

export function normalizarListaIdsExplorar(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
        .map((id) => id.trim())
    : [];
}

export function carregarListaIdsUsuarioExplorar(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const texto = lerStorageUsuarioExplorar(chave, userIdLimpo);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return normalizarListaIdsExplorar(json);
  } catch {
    return [] as string[];
  }
}

export function salvarListaIdsUsuarioExplorar(
  chave: string,
  userId: string,
  lista: string[]
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  const listaNormalizada = Array.from(new Set(normalizarListaIdsExplorar(lista)));

  salvarJsonStorageUsuarioExplorar(chave, userIdLimpo, listaNormalizada);
}

export function obterIdentificadoresObraExplorar(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((valor): valor is string => typeof valor === "string" && Boolean(valor.trim()))
    )
  );
}

export function colecaoTemObraExplorar(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const ids = new Set(normalizarListaIdsExplorar(colecao));

  return obterIdentificadoresObraExplorar(obra).some((identificador) =>
    ids.has(identificador)
  );
}


export function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioExplorar(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(
      ([chave, arquivo]) => {
        const arquivoNormalizado = normalizarArquivoObra(arquivo);

        if (chave.trim() && arquivoNormalizado) {
          backupNormalizado[chave] = arquivoNormalizado;
        }
      }
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

export function obterArquivoObraComBackup(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  slug: string,
  userId = ""
) {
  const arquivoAtual = normalizarArquivoObra(obra.arquivoObra);

  if (arquivoAtual) {
    return arquivoAtual;
  }

  const backupArquivos = carregarBackupArquivosObras(userId);
  const chaves = criarChavesBackupObra(obra, slug);

  for (const chave of chaves) {
    const arquivoBackup = normalizarArquivoObra(backupArquivos[chave]);

    if (arquivoBackup) {
      return arquivoBackup;
    }
  }

  return null;
}

export function salvarBackupsArquivosObras(obrasParaSalvar: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  const backupAtual = carregarBackupArquivosObras(userId);
  const proximoBackup: ArquivosObrasBackup = { ...backupAtual };

  obrasParaSalvar.forEach((obra) => {
    const arquivo = normalizarArquivoObra(obra.arquivoObra);

    if (!arquivo) {
      return;
    }

    criarChavesBackupObra(obra, obra.slug).forEach((chave) => {
      proximoBackup[chave] = arquivo;
    });
  });

  salvarJsonStorageUsuarioExplorar(
    FILE_BACKUP_STORAGE_KEY,
    userId,
    proximoBackup
  );
}
