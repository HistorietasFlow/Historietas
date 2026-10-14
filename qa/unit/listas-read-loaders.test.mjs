import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const interactions = readFileSync(
  new URL("../../app/listas/lib/listas-diary-interactions-loader.ts", import.meta.url),
  "utf8",
);
const profileLoader = readFileSync(
  new URL("../../app/listas/lib/listas-profile-loader.ts", import.meta.url),
  "utf8",
);

test("Listas delega os dois carregadores de leitura sem reintroduzir mutações", () => {
  for (const helper of [
    "carregarInteracoesAnotacoesListas",
    "carregarListasDoPerfil",
  ]) {
    assert.match(page, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
    assert.doesNotMatch(page, new RegExp(`async function ${helper}\\(`));
  }

  assert.match(interactions, /\.from\("profiles"\)[\s\S]*?\.select\("id,user_id,nome,username,avatar_url"\)[\s\S]*?\.in\(coluna, ids\)/);
  assert.match(interactions, /export async function carregarPerfisComentariosAnotacoesListas\(/);
  assert.match(interactions, /\.from\("diario_anotacao_curtidas"\)[\s\S]*?\.select\("id,anotacao_id,user_id"\)[\s\S]*?\.limit\(2000\)/);
  assert.match(interactions, /\.from\("diario_anotacao_comentarios"\)[\s\S]*?\.select\([\s\S]*?"id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em"[\s\S]*?\.order\("criado_em", \{ ascending: true \}\)[\s\S]*?\.limit\(2000\)/);
  assert.match(interactions, /\.from\("diario_comentario_curtidas"\)[\s\S]*?\.select\("comentario_id,user_id"\)[\s\S]*?\.limit\(4000\)/);

  assert.equal(
    (profileLoader.match(/carregarRegistrosUsuario\(/g) || []).length,
    6,
  );
  assert.match(profileLoader, /\.from\("capitulos"\)[\s\S]*?\.select\("id,obra_id"\)[\s\S]*?\.in\("id", capituloIdsSemObra\)[\s\S]*?\.limit\(capituloIdsSemObra.length\)/);
  assert.match(profileLoader, /proprioPerfil\s*\? carregarListaIdsListas/);
  assert.match(profileLoader, /const anotacoesVisiveis = \[\.\.\.anotacoesLocais, \.\.\.anotacoes\]/);
  assert.match(profileLoader, /new Set\([\s\S]*?registrosVisiveis[\s\S]*?pegarTexto\(registro\.obra_id\)/);
  assert.match(profileLoader, /montarListasPerfilEstado</);
  assert.doesNotMatch(profileLoader, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
});

test("contratos preservam deduplicação, fallback de perfis e interações iniciais", () => {
  assert.match(
    interactions,
    /new Set\(userIds\.map\(\(id\) => id\.trim\(\)\)\.filter\(Boolean\)\)/,
  );
  assert.match(interactions, /for \(const coluna of \["user_id", "id"\] as const\)/);
  assert.match(interactions, /nome:[\s\S]*?pegarTexto\(registro\.nome\)[\s\S]*?pegarTexto\(registro\.username\)[\s\S]*?"Leitor"/);
  assert.match(interactions, /estado\[id\] = criarInteracaoAnotacaoListasVazia\(\)/);
  assert.match(interactions, /if \(pegarTexto\(registro\.user_id\) === usuarioAtualId\)[\s\S]*?interacao\.curtiu = true/);
  assert.match(interactions, /parentId: pegarTexto\(registro\.parent_id\)/);
  assert.match(interactions, /curtidas: curtidasPorComentario\.get\(id\) \|\| \[\]/);
});

test("orquestrador preserva fallback de capítulo, storage próprio e carregamento final", () => {
  assert.match(profileLoader, /let obraIdPorCapituloSemObra = new Map<string, string>\(\)/);
  assert.match(profileLoader, /catch \{[\s\S]*?Mantém os registros originais caso não seja possível resolver o capítulo\./);
  assert.match(profileLoader, /const obrasLocais = proprioPerfil \? carregarObrasLocaisListas\(userId\) : \[\]/);
  assert.match(profileLoader, /const anotacoesLocais = proprioPerfil[\s\S]*?carregarAnotacoesLocaisListas\(userId\)[\s\S]*?: \[\]/);
  assert.match(profileLoader, /idsObrasRemotos\.length > 0[\s\S]*?carregarObrasPublicadas\(idsObrasRemotos\)[\s\S]*?: await carregarObrasPublicadas\(\[\]\)/);
});
