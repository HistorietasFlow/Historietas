import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-recent-activity.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const contentViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-content-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const libraryViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-library-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const sectionSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const footerSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-footer.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Perfil de Autor delega a atividade recente do Sobre", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(pagina, /<ProfileAboutSection/);
  assert.match(
    sectionSource,
    /import \{ ProfileAboutFooter \} from "\.\/profile-about-footer";/,
  );
  assert.match(
    footerSource,
    /import \{ ProfileAboutRecentActivity \} from "\.\/profile-about-recent-activity";/,
  );
  assert.match(footerSource, /<ProfileAboutRecentActivity/);
  assert.doesNotMatch(
    pagina,
    /function renderizarAtividadeRecenteSobrePerfil\(/,
  );
});

test("componente preserva limite, loading, vazio e links da timeline", () => {
  assert.match(source, /items\.slice\(0, 8\)\.map/);
  assert.match(source, /getIsLoading=\{\(\) => loading\}/);
  assert.match(source, /getIsEmpty=\{\(\) => items\.length === 0\}/);
  assert.match(source, /obterHrefItemDiarioPerfil\(item\)/);
  assert.match(source, /dataDiarioPerfilFormatada\(item\.data\)/);
  assert.match(source, /expanded \? "Ocultar" : "Abrir"/);
});


test("Perfil de Autor deriva as atividades do Diário uma única vez", () => {
  assert.match(
    contentViewStateSource,
    /const atividadesDiarioPerfil = diarioPerfil\.atividades;/,
  );
  assert.equal(
    (contentViewStateSource.match(/diarioPerfil\.atividades/g) || []).length,
    1,
  );
  assert.match(
    libraryViewStateSource,
    /atividades: atividadesDiarioPerfil,/,
  );
  assert.match(
    pagina,
    /<ProfileAboutSection[\s\S]*?recentActivityItems=\{atividadesDiarioPerfil\}/,
  );
});
