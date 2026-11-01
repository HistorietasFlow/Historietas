import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modal = readFileSync(
  new URL("../../components/DenunciaModal.tsx", import.meta.url),
  "utf8",
);
const action = readFileSync(
  new URL(
    "../../components/hooks/use-denuncia-submit-action.ts",
    import.meta.url,
  ),
  "utf8",
);

test("modal delega somente o envio da denúncia para a action dedicada", () => {
  assert.match(
    modal,
    /import \{ useDenunciaSubmitAction \} from "\.\/hooks\/use-denuncia-submit-action";/,
  );
  assert.match(
    modal,
    /const \{ enviarDenuncia \} = useDenunciaSubmitAction\(\{[\s\S]*?alvoTipo,[\s\S]*?alvoId,[\s\S]*?motivo,[\s\S]*?descricao,[\s\S]*?setEnviando,[\s\S]*?setErro,[\s\S]*?setEnviado,[\s\S]*?onEnviada,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(modal, /async function enviarDenuncia\(/);
  assert.doesNotMatch(modal, /supabase\.rpc\(/);
  assert.match(modal, /createPortal\(/);
  assert.match(modal, /<form onSubmit=\{enviarDenuncia\}/);
});

test("action preserva validações e as RPCs específicas de cada alvo", () => {
  for (const trecho of [
    "export function useDenunciaSubmitAction",
    "evento.preventDefault();",
    "if (enviando || enviado)",
    "if (!motivo)",
    "const alvoIdLimpo = alvoId.trim();",
    "if (!alvoIdLimpo)",
    'alvoTipo === "perfil"',
    'supabase.rpc("criar_denuncia_perfil", {',
    "p_denunciado_id: alvoIdLimpo",
    "p_perfil_nome: alvoTitulo.trim()",
    "p_perfil_url: alvoUrl.trim()",
    "p_descricao: descricao.trim()",
    'supabase.rpc("criar_denuncia", {',
    "p_alvo_tipo: alvoTipo",
    "p_alvo_id: alvoIdLimpo",
    "p_detalhe: descricao.trim()",
  ]) {
    assert.ok(action.includes(trecho), trecho);
  }
});

test("action preserva mapeamento de erro, resultado e conclusão do envio", () => {
  for (const trecho of [
    'codigo === "23505"',
    'codigo === "42501"',
    'codigo === "22023" || codigo === "23502"',
    "const { data, error } = resposta;",
    "if (error)",
    "const primeiroRegistro = Array.isArray(data) ? data[0] : data;",
    '"denuncia_id" in primeiroRegistro',
    "setEnviado(true);",
    "onEnviada?.(denunciaId);",
    "catch (erroDesconhecido)",
    "finally",
    "setEnviando(false);",
  ]) {
    assert.ok(action.includes(trecho), trecho);
  }
});

test("action não incorpora portal, foco, teclado ou composição visual", () => {
  for (const trecho of [
    "createPortal",
    "useEffect",
    "useRef",
    "addEventListener",
    "onKeyDown",
    "<form",
  ]) {
    assert.doesNotMatch(action, new RegExp(trecho, "i"));
  }
});
