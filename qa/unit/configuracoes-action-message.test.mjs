import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-action-message.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("useConfiguracoesActionMessage preserva ID e expiração segura", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useConfiguracoesActionMessage\(\)/);
  assert.match(
    hook,
    /useState<MensagemAcaoConfiguracoes \| null>\(null\)/,
  );
  assert.match(hook, /type TipoMensagemAcaoConfiguracoes = "sucesso" \| "erro" \| "aviso";/);
  assert.match(hook, /function mostrarMensagemAcao\(\s*tipo: TipoMensagemAcaoConfiguracoes,\s*texto: string,/);
  assert.match(hook, /setMensagemAcao\(\(mensagemAtual\) => \(\{/);
  assert.match(hook, /id: \(mensagemAtual\?\.id \?\? 0\) \+ 1,/);
  assert.match(hook, /tipo,/);
  assert.match(hook, /texto,/);
  assert.match(hook, /if \(!mensagemAcao\) \{/);
  assert.match(hook, /const mensagemId = mensagemAcao\.id;/);
  assert.match(hook, /window\.setTimeout\(\(\) => \{/);
  assert.match(hook, /\}, 5000\);/);
  assert.match(hook, /setMensagemAcao\(\(mensagemAtual\) =>/);
  assert.match(
    hook,
    /mensagemAtual\?\.id === mensagemId \? null : mensagemAtual/,
  );
  assert.match(hook, /window\.clearTimeout\(timer\)/);
  assert.match(hook, /\}, \[mensagemAcao\]\);/);
  assert.match(hook, /return \{\s*mensagemAcao,\s*setMensagemAcao,\s*mostrarMensagemAcao,\s*\};/);
});

test("Configurações mantém domínio e toast na página", () => {
  assert.match(
    pagina,
    /import \{ useConfiguracoesActionMessage \} from "\.\/hooks\/use-configuracoes-action-message";/,
  );
  assert.match(
    pagina,
    /const \{\s*mensagemAcao,\s*setMensagemAcao,\s*mostrarMensagemAcao,\s*\} = useConfiguracoesActionMessage\(\);/,
  );
  assert.doesNotMatch(
    pagina,
    /useState<MensagemAcaoConfiguracoes \| null>\(null\)/,
  );
  assert.doesNotMatch(pagina, /function mostrarMensagemAcao\(/);
  assert.doesNotMatch(pagina, /\}, 5000\);/);
  assert.doesNotMatch(pagina, /type TipoMensagemAcaoConfiguracoes =/);
  assert.doesNotMatch(pagina, /type MensagemAcaoConfiguracoes =/);

  const chamadasDominio = pagina.match(/mostrarMensagemAcao\(/g);
  assert.equal(chamadasDominio?.length, 15);
  assert.ok((pagina.match(/setMensagemAcao\(null\)/g) || []).length >= 1);
  assert.match(pagina, /\{mensagemAcao \? \(/);
  assert.match(pagina, /onClick=\{\(\) => setMensagemAcao\(null\)\}/);
  assert.match(pagina, /role=\{mensagemAcao\.tipo === "erro" \? "alert" : "status"\}/);
  assert.match(pagina, /function salvar\(/);
  assert.match(pagina, /function alterarSenha\(/);
  assert.match(pagina, /function excluirConta\(/);
});
