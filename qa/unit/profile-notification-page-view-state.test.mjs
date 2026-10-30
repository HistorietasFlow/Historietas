import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const notificationViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-notification-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-page-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

const notificationJavaScript = typescript.transpileModule(
  notificationViewStateSource.replace(
    'import { obterDadosNotificacoesPerfilAutor } from "./profile-display-utils";',
    'const obterDadosNotificacoesPerfilAutor = (total) => ({ notificacoesNaoLidasFormatadas: total > 99 ? "99+" : String(total), ariaLabelNotificacoes: total > 0 ? `Notificações: ${total} não lidas` : "Notificações", ariaLabelBadgeNotificacoes: `${total > 99 ? "99+" : total} notificações não lidas`, temNotificacoesNaoLidas: total > 0 });',
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const pageJavaScript = typescript.transpileModule(pageViewStateSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { obterEstadoVisualNotificacoesPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(notificationJavaScript).toString("base64")}`,
);
const { obterEstadoVisualPaginaPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(pageJavaScript).toString("base64")}`,
);

test("estado visual de notificações preserva a precedência de ?? e os rótulos", () => {
  assert.deepEqual(
    obterEstadoVisualNotificacoesPerfilAutor({
      notificacoesNaoLidasPerfil: 0,
      notificacoesNaoLidasContexto: 4,
    }),
    {
      notificacoesNaoLidas: 0,
      notificacoesNaoLidasFormatadas: "0",
      ariaLabelNotificacoes: "Notificações",
      ariaLabelBadgeNotificacoes: "0 notificações não lidas",
      temNotificacoesNaoLidas: false,
    },
  );
  assert.deepEqual(
    obterEstadoVisualNotificacoesPerfilAutor({
      notificacoesNaoLidasPerfil: null,
      notificacoesNaoLidasContexto: 100,
    }),
    {
      notificacoesNaoLidas: 100,
      notificacoesNaoLidasFormatadas: "99+",
      ariaLabelNotificacoes: "Notificações: 100 não lidas",
      ariaLabelBadgeNotificacoes: "99+ notificações não lidas",
      temNotificacoesNaoLidas: true,
    },
  );
});

test("estado visual da página preserva a prioridade de loading, erro e perfil", () => {
  const perfil = { autorId: "autor-1" };

  assert.equal(
    obterEstadoVisualPaginaPerfilAutor({
      carregando: true,
      redirecionandoParaLogin: false,
      autorNaoEncontrado: true,
      perfilParaMostrar: null,
    }),
    "carregando",
  );
  assert.equal(
    obterEstadoVisualPaginaPerfilAutor({
      carregando: false,
      redirecionandoParaLogin: true,
      autorNaoEncontrado: true,
      perfilParaMostrar: null,
    }),
    "carregando",
  );
  assert.equal(
    obterEstadoVisualPaginaPerfilAutor({
      carregando: false,
      redirecionandoParaLogin: false,
      autorNaoEncontrado: true,
      perfilParaMostrar: null,
    }),
    "autor-nao-encontrado",
  );
  assert.equal(
    obterEstadoVisualPaginaPerfilAutor({
      carregando: false,
      redirecionandoParaLogin: false,
      autorNaoEncontrado: false,
      perfilParaMostrar: null,
    }),
    "perfil-ausente",
  );
  assert.equal(
    obterEstadoVisualPaginaPerfilAutor({
      carregando: false,
      redirecionandoParaLogin: false,
      autorNaoEncontrado: false,
      perfilParaMostrar: perfil,
    }),
    "pronto",
  );
});

test("helpers preservam fronteiras puras e a página mantém hooks e JSX", () => {
  assert.match(
    notificationViewStateSource,
    /export function obterEstadoVisualNotificacoesPerfilAutor/,
  );
  assert.match(
    notificationViewStateSource,
    /notificacoesNaoLidasPerfil \?\? notificacoesNaoLidasContexto/,
  );
  assert.match(
    notificationViewStateSource,
    /obterDadosNotificacoesPerfilAutor\(notificacoesNaoLidas\)/,
  );
  for (const valor of [
    "notificacoesNaoLidas",
    "notificacoesNaoLidasFormatadas",
    "ariaLabelNotificacoes",
    "ariaLabelBadgeNotificacoes",
    "temNotificacoesNaoLidas",
  ]) {
    assert.match(notificationViewStateSource, new RegExp(`\\b${valor}\\b`));
  }
  assert.doesNotMatch(
    notificationViewStateSource,
    /useState|useEffect|supabase|localStorage|jsx/i,
  );

  assert.match(
    pageViewStateSource,
    /export function obterEstadoVisualPaginaPerfilAutor/,
  );
  assert.match(pageViewStateSource, /if \(carregando \|\| redirecionandoParaLogin\)/);
  assert.match(pageViewStateSource, /if \(autorNaoEncontrado\)/);
  assert.match(pageViewStateSource, /if \(!perfilParaMostrar\)/);
  assert.match(pageViewStateSource, /return "carregando";/);
  assert.match(pageViewStateSource, /return "autor-nao-encontrado";/);
  assert.match(pageViewStateSource, /return "perfil-ausente";/);
  assert.match(pageViewStateSource, /return "pronto";/);
  assert.doesNotMatch(
    pageViewStateSource,
    /useState|useEffect|supabase|localStorage|ProfilePageState|jsx/i,
  );

  assert.match(
    pagina,
    /import \{ obterEstadoVisualNotificacoesPerfilAutor \} from "\.\/lib\/profile-notification-view-state";/,
  );
  assert.match(
    pagina,
    /import \{ obterEstadoVisualPaginaPerfilAutor \} from "\.\/lib\/profile-page-view-state";/,
  );
  assert.match(pagina, /useNotificacoes\(\)/);
  assert.match(pagina, /setNotificacoesNaoLidasPerfil/);
  assert.match(pagina, /usePerfilAutorNotificationCountSync/);
  assert.match(pagina, /obterEstadoVisualNotificacoesPerfilAutor\(\{/);
  assert.match(pagina, /obterEstadoVisualPaginaPerfilAutor\(\{/);
  assert.match(pagina, /loadingLabel="Carregando perfil"/);
  assert.match(pagina, /message="Perfil não encontrado"/);
  assert.match(pagina, /message="Nenhum autor encontrado"/);
  assert.doesNotMatch(pagina, /obterDadosNotificacoesPerfilAutor\(/);
});
