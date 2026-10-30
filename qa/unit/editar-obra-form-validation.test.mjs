import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-form-validation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
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
        'import { ehClassificacao18 } from "../../../lib/historietasAdultContent";',
        'const ehClassificacao18 = (valor) => typeof valor === "string" && valor.trim() === "18+";',
      )
      .replace(
        'import { contarLetrasNumeros } from "./editar-obra-custom-value-utils";',
        'const contarLetrasNumeros = (texto) => (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;',
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const {
  calcularProgressoFormularioEdicaoObra,
  validarFormularioEdicaoObra,
} = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

function criarFormulario(valores = {}) {
  return {
    titulo: "Uma obra válida",
    autor: "Autora válida",
    autorProfileAtivo: "",
    generoFinal: "Fantasia",
    generoEhPersonalizado: false,
    generoPersonalizadoValido: true,
    formatoFinal: "HQ",
    formatoEhPersonalizado: false,
    formatoPersonalizadoValido: true,
    tagPersonalizadaValida: true,
    classificacaoIndicativa: "Livre",
    avisosConteudo18: [],
    sinopse: "Uma sinopse com letras e números suficientes.",
    ...valores,
  };
}

test("validação de Editar Obra preserva formulário válido e prioridade das mensagens", () => {
  assert.equal(validarFormularioEdicaoObra(criarFormulario()), "");
  assert.equal(
    validarFormularioEdicaoObra(criarFormulario({ titulo: "a", autor: "b" })),
    "O título precisa ter pelo menos 3 letras ou números.",
  );
  assert.equal(
    validarFormularioEdicaoObra(criarFormulario({ autor: "a" })),
    "O autor precisa ter pelo menos 2 letras ou números.",
  );
  assert.equal(
    validarFormularioEdicaoObra(criarFormulario({
      autor: "a",
      autorProfileAtivo: "Autora do perfil",
    })),
    "",
  );
});

test("validação de Editar Obra preserva formato, gênero, tag e classificação", () => {
  const casos = [
    [{ formatoFinal: "" }, "Escolha um formato para a obra."],
    [{ formatoEhPersonalizado: true, formatoPersonalizadoValido: false }, "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."],
    [{ generoFinal: "" }, "Escolha um gênero para a obra."],
    [{ generoEhPersonalizado: true, generoPersonalizadoValido: false }, "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."],
    [{ tagPersonalizadaValida: false }, "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato."],
    [{ classificacaoIndicativa: "" }, "Escolha a classificação indicativa da obra."],
    [{ classificacaoIndicativa: "Não informado" }, "Escolha a classificação indicativa da obra."],
    [{ classificacaoIndicativa: "Não informada" }, "Escolha a classificação indicativa da obra."],
  ];

  for (const [valores, mensagem] of casos) {
    assert.equal(validarFormularioEdicaoObra(criarFormulario(valores)), mensagem);
  }
});

test("validação de Editar Obra preserva os requisitos de conteúdo 18+ e sinopse", () => {
  assert.equal(
    validarFormularioEdicaoObra(criarFormulario({ classificacaoIndicativa: "18+" })),
    "Selecione pelo menos um aviso de conteúdo para a obra 18+.",
  );
  assert.equal(
    validarFormularioEdicaoObra(criarFormulario({
      classificacaoIndicativa: "18+",
      avisosConteudo18: ["violência"],
    })),
    "",
  );
  assert.equal(
    validarFormularioEdicaoObra(criarFormulario({ sinopse: "curta" })),
    "A sinopse precisa ter pelo menos 20 letras ou números.",
  );
});

test("progresso de Editar Obra preserva critérios, arredondamento e autoria do campo", () => {
  assert.equal(calcularProgressoFormularioEdicaoObra(criarFormulario({
    titulo: "",
    autor: "",
    autorProfileAtivo: "Perfil válido",
    generoFinal: "",
    formatoFinal: "",
    classificacaoIndicativa: "",
    sinopse: "",
  })), 0);
  assert.equal(calcularProgressoFormularioEdicaoObra(criarFormulario()), 100);
  assert.equal(calcularProgressoFormularioEdicaoObra(criarFormulario({
    formatoPersonalizadoValido: false,
    generoPersonalizadoValido: false,
  })), 67);
  assert.equal(calcularProgressoFormularioEdicaoObra(criarFormulario({
    classificacaoIndicativa: "18+",
  })), 83);
  assert.equal(calcularProgressoFormularioEdicaoObra(criarFormulario({
    classificacaoIndicativa: "18+",
    avisosConteudo18: ["violência"],
  })), 100);
  assert.equal(calcularProgressoFormularioEdicaoObra(criarFormulario({
    autor: "",
    autorProfileAtivo: "Perfil válido",
  })), 83);
});

test("Editar Obra delega somente validação e progresso do formulário", () => {
  assert.match(
    saveActionSource,
    /import \{ validarFormularioEdicaoObra \} from "\.\.\/lib\/editar-obra-form-validation";/,
  );
  assert.doesNotMatch(pageSource, /function validarFormulario\(/);
  assert.match(
    derivedStateSource,
    /const progresso = useMemo\(\(\) => calcularProgressoFormularioEdicaoObra\(\{[\s\S]*?\}\), \[/,
  );
  assert.match(
    pageSource,
    /import \{ useEditarObraFormDerivedState \} from "\.\/hooks\/use-editar-obra-form-derived-state";/,
  );
  assert.match(
    saveActionSource,
    /const erroValidacao = validarFormularioEdicaoObra\(\{[\s\S]*?autorProfileAtivo,[\s\S]*?tagPersonalizadaValida,[\s\S]*?\}\);/,
  );
  assert.match(source, /import \{ ehClassificacao18 \} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";/);
  assert.match(source, /import \{ contarLetrasNumeros \} from "\.\/editar-obra-custom-value-utils";/);
  assert.match(source, /Math\.round\(\(camposValidos \/ 6\) \* 100\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
