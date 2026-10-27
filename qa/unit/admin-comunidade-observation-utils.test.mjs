import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-observation-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

async function importarModulo() {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`
  );
}

test("sincroniza somente observações ausentes sem mutar as entradas", async () => {
  const { sincronizarObservacoesModeracao } = await importarModulo();
  const observacoesAtuais = {
    existente: "observação editada",
    vazia: "",
    antiga: "permanece",
    " id sem trim ": "valor original",
  };
  const denuncias = [
    { id: "existente", observacaoAdmin: "não deve sobrescrever" },
    { id: "vazia", observacaoAdmin: "não deve sobrescrever vazio" },
    { id: "nova", observacaoAdmin: "observação inicial" },
    { id: "outra", observacaoAdmin: "segunda observação" },
    { id: " id sem trim ", observacaoAdmin: "não deve normalizar" },
  ];
  const observacoesAntes = structuredClone(observacoesAtuais);
  const denunciasAntes = structuredClone(denuncias);

  const resultado = sincronizarObservacoesModeracao(
    observacoesAtuais,
    denuncias,
  );

  assert.notEqual(resultado, observacoesAtuais);
  assert.deepEqual(observacoesAtuais, observacoesAntes);
  assert.deepEqual(denuncias, denunciasAntes);
  assert.equal(resultado.existente, "observação editada");
  assert.equal(resultado.vazia, "");
  assert.equal(resultado.antiga, "permanece");
  assert.equal(resultado.nova, "observação inicial");
  assert.equal(resultado.outra, "segunda observação");
  assert.equal(resultado[" id sem trim "], "valor original");
});

test("Admin Comunidade delega a sincronização de observações sem alterar a ordem dos setters", () => {
  assert.match(
    page,
    /setDenuncias\(denunciasComContexto\);[\s\S]*?setObservacoes\(\(observacoesAtuais\) =>\s*sincronizarObservacoesModeracao\(/,
  );
  assert.match(page, /sincronizarObservacoesModeracao\(\s*observacoesAtuais,\s*denunciasComContexto,/);
  assert.doesNotMatch(page, /denunciasComContexto\.forEach\(\(denuncia\) =>/);
  assert.match(
    source,
    /const proximasObservacoes = \{ \.\.\.observacoesAtuais \};/,
  );
  assert.match(source, /if \(!\(denuncia\.id in proximasObservacoes\)\)/);
  assert.match(
    source,
    /proximasObservacoes\[denuncia\.id\] = denuncia\.observacaoAdmin;/,
  );
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|supabase|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
