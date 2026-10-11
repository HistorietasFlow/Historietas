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

test("Perfil de Autor delega a atividade recente do Sobre", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutRecentActivity \} from "\.\/components\/profile-about-recent-activity";/,
  );
  assert.match(pagina, /<ProfileAboutRecentActivity/);
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
