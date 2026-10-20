import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const diretorioAtual = path.dirname(fileURLToPath(import.meta.url));
const raizProjeto = path.resolve(diretorioAtual, "../..");
const lerArquivo = (caminho) =>
  readFileSync(path.join(raizProjeto, caminho), "utf8").replace(/\r\n/g, "\n");

const pagina = lerArquivo("app/seguindo/page.tsx");
const frame = lerArquivo("app/seguindo/components/seguindo-page-frame.tsx");
const css = lerArquivo("app/seguindo/lib/seguindo-page-css.ts");
const surfaceStyles = lerArquivo("app/seguindo/lib/seguindo-surface-styles.ts");

test("seguindoPageCss preserva o CSS global crítico de Seguindo", () => {
  assert.match(css, /export const seguindoPageCss = `/);
  assert.match(css, /@keyframes historietas-loading-spin/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.historietas-loading-spinner/);
  assert.match(css, /--historietas-seguindo-bg-page: #000000;/);
  assert.match(css, /nav a\[href="\/seguindo"\]/);
  assert.match(css, /\.historietas-bottom-nav-icon/);
  assert.match(css, /input::placeholder/);
  assert.match(css, /\.seguindo-summary-carousel::-webkit-scrollbar/);
});

test("Seguindo consome o CSS extraído sem mover responsabilidades da página", () => {
  const consumidor =
    "<style>{`${historietasThemeCss}${seguindoPageCss}`}</style>";

  assert.match(
    frame,
    /import \{ seguindoPageCss \} from "\.\.\/lib\/seguindo-page-css";/,
  );
  assert.doesNotMatch(pagina, /const seguindoPageCss = `/);
  assert.equal(frame.split(consumidor).length - 1, 1);
  assert.equal(
    pagina.includes("${seguindoPageCss}${historietasThemeCss}"),
    false,
  );
  assert.match(surfaceStyles, /export const mobileTopWaterFadeStyle: CSSProperties =/);
  assert.match(surfaceStyles, /export const desktopTopWaterFadeStyle: CSSProperties =/);
  assert.match(frame, /from "\.\.\/lib\/seguindo-surface-styles";/);
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/seguindo-loading-spinner";/,
  );
  assert.match(
    frame,
    /import \{ SeguindoLanguageBridge \} from "\.\/seguindo-language-bridge";/,
  );
  assert.match(pagina, /useSeguindoDesktopMode/);
  assert.match(pagina, /useSeguindoDataLoader/);
});
