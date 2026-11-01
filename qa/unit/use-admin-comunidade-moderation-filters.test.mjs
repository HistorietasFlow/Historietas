import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-moderation-filters.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("hook centralizes moderation filters, search, and menu closure", () => {
  assert.match(hookSource, /useState<StatusFiltroDenuncia>\(\s*"todas"\s*\)/);
  assert.match(hookSource, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(hookSource, /const \[buscaModeracaoAberta, setBuscaModeracaoAberta\] = useState\(false\);/);
  assert.match(hookSource, /const \[mostrarFiltrosModeracao, setMostrarFiltrosModeracao\] = useState\(false\);/);
  assert.match(hookSource, /filtrarDenunciasModeracao\(denuncias, statusFiltro, busca\)/);
  assert.match(hookSource, /filtrarDenunciasPerfisModeracao\([\s\S]*?denunciasPerfis,[\s\S]*?statusFiltro,[\s\S]*?busca/);
  assert.match(hookSource, /window\.setTimeout\(\(\) => \{\s*setMenuDenunciaAbertoId\(""\);\s*\}, 0\);/);
  assert.match(hookSource, /window\.clearTimeout\(fecharMenuTimer\);/);
  assert.match(hookSource, /\[busca, setMenuDenunciaAbertoId, statusFiltro\]/);
  assert.match(hookSource, /function limparFiltros\(\) \{[\s\S]*?setStatusFiltro\("todas"\);[\s\S]*?setBusca\(""\);[\s\S]*?setBuscaModeracaoAberta\(false\);[\s\S]*?setMostrarFiltrosModeracao\(false\);/);
});

test("page delegates filters without retaining lifecycle or queries", () => {
  assert.match(
    pageSource,
    /import \{ useAdminComunidadeModerationFilters \} from "\.\/hooks\/use-admin-comunidade-moderation-filters";/,
  );
  assert.match(pageSource, /useAdminComunidadeModerationFilters\(/);
  assert.doesNotMatch(pageSource, /const \[statusFiltro, setStatusFiltro\] = useState/);
  assert.doesNotMatch(pageSource, /function limparFiltros\(\)/);
  assert.doesNotMatch(pageSource, /window\.setTimeout\(\(\) => \{\s*setMenuDenunciaAbertoId\(""\);/);
  assert.doesNotMatch(hookSource, /supabase|\.from\(|auth\.getUser|router|localStorage|sessionStorage/i);
  assert.doesNotMatch(hookSource, /style=|className=|aria-/);
});
