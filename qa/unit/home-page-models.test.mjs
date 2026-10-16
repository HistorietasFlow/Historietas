import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL("../../app/lib/home-page-models.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("home-page-models preserva os modelos locais da Home", () => {
  assert.match(
    modulo,
    /export type CapituloLocal = \{[\s\S]*?id: string;[\s\S]*?titulo: string;[\s\S]*?texto: string;[\s\S]*?curtiu: boolean;[\s\S]*?salvo: boolean;[\s\S]*?comentario: string;[\s\S]*?criadoEm: string;[\s\S]*?lido: boolean;[\s\S]*?lidoEm: string;[\s\S]*?publicado\?: boolean;[\s\S]*?\};/,
  );
  assert.match(
    modulo,
    /export type Obra = \{[\s\S]*?id\?: string;[\s\S]*?titulo: string;[\s\S]*?autor: string;[\s\S]*?autorId\?: string;[\s\S]*?capitulos\?: CapituloLocal\[\];[\s\S]*?\};/,
  );
  assert.match(
    modulo,
    /export type ObraLocal = \{[\s\S]*?id: string;[\s\S]*?arquivoObra\?: unknown;[\s\S]*?capitulos: CapituloLocal\[\];[\s\S]*?progressoLeitura: number;[\s\S]*?totalCurtidas: number;[\s\S]*?totalComentarios: number;[\s\S]*?link: string;[\s\S]*?\};/,
  );
});

test("home-page-models preserva as constantes estáticas da Home", () => {
  assert.match(modulo, /export const OBRAS_CATALOGO_HOME: Obra\[\] = \[\];/);
  assert.match(modulo, /export const HERO_INICIAL_HOME = \{/);
  for (const literal of [
    'titulo: "DESCUBRA NOVAS HISTÓRIAS"',
    'autor: "HISTORIETAS"',
    'genero: "Catálogo em formação"',
    'classificacaoIndicativa: "Leitores"',
    'status: "Catálogo aberto"',
    'slug: "inicio"',
    'formato: "Leitura online"',
    'views: ""',
    'likes: ""',
    'comentarios: ""',
    "disponivel: false",
    'link: "/explorar"',
  ]) {
    assert.match(modulo, new RegExp(literal));
  }
  assert.match(
    modulo,
    /O HISTORIETAS está formando seu catálogo inicial\. Explore obras publicadas, acompanhe autores e publique sua história quando quiser\./,
  );
  assert.match(modulo, /tags: \["leitura", "autores", "histórias"\],/);
  assert.match(modulo, /\} as Obra & \{ link: string \};/);
});

test("Home delega modelos e constantes para a fronteira dedicada", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?HERO_INICIAL_HOME,[\s\S]*?OBRAS_CATALOGO_HOME,[\s\S]*?\} from "\.\/lib\/home-page-models";/,
  );
  assert.match(
    pagina,
    /import type \{ ObraLocal \} from "\.\/lib\/home-page-models";/,
  );
  assert.doesNotMatch(pagina, /type CapituloLocal = \{/);
  assert.doesNotMatch(pagina, /type Obra = \{/);
  assert.doesNotMatch(pagina, /type ObraLocal = \{/);
  assert.doesNotMatch(pagina, /const OBRAS_CATALOGO_HOME: Obra\[\] = \[\];/);
  assert.doesNotMatch(pagina, /const HERO_INICIAL_HOME = \{/);
  assert.doesNotMatch(modulo, /useState|useEffect|from "react"|supabase|localStorage/);
  assert.doesNotMatch(modulo, /function\s+/);
});
