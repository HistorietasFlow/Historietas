import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const conteudo = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const source = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-specialties.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Perfil de Autor delega o painel de Especialidades", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(
    pagina,
    /<ProfileAboutSection[\s\S]*?generosEspecialidadesPerfil=\{generosEspecialidadesPerfil\}[\s\S]*?\/>/,
  );
  assert.match(
    conteudo,
    /import \{ ProfileAboutSpecialties \} from "\.\/profile-about-specialties";/,
  );
  assert.match(
    conteudo,
    /<ProfileAboutSpecialties[\s\S]*?generosEspecialidadesPerfil=\{generosEspecialidadesPerfil\}[\s\S]*?\/>/,
  );
  assert.doesNotMatch(
    pagina,
    /import \{ ProfileAboutSpecialties \} from "\.\/components\/profile-about-specialties";/,
  );
  assert.doesNotMatch(
    pagina,
    /import \{ ProfileAboutChip \} from "\.\/components\/profile-about-chip";/,
  );
});

test("painel preserva markup, texto, ordem e chave das especialidades", () => {
  assert.match(source, /<ProfileAboutPanel>/);
  assert.match(
    source,
    /<ProfileAboutPanelTitle>Especialidades<\/ProfileAboutPanelTitle>/,
  );
  assert.match(source, /<ProfileAboutChips>/);
  assert.match(
    source,
    /generosEspecialidadesPerfil\.map\(\(genero\) => \(/,
  );
  assert.match(
    source,
    /<ProfileAboutChip key=\{`sobre-genero-\$\{genero\}`\}>/,
  );
  assert.match(source, /\{genero\}/);
  assert.match(source, /<\/ProfileAboutChips>/);
  assert.match(source, /<\/ProfileAboutPanel>/);
});
