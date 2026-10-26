export type ErroAuthSupabase = {
  message?: string;
  code?: string;
  status?: number | string;
  name?: string;
};

export function obterMensagemErroAuth(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const erroAuth = error as ErroAuthSupabase;

  return typeof erroAuth.message === "string" ? erroAuth.message.trim() : "";
}

export function obterCodigoErroAuth(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const erroAuth = error as ErroAuthSupabase;

  return typeof erroAuth.code === "string" ? erroAuth.code.trim() : "";
}
