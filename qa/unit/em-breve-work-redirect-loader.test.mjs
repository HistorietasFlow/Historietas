import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL(
  "../../app/em-breve/loaders/encontrar-link-obra-com-conteudo-em-breve.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("o loader preserva a consulta de redirecionamento da obra", async () => {
  const loader = await readFile(loaderPath, "utf8");

  for (const trecho of [
    "obraIdBusca.trim()",
    "tituloBusca.trim()",
    "idObraSupabaseValido",
    '.from("obras")',
    '.select("id,titulo,slug,link,arquivo_url,publicado,classificacao_indicativa")',
    '.eq("id", obraIdLimpo)',
    '.eq("publicado", true)',
    ".limit(1)",
    ".maybeSingle()",
    '.ilike("titulo", tituloLimpo)',
    ".limit(5)",
    "Array.isArray(obrasBanco)",
    'normalizarTexto(obra.titulo || "")',
    "normalizarTexto(tituloLimpo)",
    "ehClassificacao18",
    "obraSupabaseTemArquivoEmBreve",
    "criarLinkObraPublicadaEmBreve",
    '.from("capitulos")',
    '.select("obra_id")',
    '.eq("obra_id", obraEncontrada.id)',
    "capitulosBanco.length > 0",
  ]) {
    assert.ok(loader.includes(trecho), `mantém ${trecho}`);
  }

  assert.doesNotMatch(loader, /\.(?:insert|update|delete|upsert)\(/);
  assert.doesNotMatch(
    loader,
    /use(?:Effect|Memo|State)|router|localStorage|MutationObserver/,
  );
});

test("a página mantém o efeito e delega a localização da obra", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(
    page,
    /import \{ encontrarLinkObraComConteudoEmBreve \} from "\.\/loaders\/encontrar-link-obra-com-conteudo-em-breve"/,
  );
  assert.doesNotMatch(
    page,
    /async function encontrarLinkObraComConteudoEmBreve/,
  );
  assert.match(
    page,
    /await encontrarLinkObraComConteudoEmBreve\(\s*obraIdParam,\s*nomeObraParam\s*\)/,
  );
  assert.match(page, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /normalizarTexto/);

  for (const trecho of [
    "idObraSupabaseValido",
    "ehClassificacao18",
    "obraSupabaseTemArquivoEmBreve",
    "criarLinkObraPublicadaEmBreve",
    "SupabaseObraEmBreveRow",
  ]) {
    assert.ok(!page.includes(trecho), `remove ${trecho} da página`);
  }
});
