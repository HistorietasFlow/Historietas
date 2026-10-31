import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-profile-name-loader.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o carregamento do nome de perfil", async () => {
  const [loader, page] = await Promise.all([
    readFile(loaderPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    loader,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    loader,
    /import \{ pegarTexto \} from "\.\/top5-work-normalizers";/,
  );
  assert.match(loader, /export async function carregarNomePerfilTop5/);
  assert.match(loader, /\.from\("profiles"\)/);
  assert.match(loader, /\.select\("nome"\)/);
  assert.match(loader, /\.eq\("user_id", userId\)/);
  assert.match(loader, /\.limit\(1\)/);
  assert.match(loader, /\.maybeSingle\(\)/);
  assert.match(loader, /if \(!erroPerfilAtual\)/);
  assert.match(loader, /pegarTexto\(perfilAtual\?\.nome\) \|\| nomeAtual/);
  assert.match(loader, /return nomeAtual;/);
  assert.doesNotMatch(loader, /try\s*\{/);
  assert.doesNotMatch(loader, /catch\s*\(/);

  assert.match(
    page,
    /import \{ useTop5InitialLoad \} from "\.\/hooks\/use-top5-initial-load";/,
  );
  assert.doesNotMatch(page, /import \{ carregarNomePerfilTop5 \}/);
  assert.doesNotMatch(page, /\.from\("profiles"\)/);
  assert.doesNotMatch(page, /carregarNomePerfilTop5\(/);
  assert.doesNotMatch(page, /resolverNomeUsuarioTop5\(/);
  assert.match(page, /removerIdSelecionadoTop5\(/);
  assert.match(page, /moverIdSelecionadoTop5\(/);
  assert.match(page, /alternarIdSelecionadoTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "useState",
    "useRouter",
    "localStorage",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      loader,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
