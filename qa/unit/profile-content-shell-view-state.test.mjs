import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const contentSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-content-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const shellSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-shell-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estado visual do conteúdo preserva as derivações e a ordem", () => {
  assert.match(contentSource, /export function obterEstadoVisualConteudoPerfilAutor/);
  const ordem = [
    "obterObrasVisiveisPerfilAutor",
    "obterMensagemObrasVaziasPerfilAutor",
    "obterTituloDiarioPerfilAutor",
    "montarItensDiarioTudoPerfil",
    "diarioPerfil.atividades",
    "diarioPerfil.carregando",
    "obterResumoEstatisticasPerfilAutor",
    "obterObraMenuAbertaPerfilAutor",
  ];
  let anterior = -1;
  for (const contrato of ordem) {
    const indice = contentSource.indexOf(contrato, anterior + 1);
    assert.ok(indice > anterior, `${contrato} deve preservar a ordem`);
    anterior = indice;
  }
  for (const campo of [
    "obrasDoPerfilFiltradas",
    "mensagemObrasVazias",
    "tituloDiarioPerfil",
    "itensDiarioTudo",
    "atividadesDiarioPerfil",
    "diarioPerfilCarregando",
    "generosEspecialidadesPerfil",
    "totalVisualizacoesPerfil",
    "totalRascunhosPerfil",
    "totalObrasSemCapitulosPerfil",
    "temObrasSemCapitulosPerfil",
    "obraMenuAberta",
  ]) {
    assert.match(contentSource, new RegExp(`\\b${campo}\\b`));
  }
  assert.doesNotMatch(contentSource, /useState|useEffect|supabase|localStorage|<\w/);
});

test("estado visual do shell preserva estilos, rótulos e links", () => {
  assert.match(shellSource, /export function obterEstadoVisualShellPerfilAutor/);
  assert.match(shellSource, /obterEstilosResponsivosPerfilAutor\(isDesktop\)/);
  assert.match(
    shellSource,
    /const profileActionsExibicaoStyle = podeEditarPerfil\s*\? profileActionsAtualStyle\s*:\s*profileVisitorActionsAtualStyle;/,
  );
  for (const contrato of [
    "obterRotuloVisibilidadeUsernamePerfilAutor",
    "obterAriaLabelCopiarUsernamePerfilAutor",
    "obterUsernameExibidoPerfilAutor",
    "criarLinksComunidadePerfilAutor",
    "comunidadeAutorHref",
    "comunidadeAutorTeoriasHref",
    "comunidadeAutorReviewsHref",
  ]) {
    assert.match(shellSource, new RegExp(`\\b${contrato}\\b`));
  }
  assert.doesNotMatch(shellSource, /useState|useEffect|supabase|localStorage|<\w/);
});

test("página consome os helpers e preserva sincronizações e ações", () => {
  assert.match(pagina, /obterEstadoVisualConteudoPerfilAutor/);
  assert.match(pagina, /obterEstadoVisualShellPerfilAutor/);
  assert.match(pagina, /usePerfilAutorDiarySync\(/);
  assert.match(pagina, /usePerfilAutorTopFiveLikeActions\(/);
  assert.match(pagina, /<ProfileHeader/);
});
