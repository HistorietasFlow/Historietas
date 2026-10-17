import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-access-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);

test("hook preserva autenticação, parâmetros sociais e cancelamento", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /const router = useRouter();/);
  assert.match(hook, /const { data } = await supabase\.auth\.getUser();/);
  assert.match(
    hook,
    /if (!userId) {s*router\.replace(criarLoginHrefSeguindo());s*return;s*}/,
  );
  assert.match(
    hook,
    /const parametrosSociais = obterParametrosSociaisSeguindoUrl(userId);/,
  );
  assert.match(hook, /window\.setTimeout(() => {/);
  assert.match(hook, /setUsuarioLogadoId(userId);/);
  assert.match(hook, /setAbaSeguimento(parametrosSociais\.aba);/);
  assert.match(hook, /setAbaConteudo(parametrosSociais\.conteudo);/);
  assert.match(hook, /setPerfilSocialId(parametrosSociais\.perfilId);/);
  assert.match(hook, /setPerfilSocialNome(parametrosSociais\.perfilNome);/);
  assert.match(hook, /setVerificandoAcesso(false);/);
  assert.match(
    hook,
    /catch {s*if (!cancelado) {s*router\.replace(criarLoginHrefSeguindo());s*}s*}/,
  );
  assert.match(
    hook,
    /return () => {s*cancelado = true;s*};/,
  );
});

test("página delega o lifecycle de acesso ao hook", () => {
  assert.match(
    pagina,
    /import { useSeguindoAccessSync } from "\.\/hooks\/use-seguindo-access-sync";/,
  );
  assert.match(
    pagina,
    /useSeguindoAccessSync({s*setUsuarioLogadoId,s*setAbaSeguimento,s*setAbaConteudo,s*setPerfilSocialId,s*setPerfilSocialNome,s*setVerificandoAcesso,s*});/,
  );
  assert.doesNotMatch(pagina, /async function verificarAcesso()/);
  assert.doesNotMatch(pagina, /criarLoginHrefSeguindo/);
  assert.doesNotMatch(pagina, /obterParametrosSociaisSeguindoUrl/);
});
