const CODIGOS_SESSAO_IRRECUPERAVEL = new Set([
  "bad_jwt",
  "refresh_token_already_used",
  "refresh_token_not_found",
  "session_expired",
  "session_not_found",
  "user_banned",
  "user_not_found",
]);

const MENSAGENS_SESSAO_IRRECUPERAVEL = [
  "auth session missing",
  "invalid refresh token",
  "refresh token already used",
  "refresh token not found",
  "session not found",
];

function textoSeguro(valor) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

/**
 * Reconhece apenas erros que confirmam que a sessão local não pode ser
 * recuperada. Erros de rede, limites de frequência e falhas 5xx ficam de fora.
 *
 * @param {unknown} error
 */
export function erroExigeLimpezaSessaoLocal(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const erro = /** @type {{ code?: unknown, message?: unknown, name?: unknown }} */ (
    error
  );
  const codigo = textoSeguro(erro.code);

  if (CODIGOS_SESSAO_IRRECUPERAVEL.has(codigo)) {
    return true;
  }

  const nome = textoSeguro(erro.name);
  const mensagem = textoSeguro(erro.message);

  if (nome === "authsessionmissingerror") {
    return true;
  }

  return MENSAGENS_SESSAO_IRRECUPERAVEL.some((trecho) =>
    mensagem.includes(trecho),
  );
}

/**
 * Retorna a chave de armazenamento usada por supabase-js para o projeto.
 *
 * @param {string} supabaseUrl
 */
export function obterChaveSessaoSupabase(supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    const projeto = url.hostname.split(".")[0]?.trim() || "";

    return projeto ? `sb-${projeto}-auth-token` : "";
  } catch {
    return "";
  }
}

/**
 * Seleciona somente cookies Auth do projeto atual, inclusive cookies divididos
 * em partes e auxiliares de PKCE/usuário.
 *
 * @param {string[]} nomes
 * @param {string} supabaseUrl
 */
export function obterNomesCookiesSessaoSupabase(nomes, supabaseUrl) {
  const chave = obterChaveSessaoSupabase(supabaseUrl);

  if (!chave) {
    return [];
  }

  return [...new Set(nomes)].filter(
    (nome) =>
      nome === chave || nome.startsWith(`${chave}.`) || nome.startsWith(`${chave}-`),
  );
}
