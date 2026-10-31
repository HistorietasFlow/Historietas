import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-support-messages.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("as mensagens do suporte preservam status, erro e login", () => {
  assert.match(componente, /export function AjudaSupportMessages/);
  assert.match(componente, /\{mensagem \? \(/);
  assert.match(componente, /role="status"/);
  assert.match(componente, /supportSuccessStyle/);
  assert.match(componente, /\{erro \? \(/);
  assert.match(componente, /role="alert"/);
  assert.match(componente, /supportErrorStyle/);
  assert.match(componente, /usuarioAutenticado === false/);
  assert.match(componente, /Você precisa entrar na conta para enviar e acompanhar chamados\./);
  assert.match(componente, /You need to sign in to submit and track tickets\./);
  assert.match(componente, /Debes iniciar sesión para enviar y seguir casos\./);
  assert.match(componente, /href="\/login\?redirectTo=%2Fajuda%23problema-tecnico"/);
  assert.match(componente, /pt: "Entrar"/);
  assert.match(componente, /en: "Sign in"/);
  assert.match(componente, /es: "Iniciar sesión"/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página consome o estado de mensagens do hook de suporte", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaSupportMessages,\s*\} from "\.\/components\/ajuda-support-messages";/,
  );
  assert.match(
    pagina,
    /import \{ useAjudaTechnicalSupport \} from "\.\/hooks\/use-ajuda-technical-support";/,
  );
  assert.match(
    pagina,
    /mensagemProblema,[\s\S]*?erroProblema,[\s\S]*?usuarioAutenticado,[\s\S]*?= useAjudaTechnicalSupport\(language\);/,
  );
  assert.match(pagina, /<AjudaSupportMessages[\s\S]*?mensagem=\{mensagemProblema\}[\s\S]*?erro=\{erroProblema\}[\s\S]*?usuarioAutenticado=\{usuarioAutenticado\}/);
  assert.doesNotMatch(pagina, /supportLoginNoticeStyle/);
});
