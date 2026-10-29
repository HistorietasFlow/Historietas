import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
const conteudo = await readFile("app/ajuda/lib/ajuda-content.ts", "utf8");

test("catálogos estáticos da Central de Ajuda preservam tipos, textos e ordem", () => {
  assert.equal(
    createHash("sha256").update(conteudo).digest("hex"),
    "4985991a6d07f07eda880926e72ec425c2d3a448bdcbd193c1d013377ff74089",
  );
  for (const contrato of [
    "export type TextoTraduzido",
    "export type CategoriaAjudaId",
    "export type CategoriaAjuda",
    "export type PerguntaAjuda",
    "export type AtalhoAjuda",
    "export type IconName",
    "export const CATEGORIAS_AJUDA",
    "export const PERGUNTAS_AJUDA",
    "export const ATALHOS_AJUDA",
  ]) {
    assert.ok(conteudo.includes(contrato), contrato);
  }

  assert.deepEqual(
    [...conteudo.matchAll(/id: "([^"]+)"/g)].slice(0, 6).map((item) => item[1]),
    ["todos", "conta", "publicacao", "leitura", "comunidade", "privacidade"],
  );
  assert.deepEqual(
    [...conteudo.matchAll(/id: "([^"]+)"/g)].slice(6, 21).map((item) => item[1]),
    ["entrar-conta", "alterar-perfil", "alterar-senha", "publicar-obra", "editar-obra", "capitulos", "biblioteca", "progresso-leitura", "seguir-autores", "notificacoes", "receber-avisos", "comentar", "perfil-privado", "preferencia-local", "backup"],
  );
  assert.deepEqual(
    [...conteudo.matchAll(/href: "([^"]+)"/g)].map((item) => item[1]),
    ["/publicar", "/painel-autor", "/listas", "/notificacoes", "/comunidade", "/configuracoes"],
  );
  assert.equal((conteudo.match(/\bpt:/g) || []).length, 70);
  assert.equal((conteudo.match(/\ben:/g) || []).length, 70);
  assert.equal((conteudo.match(/\bes:/g) || []).length, 70);
});

test("página importa os catálogos sem redefini-los", () => {
  assert.match(pagina, /from "\.\/lib\/ajuda-content"/);
  assert.doesNotMatch(pagina, /type CategoriaAjudaId =/);
  assert.doesNotMatch(pagina, /const CATEGORIAS_AJUDA/);
  assert.doesNotMatch(pagina, /const PERGUNTAS_AJUDA/);
  assert.doesNotMatch(pagina, /const ATALHOS_AJUDA/);
});
