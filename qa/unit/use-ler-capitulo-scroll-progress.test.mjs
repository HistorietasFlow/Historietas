import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-scroll-progress.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");

test("progresso preserva cálculo, clamp, timer, listeners e cleanup", () => {
  assert.match(fonte, /document\.documentElement\.scrollHeight[\s\S]*?window\.innerHeight/);
  assert.match(fonte, /alturaTotal <= 0[\s\S]*?setProgressoRolagem\(0\)/);
  assert.match(fonte, /Math\.round\(/);
  assert.match(fonte, /Math\.min\([\s\S]*?100,[\s\S]*?Math\.max\([\s\S]*?0,[\s\S]*?progressoAtual/);
  assert.match(fonte, /window\.setTimeout\([\s\S]*?atualizarProgressoRolagem,[\s\S]*?0,/);
  assert.match(fonte, /window\.addEventListener\([\s\S]*?"scroll",[\s\S]*?atualizarProgressoRolagem/);
  assert.match(fonte, /window\.addEventListener\([\s\S]*?"resize",[\s\S]*?atualizarProgressoRolagem/);
  assert.match(fonte, /window\.clearTimeout\([\s\S]*?atualizarProgressoTimer/);
  assert.match(fonte, /window\.removeEventListener\([\s\S]*?"scroll",[\s\S]*?atualizarProgressoRolagem/);
  assert.match(fonte, /window\.removeEventListener\([\s\S]*?"resize",[\s\S]*?atualizarProgressoRolagem/);
});

test("página mantém estado local e delega apenas o progresso de rolagem", () => {
  assert.match(pagina, /import \{ useLerCapituloScrollProgress \} from "\.\/hooks\/use-ler-capitulo-scroll-progress";/);
  assert.match(pagina, /const \[progressoRolagem, setProgressoRolagem\] = useState\(0\);/);
  assert.match(pagina, /useLerCapituloScrollProgress\(\{[\s\S]*?capituloId:\s*capituloAtual\?\.id,[\s\S]*?setProgressoRolagem,/);
  assert.doesNotMatch(pagina, /function atualizarProgressoRolagem/);
});
