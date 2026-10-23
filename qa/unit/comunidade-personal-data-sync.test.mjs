import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-personal-data-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useComunidadeSavedPostsSync preserva a leitura local e sincronizacao de posts salvos", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeSavedPostsSync\(/);
  assert.match(hook, /const userId = usuarioId \|\| "";/);
  assert.match(
    hook,
    /carregarPostsSalvosLocaisComunidade\([\s\S]*?carregarJsonUsuarioComunidade,[\s\S]*?userId/,
  );
  assert.match(
    hook,
    /setVotosEnquetes\([\s\S]*?carregarVotosEnquetesLocais\(carregarJsonUsuarioComunidade, userId\)/,
  );
  assert.match(
    hook,
    /void carregarPostsSalvosSupabaseComunidade\(userId\)\.then\(\(postsSalvosReais\) => \{[\s\S]*?if \(cancelado \|\| !postsSalvosReais\) \{[\s\S]*?setPostsSalvosIds\(postsSalvosReais\);/,
  );
  assert.match(
    hook,
    /salvarJsonUsuarioComunidade\([\s\S]*?CHAVE_POSTS_SALVOS_COMUNIDADE,[\s\S]*?userId,[\s\S]*?postsSalvosReais/,
  );
  assert.match(
    hook,
    /return \(\) => \{[\s\S]*?cancelado = true;[\s\S]*?window\.clearTimeout\(carregarLocaisTimer\);/,
  );
});

test("useComunidadePollVotesSync preserva a reconciliacao local e remota das enquetes", () => {
  assert.match(hook, /export function useComunidadePollVotesSync\(/);
  assert.match(
    hook,
    /const postsEnqueteIds = posts[\s\S]*?\.filter\(\(post\) => postEhEnquete\(post\)\)[\s\S]*?\.map\(\(post\) => post\.id\)[\s\S]*?\.filter\(Boolean\);/,
  );
  assert.match(
    hook,
    /if \(postsEnqueteIds\.length === 0\) \{[\s\S]*?setResultadosEnquetes\(\{\}\);/,
  );
  assert.match(
    hook,
    /const votosLocais = carregarVotosEnquetesLocais\([\s\S]*?carregarJsonUsuarioComunidade,[\s\S]*?usuarioId \|\| ""/,
  );
  assert.match(
    hook,
    /setVotosEnquetes\(\(votosAtuais\) => \(\{[\s\S]*?\.\.\.votosLocais,[\s\S]*?\.\.\.votosAtuais,/,
  );
  assert.match(
    hook,
    /const votosReais = await carregarVotosEnquetesSupabase\([\s\S]*?postsEnqueteIds,[\s\S]*?usuarioId/,
  );
  assert.match(
    hook,
    /setResultadosEnquetes\(votosReais\.resultados\);[\s\S]*?\.\.\.votosAtuais,[\s\S]*?\.\.\.votosReais\.meusVotos/,
  );
  assert.match(
    hook,
    /salvarVotosEnquetesLocais\([\s\S]*?salvarJsonUsuarioComunidade,[\s\S]*?votosAtualizados,[\s\S]*?usuarioId/,
  );
  assert.match(hook, /return \(\) => \{\s*cancelado = true;\s*\};/);
});

test("Comunidade delega somente os lifecycles de dados pessoais aos hooks", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?useComunidadePollVotesSync,[\s\S]*?useComunidadeSavedPostsSync,[\s\S]*?\} from "\.\/hooks\/use-comunidade-personal-data-sync";/,
  );
  assert.match(
    pagina,
    /useComunidadeSavedPostsSync\(\{[\s\S]*?usuarioId: usuario\?\.id,[\s\S]*?setPostsSalvosIds,[\s\S]*?setVotosEnquetes,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadePollVotesSync\(\{[\s\S]*?posts,[\s\S]*?usuarioId: usuario\?\.id,[\s\S]*?setVotosEnquetes,[\s\S]*?setResultadosEnquetes,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /void carregarPostsSalvosSupabaseComunidade\(/);
  assert.doesNotMatch(pagina, /await carregarVotosEnquetesSupabase\(/);
  assert.match(pagina, /useComunidadePostEngagementActions\(\{/);
  assert.doesNotMatch(pagina, /function salvarPostComunidade\(postId: string\)/);
  assert.doesNotMatch(pagina, /function votarEnquetePostComunidade\(postId: string, opcao: string\)/);
  assert.match(pagina, /useComunidadeAuthAccountLifecycle\(/);
});
