import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-capitulo/actions/registrar-diario-edicao-capitulo.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloSaveAction.ts",
    import.meta.url,
  ),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo(resultados = []) {
  const chamadas = [];
  globalThis.__editarCapituloDiaryActionDependencies = {
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
    idObraSupabaseValido(id) {
      return id.startsWith("valido-");
    },
    criarHrefLeituraCapitulo(obra, capituloId, numeroCapitulo) {
      chamadas.push(["href", obra, capituloId, numeroCapitulo]);
      return `/leitura/${capituloId}/${numeroCapitulo}`;
    },
  };

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__editarCapituloDiaryActionDependencies.supabase;",
        )
        .replace(
          'import { idObraSupabaseValido } from "../../../lib/utils";',
          "const idObraSupabaseValido = globalThis.__editarCapituloDiaryActionDependencies.idObraSupabaseValido;",
        )
        .replace(
          'import { criarHrefLeituraCapitulo } from "../lib/editar-capitulo-route-utils";',
          "const criarHrefLeituraCapitulo = globalThis.__editarCapituloDiaryActionDependencies.criarHrefLeituraCapitulo;",
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
  id: "valido-obra-1",
  titulo: "Obra editada",
  slug: "obra-editada",
  publicado: true,
};

const parametros = {
  userId: " usuario-1 ",
  obra,
  capituloId: "valido-capitulo-1",
  tituloCapitulo: "Capítulo atualizado",
  numeroCapitulo: 2,
  atualizadoEm: "2026-10-25T00:00:00.000Z",
};

test("Diário de Editar Capítulo ignora usuário ou IDs inválidos sem acessar Supabase", async () => {
  const modulo = await carregarModulo();

  await modulo.registrarDiarioEdicaoCapitulo({ ...parametros, userId: "   " });
  await modulo.registrarDiarioEdicaoCapitulo({
    ...parametros,
    obra: { ...obra, id: "invalido" },
  });
  await modulo.registrarDiarioEdicaoCapitulo({
    ...parametros,
    capituloId: "invalido",
  });

  assert.deepEqual(modulo.chamadas, []);
});

test("Diário de Editar Capítulo insere payload público completo e não usa fallback no sucesso", async () => {
  const modulo = await carregarModulo();

  await modulo.registrarDiarioEdicaoCapitulo(parametros);

  assert.deepEqual(modulo.chamadas, [
    ["href", obra, "valido-capitulo-1", 2],
    ["from", "diario_atividades"],
    ["insert", "diario_atividades", {
      user_id: "usuario-1",
      tipo: "editou_capitulo",
      obra_id: "valido-obra-1",
      capitulo_id: "valido-capitulo-1",
      texto: "",
      visibilidade: "publico",
      metadata: {
        obra_titulo: "Obra editada",
        titulo_obra: "Obra editada",
        capitulo_titulo: "Capítulo atualizado",
        numero_capitulo: 2,
        href: "/leitura/valido-capitulo-1/2",
      },
      criado_em: "2026-10-25T00:00:00.000Z",
      atualizado_em: "2026-10-25T00:00:00.000Z",
    }],
  ]);
});

test("Diário de Editar Capítulo mantém visibilidade privada e fallback simplificado", async () => {
  const modulo = await carregarModulo([{ error: { message: "metadata indisponível" } }]);

  await modulo.registrarDiarioEdicaoCapitulo({
    ...parametros,
    obra: { ...obra, publicado: false },
  });

  const inserts = modulo.chamadas.filter(([tipo]) => tipo === "insert");
  assert.equal(inserts.length, 2);
  assert.equal(inserts[0][2].visibilidade, "privado");
  assert.deepEqual(inserts[1], ["insert", "diario_atividades", {
    user_id: "usuario-1",
    tipo: "editou_capitulo",
    obra_id: "valido-obra-1",
    capitulo_id: "valido-capitulo-1",
    texto: "",
    visibilidade: "privado",
    criado_em: "2026-10-25T00:00:00.000Z",
  }]);
  assert.equal("metadata" in inserts[1][2], false);
  assert.equal("atualizado_em" in inserts[1][2], false);
});

test("Diário de Editar Capítulo absorve exceções e preserva o aviso", async () => {
  const modulo = await carregarModulo([new Error("falha de rede")]);
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);

  try {
    await assert.doesNotReject(() => modulo.registrarDiarioEdicaoCapitulo(parametros));
  } finally {
    console.warn = warnAnterior;
  }

  assert.deepEqual(avisos, [[
    "Não consegui registrar a edição do capítulo no Diário:",
    new Error("falha de rede"),
  ]]);
});

test("Editar Capítulo delega somente a ação de Diário antes da notificação", () => {
  assert.match(
    saveActionSource,
    /import \{ registrarDiarioEdicaoCapitulo \} from "\.\.\/actions\/registrar-diario-edicao-capitulo";/,
  );
  assert.doesNotMatch(pageSource, /async function registrarDiarioEdicaoCapitulo\(/);
  assert.match(source, /export async function registrarDiarioEdicaoCapitulo\(/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage|router|<\w/);
  assert.match(source, /\.from\("diario_atividades"\)\.insert\(payload\)/);
  assert.match(source, /await supabase\.from\("diario_atividades"\)\.insert\(\{/);
  assert.match(source, /tipo: "editou_capitulo"/);
  assert.match(
    source,
    /console\.warn\("Não consegui registrar a edição do capítulo no Diário:", error\)/,
  );
  assert.match(
    saveActionSource,
    /await registrarDiarioEdicaoCapitulo\([\s\S]*?\);\s*\n\s*await atualizarNotificacaoCapituloSupabase\(/,
  );
});
