import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const camposBasicos = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-basic-fields.ts", import.meta.url),
  "utf8",
);
const tags = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-tags.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("usePublicarBasicFields preserva campos e limpeza de erro", () => {
  assert.match(camposBasicos, /^"use client";/);
  assert.match(camposBasicos, /const \[titulo, setTitulo\] = useState\(""\);/);
  assert.match(camposBasicos, /const \[autor, setAutor\] = useState\(""\);/);
  assert.match(camposBasicos, /const \[sinopse, setSinopse\] = useState\(""\);/);
  assert.match(camposBasicos, /function atualizarTitulo\(valor: string\)[\s\S]*?setTitulo\(valor\)[\s\S]*?setErro\(""\);/);
  assert.match(camposBasicos, /function atualizarAutor\(valor: string\)[\s\S]*?setAutor\(valor\)[\s\S]*?setErro\(""\);/);
  assert.match(camposBasicos, /function atualizarSinopse\(valor: string\)[\s\S]*?setSinopse\(valor\)[\s\S]*?setErro\(""\);/);
  assert.match(camposBasicos, /setAutor,/);
  assert.doesNotMatch(camposBasicos, /supabase|localStorage|useEffect|window\.|document\./);
});

test("usePublicarTags preserva normalização, limites e seleção", () => {
  assert.match(tags, /^"use client";/);
  assert.match(tags, /const \[tags, setTags\] = useState\(""\);/);
  assert.match(tags, /const \[tagPersonalizada, setTagPersonalizada\] = useState\(""\);/);
  assert.match(tags, /const \[usarTagPersonalizada, setUsarTagPersonalizada\] = useState\(false\);/);
  assert.match(tags, /tags[\s\S]*?\.split\(","\)[\s\S]*?\.filter\(Boolean\)[\s\S]*?\.slice\(0, LIMITE_TAGS_OBRA\)/);
  assert.match(tags, /normalizarTexto\(tagAtual\) === normalizarTexto\(tag\)/);
  assert.match(tags, /limparTextoPersonalizado\([\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA/);
  assert.match(tags, /textoPersonalizadoValido\([\s\S]*?textoLimpo,[\s\S]*?2,[\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA/);
  assert.match(tags, /if \(tag === OUTRA_TAG_VALUE\)/);
  assert.match(tags, /if \(!tag\) \{[\s\S]*?setUsarTagPersonalizada\(false\)[\s\S]*?setTags\(""\)[\s\S]*?setErro\(""\);/);
  assert.doesNotMatch(tags, /supabase|localStorage|useEffect|window\.|document\./);
});

test("Publicar delega apenas estados básicos e tags aos hooks", () => {
  assert.match(pagina, /usePublicarBasicFields\(\{ setErro \}\)/);
  assert.match(pagina, /usePublicarTags\(\{ setErro \}\)/);
  assert.doesNotMatch(pagina, /function atualizarTagPersonalizada\(valor: string\)/);
  assert.doesNotMatch(pagina, /function adicionarTagSelecionada\(tag: string\)/);
  assert.doesNotMatch(pagina, /function atualizarTagSelecionada\(tag: string\)/);
});
