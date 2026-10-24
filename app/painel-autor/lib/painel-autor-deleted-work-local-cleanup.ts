import { obterChavesBackupArquivoPainel } from "./painel-autor-file-backup-key-utils";
import {
  FILE_BACKUP_STORAGE_KEY,
  carregarBackupArquivosObras,
} from "./painel-autor-file-backup-storage";
import { removerObraDaColecaoPainel } from "./painel-autor-collection-utils";
import {
  lerListaIdsStoragePainel,
  salvarJsonStorageUsuarioPainel,
} from "./painel-autor-storage-utils";

type ObraExcluidaPainel = {
  id: string;
  slug: string;
  titulo: string;
  link?: string;
};

type ConfiguracaoLimpezaLocalPainel = {
  chavesColecoes: readonly string[];
};

export function limparReferenciasLocaisObraExcluidaPainel(
  obra: ObraExcluidaPainel,
  userId: string,
  { chavesColecoes }: ConfiguracaoLimpezaLocalPainel
) {
  chavesColecoes.forEach((chave) => {
    try {
      const listaUsuario = removerObraDaColecaoPainel(
        lerListaIdsStoragePainel(chave, userId),
        obra
      );

      salvarJsonStorageUsuarioPainel(chave, userId, listaUsuario);
    } catch {
      // A limpeza local não pode impedir a exclusão da obra.
    }
  });

  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obterChavesBackupArquivoPainel(obra).forEach((chave) => {
      delete backupAtual[chave];
    });

    salvarJsonStorageUsuarioPainel(FILE_BACKUP_STORAGE_KEY, userId, backupAtual);
  } catch {
    // O backup antigo não pode impedir a exclusão da obra.
  }
}
