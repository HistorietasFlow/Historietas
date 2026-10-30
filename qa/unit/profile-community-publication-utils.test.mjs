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
const communityPostRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-community-post-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const communityViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-community-view-state.ts",
    import.meta.url,
  ),
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
  comunidadeSemPublicacoesRecentesPerfilAutor,
  criarHrefPublicacaoComunidadePerfil,
  criarResumoPublicacaoComunidadePerfil,
  normalizarPublicacaoComunidadePerfil,
  obterDadosPublicacaoRecenteComunidadePerfilAutor,
  obterAriaLabelsEstatisticasComunidadePerfilAutor,
  obterAvisoComunidadeVaziaPerfilAutor,
  obterPaddingInferiorPublicacaoComunidadePerfilAutor,
  obterTituloComunidadePerfilAutor,
  obterValoresEstatisticasComunidadePerfilAutor,
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

test("estado vazio da Comunidade depende apenas da ausência de publicações recentes", () => {
  assert.equal(comunidadeSemPublicacoesRecentesPerfilAutor([]), true);
  assert.equal(
    comunidadeSemPublicacoesRecentesPerfilAutor([criarPublicacao()]),
    false,
  );
});


test("página delega o estado vazio das publicações recentes ao helper", () => {
  assert.match(
    communityViewStateSource,
    /comunidadeSemPublicacoesRecentesPerfilAutor,[\s\S]*?from "\.\/profile-community-publication-utils";/,
  );
  assert.equal(
    (communityViewStateSource.match(/comunidadeSemPublicacoesRecentesPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /empty=\{comunidadeSemPublicacoesRecentes\}/,
  );
  assert.doesNotMatch(
    pagina,
    /comunidadePerfil\.publicacoesRecentes\.length === 0/,
  );
});


test("página deriva as publicações recentes da Comunidade uma única vez", () => {
  assert.match(
    communityViewStateSource,
    /const publicacoesRecentesComunidade =\s*comunidadePerfil\.publicacoesRecentes;/,
  );
  assert.equal(
    (communityViewStateSource.match(/comunidadePerfil\.publicacoesRecentes/g) || []).length,
    1,
  );
  assert.match(
    communityViewStateSource,
    /comunidadeSemPublicacoesRecentesPerfilAutor\(\s*publicacoesRecentesComunidade,?\s*\)/,
  );
  assert.match(
    pagina,
    /publicacoesRecentes=\{publicacoesRecentesComunidade\}/,
  );
});


test("página deriva o erro da Comunidade uma única vez", () => {
  assert.match(
    communityViewStateSource,
    /const erroComunidadePerfil = comunidadePerfil\.erro;/,
  );
  assert.equal(
    (communityViewStateSource.match(/comunidadePerfil\.erro/g) || []).length,
    1,
  );
  assert.match(pagina, /error=\{erroComunidadePerfil\}/);
  assert.match(
    pagina,
    /<ProfileCommunityTab/,
  );
});


test("valores das estatísticas da Comunidade reutilizam a mesma formatação", () => {
  assert.deepEqual(
    obterValoresEstatisticasComunidadePerfilAutor({
      totalPublicacoes: 12,
      totalTeorias: 3,
      totalReviews: 7,
      formatarNumero: (valor) => `fmt:${valor}`,
    }),
    {
      publicacoes: "fmt:12",
      teorias: "fmt:3",
      reviews: "fmt:7",
    },
  );
});


test("página delega a formatação dos valores das estatísticas da Comunidade", () => {
  assert.match(
    communityViewStateSource,
    /obterValoresEstatisticasComunidadePerfilAutor,[\s\S]*?from "\.\/profile-community-publication-utils";/,
  );
  assert.equal(
    (
      communityViewStateSource.match(
        /obterValoresEstatisticasComunidadePerfilAutor\(\{/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    pagina,
    /publicacoes=\{\{[\s\S]*?value: valoresEstatisticasComunidade\.publicacoes,/,
  );
  assert.match(
    pagina,
    /teorias=\{\{[\s\S]*?value: valoresEstatisticasComunidade\.teorias,/,
  );
  assert.match(
    pagina,
    /reviews=\{\{[\s\S]*?value: valoresEstatisticasComunidade\.reviews,/,
  );
  assert.doesNotMatch(
    pagina,
    /value=\{compactarNumeroPerfilAutor\(\s*comunidadePerfil\.total(?:Publicacoes|Teorias|Reviews),?\s*\)\}/,
  );
});


test("aria-labels das estatísticas da Comunidade preservam os três destinos", () => {
  assert.deepEqual(
    obterAriaLabelsEstatisticasComunidadePerfilAutor("Ana"),
    {
      publicacoes: "Abrir publicações de Ana na comunidade",
      teorias: "Abrir teorias de Ana na comunidade",
      reviews: "Abrir reviews de Ana na comunidade",
    },
  );
});


test("página reutiliza os aria-labels das estatísticas da Comunidade", () => {
  assert.match(
    communityViewStateSource,
    /obterAriaLabelsEstatisticasComunidadePerfilAutor,[\s\S]*?from "\.\/profile-community-publication-utils";/,
  );
  assert.equal(
    (
      communityViewStateSource.match(
        /obterAriaLabelsEstatisticasComunidadePerfilAutor\(/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    pagina,
    /publicacoes=\{\{[\s\S]*?ariaLabel: ariaLabelsEstatisticasComunidade\.publicacoes,/,
  );
  assert.match(
    pagina,
    /teorias=\{\{[\s\S]*?ariaLabel: ariaLabelsEstatisticasComunidade\.teorias,/,
  );
  assert.match(
    pagina,
    /reviews=\{\{[\s\S]*?ariaLabel: ariaLabelsEstatisticasComunidade\.reviews,/,
  );
  assert.doesNotMatch(
    pagina,
    /ariaLabel=\{`Abrir (?:publicações|teorias|reviews) de \$\{perfilParaMostrar\.nome\} na comunidade`\}/,
  );
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
    communityViewStateSource,
    /obterTituloComunidadePerfilAutor,[\s\S]*?from "\.\/profile-community-publication-utils";/,
  );
  assert.equal(
    (communityViewStateSource.match(/obterTituloComunidadePerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /<ProfileCommunityTab[\s\S]*?title=\{tituloComunidadePerfil\}/);
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
    communityViewStateSource,
    /obterPaddingInferiorPublicacaoComunidadePerfilAutor,[\s\S]*?from "\.\/profile-community-publication-utils";/,
  );
  assert.equal(
    (
      communityViewStateSource.match(
        /obterPaddingInferiorPublicacaoComunidadePerfilAutor\(/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    communityPostRendererSource,
    /paddingBottom=\{[\s\S]*?paddingInferiorPublicacaoComunidade[\s\S]*?\}/,
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
    communityViewStateSource,
    /obterAvisoComunidadeVaziaPerfilAutor,[\s\S]*?from "\.\/profile-community-publication-utils";/,
  );
  assert.equal(
    (communityViewStateSource.match(/obterAvisoComunidadeVaziaPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /emptyTitle=\{avisoComunidadeVazia\.title\}/);
  assert.match(
    pagina,
    /emptyDescription=\{avisoComunidadeVazia\.description\}/,
  );
  assert.doesNotMatch(
    pagina,
    /podeEditarPerfil[\s\S]{0,120}\? "Sua comunidade ainda está vazia"/,
  );
});


test("dados da publicação recente centralizam link, acessibilidade, resumo e enquete", () => {
  assert.deepEqual(
    obterDadosPublicacaoRecenteComunidadePerfilAutor(
      criarPublicacao({
        id: " post / número 1 ",
        tipoPublicacao: "Enquete",
        texto: "Enquete: Melhor capítulo?\nOpção 1: Um\nOpção 2: Dois",
      }),
    ),
    {
      href: "/comunidade?post=post%20%2F%20n%C3%BAmero%201",
      ariaLabel: "Abrir Enquete na Comunidade",
      resumo: "Melhor capítulo?",
      totalOpcoesEnquete: 2,
      exibirInfoEnquete: true,
      exibirObraRelacionada: false,
    },
  );
});


test("página deriva os dados da publicação recente uma única vez por item", () => {
  assert.match(
    communityPostRendererSource,
    /import \{ obterDadosPublicacaoRecenteComunidadePerfilAutor \} from "\.\.\/lib\/profile-community-publication-utils";/,
  );
  assert.equal(
    (
      communityPostRendererSource.match(
        /obterDadosPublicacaoRecenteComunidadePerfilAutor\(/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    communityPostRendererSource,
    /<ProfileCommunityPostItem[\s\S]*?href=\{dadosPublicacao\.href\}/,
  );
  assert.match(
    communityPostRendererSource,
    /<ProfileCommunityPostItem[\s\S]*?ariaLabel=\{dadosPublicacao\.ariaLabel\}/,
  );
  assert.match(
    communityPostRendererSource,
    /<ProfileCommunityPostItem[\s\S]*?resumo=\{dadosPublicacao\.resumo\}/,
  );
  assert.match(
    communityPostRendererSource,
    /exibirInfoEnquete=\{[\s\S]*?dadosPublicacao\.exibirInfoEnquete[\s\S]*?\}/,
  );
  assert.match(
    communityPostRendererSource,
    /exibirObraRelacionada=\{[\s\S]*?dadosPublicacao\.exibirObraRelacionada[\s\S]*?\}/,
  );
  assert.doesNotMatch(communityPostRendererSource, /dadosPublicacao\.totalOpcoesEnquete >= 2/);
  assert.doesNotMatch(communityPostRendererSource, /\{publicacao\.obraRelacionada && \(/);
  assert.doesNotMatch(pagina, /criarHrefPublicacaoComunidadePerfil/);
  assert.doesNotMatch(pagina, /criarResumoPublicacaoComunidadePerfil/);
  assert.doesNotMatch(pagina, /analisarEnquetePublicacaoComunidadePerfil/);
});


test("dados da publicação recente ocultam info de enquete com menos de duas opções", () => {
  assert.deepEqual(
    obterDadosPublicacaoRecenteComunidadePerfilAutor(
      criarPublicacao({
        tipoPublicacao: "Enquete",
        texto: "Enquete: Melhor capítulo?\nOpção 1: Um",
      }),
    ),
    {
      href: "/comunidade?post=post-1",
      ariaLabel: "Abrir Enquete na Comunidade",
      resumo: "Melhor capítulo?",
      totalOpcoesEnquete: 1,
      exibirInfoEnquete: false,
      exibirObraRelacionada: false,
    },
  );
});


test("dados da publicação recente derivam a visibilidade da obra relacionada", () => {
  assert.deepEqual(
    obterDadosPublicacaoRecenteComunidadePerfilAutor(
      criarPublicacao({
        obraRelacionada: "Obra relacionada",
      }),
    ),
    {
      href: "/comunidade?post=post-1",
      ariaLabel: "Abrir Discussão na Comunidade",
      resumo: "Texto da publicação",
      totalOpcoesEnquete: 0,
      exibirInfoEnquete: false,
      exibirObraRelacionada: true,
    },
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
    communityPostRendererSource,
    /import \{ obterDadosPublicacaoRecenteComunidadePerfilAutor \} from "\.\.\/lib\/profile-community-publication-utils";/,
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
    "comunidadeSemPublicacoesRecentesPerfilAutor",
    "normalizarPublicacaoComunidadePerfil",
    "criarHrefPublicacaoComunidadePerfil",
    "analisarEnquetePublicacaoComunidadePerfil",
    "criarResumoPublicacaoComunidadePerfil",
    "obterDadosPublicacaoRecenteComunidadePerfilAutor",
    "obterAriaLabelsEstatisticasComunidadePerfilAutor",
    "obterAvisoComunidadeVaziaPerfilAutor",
    "obterPaddingInferiorPublicacaoComunidadePerfilAutor",
    "obterTituloComunidadePerfilAutor",
    "obterValoresEstatisticasComunidadePerfilAutor",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    communityLoaderSource,
    /\.map\(\(registro\) => normalizarPublicacaoComunidadePerfil\(registro\)\)/,
  );
  assert.equal(
    (
      communityPostRendererSource.match(
        /obterDadosPublicacaoRecenteComunidadePerfilAutor\(/g,
      ) || []
    ).length,
    1,
  );
  assert.doesNotMatch(pagina, /criarHrefPublicacaoComunidadePerfil/);
  assert.doesNotMatch(pagina, /criarResumoPublicacaoComunidadePerfil/);
  assert.doesNotMatch(pagina, /analisarEnquetePublicacaoComunidadePerfil/);
  assert.doesNotMatch(pagina, /supabase\s*\.from\("comunidade_posts"\)/);
  assert.match(
    communityLoaderSource,
    /supabase\s*\.from\("comunidade_posts"\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect|localStorage/);
});
