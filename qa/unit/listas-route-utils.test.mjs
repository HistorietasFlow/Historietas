import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL("../../app/listas/lib/listas-route-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const routeStateSource = readFileSync(
  new URL("../../app/listas/lib/listas-page-route-state.ts", import.meta.url),
  "utf8",
);
const typesSource = readFileSync(
  new URL("../../app/listas/types.ts", import.meta.url),
  "utf8",
);
const pageDataHook = readFileSync(
  new URL("../../app/listas/hooks/use-listas-page-data-loader.ts", import.meta.url),
  "utf8",
);
const annotationUtilsSource = readFileSync(
  new URL(
    "../../app/listas/lib/listas-diary-annotation-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const annotationActionsSource = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-diary-annotation-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const profileLoaderSource = readFileSync(
  new URL("../../app/listas/lib/listas-profile-loader.ts", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  normalizarCategoriaPerfil,
  normalizarModoLista,
  normalizarOrdenacao,
  normalizarOrigemPerfil,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);
const routeStateJavascript = typescript.transpileModule(
  routeStateSource
    .replace(
      /import \{[\s\S]*?\} from "\.\/listas-route-utils";/,
      [
        `const normalizarCategoriaPerfil = ${normalizarCategoriaPerfil.toString()};`,
        `const normalizarModoLista = ${normalizarModoLista.toString()};`,
        `const normalizarOrdenacao = ${normalizarOrdenacao.toString()};`,
        `const normalizarOrigemPerfil = ${normalizarOrigemPerfil.toString()};`,
      ].join("\n"),
    )
    .replace(
      'import { pegarTexto } from "./listas-value-utils";',
      `const pegarTexto = (valor, fallback = "") =>
  typeof valor === "string" && valor.trim() ? valor.trim() : fallback;`,
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { obterEstadoRotaListas } = await import(
  `data:text/javascript;base64,${Buffer.from(routeStateJavascript).toString("base64")}`,
);

test("normalizarModoLista preserva valores permitidos e fallback", () => {
  assert.equal(normalizarModoLista("perfil"), "perfil");
  assert.equal(normalizarModoLista("autores"), "autores");
  assert.equal(normalizarModoLista("obras"), "obras");
  assert.equal(normalizarModoLista("invalido"), "obras");
  assert.equal(normalizarModoLista(null), "obras");
});

test("normalizarOrigemPerfil preserva biblioteca e fallback diario", () => {
  assert.equal(normalizarOrigemPerfil("biblioteca"), "biblioteca");
  assert.equal(normalizarOrigemPerfil("diario"), "diario");
  assert.equal(normalizarOrigemPerfil("invalida"), "diario");
  assert.equal(normalizarOrigemPerfil(null), "diario");
});

test("normalizarCategoriaPerfil preserva os sete valores aceitos", () => {
  for (const categoria of [
    "lendo",
    "quero-ler",
    "favoritas",
    "concluidas",
    "avaliacoes",
    "historico",
    "tudo",
  ]) {
    assert.equal(normalizarCategoriaPerfil(categoria), categoria);
  }

  assert.equal(normalizarCategoriaPerfil("invalida"), "tudo");
  assert.equal(normalizarCategoriaPerfil(null), "tudo");
});

test("normalizarOrdenacao preserva especiais e recentes por fallback", () => {
  assert.equal(normalizarOrdenacao("titulo"), "titulo");
  assert.equal(normalizarOrdenacao("avaliacao"), "avaliacao");
  assert.equal(normalizarOrdenacao("popularidade"), "popularidade");
  assert.equal(normalizarOrdenacao("recentes"), "recentes");
  assert.equal(normalizarOrdenacao("invalida"), "recentes");
  assert.equal(normalizarOrdenacao(null), "recentes");
});

test("obterEstadoRotaListas preserva prioridades e fallbacks atuais", () => {
  const searchParams = new URLSearchParams(
    "modo=perfil&origem=biblioteca&categoria=favoritas&usuario=%20principal%20&userId=segundo&autorId=terceiro&secao=%20recomendacoes%20&genero=%20Fantasia%20&titulo=%20Minha%20lista%20&obra=obra-principal&obraId=obra-secundaria&ordem=titulo",
  );

  assert.deepEqual(obterEstadoRotaListas(searchParams), {
    queryAtual: searchParams.toString(),
    modo: "perfil",
    origemPerfil: "biblioteca",
    categoriaUrl: "favoritas",
    userIdUrl: " principal ",
    secao: "recomendacoes",
    genero: "Fantasia",
    tituloPersonalizado: "Minha lista",
    obraAlvoId: "obra-principal",
    ordenacao: "titulo",
  });

  assert.deepEqual(obterEstadoRotaListas(new URLSearchParams()), {
    queryAtual: "",
    modo: "obras",
    origemPerfil: "diario",
    categoriaUrl: "tudo",
    userIdUrl: "",
    secao: "catalogo",
    genero: "",
    tituloPersonalizado: "",
    obraAlvoId: "",
    ordenacao: "recentes",
  });
});

test("Listas delega normalizacao de rota e armazenamento local", () => {
  assert.match(
    routeStateSource,
    /import \{[\s\S]*?normalizarCategoriaPerfil,[\s\S]*?normalizarModoLista,[\s\S]*?normalizarOrdenacao,[\s\S]*?normalizarOrigemPerfil,[\s\S]*?\} from "\.\/listas-route-utils";/,
  );

  for (const helper of [
    "normalizarModoLista",
    "normalizarOrigemPerfil",
    "normalizarCategoriaPerfil",
    "normalizarOrdenacao",
  ]) {
    assert.doesNotMatch(routeStateSource, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    routeStateSource,
    /const modo: ModoLista = normalizarModoLista\(searchParams\.get\("modo"\)\);/,
  );
  assert.match(
    routeStateSource,
    /const origemPerfil: OrigemPerfil = normalizarOrigemPerfil\([\s\S]*?searchParams\.get\("origem"\),[\s\S]*?\);/,
  );
  assert.match(
    routeStateSource,
    /const categoriaUrl: CategoriaPerfil = normalizarCategoriaPerfil\([\s\S]*?searchParams\.get\("categoria"\),[\s\S]*?\);/,
  );
  assert.match(
    routeStateSource,
    /const ordenacao: OrdenacaoLista = normalizarOrdenacao\([\s\S]*?searchParams\.get\("ordem"\),[\s\S]*?\);/,
  );
  assert.match(routeStateSource, /const queryAtual = searchParams\.toString\(\);/);
  assert.match(
    routeStateSource,
    /searchParams\.get\("usuario"\) \|\|[\s\S]*?searchParams\.get\("userId"\) \|\|[\s\S]*?searchParams\.get\("autorId"\) \|\|[\s\S]*?"";/,
  );
  assert.match(
    routeStateSource,
    /searchParams\.get\("obra"\) \|\| searchParams\.get\("obraId"\)/,
  );
  assert.match(
    routeStateSource,
    /pegarTexto\(searchParams\.get\("secao"\), "catalogo"\)/,
  );

  for (const tipo of [
    "ModoLista",
    "OrigemPerfil",
    "CategoriaPerfil",
    "OrdenacaoLista",
  ]) {
    assert.match(typesSource, new RegExp(`export type ${tipo} =`));
  }

  assert.match(
    annotationActionsSource,
    /import \{[\s\S]*?normalizarQuemPodeComentarAnotacaoListas,[\s\S]*?normalizarVisibilidadeComentariosAnotacaoListas,[\s\S]*?\} from "\.\.\/lib\/listas-diary-normalizer-utils";/,
  );
  assert.doesNotMatch(pagina, /function normalizarQuemPodeComentarAnotacaoListas\(/);
  assert.doesNotMatch(pagina, /function normalizarVisibilidadeComentariosAnotacaoListas\(/);
  assert.match(pagina, /const searchParams = useSearchParams\(\);/);
  assert.match(
    pagina,
    /import \{ obterEstadoRotaListas \} from "\.\/lib\/listas-page-route-state";/,
  );
  assert.match(pagina, /\} = obterEstadoRotaListas\(searchParams\);/);
  assert.match(pagina, /useState/);
  assert.match(pageDataHook, /useEffect/);
  assert.doesNotMatch(pagina, /from "\.\.\/\.\.\/lib\/supabase\/client"/);
  assert.doesNotMatch(pagina, /localStorage/);
  assert.match(
    profileLoaderSource,
    /import \{[\s\S]*?carregarAnotacoesLocaisListas,[\s\S]*?\} from "\.\/listas-diary-annotation-utils";/,
  );
  assert.match(annotationUtilsSource, /localStorage/);
  assert.doesNotMatch(utilsSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(routeStateSource, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(
    annotationUtilsSource,
    /useState|useEffect|supabase|\.from\(|\.rpc\(/,
  );
});
