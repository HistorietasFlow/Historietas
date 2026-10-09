import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssModule = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("adminComunidadePageCss preserva o CSS global crítico", () => {
  assert.match(cssModule, /export const adminComunidadePageCss = `/);
  assert.match(cssModule, /--historietas-admin-comunidade-bg-page: #000000;/);
  assert.match(cssModule, /html\[data-historietas-tema-visual="foco"\]/);
  assert.match(cssModule, /nav a\[href="\/admin\/comunidade"\]/);
  assert.match(cssModule, /\.historietas-bottom-nav-icon/);
  assert.match(cssModule, /\.admin-comunidade-filter-buttons::-webkit-scrollbar/);
  assert.match(cssModule, /@media \(max-width: 760px\)/);
  assert.match(cssModule, /grid-template-columns: minmax\(0, 1fr\) auto !important;/);
  assert.match(cssModule, /!important/);
});

test("Admin Comunidade mantém os quatro consumidores e as fronteiras sensíveis", () => {
  assert.match(
    pagina,
    /import \{ adminComunidadePageCss \} from "\.\/lib\/admin-comunidade-page-css";/,
  );
  assert.doesNotMatch(pagina, /const adminComunidadePageCss = `/);
  assert.equal(
    (
      pagina.match(
        /<style>\{`\$\{historietasThemeCss\}\$\{adminComunidadePageCss\}`\}<\/style>/g,
      ) || []
    ).length,
    4,
  );
  assert.doesNotMatch(
    pagina,
    /\$\{adminComunidadePageCss\}\$\{historietasThemeCss\}/,
  );
  assert.match(pagina, /const safeTextStyle: CSSProperties =/);
  assert.match(
    pagina,
    /import \{ AdminComunidadeLanguageBridge \} from "\.\/components\/admin-comunidade-language-bridge";/,
  );
  assert.doesNotMatch(pagina, /function AdminComunidadeLanguageBridge\(\)/);
  assert.match(pagina, /useAdminComunidadeDesktopMode\(\)/);
  assert.match(pagina, /async function iniciarModeracao\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /async function atualizarStatusDenuncia\(/);
  assert.match(pagina, /const \[statusFiltro, setStatusFiltro\] = useState/);
});
