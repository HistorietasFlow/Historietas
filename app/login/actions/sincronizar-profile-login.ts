import { prepararDadosProfileLogin } from "../lib/login-profile-preparation";
import {
  PROFILE_SYNC_FAILURE_STORAGE_KEY,
  registrarFalhaSincronizacaoPerfil,
} from "../lib/login-profile-sync-diagnostics";
import { aguardarLogin } from "../lib/login-timing-utils";
import { sincronizarProfileLoginUmaVez } from "./sincronizar-profile-login-uma-vez";

export type ResultadoSincronizacaoPerfil =
  | { ok: true }
  | { ok: false; error: unknown };

export async function sincronizarProfileLogin(
  userId: string,
  nomeInformado: string,
  emailInformado: string,
  userMetadata?: Record<string, unknown> | null,
): Promise<ResultadoSincronizacaoPerfil> {
  const {
    userIdLimpo,
    nomeFinal,
  } = prepararDadosProfileLogin(
    userId,
    nomeInformado,
    emailInformado,
    userMetadata,
  );

  if (!userIdLimpo) {
    const error = new Error(
      "Não foi possível sincronizar o perfil sem o identificador do usuário.",
    );

    registrarFalhaSincronizacaoPerfil(error, userIdLimpo);
    return { ok: false, error };
  }

  let ultimoErro: unknown = new Error(
    "A sincronização do perfil não foi concluída.",
  );

  for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
    try {
      await sincronizarProfileLoginUmaVez({ userIdLimpo, nomeFinal });

      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(PROFILE_SYNC_FAILURE_STORAGE_KEY);
        } catch {
          // A limpeza do diagnóstico local não pode bloquear o login.
        }
      }

      return { ok: true };
    } catch (error) {
      ultimoErro = error;

      if (tentativa < 2) {
        await aguardarLogin(350);
      }
    }
  }

  registrarFalhaSincronizacaoPerfil(ultimoErro, userIdLimpo);

  return {
    ok: false,
    error: ultimoErro,
  };
}
