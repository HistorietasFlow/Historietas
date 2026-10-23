import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../../app/publicar/lib/publicar-page-css.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const apresentacaoPagina = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-page-presentation.ts", import.meta.url),
  "utf8",
);
const shell = readFileSync(
  new URL("../../app/publicar/components/PublicarPageShell.tsx", import.meta.url),
  "utf8",
);
const backdrop = readFileSync(
  new URL("../../app/publicar/components/PublicarPageBackdrop.tsx", import.meta.url),
  "utf8",
);
const storage = readFileSync(
  new URL("../../app/publicar/lib/publicar-storage-operations.ts", import.meta.url),
  "utf8",
);
const acaoSubmissao = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hookSubmissao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);

test("publicarPageCss preserva o CSS global de Publicar", () => {
  assert.match(css, /export const publicarPageCss = `/);
  assert.match(css, /--historietas-publicar-bg-page/);
  assert.match(css, /body,\s*main/);
  assert.match(css, /nav a\[href="\/publicar"\]/);
  assert.match(css, /\.historietas-bottom-nav-icon/);
  assert.match(css, /input::placeholder/);
  assert.match(css, /input,\s*textarea,\s*select/);
});

test("Publicar mantem os consumidores e as fronteiras fora do CSS extraido", () => {
  assert.match(pagina, /import \{ PublicarPageBackdrop \} from "\.\/components\/PublicarPageBackdrop";/);
  assert.match(
    backdrop,
    /import \{ publicarPageCss \} from "\.\.\/lib\/publicar-page-css";/,
  );
  assert.doesNotMatch(pagina, /const publicarPageCss = `/);
  assert.doesNotMatch(backdrop, /const publicarPageCss = `/);

  const consumidoresPagina = pagina.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{publicarPageCss\}`\}<\/style>/g,
  );
  const consumidoresShell = shell.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{publicarPageCss\}`\}<\/style>/g,
  );
  const consumidoresBackdrop = backdrop.match(
    /<style>\{`\$\{historietasThemeCss\}\$\{publicarPageCss\}`\}<\/style>/g,
  );
  assert.equal(
    (consumidoresPagina?.length || 0) +
      (consumidoresShell?.length || 0) +
      (consumidoresBackdrop?.length || 0),
    2,
  );
  assert.doesNotMatch(
    pagina,
    /\$\{publicarPageCss\}\$\{historietasThemeCss\}/,
  );
  assert.doesNotMatch(
    shell,
    /\$\{publicarPageCss\}\$\{historietasThemeCss\}/,
  );
  assert.doesNotMatch(
    backdrop,
    /\$\{publicarPageCss\}\$\{historietasThemeCss\}/,
  );

  assert.match(
    pagina,
    /import \{ usePublicarPagePresentation \} from "\.\/hooks\/use-publicar-page-presentation";/,
  );
  assert.match(
    apresentacaoPagina,
    /from "\.\.\/lib\/publicar-layout-styles";/,
  );
  assert.match(apresentacaoPagina, /useHistorietasTheme\(pageStyle\)/);
  assert.doesNotMatch(pagina, /const safeTextStyle: CSSProperties/);
  assert.match(pagina, /const isDesktop = usePublicarDesktopMode\(\);/);
  assert.match(pagina, /import \{ usePublicarSubmission \} from "\.\/hooks\/use-publicar-submission";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-submission-action";/);
  assert.match(hookSubmissao, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-storage-operations";/);
  assert.match(acaoSubmissao, /from "\.\/publicar-storage-operations";/);
  assert.match(acaoSubmissao, /enviarArquivoStorage,/);
  assert.match(acaoSubmissao, /desfazerPublicacaoParcialPublicar,/);
  assert.doesNotMatch(pagina, /supabase\.storage/);
  assert.match(storage, /supabase\.storage/);
  assert.doesNotMatch(pagina, /async function salvarObra\(/);
  assert.match(hookSubmissao, /async function salvarObra\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(acaoSubmissao, /export async function salvarObraPublicar\(/);
});
