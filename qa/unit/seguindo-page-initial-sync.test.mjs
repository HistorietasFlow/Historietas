import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("a sincronização inicial preserva a ordem de acesso e carregamento", () => {
  assert.match(sincronizacaoInicial, /^"use client";/);
  assert.match(
    sincronizacaoInicial,
    /useSeguindoAccessSync\(\{[\s\S]*?\}\);[\s\S]*?useSeguindoPageDataLoading\(\{[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(sincronizacaoInicial, /supabase|localStorage|useEffect|useMemo/);
});

test("Seguindo delega somente a composição dos lifecycles iniciais", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoPageInitialSync \} from "\.\/hooks\/use-seguindo-page-initial-sync";/,
  );
  assert.match(
    pagina,
    /useSeguindoPageInitialSync\(\{[\s\S]*?setUsuarioLogadoId,[\s\S]*?setCarregando,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /useSeguindoAccessSync/);
  assert.doesNotMatch(pagina, /useSeguindoPageDataLoading/);
});
