import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-community-publication-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const communityLoaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-community-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(
  utilsSource.replace(
    'import { pegarTexto } from "./data-normalizers";',
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
const {
  analisarEnquetePublicacaoComunidadePerfil,
  criarHrefPublicacaoComunidadePerfil,
  criarResumoPublicacaoComunidadePerfil,
  normalizarPublicacaoComunidadePerfil,
  obterAvisoComunidadeVaziaPerfilAutor,
  obterPaddingInferiorPublicacaoComunidadePerfilAutor,
  obterTituloComunidadePerfilAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const criarPublicacao = (sobrescrever = {}) => ({
  id: "post-1",
  categoria: "Geral",
  tipoPublicacao: "Discussão",
  temSpoiler: false,
  texto: "Texto da publicação",
  obraRelacionada: "",
  criadoEm: "2026-10-10T00:00:00.000Z",
  ...sobrescrever,
});

test("título da Comunidade preserva português, inglês e espanhol", () => {
  assert.equal(
    obterTituloComunidadePerfilAutor({
      language: "pt",
      nomePerfil: "Ana",
    }),
    "Comunidade de Ana",
  );
  assert.equal(
    obterTituloComunidadePerfilAutor({
      language: "en",
      nomePerfil: "Ana",
    }),
    "Ana's Community",
  );
  assert.equal(
    obterTituloComunidadePerfilAutor({
      language: "es",
      nomePerfil: "Ana",
    }),
    "Comunidad de Ana",
  );
});


test("página delega o título localizado da Comunidade ao helper", () => {
  assert.match(
    pagina,
    /obterTituloComunidadePerfilAutor,[\s\S]*?from "\.\/lib\/profile-community-publication-utils";/,
  );
  assert.equal(
    (pagina.match(/obterTituloComunidadePerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /<ProfileCommunityHeader title=\{tituloComunidadePerfil\} \/>/);
  assert.doesNotMatch(pagina, /language === "en"[\s\S]{0,180}Community/);
});


test("padding inferior da publicação preserva espaço de autor e visitante", () => {
  assert.equal(
    obterPaddingInferiorPublicacaoComunidadePerfilAutor(true),
    "10px",
  );
  assert.equal(
    obterPaddingInferiorPublicacaoComunidadePerfilAutor(false),
    "42px",
  );
});


test("página delega o padding inferior das publicações ao helper", () => {
  assert.match(
    pagina,
    /obterPaddingInferiorPublicacaoComunidadePerfilAutor,[\s\S]*?from "\.\/lib\/profile-community-publication-utils";/,
  );
  assert.equal(
    (
      pagina.match(
        /obterPaddingInferiorPublicacaoComunidadePerfilAutor\(/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    pagina,
    /paddingBottom=\{paddingInferiorPublicacaoComunidade\}/,
  );
  assert.doesNotMatch(
    pagina,
    /podeEditarPerfil \? "10px" : "42px"/,
  );
});


test("aviso de comunidade vazia preserva textos de autor e visitante", () => {
  assert.deepEqual(
    obterAvisoComunidadeVaziaPerfilAutor({
      podeEditarPerfil: true,
      nomePerfil: "Ana",
    }),
    {
      title: "Sua comunidade ainda está vazia",
      description:
        "Publique avisos, bastidores, teorias e chamadas para aproximar leitores das suas obras.",
    },
  );

  assert.deepEqual(
    obterAvisoComunidadeVaziaPerfilAutor({
      podeEditarPerfil: false,
      nomePerfil: "Ana",
    }),
    {
      title: "Nenhuma publicação por aqui ainda",
      description:
        "Quando Ana publicar posts, teorias ou reviews, eles aparecerão nesta área.",
    },
  );
});


test("página delega o aviso de comunidade vazia ao helper", () => {
  assert.match(
    pagina,
    /obterAvisoComunidadeVaziaPerfilAutor,[\s\S]*?from "\.\/lib\/profile-community-publication-utils";/,
  );
  assert.equal(
    (pagina.match(/obterAvisoComunidadeVaziaPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /title=\{avisoComunidadeVazia\.title\}/);
  assert.match(pagina, /description=\{avisoComunidadeVazia\.description\}/);
  assert.doesNotMatch(
    pagina,
    /podeEditarPerfil[\s\S]{0,120}\? "Sua comunidade ainda está vazia"/,
  );
});


test("normalizarPublicacaoComunidadePerfil preserva fallbacks, limites e spoiler", () => {
  assert.equal(normalizarPublicacaoComunidadePerfil({ texto: "sem id" }), null);

  const publicacao = normalizarPublicacaoComunidadePerfil({
    id: " post-1 ",
    categoria: " ",
    tipo_publicacao: " ",
    tem_spoiler: true,
    texto: ` ${"t".repeat(701)} `,
    obra_relacionada: ` ${"o".repeat(121)} `,
    criado_em: " 2026-10-10 ",
  });

  assert.deepEqual(publicacao, {
    id: "post-1",
    categoria: "Geral",
    tipoPublicacao: "Discussão",
    temSpoiler: true,
    texto: "t".repeat(700),
    obraRelacionada: "o".repeat(120),
    criadoEm: "2026-10-10",
  });
});

test("criarHrefPublicacaoComunidadePerfil preserva trim e encoding", () => {
  assert.equal(
    criarHrefPublicacaoComunidadePerfil(" post / número 1 "),
    "/comunidade?post=post%20%2F%20n%C3%BAmero%201",
  );
});

test("analisarEnquetePublicacaoComunidadePerfil preserva regex, pergunta e fallback", () => {
  assert.deepEqual(
    analisarEnquetePublicacaoComunidadePerfil(
      criarPublicacao({
        texto: "Enquete:\r\nQual capa prefere?\r\nOpção 1: Azul\r\nOpcao 2: Laranja",
      }),
    ),
    {
      ehEnquete: true,
      pergunta: "Qual capa prefere?",
      totalOpcoes: 2,
    },
  );
  assert.deepEqual(
    analisarEnquetePublicacaoComunidadePerfil(
      criarPublicacao({ categoria: "Enquete", texto: "" }),
    ),
    {
      ehEnquete: true,
      pergunta: "Enquete da comunidade",
      totalOpcoes: 0,
    },
  );
});

test("criarResumoPublicacaoComunidadePerfil preserva spoiler, enquete, espaços e limite", () => {
  assert.equal(
    criarResumoPublicacaoComunidadePerfil(criarPublicacao({ temSpoiler: true })),
    "Este post contém spoiler",
  );
  assert.equal(
    criarResumoPublicacaoComunidadePerfil(
      criarPublicacao({ texto: "Enquete: Melhor capítulo?\nOpção 1: Um\nOpção 2: Dois" }),
    ),
    "Melhor capítulo?",
  );
  assert.equal(
    criarResumoPublicacaoComunidadePerfil(criarPublicacao({ texto: " \n\t " })),
    "Publicação sem texto.",
  );
  assert.equal(
    criarResumoPublicacaoComunidadePerfil(
      criarPublicacao({ texto: `  ${"x".repeat(151)}  ` }),
    ),
    `${"x".repeat(150)}...`,
  );
});

test("Perfil de Autor delega somente os helpers puros de publicações da comunidade", () => {
  assert.match(
    utilsSource,
    /import type \{ PublicacaoComunidadePerfil \} from "\.\.\/types";/,
  );
  assert.match(
    utilsSource,
    /import \{ pegarTexto \} from "\.\/data-normalizers";/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?analisarEnquetePublicacaoComunidadePerfil,[\s\S]*?criarHrefPublicacaoComunidadePerfil,[\s\S]*?criarResumoPublicacaoComunidadePerfil,[\s\S]*?\} from "\.\/lib\/profile-community-publication-utils";/,
  );
  assert.doesNotMatch(
    pagina,
    /normalizarPublicacaoComunidadePerfil[\s\S]*?from "\.\/lib\/profile-community-publication-utils";/,
  );
  assert.match(
    communityLoaderSource,
    /import \{ normalizarPublicacaoComunidadePerfil \} from "\.\/profile-community-publication-utils";/,
  );

  for (const helper of [
    "normalizarPublicacaoComunidadePerfil",
    "criarHrefPublicacaoComunidadePerfil",
    "analisarEnquetePublicacaoComunidadePerfil",
    "criarResumoPublicacaoComunidadePerfil",
    "obterAvisoComunidadeVaziaPerfilAutor",
    "obterPaddingInferiorPublicacaoComunidadePerfilAutor",
    "obterTituloComunidadePerfilAutor",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    communityLoaderSource,
    /\.map\(\(registro\) => normalizarPublicacaoComunidadePerfil\(registro\)\)/,
  );
  assert.match(pagina, /href=\{criarHrefPublicacaoComunidadePerfil\(/);
  assert.match(pagina, /criarResumoPublicacaoComunidadePerfil\(/);
  assert.match(pagina, /analisarEnquetePublicacaoComunidadePerfil\(/);
  assert.doesNotMatch(pagina, /supabase\s*\.from\("comunidade_posts"\)/);
  assert.match(
    communityLoaderSource,
    /supabase\s*\.from\("comunidade_posts"\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect|localStorage/);
});
