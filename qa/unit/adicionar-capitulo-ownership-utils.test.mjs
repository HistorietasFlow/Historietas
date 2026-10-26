import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-ownership-utils.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { normalizarUsuarioId, obraPertenceAoUsuario, filtrarObrasDoUsuario, atualizarObrasLocaisDoUsuario } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("ownership preserva normalização, filtro, ordem, referências e remoções", () => {
  assert.equal(normalizarUsuarioId(" User@ID "), "user@id"); assert.equal(normalizarUsuarioId(""), "");
  const minha = { id: "a", autorId: " USER ", marca: "minha" }; const outra = { id: "b", autorId: "outra", marca: "outra" }; const semAutor = { id: "c", marca: "sem" };
  assert.equal(obraPertenceAoUsuario(minha, "user"), true); assert.equal(obraPertenceAoUsuario(semAutor, "user"), false); assert.equal(obraPertenceAoUsuario(minha, ""), false);
  const filtradas = filtrarObrasDoUsuario([outra, minha, semAutor], " USER "); assert.deepEqual(filtradas, [minha]); assert.equal(filtradas[0], minha);
  const atualizada = { id: "a", autorId: "user", marca: "nova" }; const antigaMesmoUsuario = { id: "velha", autorId: "user" }; const duplicadaOutro = { id: "a", autorId: "outro" };
  const atuais = [outra, antigaMesmoUsuario, duplicadaOutro]; const resultado = atualizarObrasLocaisDoUsuario(atuais, [atualizada], "user");
  assert.deepEqual(resultado, [atualizada, outra]); assert.equal(resultado[0], atualizada); assert.equal(resultado[1], outra); assert.deepEqual(atuais, [outra, antigaMesmoUsuario, duplicadaOutro]);
});

test("Adicionar Capítulo delega somente ownership", () => {
  for (const nome of ["normalizarUsuarioId", "obraPertenceAoUsuario", "filtrarObrasDoUsuario", "atualizarObrasLocaisDoUsuario"]) assert.doesNotMatch(page, new RegExp(`function ${nome}\\(`));
  assert.match(page, /function carregarObrasLocais\(/); assert.match(page, /function salvarObrasAdicionarCapituloStorage\(/); assert.match(page, /obraPertenceAoUsuario\(/); assert.match(page, /filtrarObrasDoUsuario\(/); assert.equal((page.match(/atualizarObrasLocaisDoUsuario\(/g) || []).length, 2); assert.doesNotMatch(source, /useState|useEffect|localStorage|\.from\(|router|<[a-z]/);
});
