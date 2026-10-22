import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modelos = readFileSync(
  new URL("../../app/publicar/lib/publicar-models.ts", import.meta.url),
  "utf8",
);
const opcoes = readFileSync(
  new URL("../../app/publicar/lib/publicar-static-options.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("modelos locais de Publicar preservam contratos de obra, capítulo e arquivo", () => {
  assert.match(modelos, /export type CapituloLocal = \{/);
  assert.match(modelos, /export type ArquivoObraLocal = \{/);
  assert.match(modelos, /export type ObraLocal = \{/);
  assert.match(
    modelos,
    /export type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;/,
  );
  assert.match(modelos, /export type ObraSalva = Partial<ObraLocal> & \{/);
  assert.match(modelos, /export type ArquivoStoragePublicar = \{/);

  for (const campo of [
    "autorId?: string;",
    "avisosConteudo: AvisoConteudo18[];",
    "arquivoObra?: ArquivoObraLocal | null;",
    "capitulos: CapituloLocal[];",
    "progressoLeitura: number;",
    "totalCurtidas: number;",
    "totalComentarios: number;",
    "totalSalvos: number;",
    "totalLidos: number;",
    'bucket: "capas-obras" | "arquivos-obras";',
  ]) {
    assert.ok(modelos.includes(campo), "campo preservado: " + campo);
  }

  assert.doesNotMatch(modelos, /useState|useEffect|supabase|localStorage|function /);
});

test("opções estáticas de Publicar preservam limites, MIME, formatos e classificações", () => {
  for (const constante of [
    "STORAGE_KEY",
    "FILE_BACKUP_STORAGE_KEY",
    "TAMANHO_MAXIMO_CAPA",
    "TAMANHO_MAXIMO_ARQUIVO_TEXTO",
    "TAMANHO_MAXIMO_ARQUIVO_OBRA",
    "EXTENSOES_IMAGEM_ACEITAS",
    "TIPOS_MIME_IMAGEM_ACEITOS",
    "TIPOS_MIME_TEXTO_ACEITOS",
    "TIPOS_MIME_PDF_ACEITOS",
    "OUTRO_FORMATO_VALUE",
    "OUTRO_GENERO_VALUE",
    "OUTRA_TAG_VALUE",
    "LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO",
    "LIMITE_CARACTERES_TAG_PERSONALIZADA",
    "LIMITE_TAGS_OBRA",
    "OPCOES_FORMATO_OBRA",
    "OPCOES_GENERO_OBRA",
    "OPCOES_TAGS_OBRA",
    "CLASSIFICACOES_INDICATIVAS_OBRA",
  ]) {
    assert.ok(opcoes.includes("export const " + constante));
  }

  for (const literal of [
    '"historietas-obras"',
    '"historietas-arquivos-obras-backup"',
    '"__outro_formato__"',
    '"__outro_genero__"',
    '"__outra_tag__"',
    '"application/pdf"',
    '"text/markdown"',
    '"Mangá"',
    '"Ficção"',
    '"Super-herói"',
    '"18+"',
  ]) {
    assert.ok(opcoes.includes(literal), "literal preservado: " + literal);
  }

  assert.match(opcoes, /LIMITES_BYTES_STORAGE\["capas-obras"\]/);
  assert.match(opcoes, /LIMITES_BYTES_STORAGE\["arquivos-obras"\]/);
  assert.doesNotMatch(opcoes, /useState|useEffect|supabase|localStorage|function /);
});

test("Publicar delega modelos e opções estáticas às fronteiras extraídas", () => {
  assert.match(pagina, /from "\.\/lib\/publicar-models";/);
  assert.match(pagina, /from "\.\/lib\/publicar-static-options";/);

  for (const declaracao of [
    "type CapituloLocal =",
    "type ArquivoObraLocal =",
    "type ObraLocal =",
    "type CapituloSalvo =",
    "type ObraSalva =",
    "type ArquivoStoragePublicar =",
    "const STORAGE_KEY =",
    "const OPCOES_FORMATO_OBRA =",
    "const OPCOES_GENERO_OBRA =",
    "const OPCOES_TAGS_OBRA =",
    "const CLASSIFICACOES_INDICATIVAS_OBRA =",
  ]) {
    assert.equal(pagina.includes(declaracao), false, "declaração removida: " + declaracao);
  }

  assert.match(pagina, /const TEXTOS_PUBLICAR = \{/);
  assert.match(pagina, /function salvarObra\(/);
  assert.match(pagina, /supabase\.storage/);
});
