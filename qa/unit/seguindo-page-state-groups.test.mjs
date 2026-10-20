import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const estadoSocial = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-social-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const estadoDescoberta = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-discovery-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("os grupos de estado preservam a ordem dos hooks sociais", () => {
  assert.match(estadoSocial, /^"use client";/);
  assert.match(
    estadoSocial,
    /import \{ useSeguindoSocialListState \} from "\.\/use-seguindo-social-list-state";/,
  );
  assert.match(
    estadoSocial,
    /import \{ useSeguindoRequestActionState \} from "\.\/use-seguindo-request-action-state";/,
  );
  assert.match(
    estadoSocial,
    /\.\.\.useSeguindoSocialListState\(\),[\s\S]*?\.\.\.useSeguindoRequestActionState\(\),/,
  );
  assert.doesNotMatch(estadoSocial, /supabase|localStorage|useEffect|useMemo/);
});

test("os grupos de estado preservam a ordem dos hooks de descoberta", () => {
  assert.match(estadoDescoberta, /^"use client";/);
  assert.match(
    estadoDescoberta,
    /\.\.\.useSeguindoSearchState\(\),[\s\S]*?\.\.\.useSeguindoSuggestionState\(\),[\s\S]*?\.\.\.useSeguindoFilterSortState\(\),[\s\S]*?\.\.\.useSeguindoContentTabState\(\),[\s\S]*?\.\.\.useSeguindoSortingPanelState\(\),/,
  );
  assert.doesNotMatch(estadoDescoberta, /supabase|localStorage|useEffect|useMemo/);
});

test("a página delega somente os grupos de estado locais", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoPageSocialState \} from "\.\/hooks\/use-seguindo-page-social-state";/,
  );
  assert.match(
    pagina,
    /import \{ useSeguindoPageDiscoveryState \} from "\.\/hooks\/use-seguindo-page-discovery-state";/,
  );
  assert.match(pagina, /\} = useSeguindoPageSocialState\(\);/);
  assert.match(pagina, /\} = useSeguindoPageDiscoveryState\(\);/);
  assert.doesNotMatch(pagina, /useSeguindoSocialListState/);
  assert.doesNotMatch(pagina, /useSeguindoSearchState/);
});
