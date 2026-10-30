import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  obterVisibilidadeAbasPerfilAutor,
  obterVisibilidadeConteudosAbasPerfilAutor,
} from "../../app/perfil-autor/lib/profile-tab-visibility-utils.ts";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const accessViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-access-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const tabContent = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-tab-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroActionsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero.tsx",
    import.meta.url,
  ),
  "utf8",
);
const navigationPanelSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-navigation-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);

const todas = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: true,
  atividades: true,
};

test("perfil próprio mantém todas as áreas visíveis", () => {
  const resultado = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario: true,
    existeBloqueio: true,
    privacidadeCarregando: true,
    permissoes: {
      obras: false,
      sobre: false,
      diario: false,
      comunidade: false,
      biblioteca: false,
      atividades: false,
    },
  });

  assert.equal(resultado.perfilBloqueadoEntreUsuarios, false);
  assert.equal(resultado.obrasPerfilVisivel, true);
  assert.equal(resultado.sobrePerfilVisivel, true);
  assert.equal(resultado.diarioPerfilVisivel, true);
  assert.equal(resultado.comunidadePerfilVisivel, true);
  assert.equal(resultado.bibliotecaPerfilVisivel, true);
  assert.equal(resultado.atividadesPerfilVisivel, true);
  assert.equal(resultado.totalAbasPerfilVisiveis, 5);
  assert.equal(resultado.temAbasPerfilVisiveis, true);
  assert.equal(resultado.conteudoPrivadoBloqueado, false);
  assert.equal(resultado.primeiraAbaPerfilVisivel, "obras");
});

test("bloqueio entre usuários oculta as áreas públicas", () => {
  const resultado = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario: false,
    existeBloqueio: true,
    privacidadeCarregando: false,
    permissoes: todas,
  });

  assert.equal(resultado.perfilBloqueadoEntreUsuarios, true);
  assert.equal(resultado.totalAbasPerfilVisiveis, 0);
  assert.equal(resultado.temAbasPerfilVisiveis, false);
  assert.equal(resultado.atividadesPerfilVisivel, false);
  assert.equal(resultado.conteudoPrivadoBloqueado, true);
  assert.equal(resultado.primeiraAbaPerfilVisivel, null);
});

test("preserva permissões, ordem da primeira aba e total sem atividades", () => {
  const resultado = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario: false,
    existeBloqueio: false,
    privacidadeCarregando: false,
    permissoes: {
      obras: false,
      sobre: true,
      diario: false,
      comunidade: true,
      biblioteca: true,
      atividades: true,
    },
  });

  assert.equal(resultado.obrasPerfilVisivel, false);
  assert.equal(resultado.sobrePerfilVisivel, true);
  assert.equal(resultado.comunidadePerfilVisivel, true);
  assert.equal(resultado.bibliotecaPerfilVisivel, true);
  assert.equal(resultado.atividadesPerfilVisivel, true);
  assert.equal(resultado.totalAbasPerfilVisiveis, 3);
  assert.equal(resultado.temAbasPerfilVisiveis, true);
  assert.equal(resultado.primeiraAbaPerfilVisivel, "comunidade");
  assert.equal(resultado.conteudoPrivadoBloqueado, false);
});

test("carregamento de privacidade não é tratado como conteúdo privado definitivo", () => {
  const resultado = obterVisibilidadeAbasPerfilAutor({
    perfilPertenceAoUsuario: false,
    existeBloqueio: false,
    privacidadeCarregando: true,
    permissoes: todas,
  });

  assert.equal(resultado.totalAbasPerfilVisiveis, 0);
  assert.equal(resultado.temAbasPerfilVisiveis, false);
  assert.equal(resultado.conteudoPrivadoBloqueado, false);
  assert.equal(resultado.primeiraAbaPerfilVisivel, null);
});


