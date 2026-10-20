import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";
import "./notificacoes-local-data.test.mjs";
import "./notificacoes-merge-utils.test.mjs";

const displayUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-display-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const hookInicial = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);
const painelAcoes = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-actions-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const cartaoFeed = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-feed-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const localStateUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-local-state-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const recordNormalizers = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-record-normalizers.ts",
    import.meta.url,
  ),
  "utf8",
);
const directLoader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-direct-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const displayUtilsExecutavel = displayUtils
  .replace(
    'import { normalizarTexto } from "../../../lib/utils";',
    [
      "const normalizarTexto = (texto) => String(texto || '')",
      '  .normalize("NFD")',
      '  .replace(/[\\u0300-\\u036f]/g, "")',
      '  .toLowerCase()',
      '  .trim()',
      '  .replace(/\\s+/g, " ");',
    ].join("\n"),
  )
  .replace(
    'import { notificacaoEhComunidade } from "./notificacoes-filter-utils";',
    [
      "const notificacaoEhCapitulo = (notificacao) =>",
      '  notificacao.tipo === "novo-capitulo" ||',
      '  notificacao.tipo === "comentario-capitulo" ||',
      '  notificacao.tipo === "curtida-capitulo" ||',
      '  notificacao.tipo === "curtida-comentario-capitulo";',
      "const notificacaoEhComunidade = (notificacao) => !notificacaoEhCapitulo(notificacao);",
    ].join("\n"),
  );
const displayUtilsJavascript = typescript.transpileModule(displayUtilsExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  notificacaoTemAutorSocial,
  notificacaoUsaCardSocial,
  obterAcaoPrincipalNotificacao,
  obterDetalheNotificacao,
  obterIconeNotificacao,
  obterInicialNotificacao,
  obterNomeAutorNotificacao,
  obterTextoBlocoSocialNotificacao,
  obterTituloBlocoSocialNotificacao,
  obterTituloExibicaoNotificacao,
} = await import(
  `data:text/javascript;base64,${Buffer.from(displayUtilsJavascript).toString("base64")}`,
);

function criarNotificacao(overrides = {}) {
  return {
    tipo: "novo-capitulo",
    titulo: "Título original",
    mensagem: "Mensagem original",
    lida: false,
    autorNome: "",
    ...overrides,
  };
}

test("preserva detalhes e ações semânticas por tipo", () => {
  assert.equal(
    obterDetalheNotificacao(criarNotificacao({ tipo: "comentario-obra" })),
    "Comentário na obra",
  );
  assert.equal(
    obterDetalheNotificacao(criarNotificacao({ tipo: "review-comunidade" })),
    "Review publicada",
  );
  assert.equal(
    obterDetalheNotificacao(criarNotificacao({ tipo: "desconhecida" })),
    "Capítulo",
  );

  assert.equal(
    obterAcaoPrincipalNotificacao(
      criarNotificacao({ tipo: "solicitacao-seguidor" }),
    ),
    "Responder solicitação",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(criarNotificacao({ tipo: "novo-seguidor" })),
    "Ver perfil",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(criarNotificacao({ tipo: "problema-tecnico" })),
    "Ver chamado",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(criarNotificacao({ tipo: "curtida-obra" })),
    "Ver obra",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(criarNotificacao({ tipo: "atividade-diario" })),
    "Ver Diário",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(
      criarNotificacao({ tipo: "comentario-comunidade" }),
    ),
    "Ver comunidade",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(criarNotificacao({ tipo: "comentario-capitulo" })),
    "Ver comentário",
  );
  assert.equal(
    obterAcaoPrincipalNotificacao(criarNotificacao({ tipo: "novo-capitulo" })),
    "Ver capítulo",
  );
});

