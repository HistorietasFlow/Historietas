import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/em-alta/hooks/use-em-alta-auth-session.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const rankingLoaderFase891 = readFileSync(
  new URL("../../app/em-alta/hooks/use-em-alta-ranking-loader.ts", import.meta.url),
  "utf8",
);

test("useEmAltaAuthSession preserva a leitura inicial, o timer e o cleanup", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect \} from "react";/);
  assert.match(
    hook,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(hook, /export function useEmAltaAuthSession\(/);
  assert.match(hook, /let ativo = true;/);
  assert.match(hook, /async function verificarUsuarioLogado\(\)/);
  assert.match(hook, /const \{ data \} = await supabase\.auth\.getUser\(\);/);
  assert.match(
    hook,
    /window\.setTimeout\(\(\) => \{\s*if \(ativo\) \{\s*setUsuarioLogado\(Boolean\(data\.user\)\);\s*setUsuarioLogadoId\(data\.user\?\.id \|\| ""\);/,
  );
  assert.match(
    hook,
    /catch \{\s*window\.setTimeout\(\(\) => \{\s*if \(ativo\) \{\s*setUsuarioLogado\(false\);\s*setUsuarioLogadoId\(""\);/,
  );
  assert.match(hook, /void verificarUsuarioLogado\(\);/);
  assert.match(
    hook,
    /return \(\) => \{\s*ativo = false;\s*\};\s*\}, \[setUsuarioLogado, setUsuarioLogadoId\]\);/,
  );
});

test("useEmAltaAuthSession preserva a revalidação de sessão das ações", () => {
  assert.match(hook, /async function usuarioTemSessaoAtiva\(\)/);
  assert.match(
    hook,
    /const userId = data\.user\?\.id \|\| "";\s*const logado = Boolean\(userId\);\s*setUsuarioLogado\(logado\);\s*setUsuarioLogadoId\(userId\);\s*return logado;/,
  );
  assert.match(
    hook,
    /catch \{\s*setUsuarioLogado\(false\);\s*setUsuarioLogadoId\(""\);\s*return false;/,
  );
  assert.match(hook, /return \{ usuarioTemSessaoAtiva \};/);

  for (const proibido of [
    /\.from\(/,
    /\.insert\(/,
    /\.update\(/,
    /\.delete\(/,
    /localStorage/,
    /sessionStorage/,
    /<[A-Z][\w.]*\s+[\w-]+=/,
  ]) {
    assert.doesNotMatch(hook, proibido);
  }
});

test("Em Alta mantém autenticação, carregamento e ações em suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ useEmAltaAuthSession \} from "\.\/hooks\/use-em-alta-auth-session";/,
  );
  assert.match(
    pagina,
    /const \{ usuarioTemSessaoAtiva \} = useEmAltaAuthSession\(\{\s*setUsuarioLogado,\s*setUsuarioLogadoId,\s*\}\);/,
  );
  assert.doesNotMatch(pagina, /async function verificarUsuarioLogado\(/);
  assert.doesNotMatch(pagina, /async function usuarioTemSessaoAtiva\(/);
  assert.match(pagina, /useEmAltaRankingLoader\(/);
  assert.match(rankingLoaderFase891, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /useEmAltaRankingCollectionActions\(/);
  assert.doesNotMatch(pagina, /async function alternarFavorito\(obraId: string\)/);
  assert.doesNotMatch(pagina, /async function alternarConcluido\(obraId: string\)/);
});
