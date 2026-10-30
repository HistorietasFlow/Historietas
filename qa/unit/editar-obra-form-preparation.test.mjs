import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-form-preparation.ts", import.meta.url),
  "utf8",
);
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";/,
        'const normalizarAvisosConteudo18 = (avisos, classificacao) => [classificacao, ...avisos];',
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\/editar-obra-custom-value-utils";/,
        `const limparTextoPersonalizado = (texto, limite) => texto.replace(/!/g, "").slice(0, limite);
const opcaoExiste = (opcoes, valor) => opcoes.some((opcao) => opcao.toLowerCase() === valor.toLowerCase());
const prepararValorEditavel = (valor, opcoes, outroValue, limite) => opcaoExiste(opcoes, valor)
  ? { selecionado: valor, personalizado: "" }
  : { selecionado: outroValue, personalizado: valor.slice(0, limite) };`,
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\/editar-obra-format-utils";/,
        "const formatarFormatoEdicaoObra = (valor) => valor.trim();\nconst formatarGeneroEdicaoObra = (valor) => valor.trim();",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { prepararValoresFormularioEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const opcoes = {
  opcoesFormato: ["HQ"],
  opcoesGenero: ["Fantasia"],
  opcoesTags: ["Sombria"],
  outroFormatoValue: "__outro_formato__",
  outroGeneroValue: "__outro_genero__",
  limiteCaracteresFormatoGeneroPersonalizado: 14,
  limiteCaracteresTagPersonalizada: 10,
};

test("prepara valores do formulário com profile, fallbacks e tag personalizada", () => {
  const valores = prepararValoresFormularioEdicaoObra({
    ...opcoes,
    nomeAutorProfileAtual: "  Autora do perfil  ",
    obraAtual: {
      titulo: "Obra",
      autor: "Autora da obra",
      formato: " Outro formato ",
      genero: " Outro gênero ",
      classificacaoIndicativa: "Não informada",
      avisosConteudo: ["violência"],
      sinopse: "Sinopse",
      tags: ["sem tags", " Tag! personalizada "],
      capa: "capa.png",
      capaNome: "Capa",
      arquivoObra: { nome: "obra.pdf" },
    },
  });

  assert.deepEqual(valores, {
    titulo: "Obra",
    autor: "Autora do perfil",
    genero: "__outro_genero__",
    generoPersonalizado: "Outro gênero",
    formato: "__outro_formato__",
    formatoPersonalizado: "Outro formato",
    classificacaoIndicativa: "Livre",
    avisosConteudo18: ["Não informada", "violência"],
    sinopse: "Sinopse",
    usarTagPersonalizada: true,
    tagPersonalizada: "Tag perso",
    tags: " Tag! personalizada ",
    capa: "capa.png",
    capaNome: "Capa",
    arquivoObra: { nome: "obra.pdf" },
  });
});

test("prepara valores padrão sem profile nem tag personalizada", () => {
  const valores = prepararValoresFormularioEdicaoObra({
    ...opcoes,
    obraAtual: {
      titulo: "Obra",
      autor: "Autora da obra",
      formato: "HQ",
      genero: "Fantasia",
      classificacaoIndicativa: "12 anos",
      avisosConteudo: [],
      sinopse: "Sinopse",
      tags: ["Sombria"],
      capa: "",
      capaNome: "",
      arquivoObra: null,
    },
  });

  assert.equal(valores.autor, "Autora da obra");
  assert.equal(valores.formato, "HQ");
  assert.equal(valores.genero, "Fantasia");
  assert.equal(valores.usarTagPersonalizada, false);
  assert.equal(valores.tagPersonalizada, "");
  assert.equal(valores.tags, "Sombria");
  assert.equal(valores.arquivoObra, null);
});

test("Editar Obra delega somente a preparação pura antes dos setters", () => {
  assert.match(
    initialLoadSource,
    /import \{ prepararValoresFormularioEdicaoObra \} from "\.\.\/lib\/editar-obra-form-preparation";/,
  );
  assert.match(initialLoadSource, /function aplicarObraNoFormulario\(/);
  assert.match(
    initialLoadSource,
    /const valoresFormulario = prepararValoresFormularioEdicaoObra\(\{[\s\S]*?obraAtual,[\s\S]*?nomeAutorProfileAtual,[\s\S]*?opcoesFormato: OPCOES_FORMATO_OBRA,[\s\S]*?opcoesGenero: OPCOES_GENERO_OBRA,[\s\S]*?opcoesTags: OPCOES_TAGS_OBRA,/,
  );
  assert.match(initialLoadSource, /setTitulo\(valoresFormulario\.titulo\);[\s\S]*?setArquivoObra\(valoresFormulario\.arquivoObra\);/);
  assert.match(source, /prepararValorEditavel\(/);
  assert.match(source, /formatarFormatoEdicaoObra\(obraAtual\.formato\)/);
  assert.match(source, /formatarGeneroEdicaoObra\(obraAtual\.genero\)/);
  assert.match(source, /opcaoExiste\(opcoesTags, primeiraTag\)/);
  assert.match(source, /limparTextoPersonalizado\(primeiraTag, limiteCaracteresTagPersonalizada\)\.trim\(\)/);
  assert.match(source, /normalizarAvisosConteudo18\(/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
