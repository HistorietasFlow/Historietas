import { supabase } from "../../../lib/supabase/client";

export type EstadoLink = "verificando" | "valido" | "invalido";

export function obterMensagemErro(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const mensagem =
    "message" in error && typeof error.message === "string"
      ? error.message.trim()
      : "";

  return mensagem || fallback;
}

export async function sessaoEhRecuperacao() {
  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims || typeof data.claims !== "object") {
      return false;
    }

    const amr = (data.claims as { amr?: unknown }).amr;

    if (!Array.isArray(amr)) {
      return false;
    }

    return amr.some((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const metodo = (item as { method?: unknown }).method;

      return (
        typeof metodo === "string" &&
        metodo.trim().toLowerCase() === "recovery"
      );
    });
  } catch {
    return false;
  }
}
