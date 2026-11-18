import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { decodificarSlugSeguro } from "@/app/obra/[slug]/capitulo/[numero]/lib/obra-chapter-canonical-route-utils";
import { reconhecerRotaPrevia } from "@/lib/rota-previa-abertura";
import { lerCredencialDaPrevia, urlSupabaseDoEnsaio } from "@/lib/server/previa-abertura-local";

export const dynamic = "force-dynamic";

function responder(status: number, trecho?: string) {
  return Response.json(trecho === undefined ? {} : { trecho }, {
    status,
    headers: { "Cache-Control": "private, no-store", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const origem = urlSupabaseDoEnsaio();
  if (!origem) return responder(404);
  const caminho = reconhecerRotaPrevia(request.nextUrl.pathname);
  if (!caminho) return responder(404);
  const slug = decodificarSlugSeguro(caminho[1]);
  if (!slug) return responder(400);
  const credencial = lerCredencialDaPrevia(request.headers, origem);
  if (credencial.tipo === "invalida") return responder(401);

  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const chaveProva = process.env.HISTORIETAS_PREVIA_CHAVE_ENSAIO;
  if (!chave || !chaveProva || !/^[a-f0-9]{64}$/.test(chaveProva)) return responder(503);
  const headers = new Headers({ apikey: chave });
  if (credencial.tipo === "sessao") headers.set("Authorization", "Bearer " + credencial.token);
  else if (!chave.startsWith("sb_publishable_")) headers.set("Authorization", "Bearer " + chave);

  const opcoes = { cache: "no-store", redirect: "error", headers } as const;
  try {
    let identidade = "anon";
    if (credencial.tipo === "sessao") {
      // Valida exatamente o token recebido, sem atualizar a sessão nem tentar novamente como anon.
      const usuario = await fetch(origem + "/auth/v1/user", opcoes);
      if ([400, 401, 403].includes(usuario.status)) return responder(401);
      if (!usuario.ok) return responder(503);
      const id = (await usuario.json())?.id;
      if (typeof id !== "string") return responder(503);
      const claims = JSON.parse(Buffer.from(credencial.token.split(".")[1], "base64url").toString("utf8"));
      if (id !== claims.sub || typeof claims.session_id !== "string" || !claims.session_id) return responder(401);
      identidade = id + "/" + claims.session_id;
    }
    const prazo = String(Math.floor(Date.now() / 1000) + 20);
    const mensagem = ["historietas/previa/v1", prazo, identidade, slug].join("\n");
    const prova = createHmac("sha256", Buffer.from(chaveProva, "hex")).update(mensagem).digest("hex");
    headers.set("x-historietas-previa-exp", prazo);
    headers.set("x-historietas-previa-prova", prova);
    headers.set("Content-Type", "application/json");
    const resposta = await fetch(origem + "/rest/v1/rpc/previa_abertura_assinada", {
      ...opcoes, method: "POST", body: JSON.stringify({ p_slug: slug }),
    });
    if (resposta.status === 401 && credencial.tipo === "sessao") return responder(401);
    if (!resposta.ok) return responder(503);
    const linhas = await resposta.json();
    if (!Array.isArray(linhas) || linhas.length > 1) return responder(503);
    if (!linhas.length) return responder(404);
    const trecho = linhas[0]?.trecho;
    if (typeof trecho !== "string" || !trecho.length || Array.from(trecho).length > 600) return responder(503);
    return responder(200, trecho);
  } catch {
    return responder(503);
  }
}
