import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/explorar/hooks/use-explorar-personal-collections-state.ts",
);
const pagina = ler("../../app/explorar/page.tsx");
const initialLoad = ler("../../app/explorar/hooks/use-explorar-initial-load.ts");
const sync = ler("../../app/explorar/hooks/use-explorar-personal-collections-sync.ts");
const derived = ler("../../app/explorar/lib/explorar-derived-utils.ts");

test("hook centraliza somente as coleções pessoais de Explorar", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function useExplorarPersonalCollectionsState\(\)/);
  assert.match(
    hook,
    /obrasFavoritas, setObrasFavoritas\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /obrasConcluidas, setObrasConcluidas\] = useState<string\[\]>\(\[\]\)/,
  );
  assert.match(hook, /obrasComLeitura, setObrasComLeitura\] = useState<string\[\]>\(\[\]\)/);
  assert.match(hook, /colecoesCarregadas, setColecoesCarregadas\] = useState\(false\)/);
  assert.match(hook, /erroColecoesExplorar, setErroColecoesExplorar\] = useState\(false\)/);
  assert.doesNotMatch(
    hook,
    /useEffect|useMemo|supabase|localStorage|normalizar|carregar|return\s*\(\s*</,
  );
});

test("Explorar delega coleções e preserva carregamento e filtros pessoais", () => {
  assert.match(
    pagina,
    /import \{ useExplorarPersonalCollectionsState \} from "\.\/hooks\/use-explorar-personal-collections-state";/,
  );
  assert.match(pagina, /\} = useExplorarPersonalCollectionsState\(\);/);
  assert.doesNotMatch(pagina, /const \[obrasFavoritas, setObrasFavoritas\]/);
  assert.doesNotMatch(pagina, /const \[obrasConcluidas, setObrasConcluidas\]/);
  assert.match(
    pagina,
    /useExplorarPersonalCollectionsSync\(\{[\s\S]*?usuarioIdExplorar,[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,[\s\S]*?setObrasComLeitura,/,
  );
  assert.match(
    pagina,
    /filtrarObrasBaseExplorar\(\{[\s\S]*?filtroColecao,[\s\S]*?usuarioLogado,[\s\S]*?ordenacao,[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?colecaoTemObraExplorar,/,
  );
  assert.doesNotMatch(initialLoad, /carregarColecoesUsuarioExplorar|setObrasFavoritas|setObrasConcluidas/);
  assert.match(sync, /carregarColecoesUsuarioExplorar\(userId\)/);
  assert.match(sync, /versaoIdentidadeRef\.current !== numeroVersao/);
  assert.match(sync, /setObrasComLeitura\(comLeitura\)/);
  assert.match(derived, /filtroColecao === "favoritas"/);
  assert.match(derived, /filtroColecao === "concluidas"/);
});
