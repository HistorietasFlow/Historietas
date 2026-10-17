import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const shell = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-page-shell.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("EmAltaPageShell preserva os dois ramos visuais da página", () => {
  assert.match(shell, /import type \{ CSSProperties, ReactNode \} from "react";/);
  assert.match(
    shell,
    /import \{ historietasThemeCss \} from "\.\.\/\.\.\/\.\.\/lib\/historietasTheme";/,
  );
  assert.match(shell, /import \{ emAltaPageCss \} from "\.\.\/lib\/em-alta-page-css";/);
  assert.match(shell, /import \{ EmAltaLanguageBridge \} from "\.\/em-alta-language-bridge";/);
  assert.match(shell, /export function EmAltaPageShell\(/);
  assert.match(shell, /carregando\?: boolean;/);
  assert.match(shell, /children: ReactNode;/);
  assert.match(shell, /pageThemeStyle: CSSProperties;/);
  assert.match(shell, /if \(carregando\) \{/);
  assert.equal((shell.match(/className="historietas-em-alta-page"/g) || []).length, 2);
  assert.equal((shell.match(/data-historietas-em-alta-root="true"/g) || []).length, 2);
  assert.equal((shell.match(/<style>\{`\$\{historietasThemeCss\}\$\{emAltaPageCss\}`\}<\/style>/g) || []).length, 2);
  assert.equal((shell.match(/<EmAltaLanguageBridge \/>/g) || []).length, 2);
  assert.equal((shell.match(/\{children\}/g) || []).length, 2);
  assert.match(shell, /aria-busy="true"/);
  assert.doesNotMatch(shell, /useEffect|useMemo|useState|supabase|localStorage|window\.|document\./);
});

test("Em Alta delega só o shell e mantém os ramos de carregamento e conteúdo", () => {
  assert.match(
    pagina,
    /import \{ EmAltaPageShell \} from "\.\/components\/em-alta-page-shell";/,
  );
  assert.match(pagina, /if \(carregandoRanking\)/);
  assert.match(
    pagina,
    /<EmAltaPageShell pageThemeStyle=\{pageThemeStyle\} carregando>\s*<LoadingSpinner label="Carregando Em Alta" \/>\s*<\/EmAltaPageShell>/,
  );
  assert.match(
    pagina,
    /return \(\s*<EmAltaPageShell pageThemeStyle=\{pageThemeStyle\}>\s*<EmAltaPageDecorations/,
  );
  assert.doesNotMatch(pagina, /data-historietas-em-alta-root="true"/);
  assert.doesNotMatch(pagina, /historietasThemeCss/);
  assert.doesNotMatch(pagina, /emAltaPageCss/);
  assert.match(pagina, /async function carregarRanking\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
