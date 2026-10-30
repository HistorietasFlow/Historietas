import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-target-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(
  source
    .replace(
      'import { criarPerfilUsuarioRemotoComoAutor } from "./data-normalizers";',
      'const criarPerfilUsuarioRemotoComoAutor = (perfil) => ({ autorId: perfil.userId, nome: perfil.nome, obras: [] });',
    )
    .replace(
      'import { montarPerfisAutoresPorObras } from "./profile-author-groups";',
      'const montarPerfisAutoresPorObras = (obras, totais) => { globalThis.chamadas.push(["montar", obras, totais]); return [{ autorId: "autor-1", nome: "Ana", obras }]; };',
    )
    .replace(
      'import { resolverEstadoPerfilAutor } from "./profile-resolution-utils";',
      'const resolverEstadoPerfilAutor = (entrada) => { globalThis.chamadas.push(["resolver", entrada]); return { autorNaoEncontrado: false, perfilDoUsuarioLogado: null, perfilParaMostrar: entrada.perfisAutores[0], perfilPertenceAoUsuario: true, redirecionandoParaLogin: false }; };',
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { obterEstadoAlvoPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("preserva a ordem de agrupamento, fallback remoto e resolução", () => {
  globalThis.chamadas = [];
  const obras = [{ id: "obra-1" }];
  const totais = { curtidasPorObra: {} };
  const perfilRemoto = { userId: "remoto-1", nome: "Remoto" };

  const resultado = obterEstadoAlvoPerfilAutor({
    obras,
    totaisInteracoesObras: totais,
    perfilUsuarioRemoto: perfilRemoto,
    autorSelecionado: "",
    autorIdSelecionado: "autor-1",
    usuarioIdLogado: "usuario-1",
    autenticacaoCarregada: true,
  });

  assert.deepEqual(
    globalThis.chamadas.map(([nome]) => nome),
    ["montar", "resolver"],
  );
  assert.deepEqual(globalThis.chamadas[1][1].perfilUsuarioRemotoComoAutor, {
    autorId: "remoto-1",
    nome: "Remoto",
    obras: [],
  });
  assert.equal(resultado.perfilAutorId, "autor-1");
  assert.equal(resultado.perfilNome, "Ana");
  assert.equal(resultado.obrasPerfil, obras);
  assert.equal(resultado.totalObrasPerfil, 1);
  assert.equal(resultado.perfilPertenceAoUsuario, true);
});

test("mantém fallback remoto nulo e estado puramente derivado", () => {
  assert.match(source, /perfilUsuarioRemoto\?\.userId/);
  assert.match(source, /criarPerfilUsuarioRemotoComoAutor\(perfilUsuarioRemoto\)/);
  assert.match(source, /const perfilAutorId = perfilParaMostrar\?\.autorId \|\| "";/);
  assert.match(source, /const perfilNome = perfilParaMostrar\?\.nome \|\| "";/);
  assert.match(source, /const obrasPerfil = perfilParaMostrar\?\.obras \|\| \[\];/);
  assert.match(source, /const totalObrasPerfil = obrasPerfil\.length;/);
  assert.doesNotMatch(source, /useState|useEffect|supabase|localStorage|<\w/);
});

test("página delega a resolução e mantém seus consumidores", () => {
  assert.match(
    pagina,
    /import \{ obterEstadoAlvoPerfilAutor \} from "\.\/lib\/profile-target-view-state";/,
  );
  assert.match(
    pagina,
    /\} = obterEstadoAlvoPerfilAutor\(\{[\s\S]*?obras,[\s\S]*?totaisInteracoesObras,[\s\S]*?perfilUsuarioRemoto,[\s\S]*?autorSelecionado,[\s\S]*?autorIdSelecionado,[\s\S]*?usuarioIdLogado,[\s\S]*?autenticacaoCarregada,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /const perfisAutores = montarPerfisAutoresPorObras/);
  assert.doesNotMatch(pagina, /const perfilUsuarioRemotoComoAutor/);
  assert.doesNotMatch(pagina, /\} = resolverEstadoPerfilAutor\(/);
  assert.match(pagina, /usePerfilAutorTopFiveStorageSync\(\{[\s\S]*?perfilAutorId,/);
  assert.match(pagina, /<ProfileHero[\s\S]*?autorNome=\{perfilNome\}/);
});
