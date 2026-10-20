import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const derived = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-derived-content.ts", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-list-counts.ts", import.meta.url), "utf8");

test("totais preservam inclusão condicional de autores e solicitações", () => {
  assert.match(derived, /calcularTotaisSeguindo\(\{/);
  assert.match(helper, /visualizandoListaSocialDoPerfil \? 0 : autoresBase\.length/);
  assert.match(helper, /listaSocialEhDoUsuarioLogado \? solicitacoesSeguidores\.length : 0/);
  assert.match(helper, /usuariosFiltrados\.length \+ solicitacoesSeguidoresFiltradas\.length/);
  assert.match(helper, /visualizandoListaSocialDoPerfil \? 0 : autoresFiltrados\.length/);
  assert.match(helper, /return \{ totalDisponivelGeral, totalSemFiltros, totalSeguindo \}/);
});
