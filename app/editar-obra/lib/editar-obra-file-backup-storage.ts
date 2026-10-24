import { obterChavesBackupArquivoEdicaoObra } from "./editar-obra-file-backup-key-utils";
import { normalizarArquivoObra } from "./editar-obra-file-normalization";
import {
  lerStorageUsuarioEditarObra,
  salvarJsonStorageUsuarioEditarObra,
} from "./editar-obra-storage-utils";

export const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

type ArquivoObraBackup = NonNullable<ReturnType<typeof normalizarArquivoObra>>;
type ObraComChavesBackup = Parameters<
  typeof obterChavesBackupArquivoEdicaoObra
>[0];
type ObraComArquivoBackup = ObraComChavesBackup & {
  arquivoObra?: ArquivoObraBackup | null;
};

export type ArquivosObrasBackup = Record<string, ArquivoObraBackup>;

export function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioEditarObra(
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

    salvarJsonStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

export function salvarArquivoObraNoBackup(
  obra: ObraComChavesBackup,
  arquivo: ArquivoObraBackup | null,
  userId = ""
) {
  if (!obra.id.trim() || typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obterChavesBackupArquivoEdicaoObra(obra).forEach((chave) => {
      if (arquivo) {
        backupAtual[chave] = arquivo;
      } else {
        delete backupAtual[chave];
      }
    });

    salvarJsonStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Mantém o salvamento principal funcionando mesmo se o backup falhar.
  }
}

export function sincronizarBackupArquivosObras<
  T extends ObraComArquivoBackup,
>(obras: T[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obras.forEach((obra) => {
      if (obra.arquivoObra) {
        obterChavesBackupArquivoEdicaoObra(obra).forEach((chave) => {
          backupAtual[chave] = obra.arquivoObra as ArquivoObraBackup;
        });
      }
    });

    salvarJsonStorageUsuarioEditarObra(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Backup é uma proteção extra. Não deve travar a página.
  }
}

export function restaurarArquivoObraComBackup<T extends ObraComArquivoBackup>(
  obra: T,
  backup: ArquivosObrasBackup
): T {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupArquivoEdicaoObra(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraBackup => Boolean(arquivo));

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}
