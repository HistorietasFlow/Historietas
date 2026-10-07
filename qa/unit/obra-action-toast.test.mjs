import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const toast = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-action-toast.tsx",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("toast preserva apresentação e acessibilidade da mensagem", () => {
  for (const trecho of [
    "mensagem: string;",
    "if (!mensagem)",
    "return null;",
    "obraActionToastStyle",
    'role="status"',
    'aria-live="polite"',
    "{mensagem}",
  ]) {
    assert.ok(toast.includes(trecho), trecho);
  }
});

test("cliente preserva estado e expiração temporal da mensagem", () => {
  for (const trecho of [
    "<ObraActionToast mensagem={mensagemAcao} />",
    'const [mensagemAcao, setMensagemAcao] = useState("");',
    "if (!mensagemAcao)",
    "window.setTimeout",
    "}, 3000);",
    'setMensagemAcao("");',
    "window.clearTimeout(timerMensagemAcao);",
  ]) {
    assert.ok(cliente.includes(trecho), trecho);
  }
});
