import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modelos = readFileSync(
  new URL("../../app/em-alta/lib/em-alta-models.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const traducoes = readFileSync(
  new URL("../../app/em-alta/lib/em-alta-translations.ts", import.meta.url),
  "utf8",
);

test("modelos de Em Alta preservam os contratos locais e Supabase", () => {
  for (const tipo of [
    "CapituloLocal",
    "ArquivoObraLocal",
    "ObraLocal",
    "SupabaseObraRow",
    "SupabaseCapituloRow",
    "SupabaseProgressoLeituraEmAltaRow",
    "SupabaseProfileAutorRankingRow",
    "AvaliacaoRankingObra",
    "ObraRanking",
    "AutorRanking",
    "TipoRanking",
  ]) {
    assert.match(modelos, new RegExp(`export type ${tipo}\\b`));
  }

  assert.match(
    modelos,
    /export type ObraLocal = \{[\s\S]*?id: string;[\s\S]*?titulo: string;[\s\S]*?autor: string;[\s\S]*?autorId\?: string;[\s\S]*?autorAvatarRanking\?: string;[\s\S]*?capitulos: CapituloLocal\[\];[\s\S]*?arquivoObra: ArquivoObraLocal \| null;[\s\S]*?totalCurtidasRanking\?: number;[\s\S]*?totalComentariosRanking\?: number;[\s\S]*?totalSalvosRanking\?: number;[\s\S]*?totalViewsRanking\?: number;[\s\S]*?totalSeguidoresRanking\?: number;[\s\S]*?totalSeguidoresAutorRanking\?: number;[\s\S]*?totalAvaliacoesRanking\?: number;[\s\S]*?mediaAvaliacoesRanking\?: number;[\s\S]*?\};/,
  );

  assert.match(
    modelos,
    /export type SupabaseObraRow = \{[\s\S]*?user_id: string \| null;[\s\S]*?classificacao_indicativa: string \| null;[\s\S]*?arquivo_tamanho: number \| null;[\s\S]*?criada_em: string \| null;[\s\S]*?atualizado_em: string \| null;[\s\S]*?\};/,
  );
  assert.match(
    modelos,
    /export type SupabaseCapituloRow = \{[\s\S]*?obra_id: string;[\s\S]*?user_id: string \| null;[\s\S]*?criado_em: string \| null;[\s\S]*?atualizado_em: string \| null;[\s\S]*?\};/,
  );
  assert.match(
    modelos,
    /export type SupabaseProgressoLeituraEmAltaRow = \{[\s\S]*?obra_id: string \| null;[\s\S]*?capitulo_id: string \| null;[\s\S]*?atualizado_em: string \| null;[\s\S]*?\};/,
  );
  assert.match(
    modelos,
    /export type SupabaseProfileAutorRankingRow = \{[\s\S]*?user_id: string \| null;[\s\S]*?avatar_url: string \| null;[\s\S]*?\};/,
  );

  assert.match(
    modelos,
    /export type ObraRanking = \{[\s\S]*?storageId: string;[\s\S]*?tipo: "local";[\s\S]*?pontuacao: number;[\s\S]*?criadaEmTimestamp: number;[\s\S]*?\};/,
  );
  assert.match(
    modelos,
    /export type AutorRanking = \{[\s\S]*?obras: number;[\s\S]*?capitulos: number;[\s\S]*?seguidores: number;[\s\S]*?views: number;[\s\S]*?curtidas: number;[\s\S]*?comentarios: number;[\s\S]*?avaliacoes: number;[\s\S]*?mediaAvaliacao: number;[\s\S]*?pontuacao: number;[\s\S]*?\};/,
  );
  assert.match(
    modelos,
    /export type TipoRanking =\s*\| "geral"\s*\| "lidas"\s*\| "curtidas"\s*\| "comentadas"\s*\| "salvas"\s*\| "recentes"\s*\| "capitulos";/,
  );
});

test("Em Alta importa os modelos sem manter contratos duplicados", () => {
  assert.match(pagina, /import type \{[\s\S]*?CapituloLocal,[\s\S]*?ArquivoObraLocal,[\s\S]*?ObraLocal,[\s\S]*?SupabaseObraRow,[\s\S]*?SupabaseCapituloRow,[\s\S]*?SupabaseProgressoLeituraEmAltaRow,[\s\S]*?SupabaseProfileAutorRankingRow,[\s\S]*?AvaliacaoRankingObra,[\s\S]*?ObraRanking,[\s\S]*?AutorRanking,[\s\S]*?TipoRanking,[\s\S]*?\} from "\.\/lib\/em-alta-models";/);

  for (const tipo of [
    "CapituloLocal",
    "ArquivoObraLocal",
    "ObraLocal",
    "SupabaseObraRow",
    "SupabaseCapituloRow",
    "SupabaseProgressoLeituraEmAltaRow",
    "SupabaseProfileAutorRankingRow",
    "AvaliacaoRankingObra",
    "ObraRanking",
    "AutorRanking",
    "TipoRanking",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`type ${tipo}\\s*=`));
  }

  assert.match(traducoes, /type TraducaoEmAlta = \{/);
});

test("módulo de modelos permanece exclusivamente estático", () => {
  assert.doesNotMatch(modelos, /from ["']react["']/i);
  assert.doesNotMatch(modelos, /\buse[A-Z]\w*\b/);
  assert.doesNotMatch(modelos, /from ["'][^"']*supabase/i);
  assert.doesNotMatch(modelos, /localStorage/);
  assert.doesNotMatch(modelos, /\b(function|const|let|var)\b/);
});
