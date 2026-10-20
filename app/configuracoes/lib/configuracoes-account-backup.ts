import { carregarPreferencias } from "./configuracoes-account-preferences";
import {
  CHAVES_RESUMO,
  CONFIG_STORAGE_KEY,
} from "./configuracoes-account-storage-constants";
import { lerStorageUsuarioConfiguracoes } from "./configuracoes-local-summary-utils";

export function criarBackupLocal(userId = "") {
  const userIdLimpo = userId.trim();
  const backup: Record<string, unknown> = {};

  if (!userIdLimpo) {
    backup.exportadoEm = new Date().toISOString();
    backup.projeto = "Historietas";
    backup.userId = "";

    return JSON.stringify(backup, null, 2);
  }

  CHAVES_RESUMO.forEach((chave) => {
    try {
      const valor = lerStorageUsuarioConfiguracoes(chave, userIdLimpo);
      backup[chave] = valor ? JSON.parse(valor) : null;
    } catch {
      backup[chave] = null;
    }
  });

  backup[CONFIG_STORAGE_KEY] = carregarPreferencias(userIdLimpo);
  backup.exportadoEm = new Date().toISOString();
  backup.projeto = "Historietas";
  backup.userId = userIdLimpo;

  return JSON.stringify(backup, null, 2);
}
