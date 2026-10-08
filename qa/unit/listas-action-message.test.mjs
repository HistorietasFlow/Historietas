import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-action-message.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);

test("useListasActionMessage preserva o lifecycle da mensagem de ação", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /const \[mensagemAcao, setMensagemAcao\] = useState\(""\);/);
  assert.match(
    hook,
    /useEffect\(\(\) => \{\s*if \(!mensagemAcao\) \{\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const timer = window\.setTimeout\(\(\) => setMensagemAcao\(""\), 2600\);/,
  );
  assert.match(hook, /return \(\) => window\.clearTimeout\(timer\);/);
  assert.match(hook, /\}, \[mensagemAcao\]\);/);
  assert.match(
    hook,
    /return \{\s*mensagemAcao,\s*setMensagemAcao,\s*\};/,
  );
  assert.doesNotMatch(hook, /setInterval|mostrarMensagem|limparMensagem/);
});

test("Listas delega somente o lifecycle e mantém mensagens e status locais", () => {
  assert.match(
    pagina,
    /import \{ useListasActionMessage \} from "\.\/hooks\/use-listas-action-message";/,
  );
  assert.match(
    pagina,
    /const \{ mensagemAcao, setMensagemAcao \} = useListasActionMessage\(\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[mensagemAcao, setMensagemAcao\] = useState\(""\);/,
  );
  assert.doesNotMatch(pagina, /setTimeout\(\(\) => setMensagemAcao\(""\), 2600\)/);

  [
    "Você só pode editar anotações da sua própria lista.",
    "Anotação salva.",
    "Anotação removida.",
    "Não foi possível identificar este conteúdo.",
    "Você não pode denunciar seu próprio conteúdo.",
    "As curtidas estão desativadas nesta anotação.",
    "Você não tem permissão para comentar nesta anotação.",
    "Os comentários desta anotação não estão disponíveis.",
    "Denúncia enviada para análise.",
  ].forEach((texto) => assert.match(pagina, new RegExp(texto)));

  assert.match(
    pagina,
    /\{mensagemAcao && \(\s*<div role="status" style=\{actionMessageStyle\}>\s*\{mensagemAcao\}/,
  );
  assert.match(pagina, /const actionMessageStyle: CSSProperties =/);
  assert.match(pagina, /await supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /async function salvarAnotacaoListas\(/);
  assert.match(pagina, /async function enviarComentarioAnotacaoListas\(/);
});
