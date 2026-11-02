import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-page-load-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const loader = ler("../../app/listas/hooks/use-listas-page-data-loader.ts");

test("hook centraliza somente o estado de carregamento da página de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function useListasPageLoadState\(\)/);
  assert.match(hook, /carregando, setCarregando\] = useState\(true\)/);
  assert.match(hook, /bloqueado, setBloqueado\] = useState\(false\)/);
  assert.match(hook, /erro, setErro\] = useState\(""\)/);
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("Listas delega o estado e preserva o lifecycle e os consumidores", () => {
  assert.match(
    pagina,
    /import \{ useListasPageLoadState \} from "\.\/hooks\/use-listas-page-load-state";/,
  );
  assert.match(pagina, /\} = useListasPageLoadState\(\);/);

  for (const estadoLocal of [
    "const [carregando, setCarregando]",
    "const [bloqueado, setBloqueado]",
    "const [erro, setErro]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasPageDataLoader\(\{[\s\S]*?setCarregando,[\s\S]*?setBloqueado,[\s\S]*?setErro,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /carregando,/);
  assert.match(pagina, /bloqueado,/);
  assert.match(pagina, /erro,/);
  assert.match(loader, /setCarregando\(true\);/);
  assert.match(loader, /setBloqueado\(false\);/);
  assert.match(loader, /setErro\(""\);/);
  assert.match(loader, /if \(!permitido\) \{[\s\S]*?setBloqueado\(true\);/);
  assert.match(loader, /finally \{[\s\S]*?setCarregando\(false\);/);
});
