import assert from "node:assert/strict";
import test from "node:test";
import { normalizarHistoriasEmComum } from "../../app/perfil-autor/lib/profile-common-stories-data.mjs";

const valido = Object.freeze({
  obra_id: "cd200000-0000-4000-8000-000000000001",
  slug: "obra-fantasia",
  titulo: "Uma história",
  autor: "Autora",
  capa_url: "https://exemplo.test/capa.webp",
});

test("valida e normaliza obra pública retornada pela RPC", () => {
  assert.deepEqual(normalizarHistoriasEmComum([valido]), [{
    id: valido.obra_id,
    href: "/obra/obra-fantasia",
    titulo: "Uma história",
    autor: "Autora",
    capa: "https://exemplo.test/capa.webp",
  }]);
});

test("nenhum resultado e falha de formato não revelam metadados", () => {
  assert.deepEqual(normalizarHistoriasEmComum(null), []);
  assert.deepEqual(normalizarHistoriasEmComum({ items: [valido] }), []);
  assert.deepEqual(normalizarHistoriasEmComum([]), []);
});

test("uma linha malformada invalida a página inteira", () => {
  assert.deepEqual(normalizarHistoriasEmComum([valido, { ...valido, obra_id: "segredo" }]), []);
  assert.deepEqual(normalizarHistoriasEmComum([valido, { ...valido, slug: "../../private" }]), []);
  assert.deepEqual(normalizarHistoriasEmComum([valido, { ...valido, titulo: "" }]), []);
});

test("não aceita duplicatas nem respostas acima do teto da RPC", () => {
  assert.deepEqual(normalizarHistoriasEmComum([valido, valido]), []);
  assert.deepEqual(normalizarHistoriasEmComum(Array.from({ length: 21 }, (_, n) => ({
    ...valido,
    obra_id: `cd200000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`,
  }))), []);
});

test("URL de capa insegura é descartada sem descartar a história", () => {
  const [javascript] = normalizarHistoriasEmComum([{ ...valido, capa_url: "javascript:alert(1)" }]);
  assert.equal(javascript.capa, "");
  const [data] = normalizarHistoriasEmComum([{ ...valido, capa_url: "data:image/svg+xml,test" }]);
  assert.equal(data.capa, "");
  const [protocolRelative] = normalizarHistoriasEmComum([{ ...valido, capa_url: "//outro.site/capa.png" }]);
  assert.equal(protocolRelative.capa, "");
});

test("capa opcional não interrompe a listagem", () => {
  const [semCapa] = normalizarHistoriasEmComum([{ ...valido, capa_url: null, autor: null }]);
  assert.equal(semCapa.capa, "");
  assert.equal(semCapa.autor, "");
});


test("IDs duplicados com caixa diferente e protocolos maliciosos são rejeitados", () => {
  assert.deepEqual(normalizarHistoriasEmComum([
    valido,
    { ...valido, obra_id: valido.obra_id.toUpperCase() },
  ]), []);
  assert.deepEqual(normalizarHistoriasEmComum([{ ...valido, slug: "javascript:alert(1)" }]), []);
  assert.deepEqual(normalizarHistoriasEmComum([{ ...valido, slug: "obra?segredo=1" }]), []);
  const [valida] = normalizarHistoriasEmComum([{ ...valido, capa_url: "/capas/obra.webp" }]);
  assert.equal(valida.capa, "/capas/obra.webp");
});
