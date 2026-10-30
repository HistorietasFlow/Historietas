import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/excluir-conta/page.tsx", import.meta.url),
  "utf8",
);
const cssSource = readFileSync(
  new URL(
    "../../app/excluir-conta/styles/excluir-conta-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const actionSource = readFileSync(
  new URL(
    "../../app/excluir-conta/hooks/use-excluir-conta-request-action.ts",
    import.meta.url,
  ),
  "utf8",
);

test("CSS estático de excluir conta foi movido sem alterar o contrato visual", () => {
  assert.match(
    cssSource,
    /export const excluirContaPageCss = `/,
  );
  assert.match(cssSource, /\.exclusao-conta-page/);
  assert.match(cssSource, /\.exclusao-conta-honeypot/);
  assert.match(cssSource, /@media \(max-width: 560px\)/);
  assert.match(cssSource, /!important/);
  assert.doesNotMatch(pageSource, /^const pageCss =/m);
  assert.match(
    pageSource,
    /import \{ excluirContaPageCss \} from "\.\/styles\/excluir-conta-page-css";/,
  );
  assert.match(
    pageSource,
    /<style>\{`\$\{historietasThemeCss\}\$\{excluirContaPageCss\}`\}<\/style>/,
  );
});

test("ação de solicitação preserva o contrato do endpoint e seus resets", () => {
  assert.match(
    actionSource,
    /export function useExcluirContaRequestAction\(/,
  );
  assert.match(
    actionSource,
    /event\.preventDefault\(\);/,
  );
  assert.match(actionSource, /if \(enviando\) return;/);
  assert.match(
    actionSource,
    /setErro\(""\);\s*setEnviando\(true\);/,
  );
  assert.match(
    actionSource,
    /fetch\("\/api\/conta\/solicitar-exclusao", \{/,
  );
  assert.match(actionSource, /method: "POST"/);
  assert.match(actionSource, /credentials: "same-origin"/);
  assert.match(
    actionSource,
    /headers: \{ "Content-Type": "application\/json" \}/,
  );
  assert.match(
    actionSource,
    /JSON\.stringify\(\{\s*email,\s*motivo,\s*confirmacao,\s*website,\s*\}\)/,
  );
  assert.match(
    actionSource,
    /await response\.json\(\)\.catch\(\(\) => null\)/,
  );
  assert.match(actionSource, /if \(!response\.ok \|\| !data\?\.ok\)/);
  assert.match(actionSource, /data\?\.mensagem \|\|/);
  assert.match(
    actionSource,
    /setEnviado\(true\);\s*setEmail\(""\);\s*setMotivo\(""\);\s*setConfirmacao\(false\);\s*setWebsite\(""\);/,
  );
  assert.match(
    actionSource,
    /finally \{\s*setEnviando\(false\);\s*\}/,
  );
});

test("página mantém o formulário e o honeypot sob sua responsabilidade", () => {
  assert.match(
    pageSource,
    /import \{ useExcluirContaRequestAction \} from "\.\/hooks\/use-excluir-conta-request-action";/,
  );
  assert.match(
    pageSource,
    /const \{ enviarSolicitacao \} = useExcluirContaRequestAction\(\{[\s\S]*?email,[\s\S]*?motivo,[\s\S]*?confirmacao,[\s\S]*?website,[\s\S]*?enviando,[\s\S]*?t,[\s\S]*?setEmail,[\s\S]*?setMotivo,[\s\S]*?setConfirmacao,[\s\S]*?setWebsite,[\s\S]*?setEnviando,[\s\S]*?setErro,[\s\S]*?setEnviado,[\s\S]*?\}\);/,
  );
  assert.match(
    pageSource,
    /<form onSubmit=\{enviarSolicitacao\} className="exclusao-conta-form">/,
  );
  assert.doesNotMatch(pageSource, /async function enviarSolicitacao/);
  assert.match(
    pageSource,
    /className="exclusao-conta-honeypot" aria-hidden="true"/,
  );
  assert.match(pageSource, /type="text"/);
  assert.match(pageSource, /name="website"/);
  assert.match(pageSource, /value=\{website\}/);
  assert.match(pageSource, /autoComplete="off"/);
  assert.match(pageSource, /tabIndex=\{-1\}/);
  assert.match(pageSource, /maxLength=\{254\}/);
  assert.match(pageSource, /maxLength=\{1000\}/);
});
