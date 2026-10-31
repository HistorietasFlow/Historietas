import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const contextSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-context-map-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const contextoLoader = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-denuncias-contexto-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);

async function importarModulo(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`
  );
}

async function importarContexto() {
  const profileUtils = await importarModulo(profileSource);
  globalThis.__criarMapaNomesPerfisModeracao =
    profileUtils.criarMapaNomesPerfisModeracao;
  const source = contextSource.replace(
    /import\s+\{[\s\S]*?\}\s+from "\.\/admin-comunidade-profile-utils";/,
    "const criarMapaNomesPerfisModeracao = globalThis.__criarMapaNomesPerfisModeracao;",
  );

  return importarModulo(source);
}

function criarEntradas() {
  const post = { id: " post-1 ", texto: "Post" };
  const comentario = { id: "comentario-1", texto: "Comentário" };
  const comentarioCapitulo = { id: "comentario-capitulo-1" };
  const comentarioObra = { id: "comentario-obra-1" };
  const comentarioDiario = { id: "comentario-diario-1" };
  const anotacao = { id: "anotacao-1" };
  const capitulo = { id: "capitulo-1" };
  const obra = { id: "obra-1" };

  return {
    post,
    comentario,
    comentarioCapitulo,
    comentarioObra,
    comentarioDiario,
    anotacao,
    capitulo,
    obra,
    params: {
      perfis: [{ id: " perfil-1 ", user_id: " usuario-1 ", nome: " Ada " }],
      posts: [post],
      comentarios: [comentario],
      comentariosCapitulos: [comentarioCapitulo],
      comentariosObras: [comentarioObra],
      comentariosDiario: [comentarioDiario],
      diarioAnotacoes: [anotacao],
      capitulos: [capitulo],
      obras: [obra],
    },
  };
}

test("cria os nove mapas, preservando referências e o mapa de nomes de perfis", async () => {
  const { criarMapasContextoModeracao } = await importarContexto();
  const entradas = criarEntradas();
  const resultado = criarMapasContextoModeracao(entradas.params);

  assert.equal(resultado.perfisPorId.get("perfil-1"), "Ada");
  assert.equal(resultado.perfisPorId.get("usuario-1"), "Ada");
  assert.equal(resultado.postsPorId.get(" post-1 "), entradas.post);
  assert.equal(resultado.comentariosPorId.get("comentario-1"), entradas.comentario);
  assert.equal(
    resultado.comentariosCapitulosPorId.get("comentario-capitulo-1"),
    entradas.comentarioCapitulo,
  );
  assert.equal(
    resultado.comentariosObrasPorId.get("comentario-obra-1"),
    entradas.comentarioObra,
  );
  assert.equal(
    resultado.comentariosDiarioPorId.get("comentario-diario-1"),
    entradas.comentarioDiario,
  );
  assert.equal(resultado.diarioAnotacoesPorId.get("anotacao-1"), entradas.anotacao);
  assert.equal(resultado.capitulosPorId.get("capitulo-1"), entradas.capitulo);
  assert.equal(resultado.obrasPorId.get("obra-1"), entradas.obra);
});

test("mapas vazios, entradas duplicadas e arrays de entrada preservam a semântica nativa", async () => {
  const { criarMapasContextoModeracao } = await importarContexto();
  const primeiroPost = { id: "duplicado", texto: "primeiro" };
  const ultimoPost = { id: "duplicado", texto: "último" };
  const params = {
    perfis: [],
    posts: [primeiroPost, ultimoPost],
    comentarios: [],
    comentariosCapitulos: [],
    comentariosObras: [],
    comentariosDiario: [],
    diarioAnotacoes: [],
    capitulos: [],
    obras: [],
  };
  const original = structuredClone(params);
  const resultado = criarMapasContextoModeracao(params);

  assert.equal(resultado.postsPorId.size, 1);
  assert.equal(resultado.postsPorId.get("duplicado"), ultimoPost);
  assert.equal(resultado.perfisPorId.size, 0);
  assert.equal(resultado.comentariosPorId.size, 0);
  assert.equal(resultado.comentariosCapitulosPorId.size, 0);
  assert.equal(resultado.comentariosObrasPorId.size, 0);
  assert.equal(resultado.comentariosDiarioPorId.size, 0);
  assert.equal(resultado.diarioAnotacoesPorId.size, 0);
  assert.equal(resultado.capitulosPorId.size, 0);
  assert.equal(resultado.obrasPorId.size, 0);
  assert.deepEqual(params, original);
});

test("Admin Comunidade delega apenas a criação dos mapas de contexto", () => {
  for (const nome of [
    "perfisPorId",
    "postsPorId",
    "comentariosPorId",
    "comentariosCapitulosPorId",
    "comentariosObrasPorId",
    "comentariosDiarioPorId",
    "diarioAnotacoesPorId",
    "capitulosPorId",
    "obrasPorId",
  ]) {
    assert.doesNotMatch(page, new RegExp(`const ${nome} = new Map`));
  }
  assert.doesNotMatch(page, /criarMapasContextoModeracao\(/);
  assert.doesNotMatch(page, /montarDenunciasComContextoModeracao\(/);
  assert.match(contextoLoader, /criarMapasContextoModeracao\(\{/);
  assert.match(contextoLoader, /montarDenunciasComContextoModeracao\(\{/);
  assert.match(page, /setDenuncias\(/);
  assert.match(page, /setObservacoes\(/);
  assert.match(
    contextSource,
    /criarMapaNomesPerfisModeracao\(perfis\)/,
  );
  assert.doesNotMatch(
    contextSource,
    /useState|useEffect|useMemo|supabase|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
