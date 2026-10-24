import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-save-preparation.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";/,
        `const ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO = true;
const ehClassificacao18 = (classificacao) => classificacao === "18+";
const normalizarAvisosConteudo18 = (avisos, classificacao) => [classificacao, ...avisos];`,
      )
      .replace(
        'import { obterTagsFinaisEdicaoObra } from "./editar-obra-tags-list-utils";',
        'const obterTagsFinaisEdicaoObra = (tags) => tags.length > 0 ? tags : ["sem tags"];',
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { prepararValoresSalvamentoEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("prepara os valores iniciais de salvamento preservando normalização e bloqueio 18+", () => {
  assert.deepEqual(
    prepararValoresSalvamentoEdicaoObra({
      titulo: "  Obra  ",
      autor: "  Autora  ",
      autorProfileAtivo: "Autora do perfil",
      generoFinal: "Fantasia",
      formatoFinal: "HQ",
      classificacaoIndicativa: " 18+ ",
      avisosConteudo18: ["terror"],
      sinopse: "  Sinopse  ",
      tagsTratadas: ["aventura"],
    }),
    {
      tituloFinal: "Obra",
      autorFormularioFinal: "Autora",
      autorFinal: "Autora do perfil",
      generoFinalSalvo: "Fantasia",
      formatoFinalSalvo: "HQ",
      classificacaoFinal: "18+",
      capaBloqueadaPorClassificacao: true,
      avisosConteudoFinal: ["18+", "terror"],
      sinopseFinal: "Sinopse",
      tagsFinais: ["aventura"],
    },
  );
});

test("preserva fallback de autor, classificação comum e tags sem valor", () => {
  const valores = prepararValoresSalvamentoEdicaoObra({
    titulo: "Obra",
    autor: "  Autora  ",
    autorProfileAtivo: "",
    generoFinal: "Drama",
    formatoFinal: "Romance",
    classificacaoIndicativa: "Livre",
    avisosConteudo18: [],
    sinopse: "Sinopse",
    tagsTratadas: [],
  });

  assert.equal(valores.autorFinal, "Autora");
  assert.equal(valores.capaBloqueadaPorClassificacao, false);
  assert.deepEqual(valores.tagsFinais, ["sem tags"]);
});

test("Editar Obra delega somente a preparação inicial de salvamento", () => {
  assert.match(
    pageSource,
    /import \{ prepararValoresSalvamentoEdicaoObra \} from "\.\/lib\/editar-obra-save-preparation";/,
  );
  assert.match(pageSource, /function salvarEdicao\(/);
  assert.match(
    pageSource,
    /const valoresSalvamento = prepararValoresSalvamentoEdicaoObra\(\{[\s\S]*?titulo,[\s\S]*?tagsTratadas,[\s\S]*?\}\);/,
  );
  assert.match(pageSource, /const agora = new Date\(\)\.toISOString\(\);/);
  assert.match(source, /ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO\s*&&\s*ehClassificacao18\(classificacaoFinal\)/);
  assert.match(source, /normalizarAvisosConteudo18\([\s\S]*?avisosConteudo18,[\s\S]*?classificacaoFinal/);
  assert.match(source, /obterTagsFinaisEdicaoObra\(tagsTratadas\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
