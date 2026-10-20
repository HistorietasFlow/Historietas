import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const normalizadores = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-record-normalizers.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");
const hookInicial = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-initial-load.ts",
    import.meta.url,
  ), "utf8");
const storageUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

test("normalizadores de registros preservam aliases, defaults e merge de obras", () => {
  for (const contrato of [
    "export function normalizarObraSupabase",
    "row.autor ?? row.nome_autor ?? row.autor_nome",
    "row.classificacao_indicativa ?? row.classificacaoIndicativa",
    "export function normalizarCapituloSupabase",
    "row.texto ?? row.conteudo",
    "row.obra_id ?? row.obraId",
    "export function mesclarObrasPorIdSlug",
    "criarSlugBase(obra.titulo)",
    "normalizarTexto(obra.titulo)",
    "curtiu: capituloExistente.curtiu || capitulo.curtiu",
    "progressoLeitura: calcularProgressoLeitura(capitulos)",
    "export function normalizarNotificacaoSupabase",
    "registro.notificacao_id",
    "metadata.notificacao_id",
    "registro.lida === true || registro.lida === \"true\"",
    "solicitacaoId:",
  ]) {
    assert.ok(normalizadores.includes(contrato), `contrato ausente: ${contrato}`);
  }

  assert.doesNotMatch(normalizadores, /from "\.\.\/\.\.\/lib\/supabase\//);
  assert.doesNotMatch(normalizadores, /localStorage|useEffect|useState|from "react"/i);
});

test("página delega ao hook a normalização de registros e IDs locais", () => {
  assert.match(
    hookInicial,
    /from "\.\.\/lib\/notificacoes-record-normalizers";/,
  );
  assert.match(hookInicial, /lerIdsLocalStorage,/);
  assert.match(pagina, /useNotificacoesInitialLoad\(/);

  for (const helper of [
    "normalizarObraSupabase",
    "normalizarCapituloSupabase",
    "mesclarObrasPorIdSlug",
    "normalizarNotificacaoSupabase",
    "lerIdsLocalStorage",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(storageUtils, /export function lerIdsLocalStorage\(/);
  assert.match(storageUtils, /typeof window === "undefined" \|\| !userIdLimpo/);
  assert.match(storageUtils, /JSON\.parse\(texto\)/);
  assert.doesNotMatch(storageUtils, /supabase|useEffect|useState|from "react"/i);
});
