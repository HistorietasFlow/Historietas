import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { obterVisibilidadeAbasPerfilAutor } from "../../app/perfil-autor/lib/profile-tab-visibility-utils.ts";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
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
  assert.match(pagina, /\{temAbasPerfilVisiveis && \(/);
  assert.doesNotMatch(
    pagina,
    /totalAbasPerfilVisiveis > 0/,
  );
});
