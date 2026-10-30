import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/ler-capitulo/hooks/use-ler-capitulo-content-18-access.ts",
);
const pagina = ler("../../app/ler-capitulo/page.tsx");

test("hook preserva o controle 18+ por obra, a derivação e a reavaliação agendada", () => {
  assert.match(
    hook,
    /export function useLerCapituloContent18Access\(\s*obra: ObraLocal \| null,?\s*\)/,
  );
  assert.match(hook, /obraId: "",\s*status: "verificando",/);
  assert.match(
    hook,
    /obra &&\s*controleAcesso18\.obraId === obra\.id\s*\? controleAcesso18\.status\s*:\s*"verificando"/,
  );
  assert.match(hook, /window\.setTimeout\(\(\) => \{/);
  assert.match(hook, /\}, 0\);/);
  assert.match(hook, /\}, \[obra\]\);/);
  assert.match(hook, /window\.clearTimeout\(\s*atualizarAcessoTimer,?\s*\);/);
});

test("hook preserva os estados, a otimização e a confirmação manual", () => {
  assert.match(hook, /if \(!obra\) \{\s*return;\s*\}/);
  assert.match(
    hook,
    /!ehClassificacao18\(\s*obra\.classificacaoIndicativa,?\s*\)\s*\? "permitido"\s*:\s*acessoConteudo18Confirmado\(\)\s*\? "permitido"\s*:\s*"bloqueado"/,
  );
  assert.match(
    hook,
    /controleAtual\.obraId ===\s*obra\.id &&\s*controleAtual\.status ===\s*proximoStatus/,
  );
  assert.match(hook, /return controleAtual;/);
  assert.match(
    hook,
    /function permitirAcesso18Atual\(\)[\s\S]*?setControleAcesso18\(\{\s*obraId: obra\.id,\s*status: "permitido",?\s*\}\);/,
  );
  assert.match(
    hook,
    /return \{\s*statusAcesso18,\s*permitirAcesso18Atual,?\s*\};/,
  );
});

test("página delega somente o controle de acesso e preserva o gate", () => {
  assert.match(
    pagina,
    /import \{ useLerCapituloContent18Access \} from "\.\/hooks\/use-ler-capitulo-content-18-access";/,
  );
  assert.match(
    pagina,
    /const \{\s*statusAcesso18,\s*permitirAcesso18Atual,?\s*\} =\s*useLerCapituloContent18Access\(\s*obraAtual,?\s*\);/,
  );
  assert.doesNotMatch(pagina, /const \[\s*controleAcesso18,/);
  assert.match(
    pagina,
    /onConfirmar=\{\s*permitirAcesso18Atual\s*\}/,
  );
  assert.match(pagina, /onVoltar=\{\(\) => \{/);
});

test("hook permanece sem persistência, Supabase, roteamento ou JSX", () => {
  assert.doesNotMatch(
    hook,
    /supabase|localStorage|useRouter|router\.|\.(?:insert|update|delete|upsert)\(|<[A-Z][\w.]*\s+[^>]*>/,
  );
});
