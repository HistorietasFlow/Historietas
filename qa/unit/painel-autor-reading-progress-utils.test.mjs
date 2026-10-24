import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-reading-progress-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const converterSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-work-converter.ts",
    import.meta.url,
  ),
  "utf8",
);
const metricasObrasSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-metrics.ts",
    import.meta.url,
  ),
  "utf8",
);
const workNormalizerSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obterCapitulosPublicadosPainel,
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("filtra somente capitulos explicitamente nao publicados e preserva identidade", () => {
  const primeiro = { id: "1", publicado: true, lido: false };
  const segundo = { id: "2", lido: true };
  const rascunho = { id: "3", publicado: false, lido: true };
  const publicados = obterCapitulosPublicadosPainel([primeiro, segundo, rascunho]);

  assert.deepEqual(publicados, [primeiro, segundo]);
  assert.equal(publicados[0], primeiro);
  assert.equal(publicados[1], segundo);
});

test("calcula progresso com capitulos publicados, lidos, arredondamento e fallback", () => {
  assert.equal(
    calcularProgressoLeitura([
      { publicado: true, lido: true },
      { publicado: true, lido: false },
      { publicado: true, lido: true },
    ]),
    67,
  );
  assert.equal(
    calcularProgressoLeitura([{ publicado: false, lido: true }]),
    0,
  );
  assert.equal(calcularProgressoLeitura([]), 0);
});

test("encontra o proximo capitulo nao lido apos o ultimo lido", () => {
  const primeiro = { id: "1", publicado: true, lido: true };
  const segundo = { id: "2", publicado: true, lido: false };
  const terceiro = { id: "3", publicado: true, lido: false };

  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [primeiro, segundo, terceiro],
      ultimoCapituloLidoId: "1",
    }),
    segundo,
  );
});

test("preserva fallbacks do capitulo para continuar", () => {
  const primeiro = { id: "1", publicado: true, lido: false };
  const ultimo = { id: "2", publicado: true, lido: true };

  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [primeiro, ultimo],
      ultimoCapituloLidoId: "inexistente",
    }),
    primeiro,
  );
  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [ultimo, { id: "3", publicado: false, lido: false }],
      ultimoCapituloLidoId: "2",
    }),
    ultimo,
  );
  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [{ id: "1", publicado: true, lido: false }],
      ultimoCapituloLidoId: "",
    }),
    null,
  );
});

test("Painel do Autor delega helpers puros de progresso às fronteiras corretas", () => {
  assert.match(
    pagina,
    /import \{ obterCapitulosPublicadosPainel \} from "\.\/lib\/painel-autor-reading-progress-utils";/,
  );
  assert.match(
    converterSource,
    /import \{ calcularProgressoLeitura \} from "\.\/painel-autor-reading-progress-utils";/,
  );
  assert.match(
    metricasObrasSource,
    /import \{[\s\S]*?calcularProgressoLeitura,[\s\S]*?encontrarCapituloParaContinuar,[\s\S]*?obterCapitulosPublicadosPainel,[\s\S]*?\} from "\.\/painel-autor-reading-progress-utils";/,
  );
  assert.match(
    workNormalizerSource,
    /import \{ calcularProgressoLeitura \} from "\.\/painel-autor-reading-progress-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterCapitulosPublicadosPainel\(/);
  assert.doesNotMatch(pagina, /function calcularProgressoLeitura\(/);
  assert.doesNotMatch(pagina, /function encontrarCapituloParaContinuar\(/);
  assert.equal((pagina.match(/\bobterCapitulosPublicadosPainel\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bcalcularProgressoLeitura\b/g) || []).length, 0);
  assert.doesNotMatch(pagina, /\bencontrarCapituloParaContinuar\b/);
  assert.match(
    converterSource,
    /progressoLeitura: calcularProgressoLeitura\(capitulosMesclados\)/,
  );
  assert.match(
    pagina,
    /import \{ normalizarObraPainel \} from "\.\/lib\/painel-autor-work-normalizer";/,
  );
  assert.match(
    workNormalizerSource,
    /progressoLeitura: calcularProgressoLeitura\(capitulosNormalizados\)/,
  );
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect/);
});
