import { supabase } from "../../../lib/supabase/client";

export type EstadoLink = "verificando" | "valido" | "invalido";

export type SessaoRecuperacao = {
  usuarioId: string;
  sessaoId: string;
  accessToken: string;
  refreshToken: string;
  expiraEm: number;
};

export type ContextoRecuperacao = {
  query: string;
  estado: EstadoLink;
  sessao: SessaoRecuperacao | null;
  consumido: boolean;
  emAlteracao: boolean;
  logoutSolicitado: boolean;
};

export function criarContextoRecuperacao(query = ""): ContextoRecuperacao {
  return { query, estado: "verificando", sessao: null, consumido: false, emAlteracao: false, logoutSolicitado: false };
}

export function invalidarContextoRecuperacao(ref: { current: ContextoRecuperacao }) {
  ref.current = { ...criarContextoRecuperacao(ref.current.query), estado: "invalido" };
}

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

export async function obterSessaoRecuperacao(): Promise<SessaoRecuperacao | null> {
  try {
    // A sessão local fornece o token; getUser/getClaims verificam sua autoridade.
    const { data: local, error: erroLocal } = await supabase.auth.getSession();
    const session = local.session;
    if (erroLocal || !session?.access_token || !session.refresh_token) return null;
    const token = session.access_token;
    const { data: usuario, error: erroUsuario } = await supabase.auth.getUser(token);
    if (erroUsuario || !usuario.user) return null;
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims || typeof data.claims !== "object") return null;
    const { sub, session_id, exp, amr } = data.claims;
    if (sub !== usuario.user.id || typeof session_id !== "string" || !session_id.trim() ||
      typeof exp !== "number" || !Number.isFinite(exp) || exp <= Date.now() / 1000 || !Array.isArray(amr)) return null;
    const recovery = amr.some(item => item && typeof item === "object" &&
      typeof item.method === "string" && item.method.trim().toLowerCase() === "recovery");
    if (!recovery) return null;
    const { data: atual, error: erroAtual } = await supabase.auth.getSession();
    if (erroAtual || atual.session?.access_token !== token) return null;
    return { usuarioId: sub, sessaoId: session_id, accessToken: token,
      refreshToken: session.refresh_token, expiraEm: exp };
  } catch {
    return null;
  }
}

export async function sessaoEhRecuperacao() {
  return Boolean(await obterSessaoRecuperacao());
}
