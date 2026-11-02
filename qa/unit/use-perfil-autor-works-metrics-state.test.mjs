import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-works-metrics-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente os estados de obras e métricas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import \{ totaisInteracoesObrasPerfilVazio \} from "\.\.\/constants";/,
  );
  assert.match(
    hook,
    /import type \{[\s\S]*?ObraLocal,[\s\S]*?TotaisInteracoesObrasPerfilAutor,[\s\S]*?\} from "\.\.\/types";/,
  );
  assert.match(hook, /export function usePerfilAutorWorksMetricsState\(\)/);
  assert.match(hook, /obras, setObras\] = useState<ObraLocal\[\]>\(\[\]\)/);
  assert.match(
    hook,
    /totaisInteracoesObras, setTotaisInteracoesObras\][\s\S]*?useState<TotaisInteracoesObrasPerfilAutor>\([\s\S]*?totaisInteracoesObrasPerfilVazio,[\s\S]*?\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega os estados e preserva consumidores de obras e métricas", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorWorksMetricsState \} from "\.\/hooks\/use-perfil-autor-works-metrics-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorWorksMetricsState\(\);/);

  for (const estadoLocal of [
    "const [obras, setObras]",
    "const [totaisInteracoesObras, setTotaisInteracoesObras]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorProfileLoadSync({",
    "usePerfilAutorAuthIdentitySync({",
    "usePerfilAutorInteractionTotalsSync({",
    "usePerfilAutorLibraryStorageActions({",
    "usePerfilAutorProfileEditorSaveActions({",
    "obterEstadoAlvoPerfilAutor({",
    "usePerfilAutorWorkItemRenderer({",
    "usePerfilAutorLibraryItemRenderer({",
    "obterEstadoVisualActionSheetsPerfilAutor({",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorAuthIdentitySync\(\{[\s\S]*?setObras,[\s\S]*?setTotaisInteracoesObras,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileLoadSync\(\{[\s\S]*?setObras,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorInteractionTotalsSync\(\{[\s\S]*?obras,[\s\S]*?setTotaisInteracoesObras,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorLibraryStorageActions\(\{[\s\S]*?setObras,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorProfileEditorSaveActions\(\{[\s\S]*?setObras,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /obterEstadoAlvoPerfilAutor\(\{[\s\S]*?obras,[\s\S]*?totaisInteracoesObras,[\s\S]*?\}\);/,
  );
});
