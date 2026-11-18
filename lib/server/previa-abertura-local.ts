import "server-only";
import { stringFromBase64URL } from "@supabase/ssr";
import { obterChaveSessaoSupabase } from "../supabase/session-recovery.mjs";
import { configuracaoPreviaVercel } from "./origem-previa-vercel.mjs";

export function urlSupabaseDoEnsaio() {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL ||
      process.env.HISTORIETAS_PREVIA_LOCAL !== "1") return null;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    if (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
        && !url.username && !url.password && url.href === url.origin + "/") return url.origin;
  } catch { /* Configuração ausente ou inválida mantém a rota desligada. */ }
  return null;
}

export function configuracaoRotaPrevia() {
  const local = urlSupabaseDoEnsaio();
  if (local) return { origem: local, chaveProva: process.env.HISTORIETAS_PREVIA_CHAVE_ENSAIO };
  return configuracaoPreviaVercel(process.env);
}

type Credencial = { tipo: "visitante" } | { tipo: "invalida" } | { tipo: "sessao"; token: string };

export function lerCredencialDaPrevia(headers: Headers, url: string): Credencial {
  // O Explorar usa cookies SSR de mesma origem. Não aceita identidade alternativa por header.
  if (headers.has("authorization")) return { tipo: "invalida" };
  const chave = obterChaveSessaoSupabase(url);
  const partes = new Map<string, string>();
  let temCookieUsuario = false;
  try {
    for (const campo of (headers.get("cookie") || "").split(";")) {
      const par = campo.trim();
      const igual = par.indexOf("=");
      const nome = igual === -1 ? par : par.slice(0, igual);
      if (nome === chave + "-user" || nome.startsWith(chave + "-user.")) temCookieUsuario = true;
      if (nome !== chave && !nome.startsWith(chave + ".")) continue;
      if (igual === -1 || partes.has(nome)) return { tipo: "invalida" };
      partes.set(nome, decodeURIComponent(par.slice(igual + 1)));
    }
    if (!partes.size) return { tipo: temCookieUsuario ? "invalida" : "visitante" };
    const inteira = partes.has(chave);
    if (inteira && partes.size !== 1) return { tipo: "invalida" };
    const fragmentos: string[] = [];
    for (let i = 0; i < partes.size; i++) {
      const parte = partes.get(inteira ? chave : chave + "." + i);
      if (!parte) return { tipo: "invalida" };
      fragmentos.push(parte);
    }
    const valor = fragmentos.join("");
    const sessao = JSON.parse(valor.startsWith("base64-") ? stringFromBase64URL(valor.slice(7)) : valor);
    const token = sessao?.access_token;
    if (typeof token === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      return { tipo: "sessao", token };
    }
  } catch { /* Um cookie presente e ilegível nunca representa uma visita anônima. */ }
  return { tipo: "invalida" };
}
