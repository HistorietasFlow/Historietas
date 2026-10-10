import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega o carregamento remoto do Diário", () => {
  assert.match(
    pagina,
    /import \{ carregarDiarioPerfilSupabase \} from "\.\/lib\/profile-diary-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarDiarioPerfilSupabase\(/);
  assert.match(source, /export async function carregarDiarioPerfilSupabase\(/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});

test("preserva as seis coleções remotas e a resolução de capítulos sem obra", () => {
  for (const tabela of [
    "seguindo_obras",
    "favoritos",
    "concluidas",
    "progresso_leitura",
    "obra_avaliacoes",
    "diario_atividades",
  ]) {
    assert.match(
      source,
      new RegExp(`carregarRegistrosDiarioPerfil\\("${tabela}", userId\\)`),
    );
  }
  assert.match(source, /\.from\("capitulos"\)/);
  assert.match(source, /\.select\("id,obra_id"\)/);
  assert.match(source, /\.in\("id", capituloIdsSemObra\)/);
});

test("preserva obras faltantes, classificação e regras de privacidade", () => {
  assert.match(
    source,
    /carregarObrasPublicadasPorIdsSupabase\(\s*idsObrasFaltantes,\s*\)/,
  );
  assert.match(source, /!ehClassificacao18\(obra\.classificacaoIndicativa\)/);
  assert.match(
    source,
    /registroDiarioPodeAparecer\(registro, incluirItensDoDiario, "privado"\)/,
  );
  assert.match(
    source,
    /colecaoTemObraPerfilBiblioteca\(obrasConcluidasIdsLocais, obra\)/,
  );
});

test("preserva a montagem final das seções do Diário", () => {
  for (const chave of [
    "lendoAgora",
    "queroLer",
    "favoritas",
    "concluidas: concluidasItens",
    "avaliacoes: avaliacoesItens",
    "reviews",
    "atividades",
  ]) {
    assert.equal(source.includes(chave), true);
  }
  assert.match(source, /\.slice\(0, 12\)/);
});
