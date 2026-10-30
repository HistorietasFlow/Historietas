import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-diary-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo(resultados = []) {
  const chamadas = [];
  globalThis.__editarObraDiaryActionDependencies = {
    supabase: {
      from(tabela) {
        chamadas.push(["from", tabela]);
        return {
          async insert(payload) {
            chamadas.push(["insert", tabela, payload]);
            const resultado = resultados.shift() || { error: null };
            if (resultado instanceof Error) {
              throw resultado;
            }
            return resultado;
          },
        };
      },
    },
    criarSlugBase(titulo) {
      chamadas.push(["slug", titulo]);
      return "slug-gerado";
    },
  };

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__editarObraDiaryActionDependencies.supabase;",
        )
        .replace(
          'import { criarSlugBase } from "../../../lib/utils";',
          "const criarSlugBase = globalThis.__editarObraDiaryActionDependencies.criarSlugBase;",
        ),
      {
        compilerOptions: {
          module: typescript.ModuleKind.ESNext,
          target: typescript.ScriptTarget.ES2022,
        },
      },
    )
    .outputText;
  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

const obra = {
  id: "obra-1",
  titulo: "Obra editada",
  formato: "HQ",
  genero: "Fantasia",
  link: "/obra/link-existente",
  slug: "obra-editada",
};

test("Diário de Editar Obra insere o payload completo e não usa fallback quando há sucesso", async () => {
  const modulo = await carregarModulo();

  await modulo.registrarDiarioEdicaoObra({
    userId: "usuario-1",
    obra,
    visibilidade: "publico",
    atualizadoEm: "2026-10-24T00:00:00.000Z",
  });

  assert.deepEqual(modulo.chamadas, [
    ["from", "diario_atividades"],
    ["insert", "diario_atividades", {
      user_id: "usuario-1",
      tipo: "editou_obra",
      obra_id: "obra-1",
      texto: "",
      visibilidade: "publico",
      metadata: {
        obra_titulo: "Obra editada",
        titulo_obra: "Obra editada",
        formato: "HQ",
        genero: "Fantasia",
        href: "/obra/link-existente",
      },
      criado_em: "2026-10-24T00:00:00.000Z",
      atualizado_em: "2026-10-24T00:00:00.000Z",
    }],
  ]);
});

test("Diário de Editar Obra preserva os fallbacks de href e visibilidade privada", async () => {
  const comSlug = await carregarModulo();
  await comSlug.registrarDiarioEdicaoObra({
    userId: "usuario-2",
    obra: { ...obra, link: "", slug: "slug-existente" },
    visibilidade: "privado",
    atualizadoEm: "data-1",
  });
  assert.equal(comSlug.chamadas[1][2].metadata.href, "/obra/slug-existente");
  assert.equal(comSlug.chamadas[1][2].visibilidade, "privado");
  assert.equal(comSlug.chamadas.some(([tipo]) => tipo === "slug"), false);

  const comTitulo = await carregarModulo();
  await comTitulo.registrarDiarioEdicaoObra({
    userId: "usuario-3",
    obra: { ...obra, link: "", slug: "" },
    visibilidade: "publico",
    atualizadoEm: "data-2",
  });
  assert.equal(comTitulo.chamadas.at(-1)[2].metadata.href, "/obra/slug-gerado");
  assert.deepEqual(comTitulo.chamadas[0], ["slug", "Obra editada"]);
});

test("Diário de Editar Obra executa fallback simplificado quando o primeiro insert retorna erro", async () => {
  const modulo = await carregarModulo([{ error: { message: "metadata indisponível" } }]);

  await modulo.registrarDiarioEdicaoObra({
    userId: "usuario-4",
    obra,
    visibilidade: "privado",
    atualizadoEm: "data-3",
  });

  assert.equal(modulo.chamadas.filter(([tipo]) => tipo === "insert").length, 2);
  assert.deepEqual(modulo.chamadas.at(-1), ["insert", "diario_atividades", {
    user_id: "usuario-4",
    tipo: "editou_obra",
    obra_id: "obra-1",
    texto: "",
    visibilidade: "privado",
    criado_em: "data-3",
  }]);
  assert.equal("metadata" in modulo.chamadas.at(-1)[2], false);
  assert.equal("atualizado_em" in modulo.chamadas.at(-1)[2], false);
});

test("Diário de Editar Obra absorve exceções e registra o aviso atual", async () => {
  const modulo = await carregarModulo([new Error("falha de rede")]);
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);

  try {
    await assert.doesNotReject(() => modulo.registrarDiarioEdicaoObra({
      userId: "usuario-5",
      obra,
      visibilidade: "publico",
      atualizadoEm: "data-4",
    }));
  } finally {
    console.warn = warnAnterior;
  }

  assert.deepEqual(avisos, [["Não consegui registrar a edição da obra no Diário:", new Error("falha de rede")]]);
});

test("Editar Obra delega somente a ação de Diário", () => {
  assert.match(
    saveActionSource,
    /import \{ registrarDiarioEdicaoObra \} from "\.\.\/lib\/editar-obra-diary-action";/,
  );
  assert.doesNotMatch(saveActionSource, /async function registrarDiarioEdicaoObra\(/);
  assert.match(source, /export async function registrarDiarioEdicaoObra\(/);
  assert.match(source, /\.from\("diario_atividades"\)\.insert\(payload\)/);
  assert.match(source, /await supabase\.from\("diario_atividades"\)\.insert\(\{/);
  assert.match(source, /obra\.link \|\| `\/obra\/\$\{obra\.slug \|\| criarSlugBase\(obra\.titulo\)\}`/);
  assert.match(source, /console\.warn\("Não consegui registrar a edição da obra no Diário:", error\)/);
});
