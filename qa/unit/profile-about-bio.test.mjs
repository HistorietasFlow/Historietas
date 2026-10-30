import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
const hero = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-hero.tsx",
    import.meta.url,
  ),
  "utf8",
);
const bioDisplay = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-bio-display.tsx",
    import.meta.url,
  ),
  "utf8",
);
const bioEditor = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-bio-editor.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("página delega os blocos de bio do Sobre e mantém as derivações no estado visual", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(
    accessViewStateSource,
    /const editorSobreVisivel = podeEditarPerfil && editorSobreAberto;/,
  );
  assert.match(pagina, /obterEstadoVisualAcessoPerfilAutor\(/);
  assert.match(
    pagina,
    /<ProfileAboutSection[\s\S]*?heroTitle=\{obterTituloSobrePerfilAutor\(perfilNome\)\}[\s\S]*?heroText=\{bioSobreAutorExibido\}[\s\S]*?heroUserContent=\{bioSobreAutorUserContent\}[\s\S]*?heroCanEdit=\{podeEditarPerfil\}[\s\S]*?onToggleHeroEditor=\{\(\) =>[\s\S]*?setEditorSobreAberto\(\(aberto\) => !aberto\)/,
  );
  assert.match(
    pagina,
    /heroEditorVisible=\{editorSobreVisivel\}[\s\S]*?heroEditorValue=\{perfilSalvoAutor\.sobreBio\}[\s\S]*?onHeroEditorChange=\{\(event\) =>[\s\S]*?atualizarBioSobreAutor\(event\.target\.value\)[\s\S]*?heroEditorPlaceholder=\{bioAutor\}[\s\S]*?heroEditorMaxLength=\{SOBRE_BIO_MAX_LENGTH\}[\s\S]*?heroEditorRemainingCharacters=\{caracteresRestantesBioSobre\}/,
  );
  assert.match(hero, /<ProfileAboutBioDisplay/);
  assert.match(hero, /editorVisible && \([\s\S]*?<ProfileAboutBioEditor/);
});

test("ProfileAboutBioDisplay preserva título, texto, edição e conteúdo do usuário", () => {
  assert.match(bioDisplay, /export function ProfileAboutBioDisplay\(/);
  assert.match(bioDisplay, /<ProfileAboutTitle>\{title\}<\/ProfileAboutTitle>/);
  assert.match(bioDisplay, /<ProfileAboutTextRow>/);
  assert.match(
    bioDisplay,
    /<ProfileAboutText userContent=\{userContent\}>\{text\}<\/ProfileAboutText>/,
  );
  assert.match(
    bioDisplay,
    /\{canEdit && <ProfileAboutEditButton onClick=\{onToggleEditor\} \/>\}/,
  );
});

test("ProfileAboutBioEditor preserva textarea, limite e contador", () => {
  assert.match(bioEditor, /export function ProfileAboutBioEditor\(/);
  assert.match(bioEditor, /<ProfileAboutEditor>/);
  assert.match(bioEditor, /value=\{value\}/);
  assert.match(bioEditor, /onChange=\{onChange\}/);
  assert.match(bioEditor, /placeholder=\{placeholder\}/);
  assert.match(bioEditor, /maxLength=\{maxLength\}/);
  assert.match(
    bioEditor,
    /<ProfileAboutCounter>\s*\{remainingCharacters\} caracteres\s*<\/ProfileAboutCounter>/,
  );
});

test("as primitives de bio não permanecem inline na página", () => {
  assert.doesNotMatch(pagina, /<ProfileAboutTitle>/);
  assert.doesNotMatch(pagina, /<ProfileAboutTextRow>/);
  assert.doesNotMatch(pagina, /<ProfileAboutText[\s>]/);
  assert.doesNotMatch(pagina, /<ProfileAboutEditButton/);
  assert.doesNotMatch(pagina, /<ProfileAboutEditor>/);
  assert.doesNotMatch(pagina, /<ProfileAboutTextarea/);
  assert.doesNotMatch(pagina, /<ProfileAboutCounter>/);
});
