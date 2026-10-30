import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const editorViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-editor-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const reportViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-report-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estado visual do editor preserva avatar, rótulos, inicial e contador", () => {
  assert.match(editorViewStateSource, /import \{ BIO_MAX_LENGTH \} from "\.\.\/constants";/);
  assert.match(editorViewStateSource, /export function obterEstadoVisualEditorPerfilAutor/);
  assert.match(editorViewStateSource, /const temAvatarPerfilEditor = Boolean\(avatarPerfilEditor\);/);
  assert.match(
    editorViewStateSource,
    /obterRotulosAcoesEditorPerfilAutor\(\{[\s\S]*?temAvatar: temAvatarPerfilEditor,[\s\S]*?salvando: salvandoEditorPerfil,[\s\S]*?\}\)/,
  );
  assert.match(
    editorViewStateSource,
    /obterInicialAvatarPerfilAutor\(\s*nomePerfilEditor,\s*perfilNome,\s*\)/,
  );
  assert.match(
    editorViewStateSource,
    /obterCaracteresRestantesPerfilAutor\(\s*bioPerfilEditor,\s*BIO_MAX_LENGTH,\s*\)/,
  );
  for (const valor of [
    "temAvatarPerfilEditor",
    "rotuloAcaoAvatar",
    "rotuloSalvarEditor",
    "inicialAvatarPerfilEditor",
    "caracteresRestantesBioPerfil",
  ]) {
    assert.match(editorViewStateSource, new RegExp(`\\b${valor}\\b`));
  }
  assert.doesNotMatch(editorViewStateSource, /useState|useEffect|supabase|localStorage|<\w/);
});

test("estado visual das denúncias preserva dados, ordem e visibilidade", () => {
  assert.match(reportViewStateSource, /export function obterEstadoVisualDenunciasPerfilAutor/);
  const dadosPerfil = reportViewStateSource.indexOf(
    "obterDadosDenunciaPerfilAutor(",
  );
  const dadosConteudo = reportViewStateSource.indexOf(
    "obterDadosDenunciaConteudoPerfilAutor(",
  );
  const visibilidade = reportViewStateSource.indexOf(
    "obterVisibilidadeDenunciasPerfilAutor({",
  );
  assert.ok(dadosPerfil < dadosConteudo);
  assert.ok(dadosConteudo < visibilidade);
  assert.match(
    reportViewStateSource,
    /obterVisibilidadeDenunciasPerfilAutor\(\{[\s\S]*?denunciaPerfilAberta,[\s\S]*?podeEditarPerfil,[\s\S]*?perfilParaMostrar,[\s\S]*?alvoDenunciaConteudoPerfil,[\s\S]*?\}\)/,
  );
  for (const valor of [
    "dadosDenunciaPerfil",
    "dadosDenunciaConteudoPerfil",
    "denunciaPerfilVisivel",
    "denunciaConteudoVisivel",
  ]) {
    assert.match(reportViewStateSource, new RegExp(`\\b${valor}\\b`));
  }
  assert.doesNotMatch(reportViewStateSource, /useState|useEffect|supabase|localStorage|<\w/);
});

test("página delega estados visuais e preserva hooks, callbacks e modais", () => {
  assert.match(
    pagina,
    /import \{ obterEstadoVisualEditorPerfilAutor \} from "\.\/lib\/profile-editor-view-state";/,
  );
  assert.match(
    pagina,
    /import \{ obterEstadoVisualDenunciasPerfilAutor \} from "\.\/lib\/profile-report-view-state";/,
  );
  assert.match(pagina, /obterEstadoVisualEditorPerfilAutor\(\{[\s\S]*?avatarPerfilEditor,[\s\S]*?salvandoEditorPerfil,[\s\S]*?nomePerfilEditor,[\s\S]*?perfilNome,[\s\S]*?bioPerfilEditor,/);
  assert.match(pagina, /obterEstadoVisualDenunciasPerfilAutor\(\{[\s\S]*?perfilParaMostrar,[\s\S]*?alvoDenunciaConteudoPerfil,[\s\S]*?denunciaPerfilAberta,[\s\S]*?podeEditarPerfil,/);
  assert.match(pagina, /usePerfilAutorAvatarEditorActions\(/);
  assert.match(pagina, /usePerfilAutorProfileEditorActions\(/);
  assert.match(pagina, /usePerfilAutorProfileEditorSaveActions\(/);
  assert.match(pagina, /<ProfileEditor[\s\S]*?hasAvatar=\{temAvatarPerfilEditor\}/);
  assert.match(pagina, /<ProfileReportModals[\s\S]*?profileOpen=\{denunciaPerfilVisivel\}[\s\S]*?contentOpen=\{denunciaConteudoVisivel\}/);
  assert.match(pagina, /onProfileClose=\{\(\) => setDenunciaPerfilAberta\(false\)\}/);
  assert.match(pagina, /onContentClose=\{\(\) => setAlvoDenunciaConteudoPerfil\(null\)\}/);
});
