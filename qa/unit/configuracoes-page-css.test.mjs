import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../../app/configuracoes/lib/configuracoes-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const loadingState = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-loading-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const accessOrchestrationHook = readFileSync(
  new URL(
    "../../app/configuracoes/hooks/use-configuracoes-access-orchestration.ts",
    import.meta.url,
  ),
  "utf8",
);
const content = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const styles = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-settings-primitives-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const secoesAcoesConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-actions-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("configuracoesPageCss preserva as regras globais de Configurações", () => {
  assert.match(css, /export const configuracoesPageCss = `/);
  assert.match(css, /--configuracoes-page-bg: #000000;/);
  assert.match(css, /--historietas-input-text: #FFFFFF;/);
  assert.match(css, /html body,\s*html main/);
  assert.match(css, /\.configuracoes-input::placeholder/);
  assert.match(css, /\.configuracoes-input-transparente/);
  assert.match(css, /\.configuracoes-theme-swatch/);
  assert.match(css, /\[data-tema-visual-opcao="foco"\]/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.historietas-loading-spinner/);
  assert.match(css, /::-webkit-search-cancel-button/);
});

test("Configurações mantém os dois consumidores e suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ configuracoesPageCss \} from "\.\/lib\/configuracoes-page-css";/,
  );
  assert.doesNotMatch(pagina, /const configuracoesPageCss = `/);

  const consumidores = pagina.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{configuracoesPageCss\}`\}<\/style>/g,
  );
  assert.equal(consumidores?.length, 1);
  assert.match(
    loadingState,
    /<style>\{`\$\{themeCss\}\$\{pageCss\}`\}<\/style>/,
  );
  assert.doesNotMatch(
    pagina,
    /\$\{configuracoesPageCss\}\$\{historietasThemeCss\}/,
  );
  assert.match(
    secoesAcoesConta,
    /from "\.\.\/lib\/configuracoes-settings-primitives-styles";/,
  );
  assert.match(content, /<ConfiguracoesAccountActionsSection/);
  assert.doesNotMatch(pagina, /const safeTextStyle: CSSProperties =/);
  assert.match(styles, /export const safeTextStyle: CSSProperties =/);
  assert.match(styles, /overflowWrap: "anywhere"/);
  assert.match(styles, /wordBreak: "break-word"/);
  assert.match(
    loadingState,
    /import \{ LoadingSpinner \} from "\.\/configuracoes-loading-spinner";/,
  );
  assert.doesNotMatch(pagina, /function LoadingSpinner\(/);
  assert.match(pagina, /if \(verificandoAcesso\) \{/);
  assert.match(
    accessOrchestrationHook,
    /import \{ useConfiguracoesInitialAccess \} from "\.\/use-configuracoes-initial-access";/,
  );
  assert.match(pagina, /useConfiguracoesAccessOrchestration\(\{/);
  assert.match(accessOrchestrationHook, /useConfiguracoesInitialAccess\(\{/);
  assert.doesNotMatch(pagina, /async function verificarAcesso\(/);
});
