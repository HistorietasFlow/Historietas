import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const navigationUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-navigation-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const navigationUtilsExecutavel = navigationUtils
  .replace(
    'import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";',
    [
      'const criarSlugBase = (titulo) => String(titulo)',
      '  .normalize("NFD")',
      '  .replace(/[\\u0300-\\u036f]/g, "")',
      '  .toLowerCase()',
      '  .trim()',
      '  .replace(/[^a-z0-9\\s-]/g, "")',
      '  .replace(/\\s+/g, "-")',
      '  .replace(/-+/g, "-")',
      '  .replace(/^-+|-+$/g, "") || "obra";',
      'const idObraSupabaseValido = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());',
    ].join("\n"),
  )
  .replace(
    'import { notificacaoEhCapitulo } from "./notificacoes-filter-utils";',
    [
      "const notificacaoEhCapitulo = (notificacao) =>",
      '  notificacao.tipo === "novo-capitulo" ||',
      '  notificacao.tipo === "comentario-capitulo" ||',
      '  notificacao.tipo === "curtida-capitulo" ||',
      '  notificacao.tipo === "curtida-comentario-capitulo";',
    ].join("\n"),
  );
const navigationUtilsJavascript = typescript.transpileModule(
  navigationUtilsExecutavel,
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  criarDiarioPerfilHrefNotificacao,
  criarHrefLeituraCapitulo,
  criarPerfilHrefNotificacao,
  linkDiretoValido,
  montarLinkNotificacao,
} = await import(
  `data:text/javascript;base64,${Buffer.from(navigationUtilsJavascript).toString("base64")}`,
);

const idObraValido = "123e4567-e89b-12d3-a456-426614174000";

function criarObra(overrides = {}) {
  return {
    id: idObraValido,
    titulo: "Aventura Espacial",
    publicado: true,
    slug: "aventura-espacial",
    link: "/obra/aventura-espacial",
    capitulos: [],
    ...overrides,
  };
}

function criarNotificacao(overrides = {}) {
  return {
    obraId: "",
    capituloId: "",
    link: "",
    tipo: "atividade-comunidade",
    autorId: "",
    autorNome: "",
    ...overrides,
  };
}

test("valida links diretos somente para caminhos internos seguros", () => {
  assert.equal(linkDiretoValido("/comunidade"), true);
  assert.equal(linkDiretoValido(" /comunidade "), true);
  assert.equal(linkDiretoValido("//externo"), false);
  assert.equal(linkDiretoValido("comunidade"), false);
  assert.equal(linkDiretoValido("/comunidade\\externo"), false);
});

test("cria links de perfil preservando os parametros e fallbacks", () => {
  assert.equal(
    criarPerfilHrefNotificacao(" usuario-1 ", " Ada Lovelace "),
    "/perfil-autor?userId=usuario-1&autorId=usuario-1&autor=Ada+Lovelace",
  );
  assert.equal(
    criarPerfilHrefNotificacao("usuario-1", ""),
    "/perfil-autor?userId=usuario-1&autorId=usuario-1",
  );
  assert.equal(
    criarPerfilHrefNotificacao("", "Ada Lovelace"),
    "/perfil-autor?autor=Ada+Lovelace",
  );
  assert.equal(criarPerfilHrefNotificacao("", ""), "/perfil-autor");
});

test("cria links de diario preservando aba apos os parametros do perfil", () => {
  assert.equal(
    criarDiarioPerfilHrefNotificacao("usuario-1", "Ada Lovelace"),
    "/perfil-autor?userId=usuario-1&autorId=usuario-1&autor=Ada+Lovelace&aba=diario",
  );
  assert.equal(
    criarDiarioPerfilHrefNotificacao("", ""),
    "/perfil-autor?aba=diario",
  );
});

