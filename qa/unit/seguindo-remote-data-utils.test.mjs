import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";

const source = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-remote-data-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const carregador = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

test("consultas sociais preservam contexto e não carregam solicitações privadas de outro perfil", async () => {
  for (const perfilSocialId of ["", "A", "B"]) {
    const calls = [];
    const query = (name, result) => async (...args) => {calls.push([name, ...args]); return result;};
    const {carregarDadosRemotosSeguindo} = loadApplicationModule("app/seguindo/lib/seguindo-remote-data-utils.ts", {
      "./seguindo-work-loader": {carregarSeguindoSupabase: query("obras", {obras: []})},
      "./seguindo-social-query-utils": {
        carregarUsuariosSeguidosSupabase: query("seguidos", [{id: "seguido"}]),
        carregarUsuariosSeguidoresSupabase: query("seguidores", [{id: "seguidor"}]),
        carregarSolicitacoesSeguidoresSupabase: query("recebidas", [{id: "pendente"}]),
        carregarIdsSolicitacoesEnviadasSupabase: query("enviadas", ["destinatario"]),
      },
    });
    const result = await carregarDadosRemotosSeguindo({obrasLocais: [], obrasSeguidasLocais: ["local"],
      obrasFavoritasLocais: [], obrasConcluidasLocais: [], perfilSocialId, usuarioLogadoId: "A"});
    const proprio = perfilSocialId !== "B";
    assert.deepEqual(calls.filter(call => call[0] !== "obras"), [
      ["seguidos", perfilSocialId || "A"], ["seguidores", perfilSocialId || "A"],
      ...(proprio ? [["recebidas", "A"], ["enviadas", "A"]] : []),
    ]);
    assert.deepEqual(calls[0][2], perfilSocialId ? [] : ["local"]);
    assert.deepEqual(result.solicitacoesEnviadasSupabase, proprio ? ["destinatario"] : []);
    assert.deepEqual(result.solicitacoesSeguidoresSupabase, proprio ? [{id: "pendente"}] : []);
  }
});

test("carregamento remoto preserva perfil social e consultas paralelas", () => {
  assert.match(
    source,
    /const perfilIdParaListaSocial = perfilSocialId \|\| usuarioLogadoId;/,
  );
  assert.match(
    source,
    /const listaSocialEhDoUsuarioLogado =\s*!perfilSocialId \|\| perfilSocialId === usuarioLogadoId;/,
  );
  assert.match(source, /await Promise\.all\(\[/);
  assert.match(source, /carregarSeguindoSupabase\(/);
  assert.match(
    source,
    /perfilSocialId \? \[\] : obrasSeguidasLocais/,
  );
  assert.match(
    source,
    /carregarUsuariosSeguidosSupabase\(perfilIdParaListaSocial\)/,
  );
  assert.match(
    source,
    /carregarUsuariosSeguidoresSupabase\(perfilIdParaListaSocial\)/,
  );
  assert.match(
    source,
    /listaSocialEhDoUsuarioLogado[\s\S]*?carregarSolicitacoesSeguidoresSupabase\(usuarioLogadoId\)/,
  );
  assert.match(
    source,
    /listaSocialEhDoUsuarioLogado[\s\S]*?carregarIdsSolicitacoesEnviadasSupabase\(usuarioLogadoId\)/,
  );
});

test("carregador principal delega o bloco remoto ao helper agregado", () => {
  assert.match(
    carregador,
    /carregarDadosRemotosSeguindo,[\s\S]*?prepararDadosRemotosSeguindo,[\s\S]*?from "\.\.\/lib\/seguindo-remote-data-utils";/,
  );
  assert.match(
    carregador,
    /await carregarDadosRemotosSeguindo\(\{[\s\S]*?obrasLocais: obrasNormalizadas,[\s\S]*?obrasSeguidasLocais: seguindoNormalizado,[\s\S]*?obrasFavoritasLocais: favoritasNormalizadas,[\s\S]*?obrasConcluidasLocais: concluidasNormalizadas,[\s\S]*?perfilSocialId,[\s\S]*?usuarioLogadoId,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /carregarSeguindoSupabase/);
  assert.doesNotMatch(pagina, /carregarUsuariosSeguidosSupabase/);
  assert.doesNotMatch(pagina, /carregarUsuariosSeguidoresSupabase/);
  assert.doesNotMatch(pagina, /carregarSolicitacoesSeguidoresSupabase/);
  assert.doesNotMatch(pagina, /carregarIdsSolicitacoesEnviadasSupabase/);
});

test("preparação remota preserva normalização e atividades", () => {
  assert.match(
    source,
    /const obras = dadosSupabase\.obras\.map\(\(obra, index\) =>[\s\S]*?normalizarObraSalva\(/,
  );
  assert.match(
    source,
    /const atividades = await carregarAtividadesSeguindoSupabase\([\s\S]*?usuariosSeguidosSupabase,[\s\S]*?obras,[\s\S]*?usuarioLogadoId/,
  );
  for (const campo of [
    "obrasSeguidas",
    "obrasFavoritas",
    "obrasConcluidas",
  ]) {
    assert.match(
      source,
      new RegExp(`${campo}: normalizarListaTexto\\(dadosSupabase\\.${campo}\\)`),
    );
  }

  assert.match(
    carregador,
    /const dadosRemotosPreparados = await prepararDadosRemotosSeguindo\(\{[\s\S]*?dadosSupabase,[\s\S]*?usuariosSeguidosSupabase,[\s\S]*?usuarioLogadoId,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /normalizarObraSalva/);
  assert.doesNotMatch(pagina, /carregarAtividadesSeguindoSupabase/);
});

