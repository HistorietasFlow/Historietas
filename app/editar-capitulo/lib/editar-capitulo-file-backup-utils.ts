import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import {
  lerStorageUsuarioEditarCapitulo,
  salvarJsonStorageUsuarioEditarCapitulo,
} from "./editar-capitulo-storage-utils";
import { normalizarArquivoObra } from "./editar-capitulo-file-normalization";

type ArquivoObraBackup = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraComChavesBackup = {
  id: string;
  titulo: string;
  slug: string;
};

type ObraComArquivoBackup = ObraComChavesBackup & {
  arquivoObra?: ArquivoObraBackup | null;
};

type ArquivosObrasBackup = Record<string, ArquivoObraBackup>;

export const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

export function criarChavesObra(obra: ObraComChavesBackup) {
  const chaves = [
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ];

  return Array.from(
    new Set(
      chaves
        .filter((chave): chave is string =>
          typeof chave === "string" && Boolean(chave.trim()),
        )
        .map((chave) => chave.trim()),
    ),
  );
}

export function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioEditarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userIdLimpo,
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson).forEach(([obraId, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (obraId.trim() && arquivoNormalizado) {
        backupNormalizado[obraId] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioEditarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userIdLimpo,
      backupNormalizado,
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

export function sincronizarBackupArquivosObras(
  obras: ObraComArquivoBackup[],
  userId = "",
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userIdLimpo);

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        criarChavesObra(obra).forEach((chave) => {
          backupAtual[chave] = arquivoNormalizado;
        });
      }
    });

    salvarJsonStorageUsuarioEditarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userIdLimpo,
      backupAtual,
    );
  } catch {
    // Se o backup falhar, a edição do capítulo continua funcionando normalmente.
  }
}

export function restaurarArquivoObraComBackup<T extends ObraComArquivoBackup>(
  obra: T,
  backup: ArquivosObrasBackup,
): T | (Omit<T, "arquivoObra"> & { arquivoObra: ArquivoObraBackup }) {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup =
    criarChavesObra(obra)
      .map((chave) => normalizarArquivoObra(backup[chave]))
      .find((arquivo): arquivo is ArquivoObraBackup => Boolean(arquivo)) || null;

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}