test("preserva prioridade de ícones e títulos de exibição", () => {
  assert.equal(
    obterIconeNotificacao(criarNotificacao({ tipo: "comentario-comunidade", lida: true }), true),
    "✓",
  );
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "comentario-obra" }), false), "💬");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "curtida-capitulo" }), false), "❤️");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "review-comunidade" }), false), "★");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "atividade-diario" }), false), "◉");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "novo-seguidor" }), false), "+");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "moderacao-comunidade" }), false), "N");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "problema-tecnico" }), false), "S");
  assert.equal(obterIconeNotificacao(criarNotificacao({ tipo: "desconhecida" }), false), "!");

  assert.equal(
    obterTituloExibicaoNotificacao(criarNotificacao({ tipo: "novo-capitulo" })),
    "Novo capítulo publicado",
  );
  assert.equal(
    obterTituloExibicaoNotificacao(criarNotificacao({ tipo: "comentario-diario" })),
    "Novo comentário no Diário",
  );
  assert.equal(
    obterTituloExibicaoNotificacao(
      criarNotificacao({
        tipo: "atividade-comunidade",
        mensagem: "Ada comentou em uma publicação",
      }),
    ),
    "Novo comentário na Comunidade",
  );
  assert.equal(
    obterTituloExibicaoNotificacao(
      criarNotificacao({
        tipo: "atividade-comunidade",
        titulo: "Curtida na comunidade",
      }),
    ),
    "Nova curtida na Comunidade",
  );
  assert.equal(
    obterTituloExibicaoNotificacao(
      criarNotificacao({
        tipo: "atividade-comunidade",
        titulo: "Atualização",
        mensagem: "Sem heurística social",
      }),
    ),
    "Atualização",
  );
  assert.equal(
    obterTituloExibicaoNotificacao(criarNotificacao({ tipo: "desconhecida", titulo: "Original" })),
    "Original",
  );
});

test("preserva heurísticas e cartões sociais", () => {
  assert.equal(
    notificacaoUsaCardSocial(criarNotificacao({ tipo: "comentario-comunidade" })),
    true,
  );
  assert.equal(
    notificacaoUsaCardSocial(criarNotificacao({ tipo: "comentario-capitulo" })),
    true,
  );
  assert.equal(
    notificacaoUsaCardSocial(criarNotificacao({ tipo: "novo-capitulo" })),
    false,
  );
  assert.equal(
    notificacaoTemAutorSocial(
      criarNotificacao({
        tipo: "atividade-comunidade",
        mensagem: "Ada comentou em uma publicação",
      }),
    ),
    true,
  );
  assert.equal(
    notificacaoTemAutorSocial(criarNotificacao({ tipo: "atividade-diario" })),
    false,
  );
});

test("preserva textos, autores e iniciais dos blocos sociais", () => {
  const comentarioComunidade = criarNotificacao({
    tipo: "comentario-comunidade",
    mensagem: "Ada comentou na publicação",
  });
  assert.equal(obterNomeAutorNotificacao(comentarioComunidade), "Ada");
  assert.equal(obterTituloBlocoSocialNotificacao(comentarioComunidade), "Comentário de Ada");
  assert.equal(obterTextoBlocoSocialNotificacao(comentarioComunidade), "");
  assert.equal(obterInicialNotificacao(comentarioComunidade), "A");
  assert.equal(
    obterInicialNotificacao(
      criarNotificacao({
        lida: true,
        autorNome: {
          trim: () => ({
            slice: () => ({ toUpperCase: () => "" }),
          }),
        },
      }),
    ),
    "✓",
  );

  const curtidaObra = criarNotificacao({
    tipo: "curtida-obra",
    autorNome: "  Bia  ",
    mensagem: "Bia curtiu sua obra",
  });
  assert.equal(obterNomeAutorNotificacao(curtidaObra), "Bia");
  assert.equal(obterTituloBlocoSocialNotificacao(curtidaObra), "Curtida de Bia");
  assert.equal(obterTextoBlocoSocialNotificacao(curtidaObra), "Bia curtiu sua obra");

  assert.equal(
    obterTituloBlocoSocialNotificacao(
      criarNotificacao({ tipo: "novo-seguidor", autorNome: "Davi" }),
    ),
    "Novo seguidor: Davi",
  );
  assert.equal(
    obterTituloBlocoSocialNotificacao(
      criarNotificacao({ tipo: "solicitacao-seguidor", autorNome: "Elisa" }),
    ),
    "Solicitação de Elisa",
  );

  assert.equal(
    obterNomeAutorNotificacao(
      criarNotificacao({ tipo: "atividade-diario", mensagem: "Caio publicou uma nota" }),
    ),
    "Caio",
  );
  assert.equal(
    obterNomeAutorNotificacao(criarNotificacao({ tipo: "atividade-diario", mensagem: "sem autor" })),
    "Usuário",
  );
  assert.equal(
    obterNomeAutorNotificacao(
      criarNotificacao({
        tipo: "atividade-comunidade",
        mensagem: "Ada comentou em uma publicação",
      }),
    ),
    "Comunidade",
  );
  assert.equal(
    obterNomeAutorNotificacao(
      criarNotificacao({ tipo: "comentario-comunidade", mensagem: "texto sem autor" }),
    ),
    "Leitor",
  );
  assert.equal(
    obterTituloBlocoSocialNotificacao(criarNotificacao({ tipo: "problema-tecnico" })),
    "Suporte técnico",
  );
});