test("página reutiliza a presença de abas já derivada pelo helper", () => {
  assert.match(pagina, /temAbasPerfilVisiveis,/);
  assert.match(
    pagina,
    /<ProfileNavigationPanel[\s\S]*?conteudoPrivadoBloqueado=\{conteudoPrivadoBloqueado\}[\s\S]*?temAbasPerfilVisiveis=\{temAbasPerfilVisiveis\}/,
  );
  assert.match(
    navigationPanelSource,
    /\{temAbasPerfilVisiveis && \([\s\S]*?<ProfileSectionTabs[\s\S]*?abaAtiva=\{abaAtiva\}[\s\S]*?totalAbasVisiveis=\{totalAbasVisiveis\}[\s\S]*?onSelect=\{onSelect\}/,
  );
  assert.match(
    navigationPanelSource,
    /\{conteudoPrivadoBloqueado && \([\s\S]*?<PrivateProfileNotice[\s\S]*?perfilBloqueadoEntreUsuarios=\{perfilBloqueadoEntreUsuarios\}/,
  );
  assert.doesNotMatch(
    pagina,
    /totalAbasPerfilVisiveis > 0/,
  );
});


test("estado de acesso deriva a existência de bloqueio e a página a consome", () => {
  assert.match(
    accessViewStateSource,
    /const existeBloqueioPerfil = estadoBloqueioPerfil\.existeBloqueio;/,
  );
  assert.match(
    accessViewStateSource,
    /existeBloqueio: existeBloqueioPerfil,/,
  );
  assert.match(
    pagina,
    /<ProfileHero[\s\S]*?existeBloqueio=\{existeBloqueioPerfil\}/,
  );
  assert.match(heroSource, /<ProfileHeroActions[\s\S]*?existeBloqueio=\{existeBloqueio\}/);
  assert.match(heroActionsSource, /\{!existeBloqueio && \(/);
  assert.equal(
    (accessViewStateSource.match(/estadoBloqueioPerfil\.existeBloqueio/g) || []).length,
    1,
  );
});


test("conteúdo ativo exige aba selecionada e visível", () => {
  assert.deepEqual(
    obterVisibilidadeConteudosAbasPerfilAutor({
      abaPerfil: "comunidade",
      obrasPerfilVisivel: true,
      sobrePerfilVisivel: true,
      diarioPerfilVisivel: true,
      comunidadePerfilVisivel: true,
      bibliotecaPerfilVisivel: true,
    }),
    {
      bibliotecaPerfilAtiva: false,
      diarioPerfilAtivo: false,
      comunidadePerfilAtiva: true,
      sobrePerfilAtivo: false,
      obrasPerfilAtivo: false,
    },
  );

  assert.deepEqual(
    obterVisibilidadeConteudosAbasPerfilAutor({
      abaPerfil: "obras",
      obrasPerfilVisivel: false,
      sobrePerfilVisivel: true,
      diarioPerfilVisivel: true,
      comunidadePerfilVisivel: true,
      bibliotecaPerfilVisivel: true,
    }),
    {
      bibliotecaPerfilAtiva: false,
      diarioPerfilAtivo: false,
      comunidadePerfilAtiva: false,
      sobrePerfilAtivo: false,
      obrasPerfilAtivo: false,
    },
  );
});

test("estado de acesso delega a visibilidade do conteúdo das cinco abas", () => {
  assert.match(
    accessViewStateSource,
    /obterVisibilidadeConteudosAbasPerfilAutor,[\s\S]*?from "\.\/profile-tab-visibility-utils";/,
  );
  assert.equal(
    (accessViewStateSource.match(/obterVisibilidadeConteudosAbasPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /obterEstadoVisualAcessoPerfilAutor\(/);

  assert.match(
    pagina,
    /import \{ ProfileTabContent \} from "\.\/components\/profile-tab-content";/,
  );
  assert.match(pagina, /<ProfileTabContent/);

  for (const nome of [
    "bibliotecaPerfilAtiva",
    "diarioPerfilAtivo",
    "comunidadePerfilAtiva",
    "sobrePerfilAtivo",
    "obrasPerfilAtivo",
  ]) {
    assert.match(tabContent, new RegExp(`${nome}: boolean;`));
    assert.match(tabContent, new RegExp("\\{" + nome + " && "));
    assert.match(pagina, new RegExp(nome + "=\\{" + nome + "\\}"));
  }

  assert.doesNotMatch(
    pagina,
    /abaPerfil === "(?:biblioteca|diario|comunidade|sobre|obras)" &&/,
  );
});
