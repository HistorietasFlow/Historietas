import { obterChavesBackupArquivoPainel } from "./painel-autor-file-backup-key-utils";
import { normalizarArquivoObra } from "./painel-autor-file-normalizer";
import {
  lerStorageUsuarioPainel,
  salvarJsonStorageUsuarioPainel,
} from "./painel-autor-storage-utils";

export const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

export type ArquivosObrasBackup = Record<
  string,
  NonNullable<ReturnType<typeof normalizarArquivoObra>>
>;

type ObraParaBackupArquivoPainel = Parameters<
  typeof obterChavesBackupArquivoPainel
>[0] & {
  arquivoObra?: unknown | null;
};

export function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (!userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([obraId, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (obraId.trim() && arquivoNormalizado) {
        backupNormalizado[obraId] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    salvarJsonStorageUsuarioPainel(FILE_BACKUP_STORAGE_KEY, userId, {});
    return {};
  }
}

export function sincronizarBackupArquivosObras(
  obras: ObraParaBackupArquivoPainel[],
  userId = ""
) {
  if (!userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        obterChavesBackupArquivoPainel(obra).forEach((chave) => {
          backupAtual[chave] = arquivoNormalizado;
        });
      }
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Se o backup falhar, o painel continua funcionando normalmente.
  }
}
