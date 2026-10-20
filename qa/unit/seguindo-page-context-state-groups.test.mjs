import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const estadoDados = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-data-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const estadoAcesso = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-access-context-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const estadoPagina = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const contextoPagina = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-context.ts",
    import.meta.url,
  ),
  "utf8",
);

test("o grupo de dados preserva a ordem dos hooks de obras, leitura e carregamento", () => {
  assert.match(estadoDados, /^"use client";/);
  assert.match(
    estadoDados,
    /\.\.\.useSeguindoWorkFollowState\(\),[\s\S]*?\.\.\.useSeguindoReadingStatusState\(\),[\s\S]*?\.\.\.useSeguindoPageLoadState\(\),/,
  );
  assert.doesNotMatch(estadoDados, /supabase|localStorage|useEffect|useMemo/);
});

test("o grupo de acesso preserva a ordem dos hooks de acesso e perfil", () => {
  assert.match(estadoAcesso, /^"use client";/);
  assert.match(
    estadoAcesso,
    /\.\.\.useSeguindoAccessState\(\),[\s\S]*?\.\.\.useSeguindoFollowTabState\(\),[\s\S]*?\.\.\.useSeguindoProfileContextState\(\),/,
  );
  assert.doesNotMatch(estadoAcesso, /supabase|localStorage|useEffect|useMemo/);
});

test("a página delega os grupos de dados e contexto sem alterar consumidores", () => {
  assert.match(
    estadoPagina,
    /import \{ useSeguindoPageDataState \} from "\.\/use-seguindo-page-data-state";/,
  );
  assert.match(
    contextoPagina,
    /import \{ useSeguindoPageAccessContextState \} from "\.\/use-seguindo-page-access-context-state";/,
  );
  assert.match(pagina, /\} = useSeguindoPageState\(\);/);
  assert.match(pagina, /\} = useSeguindoPageContext\(/);
  assert.doesNotMatch(pagina, /useSeguindoWorkFollowState/);
  assert.doesNotMatch(pagina, /useSeguindoAccessState/);
});
