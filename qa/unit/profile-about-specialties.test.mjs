import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
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
    /import \{ ProfileAboutSpecialties \} from "\.\/components\/profile-about-specialties";/,
  );
  assert.match(
    pagina,
    /<ProfileAboutSpecialties[\s\S]*?generosEspecialidadesPerfil=\{generosEspecialidadesPerfil\}[\s\S]*?\/>/,
  );
  assert.doesNotMatch(
    pagina,
    /import \{ ProfileAboutChips \} from "\.\/components\/profile-about-chips";/,
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
