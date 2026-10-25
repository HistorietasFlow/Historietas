import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const messageSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-delete-message.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(messageSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarMensagemConfirmacaoExclusaoCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("mensagem de exclusão de capítulo preserva título seguro e textos por idioma", () => {
  assert.equal(
    criarMensagemConfirmacaoExclusaoCapitulo("  Capítulo final  ", "en"),
    'Delete "Capítulo final" permanently? This action cannot be undone.',
  );
  assert.equal(
    criarMensagemConfirmacaoExclusaoCapitulo("Capítulo final", "es"),
    '¿Eliminar "Capítulo final" permanentemente? Esta acción no se puede deshacer.',
  );
  assert.equal(
    criarMensagemConfirmacaoExclusaoCapitulo("Capítulo final", "pt-BR"),
    'Excluir "Capítulo final" permanentemente? Esta ação não pode ser desfeita.',
  );
  assert.equal(
    criarMensagemConfirmacaoExclusaoCapitulo("", "pt-BR"),
    'Excluir "Capítulo" permanentemente? Esta ação não pode ser desfeita.',
  );
  assert.equal(
    criarMensagemConfirmacaoExclusaoCapitulo("   ", "pt-BR"),
    'Excluir "Capítulo" permanentemente? Esta ação não pode ser desfeita.',
  );
});

test("Editar Capítulo delega somente a mensagem pura de confirmação de exclusão", () => {
  assert.match(
    messageSource,
    /import type \{ HistorietasLanguage \} from "\.\.\/\.\.\/\.\.\/lib\/i18n";/,
  );
  assert.match(
    messageSource,
    /const tituloSeguro =\s*tituloCapitulo\.trim\(\) \|\| "Capítulo";/,
  );
  assert.match(
    pageSource,
    /import \{ criarMensagemConfirmacaoExclusaoCapitulo \} from "\.\/lib\/editar-capitulo-delete-message";/,
  );
  assert.doesNotMatch(pageSource, /function criarMensagemConfirmacaoExclusaoCapitulo\(/);
  assert.match(
    pageSource,
    /async function excluirCapitulo\(\) \{[\s\S]*?window\.confirm\(\s*criarMensagemConfirmacaoExclusaoCapitulo\(\s*capituloAtual\.titulo,\s*language\s*\)/,
  );
  assert.doesNotMatch(messageSource, /supabase|localStorage|useState|useEffect|router|<\w+/);
});
