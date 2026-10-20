import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const loadedState = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-page-loaded-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const interactions = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-content-interactions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("Seguindo delegates the loaded presentation without moving data rules", () => {
  assert.match(loadedState, /^"use client";/);
  assert.match(loadedState, /<SeguindoPageFrame isDesktop=\{isDesktop\} pageThemeStyle=\{pageThemeStyle\}>/);
  assert.match(loadedState, /isDesktop \? desktopContainerStyle : containerStyle/);
  assert.match(loadedState, /<SeguindoPageControls \{\.\.\.controls\} \/>/);
  assert.match(loadedState, /<SeguindoPageContent \{\.\.\.content\} \/>/);
  assert.doesNotMatch(loadedState, /supabase|localStorage|useEffect|useState/);
  assert.match(page, /<SeguindoPageLoadedState[\s\S]*?controls=\{\{/);
  assert.match(page, /content=\{\{[\s\S]*?onDeixarDeSeguirAutor: deixarDeSeguirAutor,/);
});

test("Seguindo composes navigation and people search without changing their hooks", () => {
  assert.match(interactions, /^"use client";/);
  assert.match(interactions, /useSeguindoContentTabNavigation\(\{/);
  assert.match(interactions, /useSeguindoUserSearchSync\(\{/);
  assert.match(interactions, /return trocarAbaConteudo;/);
  assert.doesNotMatch(interactions, /supabase|localStorage|window\.|useState/);
  assert.match(page, /const trocarAbaConteudo = useSeguindoPageContentInteractions\(/);
  assert.doesNotMatch(page, /useSeguindoContentTabNavigation\(/);
  assert.doesNotMatch(page, /useSeguindoUserSearchSync\(/);
});
