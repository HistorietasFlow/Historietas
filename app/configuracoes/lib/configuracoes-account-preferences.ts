import {
  CONFIG_STORAGE_KEY,
  CONFIGURACOES_ATUALIZADAS_EVENT,
} from "./configuracoes-account-storage-constants";
import { normalizarUsernameConfiguracoes } from "./configuracoes-account-utils";
import {
  preferenciasPadrao,
  type PreferenciasConta,
} from "./configuracoes-account-models";
import {
  lerStorageUsuarioConfiguracoes,
  salvarJsonStorageUsuarioConfiguracoes,
} from "./configuracoes-local-summary-utils";

export function carregarPreferencias(userId = ""): PreferenciasConta {
  try {
    const texto = lerStorageUsuarioConfiguracoes(CONFIG_STORAGE_KEY, userId);
    const json: unknown = texto ? JSON.parse(texto) : null;

    if (!json || typeof json !== "object") {
      return {
        ...preferenciasPadrao,
      };
    }

    const preferencias = json as Partial<PreferenciasConta>;

    return {
      nomeExibicao:
        typeof preferencias.nomeExibicao === "string"
          ? preferencias.nomeExibicao
          : "",
      username:
        typeof preferencias.username === "string"
          ? normalizarUsernameConfiguracoes(preferencias.username)
          : "",
      emailContato:
        typeof preferencias.emailContato === "string"
          ? preferencias.emailContato
          : "",
      receberAvisos:
        typeof preferencias.receberAvisos === "boolean"
          ? preferencias.receberAvisos
          : true,
    };
  } catch {
    return {
      ...preferenciasPadrao,
    };
  }
}

export function salvarPreferencias(
  preferencias: PreferenciasConta,
  userId = "",
) {
  const userIdLimpo = userId.trim();

  salvarJsonStorageUsuarioConfiguracoes(
    CONFIG_STORAGE_KEY,
    userIdLimpo,
    preferencias,
  );

  if (typeof window !== "undefined" && userIdLimpo) {
    window.dispatchEvent(
      new CustomEvent(CONFIGURACOES_ATUALIZADAS_EVENT, {
        detail: { userId: userIdLimpo },
      }),
    );
  }
}
