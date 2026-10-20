import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const estado = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const contexto = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-context.ts",
    import.meta.url,
  ),
  "utf8",
);

test("o estado composto preserva a ordem dos grupos da página", () => {
  assert.match(estado, /^"use client";/);
  assert.match(
    estado,
    /import \{ useSeguindoPageDataState \} from "\.\/use-seguindo-page-data-state";/,
  );
  assert.match(
    estado,
    /import \{ useSeguindoPageSocialState \} from "\.\/use-seguindo-page-social-state";/,
  );
  assert.match(
    estado,
    /import \{ useSeguindoPageDiscoveryState \} from "\.\/use-seguindo-page-discovery-state";/,
  );
  assert.match(
    estado,
    /\.\.\.useSeguindoPageDataState\(\),[\s\S]*?\.\.\.useSeguindoPageSocialState\(\),[\s\S]*?\.\.\.useSeguindoPageDiscoveryState\(\),/,
  );
  assert.doesNotMatch(estado, /supabase|localStorage|useEffect|useState/);
});

test("o contexto composto preserva modo desktop, acesso e apresentação", () => {
  assert.match(contexto, /^"use client";/);
  assert.match(
    contexto,
    /import \{ useSeguindoDesktopMode \} from "\.\/use-seguindo-desktop-mode";/,
  );
  assert.match(
    contexto,
    /import \{ useSeguindoPageAccessContextState \} from "\.\/use-seguindo-page-access-context-state";/,
  );
  assert.match(
    contexto,
    /import \{ useSeguindoPageView \} from "\.\/use-seguindo-page-view";/,
  );
  assert.match(
    contexto,
    /const isDesktop = useSeguindoDesktopMode\(\);[\s\S]*?const accessContextState = useSeguindoPageAccessContextState\(\);[\s\S]*?useSeguindoPageView\(mostrarPainelOrdenacao\);/,
  );
  assert.match(
    contexto,
    /return \{ isDesktop, \.\.\.accessContextState, pageThemeStyle \};/,
  );
  assert.doesNotMatch(contexto, /supabase|localStorage|useEffect|useState/);
});

test("a página delega os grupos sem alterar sua orquestração", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoPageState \} from "\.\/hooks\/use-seguindo-page-state";/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageContext \} from "\.\/hooks\/use-seguindo-page-context";/,
  );
  assert.match(
    pagina,
    /\} = useSeguindoPageState\(\);[\s\S]*?\} = useSeguindoPageContext\(\s*mostrarPainelOrdenacao,?\s*\);[\s\S]*?useSeguindoPageInitialSync\(\{/,
  );
  assert.doesNotMatch(pagina, /useSeguindoPageDataState|useSeguindoPageSocialState|useSeguindoPageDiscoveryState/);
  assert.doesNotMatch(pagina, /useSeguindoDesktopMode|useSeguindoPageAccessContextState|useSeguindoPageView/);
});
