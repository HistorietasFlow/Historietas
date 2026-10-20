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
const sincronizacaoInicial = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-initial-sync.ts",
    import.meta.url,
  ),
  "utf8",
);

test("hook preserva autenticação, parâmetros sociais e cancelamento", () => {
  assert.match(hook, /^"use client";/);
  for (const trecho of [
    "const router = useRouter();",
    "const { data } = await supabase.auth.getUser();",
    "if (!userId) {",
    "router.replace(criarLoginHrefSeguindo());",
    "const parametrosSociais = obterParametrosSociaisSeguindoUrl(userId);",
    "window.setTimeout(() => {",
    "setUsuarioLogadoId(userId);",
    "setAbaSeguimento(parametrosSociais.aba);",
    "setAbaConteudo(parametrosSociais.conteudo);",
    "setPerfilSocialId(parametrosSociais.perfilId);",
    "setPerfilSocialNome(parametrosSociais.perfilNome);",
    "setVerificandoAcesso(false);",
    "catch {",
    "return () => {",
    "cancelado = true;",
  ]) {
    assert.ok(hook.includes(trecho));
  }
});

test("a sincronização inicial delega o lifecycle de acesso ao hook", () => {
  assert.match(
    sincronizacaoInicial,
    /import \{ useSeguindoAccessSync \} from "\.\/use-seguindo-access-sync";/,
  );
  assert.match(
    sincronizacaoInicial,
    /useSeguindoAccessSync\(\{\s*setUsuarioLogadoId,\s*setAbaSeguimento,\s*setAbaConteudo,\s*setPerfilSocialId,\s*setPerfilSocialNome,\s*setVerificandoAcesso,\s*\}\);/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageInitialSync \} from "\.\/hooks\/use-seguindo-page-initial-sync";/,
  );
  assert.match(pagina, /useSeguindoPageInitialSync\(\{/);
  assert.doesNotMatch(pagina, /async function verificarAcesso()/);
  assert.doesNotMatch(pagina, /criarLoginHrefSeguindo/);
  assert.doesNotMatch(pagina, /obterParametrosSociaisSeguindoUrl/);
});
