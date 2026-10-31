import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/ajuda/hooks/use-ajuda-technical-support.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("o hook preserva o lifecycle, a leitura e a mutation do suporte técnico", () => {
  [
    "export function useAjudaTechnicalSupport",
    "useEffect(() => {",
    "let cancelado = false",
    "window.location.href",
    "supabase.auth.getUser()",
    '"listar_meus_problemas_tecnicos"',
    "p_limite: 20",
    "normalizarProblemasTecnicos(",
    "async function enviarProblemaTecnico",
    "event.preventDefault()",
    "titulo.length < 8",
    "descricao.length < 20",
    'supabase.rpc("criar_problema_tecnico"',
    "p_categoria: categoriaProblema",
    "p_pagina_url: paginaProblema.trim()",
    "navigator.userAgent",
    "window.innerWidth",
    "await carregarChamadosTecnicos()",
    "setEnviandoProblema(false)",
    "normalizarCategoriaProblemaTecnico(",
  ].forEach((contract) => assert.ok(hook.includes(contract), contract));
});

test("a página permanece responsável pela composição visual do suporte", () => {
  assert.match(
    page,
    /useAjudaTechnicalSupport\(language\)/,
  );
  [
    "AjudaSupportMessages",
    "AjudaTechnicalSupportForm",
    "AjudaSupportTickets",
    "usuarioAutenticado &&",
    "onSubmit={enviarProblemaTecnico}",
  ].forEach((contract) => assert.ok(page.includes(contract), contract));
  [
    "supabase",
    "useEffect",
    "async function carregarChamadosTecnicos",
    "async function enviarProblemaTecnico",
  ].forEach((contract) => assert.ok(!page.includes(contract), contract));
});
