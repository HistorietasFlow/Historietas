import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeStatusStates.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);

test("HomeStatusStates preserva o loading acessível e seus estilos exclusivos", () => {
  assert.match(
    componente,
    /export function LoadingSpinner\(\{ label = "Carregando" \}: \{ label\?: string \}\)/,
  );
  assert.match(
    componente,
    /role="status"\s+aria-live="polite"\s+aria-label=\{label\}\s+style=\{loadingPageStyle\}/,
  );
  assert.match(componente, /className="historietas-loading-spinner"/);
  assert.match(componente, /style=\{loadingSpinnerStyle\}\s+aria-hidden="true"/);
  assert.match(
    componente,
    /const loadingPageStyle: CSSProperties = \{[\s\S]*?position: "relative",[\s\S]*?zIndex: 2,[\s\S]*?width: "100%",[\s\S]*?minHeight: "100dvh",[\s\S]*?display: "flex",[\s\S]*?alignItems: "center",[\s\S]*?justifyContent: "center",[\s\S]*?boxSizing: "border-box",[\s\S]*?\};/,
  );
  assert.match(
    componente,
    /const loadingSpinnerStyle: CSSProperties = \{[\s\S]*?width: "30px",[\s\S]*?height: "30px",[\s\S]*?borderRadius: "999px",[\s\S]*?border: "3px solid rgba\(255,255,255,0\.20\)",[\s\S]*?borderTopColor: "#FFFFFF",[\s\S]*?boxSizing: "border-box",[\s\S]*?animation: "historietas-loading-spin 0\.78s linear infinite",[\s\S]*?flex: "0 0 auto",[\s\S]*?\};/,
  );
});

test("HomeStatusStates preserva os dois estados vazios sem generalizar os estilos", () => {
  assert.match(componente, /export function HomeEmptyState\(\)/);
  assert.match(componente, /Nenhuma obra cadastrada/);
  assert.match(componente, /export function EmptySearch\(\)/);
  assert.match(componente, /Nenhuma obra encontrada/);

  const estadosVazios = componente.match(/margin: "10px 0 0",[\s\S]*?textAlign: "center",/g) || [];
  assert.equal(estadosVazios.length, 2);
  for (const estilo of estadosVazios) {
    assert.match(estilo, /color: "#FFFFFF",/);
    assert.match(estilo, /fontSize: "12px",/);
    assert.match(estilo, /fontWeight: 800,/);
  }
});

test("Home delega os estados simples sem levar estilos exclusivos para a página", () => {
  assert.match(pagina, /import \{ LoadingSpinner \} from "\.\.\/components\/HomeStatusStates";/);
  assert.match(secoes, /import \{ EmptySearch, HomeEmptyState \} from "\.\/HomeStatusStates";/);
  assert.match(pagina, /<LoadingSpinner label="Carregando página inicial" \/>/);
  assert.match(secoes, /homeSemObrasReais && <HomeEmptyState \/>/);
  assert.match(secoes, /<EmptySearch \/>/);

  for (const declaracao of [
    "function LoadingSpinner",
    "function HomeEmptyState",
    "function EmptySearch",
    "const loadingPageStyle",
    "const loadingSpinnerStyle",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(declaracao));
  }

  assert.doesNotMatch(componente, /supabase|localStorage|useEffect|useState|useMemo/);
  assert.match(componente, /import type \{ CSSProperties \} from "react";/);
});
