import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accessSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-access-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const authorDisplaySource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-author-display-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("estado de acesso preserva ordem de permissões, bloqueio e abas", () => {
  const indiceEdicao = accessSource.indexOf(
    "const podeEditarPerfil = perfilPertenceAoUsuario;",
  );
  const indiceVisitante = accessSource.indexOf(
    "const perfilVisitante = !podeEditarPerfil;",
  );
  const indiceEditores = accessSource.indexOf(
    "const editorPerfilVisivel = podeEditarPerfil && editorPerfilAberto;",
  );
  const indiceBloqueio = accessSource.indexOf(
    "const bloqueadoPorMim = estadoBloqueioPerfil.bloqueadoPorMim;",
  );
  const indiceRotulo = accessSource.indexOf(
    "obterRotuloAcaoBloqueioPerfilAutor({",
  );
  const indiceAbas = accessSource.indexOf(
    "obterVisibilidadeAbasPerfilAutor({",
  );
  const indiceConteudos = accessSource.indexOf(
    "obterVisibilidadeConteudosAbasPerfilAutor({",
  );

  assert.ok(
    indiceEdicao < indiceVisitante &&
      indiceVisitante < indiceEditores &&
      indiceEditores < indiceBloqueio &&
      indiceBloqueio < indiceRotulo &&
      indiceRotulo < indiceAbas &&
      indiceAbas < indiceConteudos,
  );
  for (const nome of [
    "perfilBloqueadoEntreUsuarios",
    "obrasPerfilVisivel",
    "sobrePerfilVisivel",
    "diarioPerfilVisivel",
    "comunidadePerfilVisivel",
    "bibliotecaPerfilVisivel",
    "atividadesPerfilVisivel",
    "totalAbasPerfilVisiveis",
    "temAbasPerfilVisiveis",
    "conteudoPrivadoBloqueado",
    "primeiraAbaPerfilVisivel",
    "bibliotecaPerfilAtiva",
    "diarioPerfilAtivo",
    "comunidadePerfilAtiva",
    "sobrePerfilAtivo",
    "obrasPerfilAtivo",
  ]) {
    assert.match(accessSource, new RegExp(`${nome},`));
  }
  assert.doesNotMatch(accessSource, /useState|useEffect|supabase|localStorage|<\w/);
});

test("estado de exibição do autor preserva total, dados, destaques e bio traduzida", () => {
  const indiceConcluidas = authorDisplaySource.indexOf(
    "obterTotalObrasConcluidasPerfilAutor({",
  );
  const indiceDados = authorDisplaySource.indexOf(
    "obterDadosExibicaoPerfilAutor({",
  );
  const indiceDestaques = authorDisplaySource.indexOf(
    "const mostrarDestaquesAutor = perfilSalvoAutor.mostrarDestaques;",
  );
  const indiceBio = authorDisplaySource.indexOf(
    "obterBioSobreExibicaoPerfilAutor({",
  );

  assert.ok(
    indiceConcluidas < indiceDados &&
      indiceDados < indiceDestaques &&
      indiceDestaques < indiceBio,
  );
  assert.match(
    authorDisplaySource,
    /traduzirTexto: \(texto\) => traduzirTextoPerfilAutor\(texto, language\)/,
  );
  for (const nome of [
    "perfilUsuarioRemotoAtivo",
    "bioPadraoAutor",
    "bioAutorPersonalizada",
    "bioAutor",
    "bioSobrePersonalizada",
    "bioSobreAutor",
    "entradaHistorietasPerfil",
    "caracteresRestantesBioSobre",
    "bioSobreAutorEhPadrao",
    "autorHandlePerfil",
    "avatarAutor",
    "mostrarDestaquesAutor",
    "bioSobreAutorExibido",
    "bioSobreAutorUserContent",
  ]) {
    assert.match(authorDisplaySource, new RegExp(`${nome},`));
  }
  assert.doesNotMatch(
    authorDisplaySource,
    /useState|useEffect|supabase|localStorage|<\w/,
  );
});

test("página delega as duas composições e mantém menu, hooks e JSX", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?obterEstadoVisualAcessoPerfilAutor,[\s\S]*?\} from "\.\/lib\/profile-access-view-state";/,
  );
  assert.match(
    pageSource,
    /import \{ obterEstadoVisualExibicaoAutorPerfil \} from "\.\/lib\/profile-author-display-view-state";/,
  );
  assert.match(pageSource, /obterEstadoVisualAcessoPerfilAutor\(\{/);
  assert.match(pageSource, /obterEstadoVisualExibicaoAutorPerfil\(\{/);
  assert.match(
    pageSource,
    /const menuBloqueioStyle = bloqueadoPorMim[\s\S]*?\? menuItemStyle[\s\S]*?: menuDangerItemStyle;/,
  );
  assert.match(pageSource, /usePerfilAutorPrivacySync\(/);
  assert.match(pageSource, /usePerfilAutorVisibleTabSync\(/);
  assert.match(pageSource, /usePerfilAutorCommunitySync\(/);
  assert.match(pageSource, /usePerfilAutorBlockStateSync\(/);
  assert.doesNotMatch(pageSource, /const podeEditarPerfil = perfilPertenceAoUsuario;/);
  assert.doesNotMatch(
    pageSource,
    /const obrasConcluidasPerfilPorObrasDoAutor =[\s\S]*?obterTotalObrasConcluidasPerfilAutor/,
  );
});
