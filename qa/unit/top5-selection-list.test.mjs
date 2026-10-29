import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const modulePath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-selection-list.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega as operações puras da lista selecionada", async () => {
  const [source, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  for (const text of [
    "export function removerIdSelecionadoTop5",
    "export function moverIdSelecionadoTop5",
    "idsAtuais.filter((id) => id !== chave)",
    "idsAtuais.indexOf(chave)",
    "const novoIndice = indiceAtual + direcao;",
    "indiceAtual < 0",
    "novoIndice < 0",
    "novoIndice >= idsAtuais.length",
    "return idsAtuais;",
    "const novaLista = [...idsAtuais];",
    "novaLista.splice(indiceAtual, 1)",
    "novaLista.splice(novoIndice, 0, item)",
  ]) assert.ok(source.includes(text));

  assert.match(page, /removerIdSelecionadoTop5/);
  assert.match(page, /moverIdSelecionadoTop5/);
  assert.match(page, /function removerSelecionadaTop5/);
  assert.match(page, /function moverSelecionadaTop5/);
  assert.match(page, /setMensagem\(""\)/);
  assert.match(page, /function alternarObraTop5/);
  assert.match(page, /function salvarEscolhasTop5/);
});