test("componentes visuais importam os helpers extraídos e preservam as fronteiras locais", () => {
  assert.match(
    cartaoFeed,
    /import \{[\s\S]*?criarAvatarNotificacaoStyle,[\s\S]*?notificacaoTemAutorSocial,[\s\S]*?notificacaoUsaCardSocial,[\s\S]*?obterDetalheNotificacao,[\s\S]*?obterIconeNotificacao,[\s\S]*?obterInicialNotificacao,[\s\S]*?obterNomeAutorNotificacao,[\s\S]*?obterTextoBlocoSocialNotificacao,[\s\S]*?obterTituloBlocoSocialNotificacao,[\s\S]*?obterTituloExibicaoNotificacao,[\s\S]*?\} from "\.\.\/lib\/notificacoes-display-utils";/,
  );
  assert.match(pagina, /import NotificacoesFeed/);

  for (const helper of [
    "notificacaoUsaCardSocial",
    "obterDetalheNotificacao",
    "obterAcaoPrincipalNotificacao",
    "obterIconeNotificacao",
    "obterTituloExibicaoNotificacao",
    "notificacaoTemAutorSocial",
    "obterTituloBlocoSocialNotificacao",
    "obterTextoBlocoSocialNotificacao",
    "obterNomeAutorNotificacao",
    "obterInicialNotificacao",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    pagina,
    /import \{[\s\S]*?prepararNotificacaoTexto,[\s\S]*?\} from "\.\/lib\/notificacoes-local-state-utils";/,
  );
  for (const helperLocal of [
    "normalizarNotificacaoParaExibicao",
    "prepararNotificacaoTexto",
  ]) {
    assert.match(localStateUtils, new RegExp(`export function ${helperLocal}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helperLocal}\\(`));
  }

  assert.match(
    hookInicial,
    /from "\.\.\/lib\/notificacoes-supabase-direct-loader";/,
  );
  assert.match(pagina, /useNotificacoesInitialLoad\(/);
  assert.match(
    directLoader,
    /import \{ normalizarNotificacaoSupabase \} from "\.\/notificacoes-record-normalizers";/,
  );
  assert.match(recordNormalizers, /export function normalizarNotificacaoSupabase\(/);
  assert.doesNotMatch(pagina, /function normalizarNotificacao\(/);
  assert.doesNotMatch(pagina, /function normalizarNotificacaoSupabase\(/);
  assert.match(
    cartaoFeed,
    /import \{[\s\S]*?criarAvatarNotificacaoStyle,[\s\S]*?\} from "\.\.\/lib\/notificacoes-display-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarAvatarNotificacaoStyle\(/);
  assert.match(recordNormalizers, /obterDetalheNotificacao\(\{\s*id,/);
  assert.match(cartaoFeed, /notificacaoUsaCardSocial\(notificacao\)/);
  assert.match(cartaoFeed, /obterTituloBlocoSocialNotificacao\(notificacao\)/);
  assert.match(
    painelAcoes,
    /import \{[\s\S]*?obterAcaoPrincipalNotificacao,[\s\S]*?obterNomeAutorNotificacao,[\s\S]*?\} from "\.\.\/lib\/notificacoes-display-utils";/,
  );
  assert.match(painelAcoes, /obterAcaoPrincipalNotificacao\(notificacao\)/);
});
