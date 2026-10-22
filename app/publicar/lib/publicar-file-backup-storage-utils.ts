import type { ArquivoObraLocal, ObraLocal } from "./publicar-models";
import { FILE_BACKUP_STORAGE_KEY, STORAGE_KEY } from "./publicar-static-options";
import {
  normalizarArquivoObra,
  obterChavesBackupArquivoPublicar,
  obraPertenceAoUsuarioPublicar,
  prepararObraParaLocalStorage,
} from "./publicar-local-work-utils";
import {
  lerStorageUsuarioPublicar,
  salvarJsonStorageUsuarioPublicar,
} from "./publicar-user-storage-utils";

export function carregarBackupArquivosPublicar(userId = "") {
  if (!userId.trim()) {
    return {} as Record<string, ArquivoObraLocal>;
  }

  try {
    const backupTexto = lerStorageUsuarioPublicar(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {} as Record<string, ArquivoObraLocal>;
    }

    return Object.entries(backupJson as Record<string, unknown>).reduce<
      Record<string, ArquivoObraLocal>
    >((backup, [chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backup[chave] = arquivoNormalizado;
      }

      return backup;
    }, {});
  } catch {
    return {} as Record<string, ArquivoObraLocal>;
  }
}

export function sincronizarBackupArquivoPublicar(
  obrasParaSalvar: ObraLocal[],
  userId = ""
) {
  if (!userId.trim()) {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosPublicar(userId);

    obrasParaSalvar.forEach((obra) => {
      const arquivo = normalizarArquivoObra(obra.arquivoObra);

      if (!arquivo) {
        return;
      }

      obterChavesBackupArquivoPublicar(obra).forEach((chave) => {
        backupAtual[chave] = arquivo;
      });
    });

    salvarJsonStorageUsuarioPublicar(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Backup local é camada de proteção. Não bloqueia a publicação.
  }
}

export function salvarObrasLocalmente(obrasParaSalvar: ObraLocal[], userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  const obrasSemArquivosPesados = obrasParaSalvar.map(prepararObraParaLocalStorage);
  const obrasParaStorage = userIdLimpo
    ? obrasSemArquivosPesados.filter((obra) =>
        obraPertenceAoUsuarioPublicar(obra, userIdLimpo),
      )
    : obrasSemArquivosPesados;

  salvarJsonStorageUsuarioPublicar(
    STORAGE_KEY,
    userIdLimpo,
    obrasParaStorage
  );

  sincronizarBackupArquivoPublicar(obrasParaSalvar, userIdLimpo);
}
