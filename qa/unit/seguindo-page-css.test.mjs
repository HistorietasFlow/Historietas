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
const css = lerArquivo("app/seguindo/lib/seguindo-page-css.ts");

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
    pagina,
    /import \{ seguindoPageCss \} from "\.\/lib\/seguindo-page-css";/,
  );
  assert.doesNotMatch(pagina, /const seguindoPageCss = `/);
  assert.equal(pagina.split(consumidor).length - 1, 2);
  assert.equal(
    pagina.includes("${seguindoPageCss}${historietasThemeCss}"),
    false,
  );
  assert.match(pagina, /const mobileTopWaterFadeStyle: CSSProperties =/);
  assert.match(pagina, /const desktopTopWaterFadeStyle: CSSProperties =/);
  assert.match(
    pagina,
    /import \{ LoadingSpinner \} from "\.\/components\/seguindo-loading-spinner";/,
  );
  assert.match(pagina, /function SeguindoLanguageBridge\(/);
  assert.match(pagina, /useSeguindoDesktopMode/);
  assert.match(pagina, /carregarAtividadesSeguindoSupabase/);
  assert.match(pagina, /lerJsonStorageUsuarioSeguindo/);
});
