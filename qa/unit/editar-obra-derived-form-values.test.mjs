import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-derived-form-values.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const derivedStateSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-form-derived-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source
      .replace(
        'import { normalizarTexto } from "../../../lib/utils";',
        'const normalizarTexto = (texto) => texto.trim().toLowerCase().replace(/\\s+/g, " ");',
      )
      .replace(
        'import { textoPersonalizadoValido } from "./editar-obra-custom-value-utils";',
        'const textoPersonalizadoValido = (texto, minimo, limite) => { const textoLimpo = texto.trim().replace(/\\s+/g, " "); return textoLimpo.length >= minimo && textoLimpo.length <= limite; };',
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { calcularValoresDerivadosFormularioEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const limites = {
  outroFormatoValue: "__outro_formato__",
  outroGeneroValue: "__outro_genero__",
  limiteCaracteresFormatoGeneroPersonalizado: 14,
  limiteCaracteresTagPersonalizada: 10,
};

test("calcula valores personalizados, normalização e validação de tag", () => {
  assert.deepEqual(
    calcularValoresDerivadosFormularioEdicaoObra({
      ...limites,
      formato: "__outro_formato__",
      genero: "__outro_genero__",
      formatoPersonalizado: "  Novo   formato  ",
      generoPersonalizado: "  Novo   gênero  ",
      tagPersonalizada: "  Tag   livre  ",
      usarTagPersonalizada: true,
    }),
    {
      formatoEhPersonalizado: true,
      generoEhPersonalizado: true,
      formatoFinal: "Novo formato",
      generoFinal: "Novo gênero",
      tagPersonalizadaFinal: "Tag livre",
      formatoPersonalizadoValido: true,
      generoPersonalizadoValido: true,
      tagPersonalizadaValida: true,
    },
  );
});

test("preserva valores comuns e bloqueia tag repetida ou inválida", () => {
  const valores = calcularValoresDerivadosFormularioEdicaoObra({
    ...limites,
    formato: "  HQ  ",
    genero: " Fantasia ",
    formatoPersonalizado: "",
    generoPersonalizado: "",
    tagPersonalizada: " fantasia ",
    usarTagPersonalizada: true,
  });

  assert.equal(valores.formatoEhPersonalizado, false);
  assert.equal(valores.generoEhPersonalizado, false);
  assert.equal(valores.formatoFinal, "HQ");
  assert.equal(valores.generoFinal, "Fantasia");
  assert.equal(valores.tagPersonalizadaValida, false);
  assert.equal(
    calcularValoresDerivadosFormularioEdicaoObra({ ...limites, formato: "HQ", genero: "Fantasia", formatoPersonalizado: "", generoPersonalizado: "", tagPersonalizada: " ", usarTagPersonalizada: false }).tagPersonalizadaValida,
    true,
  );
});

test("Editar Obra delega somente os valores derivados do formulário", () => {
  assert.match(
    pageSource,
    /import \{ useEditarObraFormDerivedState \} from "\.\/hooks\/use-editar-obra-form-derived-state";/,
  );
  assert.match(
    derivedStateSource,
    /\} = calcularValoresDerivadosFormularioEdicaoObra\(\{[\s\S]*?outroFormatoValue: OUTRO_FORMATO_VALUE,[\s\S]*?outroGeneroValue: OUTRO_GENERO_VALUE,/,
  );
  assert.match(source, /formato === outroFormatoValue/);
  assert.match(source, /genero === outroGeneroValue/);
  assert.match(source, /textoPersonalizadoValido\([\s\S]*?formatoPersonalizado,[\s\S]*?3,/);
  assert.match(source, /textoPersonalizadoValido\([\s\S]*?generoPersonalizado,[\s\S]*?3,/);
  assert.match(source, /textoPersonalizadoValido\(\n      tagPersonalizada,\n      2,/);
  assert.match(source, /normalizarTexto\(tagPersonalizadaFinal\) !== normalizarTexto\(formatoFinal\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
