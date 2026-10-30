import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const communityViewState = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-community-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const libraryViewState = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-library-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estado visual da Comunidade preserva as derivações e os helpers atuais", () => {
  for (const trecho of [
    "comunidadePerfil.publicacoesRecentes",
    "comunidadeSemPublicacoesRecentesPerfilAutor",
    "comunidadePerfil.erro",
    "obterAvisoComunidadeVaziaPerfilAutor",
    "obterTituloComunidadePerfilAutor",
    "obterAriaLabelsEstatisticasComunidadePerfilAutor",
    "obterValoresEstatisticasComunidadePerfilAutor",
    "compactarNumeroPerfilAutor",
    "obterPaddingInferiorPublicacaoComunidadePerfilAutor",
  ]) {
    assert.match(communityViewState, new RegExp(trecho));
  }

  assert.match(
    pagina,
    /import \{ obterEstadoVisualComunidadePerfilAutor \} from "\.\/lib\/profile-community-view-state";/,
  );
  assert.match(
    pagina,
    /obterEstadoVisualComunidadePerfilAutor\(\{[\s\S]*?comunidadePerfil,[\s\S]*?podeEditarPerfil,[\s\S]*?perfilNome,[\s\S]*?language,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(communityViewState, /useState|useEffect|supabase|localStorage/);
});

test("estado visual da Biblioteca preserva composição, totais, aba e menu", () => {
  for (const trecho of [
    "montarItensBibliotecaPerfilAutor",
    "bibliotecaPerfilVisivel",
    "diarioPerfil.queroLer",
    "diarioPerfil.lendoAgora",
    "diarioPerfil.favoritas",
    "diarioPerfil.concluidas",
    "atividadesDiarioPerfil",
    "itensBibliotecaQueroLer.length",
    "itensBibliotecaConcluidas.length",
    "obterTotaisBibliotecaPerfilAutor",
    "obrasSeguidasBiblioteca",
    "obrasConcluidas",
    "obrasConcluidasPerfilPorObrasDoAutor",
    "selecionarItensBibliotecaPerfil",
    "abaBibliotecaPerfil",
    "encontrarItemBibliotecaMenuAberto",
    "bibliotecaMenuAbertoChave",
    "obterRotuloBibliotecaPerfil",
    "obterMensagemBibliotecaVaziaPerfil",
  ]) {
    assert.match(libraryViewState, new RegExp(trecho.replaceAll(".", "\\.")));
  }

  assert.match(
    pagina,
    /import \{ obterEstadoVisualBibliotecaPerfilAutor \} from "\.\/lib\/profile-library-view-state";/,
  );
  assert.match(
    pagina,
    /obterEstadoVisualBibliotecaPerfilAutor\(\{[\s\S]*?bibliotecaPerfilVisivel,[\s\S]*?diarioPerfil,[\s\S]*?atividadesDiarioPerfil,[\s\S]*?obras,[\s\S]*?obrasSeguidasBiblioteca,[\s\S]*?obrasConcluidas,[\s\S]*?obrasConcluidasPerfilPorObrasDoAutor,[\s\S]*?abaBibliotecaPerfil,[\s\S]*?bibliotecaMenuAbertoChave,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(libraryViewState, /useState|useEffect|supabase|localStorage/);
});
