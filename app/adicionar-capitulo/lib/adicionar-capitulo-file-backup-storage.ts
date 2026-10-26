import {
  lerStorageUsuarioAdicionarCapitulo,
  salvarJsonStorageUsuarioAdicionarCapitulo,
} from "./adicionar-capitulo-storage-utils";
import {
  normalizarArquivoObra,
  type ArquivoObraAdicionarCapitulo,
} from "./adicionar-capitulo-file-normalizer";
import {
  obterChavesBackupArquivoAdicionarCapitulo,
} from "./adicionar-capitulo-file-backup-utils";

const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

type ArquivosObrasBackup = Record<string, ArquivoObraAdicionarCapitulo>;

type ObraParaSincronizarBackup = {
  id: string;
  titulo: string;
  slug: string;
  link: string;
  arquivoObra?: unknown;
};

export function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return {};
  }

  try {
    const backupTexto = lerStorageUsuarioAdicionarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userIdLimpo
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

    salvarJsonStorageUsuarioAdicionarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userIdLimpo,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

export function sincronizarBackupArquivosObras(
  obras: ObraParaSincronizarBackup[],
  userId = ""
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
        obterChavesBackupArquivoAdicionarCapitulo(obra).forEach((chave) => {
          backupAtual[chave] = arquivoNormalizado;
        });
      }
    });

    salvarJsonStorageUsuarioAdicionarCapitulo(
      FILE_BACKUP_STORAGE_KEY,
      userIdLimpo,
      backupAtual
    );
  } catch {
    // Se o backup falhar, a criação do capítulo continua funcionando normalmente.
  }
}
