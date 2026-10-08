import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const componente = readFileSync(
  new URL("../../app/listas/components/listas-rating-detail.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);

const componenteExecutavel = componente
  .replace(/\r\n/g, "\n")
  .replace('import type { CSSProperties } from "react";\n\n', "")
  .replace(
    /import \{\n  formatarDataCurta,\n  formatarNotaListas,\n\} from "\.\.\/lib\/listas-format-utils";\n\n/,
    [
      "const React = {",
      "  createElement: (type, props, ...children) => ({",
      "    type,",
      "    props: { ...props, children },",
      "  }),",
      "};",
      "const formatarNotaListas = (nota) => String(nota);",
      "const formatarDataCurta = (data) => `data:${data}`;",
      "",
    ].join("\n"),
  )
  .replace("export default function ListasRatingDetail", "function ListasRatingDetail")
  .concat("\nexport { ListasRatingDetail };\n");
const componenteJavascript = typescript.transpileModule(componenteExecutavel, {
  compilerOptions: {
    jsx: typescript.JsxEmit.React,
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { ListasRatingDetail } = await import(
  `data:text/javascript;base64,${Buffer.from(componenteJavascript).toString("base64")}`,
);

test("ListasRatingDetail preserva props, formatadores e estilos exclusivos", () => {
  assert.match(componente, /export default function ListasRatingDetail/);
  assert.match(componente, /nota: number;/);
  assert.match(componente, /data: string;/);
  assert.doesNotMatch(componente, /item:/);
  assert.match(componente, /formatarNotaListas/);
  assert.match(componente, /formatarDataCurta/);

  for (const estilo of [
    "ratingDetailStyle",
    "ratingStarsStyle",
    "ratingStarSlotStyle",
    "ratingStarEmptyStyle",
    "ratingStarFillClipStyle",
    "ratingStarFilledStyle",
  ]) {
    assert.match(componente, new RegExp(`const ${estilo}: CSSProperties`));
    assert.doesNotMatch(pagina, new RegExp(`\\b${estilo}\\b`));
  }

  assert.match(componente, /gap: "7px"/);
  assert.match(componente, /gap: "1px"/);
  assert.match(componente, /fontSize: "14px"/);
  assert.match(componente, /width: "1em"/);
  assert.match(componente, /height: "1em"/);
  assert.match(componente, /color: "rgba\(255,255,255,0\.22\)"/);
  assert.match(componente, /overflow: "hidden"/);
  assert.match(componente, /color: "#F6C453"/);
});

test("ListasRatingDetail normaliza, limita o preenchimento e renderiza cinco estrelas", () => {
  const detalhe = ListasRatingDetail({ nota: 3.3, data: "2026-10-08" });
  const [estrelas, texto] = detalhe.props.children;
  const slots = estrelas.props.children[0];

  assert.equal(detalhe.type, "span");
  assert.equal(detalhe.props["aria-label"], "3.5 de 5 estrelas");
  assert.equal(estrelas.props["aria-hidden"], "true");
  assert.equal(slots.length, 5);
  assert.equal(slots[0].props.key, 0);
  assert.equal(slots[3].props.children.length, 2);
  assert.equal(slots[3].props.children[1].props.style.width, "50%");
  assert.equal(slots[4].props.children[1], false);
  assert.deepEqual(texto.props.children, ["3.5", " • ", "data:2026-10-08"]);

  const limiteInferior = ListasRatingDetail({ nota: -3, data: "d" });
  const limiteSuperior = ListasRatingDetail({ nota: 7, data: "d" });

  assert.equal(limiteInferior.props["aria-label"], "0 de 5 estrelas");
  assert.equal(limiteSuperior.props["aria-label"], "5 de 5 estrelas");
});

test("Listas delega o detalhe somente ao ramo de avaliações", () => {
  assert.match(
    pagina,
    /import ListasRatingDetail from "\.\/components\/listas-rating-detail";/,
  );
  assert.doesNotMatch(pagina, /function renderizarEstrelasAvaliacao\(/);
  assert.equal((pagina.match(/<ListasRatingDetail\b/g) || []).length, 1);
  assert.match(
    pagina,
    /categoriaAtual === "avaliacoes"\s*\? <ListasRatingDetail nota=\{item\.nota\} data=\{item\.data\} \/>\s*: categoriaAtual === "tudo"\s*\? formatarLeituraMesAno\(item\.ultimaLeituraEm \|\| ""\)\s*: textoSecundarioItem\(item, categoriaAtual\)/,
  );
  assert.match(pagina, /function renderizarItemObra\(/);
  assert.match(pagina, /formatarNotaListas\(item\.nota\)/);
  assert.match(pagina, /supabase/);
  assert.match(pagina, /useState/);
  assert.match(pagina, /useEffect/);
});