test("cria links de capitulo com rota publica e fallback codificado", () => {
  assert.equal(
    criarHrefLeituraCapitulo(criarObra(), "capitulo-1", 3),
    "/obra/aventura-espacial/capitulo/3",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      criarObra({ slug: "", titulo: "Aventura & Espacial" }),
      "capitulo-1",
      1,
    ),
    "/obra/aventura-espacial/capitulo/1",
  );
  assert.equal(
    criarHrefLeituraCapitulo(
      criarObra({ slug: "aventura espacial" }),
      "capitulo-1",
      1,
    ),
    "/obra/aventura%20espacial/capitulo/1",
  );

  for (const obra of [
    criarObra({ publicado: false }),
    criarObra({ id: "obra-local" }),
  ]) {
    assert.equal(
      criarHrefLeituraCapitulo(obra, "capitulo com espaco", 1),
      `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=capitulo%20com%20espaco`,
    );
  }

  for (const numeroCapitulo of [0, -1, 1.5]) {
    assert.equal(
      criarHrefLeituraCapitulo(criarObra(), "capitulo-1", numeroCapitulo),
      `/ler-capitulo?obraId=${idObraValido}&capituloId=capitulo-1`,
    );
  }
});

test("monta links de notificacao na ordem de fallback contratada", () => {
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({
        tipo: "solicitacao-seguidor",
        link: "/ignorado",
      }),
    ),
    "/seguindo?aba=seguidores&conteudo=seguidores",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({
        tipo: "novo-seguidor",
        autorId: "autora-1",
        autorNome: "Autora Um",
      }),
    ),
    "/perfil-autor?userId=autora-1&autorId=autora-1&autor=Autora+Um",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({
        tipo: "comentario-obra",
        link: " /direto ",
      }),
      criarObra({ link: "/obra/ignorada" }),
    ),
    "/direto",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({ tipo: "comentario-obra", link: "//externo" }),
      criarObra({ link: " /obra/aventura " }),
    ),
    "/obra/aventura",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({ tipo: "comentario-obra" }),
      criarObra({ link: " https://exemplo.test/obra " }),
    ),
    "https://exemplo.test/obra",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({ tipo: "curtida-obra" }),
      criarObra({ link: "" }),
    ),
    "/obra/aventura-espacial",
  );
});

test("monta links de capitulo e preserva fallbacks finais", () => {
  const obra = criarObra({
    capitulos: [{ id: "primeiro" }, { id: "segundo" }],
  });

  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({
        tipo: "novo-capitulo",
        obraId: obra.id,
        capituloId: "segundo",
      }),
      obra,
    ),
    "/obra/aventura-espacial/capitulo/2",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({
        tipo: "comentario-capitulo",
        obraId: obra.id,
        capituloId: "ausente",
      }),
      obra,
    ),
    "/obra/aventura-espacial/capitulo/1",
  );
  assert.equal(
    montarLinkNotificacao(
      criarNotificacao({
        tipo: "curtida-capitulo",
        obraId: "obra local",
        capituloId: "capitulo com espaco",
      }),
    ),
    "/ler-capitulo?obraId=obra%20local&capituloId=capitulo%20com%20espaco",
  );
  assert.equal(
    montarLinkNotificacao(criarNotificacao({ tipo: "novo-capitulo" })),
    "/perfil-autor?aba=biblioteca",
  );
  assert.equal(montarLinkNotificacao(criarNotificacao()), "/comunidade");
});

test("pagina delega somente os helpers de navegacao extraidos", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarDiarioPerfilHrefNotificacao,[\s\S]*?criarHrefLeituraCapitulo,[\s\S]*?criarPerfilHrefNotificacao,[\s\S]*?montarLinkNotificacao,[\s\S]*?\} from "\.\/lib\/notificacoes-navigation-utils";/,
  );
  for (const helper of [
    "criarHrefLeituraCapitulo",
    "linkDiretoValido",
    "criarPerfilHrefNotificacao",
    "criarDiarioPerfilHrefNotificacao",
    "montarLinkNotificacao",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }
  assert.match(pagina, /criarHrefLeituraCapitulo\(obra, capitulo\.id, indiceCapitulo \+ 1\)/);
  assert.match(pagina, /criarPerfilHrefNotificacao\(seguidorId, perfilSeguidor\.nome\)/);
  assert.match(pagina, /criarDiarioPerfilHrefNotificacao\(userId\)/);
  assert.match(pagina, /montarLinkNotificacao\(notificacao, obra\)/);
});
