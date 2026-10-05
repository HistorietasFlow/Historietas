import {
  normalizarArquivoObra,
  obterChavesBackupObra,
  type ArquivoObraLocal,
  type ArquivosObrasBackup,
} from "./obra-file-utils";
import {
  lerStorageUsuarioObraPublica,
  salvarStorageUsuarioObraPublica,
} from "./obra-user-storage";
import type { ObraLocal } from "./obra-data-utils";

export const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

export function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioObraPublica(FILE_BACKUP_STORAGE_KEY, userId);
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backupNormalizado[chave] = arquivoNormalizado;
      }
    });

    salvarStorageUsuarioObraPublica(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

export function sincronizarBackupArquivosObras(obrasLocais: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obrasLocais.forEach((obraLocal) => {
      if (!obraLocal.arquivoObra) {
        return;
      }

      obterChavesBackupObra(obraLocal).forEach((chave) => {
        backupAtual[chave] = obraLocal.arquivoObra as ArquivoObraLocal;
      });
    });

    salvarStorageUsuarioObraPublica(FILE_BACKUP_STORAGE_KEY, userId, backupAtual);
  } catch {
    // Backup é apenas proteção extra. Não deve travar a página pública.
  }
}
