import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const contentSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-content-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

function importarModuloTypescript(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
  );
}

const textUtils = await importarModuloTypescript(textSource);
const contentUtils = await importarModuloTypescript(
  contentSource.replace(
    'import { normalizarTexto } from "../../../../lib/utils";',
    `const normalizarTexto = (valor) => String(valor || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase();`,
  ),
);

test("textos de confirmação preservam todos os locais e tipos", () => {
  assert.equal(textUtils.localeAdminComunidade("en"), "en-US");
  assert.equal(textUtils.localeAdminComunidade("es"), "es-ES");
  assert.equal(textUtils.localeAdminComunidade("pt-BR"), "pt-BR");

  const textos = {
    post: {
      "pt-BR": "Remover esta publicação denunciada? Essa ação apaga a publicação da Comunidade.",
      en: "Remove this reported post? This action deletes the post from the Community.",
      es: "¿Eliminar esta publicación denunciada? Esta acción elimina la publicación de la Comunidad.",
    },
    comentario: {
      "pt-BR": "Remover este comentário denunciado? Essa ação apaga o comentário da Comunidade.",
      en: "Remove this reported comment? This action deletes the comment from the Community.",
      es: "¿Eliminar este comentario denunciado? Esta acción elimina el comentario de la Comunidad.",
    },
    comentario_capitulo: {
      "pt-BR": "Remover este comentário de capítulo denunciado? Essa ação apaga o comentário do capítulo.",
      en: "Remove this reported chapter comment? This action deletes the comment from the chapter.",
      es: "¿Eliminar este comentario del capítulo denunciado? Esta acción elimina el comentario del capítulo.",
    },
    obra: {
      "pt-BR": "Remover esta obra denunciada? Essa ação apaga a obra e pode apagar capítulos e interações relacionadas.",
      en: "Remove this reported work? This may also delete related chapters and interactions.",
      es: "¿Eliminar esta obra denunciada? Esto también puede eliminar capítulos e interacciones relacionadas.",
    },
    capitulo: {
      "pt-BR": "Remover este capítulo denunciado? Essa ação apaga o capítulo e pode apagar interações relacionadas.",
      en: "Remove this reported chapter? This may also delete related interactions.",
      es: "¿Eliminar este capítulo denunciado? Esto también puede eliminar interacciones relacionadas.",
    },
    comentario_obra: {
      "pt-BR": "Remover este comentário de obra denunciado? Essa ação apaga o comentário da obra.",
      en: "Remove this reported work comment? This action deletes the comment from the work.",
      es: "¿Eliminar este comentario de obra denunciado? Esta acción elimina el comentario de la obra.",
    },
    diario_anotacao: {
      "pt-BR": "Remover esta anotação denunciada? Essa ação apaga a anotação e as interações relacionadas no Diário.",
      en: "Remove this reported Journal entry? This action deletes the entry and its related interactions.",
      es: "¿Eliminar esta anotación denunciada? Esta acción elimina la anotación y sus interacciones relacionadas.",
    },
    comentario_diario: {
      "pt-BR": "Remover este comentário denunciado? Essa ação apaga o comentário do Diário.",
      en: "Remove this reported Journal comment? This action deletes the comment from the Journal.",
      es: "¿Eliminar este comentario denunciado? Esta acción elimina el comentario del Diario.",
    },
  };

  for (const [tipo, porIdioma] of Object.entries(textos)) {
    for (const [idioma, texto] of Object.entries(porIdioma)) {
      assert.equal(
        textUtils.textoConfirmacaoRemocaoAdminComunidade(tipo, idioma),
        texto,
      );
    }
  }
});

test("conteúdo indisponível normaliza texto e preserva todos os padrões", () => {
  const padroes = [
    "conteudo removido pela moderacao",
    "publicacao nao encontrada ou removida",
    "comentario nao encontrado ou removido",
    "comentario de capitulo nao encontrado ou removido",
    "obra nao encontrada ou removida",
    "capitulo nao encontrado ou removido",
    "comentario da obra nao encontrado ou removido",
    "anotacao do diario nao encontrada ou removida",
    "comentario do diario nao encontrado ou removido",
    "nao encontrada ou removida",
    "nao encontrado ou removido",
  ];

  for (const padrao of padroes) {
    assert.equal(
      contentUtils.conteudoDenunciadoIndisponivel({ alvoResumo: padrao }),
      true,
    );
  }

  assert.equal(
    contentUtils.conteudoDenunciadoIndisponivel({
      alvoResumo: "CONTEÚDO REMOVIDO PELA MODERAÇÃO",
    }),
    true,
  );
  assert.equal(
    contentUtils.conteudoDenunciadoIndisponivel({
      alvoResumo: "Texto comum disponível",
    }),
    false,
  );
});

test("Admin Comunidade delega textos e disponibilidade aos módulos puros", () => {
  for (const nome of [
    "localeAdminComunidade",
    "textoConfirmacaoRemocaoAdminComunidade",
    "conteudoDenunciadoIndisponivel",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${nome}\\b`));
  }

  assert.match(pageSource, /from "\.\/lib\/admin-comunidade-text-utils"/);
  assert.match(pageSource, /from "\.\/lib\/admin-comunidade-content-utils"/);
  assert.match(pageSource, /textoConfirmacaoRemocaoAdminComunidade\(/);
  assert.match(pageSource, /localeAdminComunidade\(language\)/);
  assert.match(pageSource, /conteudoDenunciadoIndisponivel\(denuncia\)/);
  assert.match(contentSource, /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils"/);

  for (const source of [textSource, contentSource]) {
    assert.doesNotMatch(
      source,
      /from\s+["']react["']|from\s+["'][^"']*supabase|useState|useEffect|localStorage|router|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
    );
  }
});
