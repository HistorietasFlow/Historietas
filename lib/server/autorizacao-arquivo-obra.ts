import "server-only";
import { lerCredencialDaPrevia } from "./previa-abertura-local";

type LeitorArquivo = {
  usuarioId: string;
  origem: string;
  headers: Headers;
};

export async function resolverLeitorArquivo(headersRequisicao: Headers): Promise<LeitorArquivo | null> {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "");
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!chave || !["https:", "http:"].includes(url.protocol) || url.href !== url.origin + "/") {
    throw new Error("autenticacao_indisponivel");
  }

  const credencial = lerCredencialDaPrevia(headersRequisicao, url.origin);
  if (credencial.tipo === "invalida") return null;

  const headers = new Headers({ apikey: chave });
  if (credencial.tipo === "visitante") {
    if (!chave.startsWith("sb_publishable_")) headers.set("Authorization", "Bearer " + chave);
    return { usuarioId: "", origem: url.origin, headers };
  }

  headers.set("Authorization", "Bearer " + credencial.token);
  const resposta = await fetch(url.origin + "/auth/v1/user", {
    headers, cache: "no-store", redirect: "error",
  });
  if ([400, 401, 403].includes(resposta.status)) return null;
  if (!resposta.ok) throw new Error("autenticacao_indisponivel");
  const id = (await resposta.json())?.id;
  if (typeof id !== "string" || !id) throw new Error("autenticacao_indisponivel");
  return { usuarioId: id, origem: url.origin, headers };
}

export async function autorizarLeitorArquivo(
  leitor: LeitorArquivo,
  obraId: string,
  proprietarioId: string,
  referenciaSha256: string,
): Promise<boolean | "sessao_invalida"> {
  const headers = new Headers(leitor.headers);
  headers.set("Content-Type", "application/json");
  const resposta = await fetch(leitor.origem + "/rest/v1/rpc/autorizar_leitura_arquivo_obra", {
    method: "POST", headers, cache: "no-store", redirect: "error",
    body: JSON.stringify({ p_obra_id: obraId, p_proprietario_id: proprietarioId, p_referencia_sha256: referenciaSha256 }),
  });
  if (leitor.usuarioId && resposta.status === 401) return "sessao_invalida";
  if (!resposta.ok) throw new Error("autorizacao_indisponivel");
  const permitido: unknown = await resposta.json();
  if (typeof permitido !== "boolean") throw new Error("autorizacao_indisponivel");
  return permitido;
}
