import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-tag-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source.replace(
      /import \{[\s\S]*?\} from "\.\/editar-obra-custom-value-utils";/,
      `const limparTextoPersonalizado = (texto, limite) => texto
  .replace(/[^\\p{L}\\p{N}\\s-]/gu, "")
  .replace(/\\s+/g, " ")
  .trimStart()
  .slice(0, limite);
const contarLetrasNumeros = (texto) => (texto.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
const textoPersonalizadoValido = (texto, minimo, limite) => {
  const textoLimpo = texto.trim().replace(/\\s+/g, " ");
  return textoLimpo.length <= limite && contarLetrasNumeros(textoLimpo) >= minimo && /^[\\p{L}\\p{N}][\\p{L}\\p{N}\\s-]*$/u.test(textoLimpo);
};`,
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
  prepararAtualizacaoTagPersonalizada,
  prepararSelecaoTagEdicaoObra,
} = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

test("atualização de tag personalizada preserva limpeza, limite e validação", () => {
  assert.deepEqual(prepararAtualizacaoTagPersonalizada("  Ação   Hero!", 10), {
    tagPersonalizada: "Ação Hero",
    tags: "Ação Hero",
  });
  assert.deepEqual(prepararAtualizacaoTagPersonalizada(" a ", 10), {
    tagPersonalizada: "a ",
    tags: "",
  });
});

test("seleção de tag preserva ramos vazio, outra e tag normal", () => {
  assert.deepEqual(prepararSelecaoTagEdicaoObra("", "Anterior", "__outra_tag__", 10), {
    usarTagPersonalizada: false,
    tagPersonalizada: "",
    tags: "",
  });
  assert.deepEqual(
    prepararSelecaoTagEdicaoObra("__outra_tag__", "  Ação   Hero  ", "__outra_tag__", 10),
    {
      usarTagPersonalizada: true,
      tags: "Ação Hero",
    },
  );
  assert.deepEqual(prepararSelecaoTagEdicaoObra("Aventura", "Anterior", "__outra_tag__", 10), {
    usarTagPersonalizada: false,
    tagPersonalizada: "",
    tags: "Aventura",
  });
});

test("Editar Obra delega somente o cálculo de tags e mantém os setters", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?prepararAtualizacaoTagPersonalizada,[\s\S]*?prepararSelecaoTagEdicaoObra,[\s\S]*?\} from "\.\/lib\/editar-obra-tag-utils";/,
  );
  assert.match(pageSource, /function atualizarTagPersonalizada\(valor: string\)/);
  assert.match(pageSource, /function adicionarTagSelecionada\(tag: string\)/);
  assert.match(pageSource, /setTagPersonalizada\(proximaTag\.tagPersonalizada\);[\s\S]*?setTags\(proximaTag\.tags\);[\s\S]*?marcarAlteracao\(\);/);
  assert.match(pageSource, /setUsarTagPersonalizada\(proximaTag\.usarTagPersonalizada\);[\s\S]*?setTags\(proximaTag\.tags\);[\s\S]*?marcarAlteracao\(\);/);
  assert.match(pageSource, /OUTRA_TAG_VALUE,[\s\S]*?LIMITE_CARACTERES_TAG_PERSONALIZADA,/);
  assert.match(source, /import \{[\s\S]*?limparTextoPersonalizado,[\s\S]*?textoPersonalizadoValido,[\s\S]*?\} from "\.\/editar-obra-custom-value-utils";/);
  assert.match(source, /textoPersonalizadoValido\(tagPersonalizada, 2, limiteCaracteres\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
