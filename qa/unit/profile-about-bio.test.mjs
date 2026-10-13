import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
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

test("página delega os blocos de bio do Sobre sem mover suas derivações", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutBioDisplay \} from "\.\/components\/profile-about-bio-display";/,
  );
  assert.match(
    pagina,
    /import \{ ProfileAboutBioEditor \} from "\.\/components\/profile-about-bio-editor";/,
  );
  assert.match(
    pagina,
    /const editorSobreVisivel = podeEditarPerfil && editorSobreAberto;/,
  );
  assert.match(
    pagina,
    /<ProfileAboutBioDisplay[\s\S]*?title=\{obterTituloSobrePerfilAutor\(perfilNome\)\}[\s\S]*?text=\{bioSobreAutorExibido\}[\s\S]*?userContent=\{bioSobreAutorUserContent\}[\s\S]*?canEdit=\{podeEditarPerfil\}[\s\S]*?onToggleEditor=\{\(\) =>[\s\S]*?setEditorSobreAberto\(\(aberto\) => !aberto\)/,
  );
  assert.match(pagina, /\{editorSobreVisivel && \(/);
  assert.match(
    pagina,
    /<ProfileAboutBioEditor[\s\S]*?value=\{perfilSalvoAutor\.sobreBio\}[\s\S]*?onChange=\{\(event\) =>[\s\S]*?atualizarBioSobreAutor\(event\.target\.value\)[\s\S]*?placeholder=\{bioAutor\}[\s\S]*?maxLength=\{SOBRE_BIO_MAX_LENGTH\}[\s\S]*?remainingCharacters=\{caracteresRestantesBioSobre\}/,
  );
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
