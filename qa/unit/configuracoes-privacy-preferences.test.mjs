import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-privacy-preferences.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("preferências de privacidade preservam tipos, defaults e compatibilidade", () => {
  assert.match(
    source,
    /export type PreferenciasPrivacidadeHistorietas = \{/,
  );
  assert.match(
    source,
    /export const preferenciasPrivacidadePadrao: PreferenciasPrivacidadeHistorietas = \{/,
  );

  for (const campo of [
    "perfilPrivado",
    "aprovarNovosSeguidores",
    "visibilidadeObras",
    "visibilidadeSobre",
    "visibilidadeDiario",
    "visibilidadeComunidade",
    "visibilidadeBiblioteca",
    "visibilidadeAtividades",
    "quemPodeComentarDiario",
    "visibilidadeAvaliacaoDiario",
    "mostrarAvaliacaoDiario",
    "permitirAvaliacaoDiario",
    "quemPodeAvaliarDiario",
  ]) {
    assert.match(source, new RegExp(campo));
  }

  assert.match(source, /"historietas-privacidade"/);
  assert.match(source, /"historietas:privacidade-atualizada"/);
  assert.match(source, /registro\.perfilPrivado \?\? registro\.perfil_privado/);
  assert.match(
    source,
    /registro\.visibilidadeAvaliacaoDiario \?\?\s*registro\.visibilidade_avaliacao_diario/,
  );
  assert.match(
    source,
    /registro\.quemPodeAvaliarDiario \?\?\s*registro\.quem_pode_avaliar_diario/,
  );
  assert.match(source, /quemPodeAvaliarDiario !== "ninguem"/);
});

test("preferências de privacidade preservam cache e contratos Supabase", () => {
  assert.match(source, /typeof window === "undefined" \|\| !userId\.trim\(\)/);
  assert.match(source, /localStorage\.getItem\(criarChavePrivacidadeUsuario\(userId\)\)/);
  assert.match(source, /localStorage\.setItem\(/);
  assert.match(source, /new CustomEvent\(PRIVACIDADE_ATUALIZADA_EVENT/);
  assert.match(source, /supabase\s*\.from\("preferencias_privacidade"\)/);
  assert.match(source, /\.eq\("user_id", userIdLimpo\)/);
  assert.match(source, /\.maybeSingle\(\)/);
  assert.match(source, /\.upsert\(/);
  assert.match(source, /\{ onConflict: "user_id" \}/);
  assert.match(source, /const payloadLegado = \{/);
  assert.match(source, /visibilidade_avaliacao_diario:/);
  assert.match(source, /return \{ ok: false, erro: "Usuário inválido\." \};/);
  assert.match(source, /"Não foi possível salvar a privacidade\."/);
});

test("Configurações consome a fronteira de privacidade sem manter duplicação", () => {
  assert.match(
    page,
    /import \{\s*carregarPreferenciasPrivacidade,\s*preferenciasPrivacidadePadrao,\s*salvarPreferenciasPrivacidade,\s*\} from "\.\/lib\/configuracoes-privacy-preferences";/,
  );
  assert.match(
    page,
    /import type \{\s*PreferenciasPrivacidadeHistorietas,[\s\S]*?\} from "\.\/lib\/configuracoes-privacy-preferences";/,
  );

  for (const declaracao of [
    "function normalizarPreferenciasPrivacidade",
    "function carregarPreferenciasPrivacidadeLocal",
    "function salvarPreferenciasPrivacidadeLocal",
    "async function carregarPreferenciasPrivacidade",
    "async function salvarPreferenciasPrivacidade",
  ]) {
    assert.doesNotMatch(page, new RegExp(declaracao));
  }
});
