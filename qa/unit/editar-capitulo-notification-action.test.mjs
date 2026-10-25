import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-capitulo/actions/atualizar-notificacao-capitulo.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo(resultado = { error: null }) {
  const chamadas = [];
  globalThis.__editarCapituloNotificationActionDependencies = {
    supabase: {
      async rpc(nome, parametros) {
        chamadas.push(["rpc", nome, parametros]);

        if (resultado instanceof Error) {
          throw resultado;
        }

        return resultado;
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
          "const supabase = globalThis.__editarCapituloNotificationActionDependencies.supabase;",
        )
        .replace(
          'import { idObraSupabaseValido } from "../../../lib/utils";',
          "const idObraSupabaseValido = globalThis.__editarCapituloNotificationActionDependencies.idObraSupabaseValido;",
        )
        .replace(
          'import { criarHrefLeituraCapitulo } from "../lib/editar-capitulo-route-utils";',
          "const criarHrefLeituraCapitulo = globalThis.__editarCapituloNotificationActionDependencies.criarHrefLeituraCapitulo;",
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

test("notificação de Editar Capítulo ignora usuário, publicação ou IDs inválidos", async () => {
  const modulo = await carregarModulo();

  await modulo.atualizarNotificacaoCapituloSupabase({ ...parametros, userId: " " });
  await modulo.atualizarNotificacaoCapituloSupabase({
    ...parametros,
    obra: { ...obra, publicado: false },
  });
  await modulo.atualizarNotificacaoCapituloSupabase({
    ...parametros,
    obra: { ...obra, id: "invalido" },
  });
  await modulo.atualizarNotificacaoCapituloSupabase({
    ...parametros,
    capituloId: "invalido",
  });

  assert.deepEqual(modulo.chamadas, []);
});

test("notificação de Editar Capítulo preserva href e parâmetros da RPC", async () => {
  const modulo = await carregarModulo();

  await modulo.atualizarNotificacaoCapituloSupabase(parametros);

  assert.deepEqual(modulo.chamadas, [
    ["href", obra, "valido-capitulo-1", 2],
    ["rpc", "criar_notificacoes_capitulo", {
      p_obra_id: "valido-obra-1",
      p_capitulo_id: "valido-capitulo-1",
      p_titulo: "Capítulo atualizado",
      p_mensagem: "Capítulo atualizado foi atualizado em Obra editada.",
      p_href: "/leitura/valido-capitulo-1/2",
      p_tipo: "novo-capitulo",
      p_criado_em: "2026-10-25T00:00:00.000Z",
    }],
  ]);
});

test("notificação de Editar Capítulo mantém warnings para erro retornado e exceção", async () => {
  const erroRetornado = await carregarModulo({ error: { message: "falha da RPC" } });
  const excecao = await carregarModulo(new Error("falha de rede"));
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);

  try {
    await assert.doesNotReject(() => erroRetornado.atualizarNotificacaoCapituloSupabase(parametros));
    await assert.doesNotReject(() => excecao.atualizarNotificacaoCapituloSupabase(parametros));
  } finally {
    console.warn = warnAnterior;
  }

  assert.deepEqual(avisos, [
    ["Não consegui criar notificações da edição do capítulo:", "falha da RPC"],
    ["Não consegui notificar leitores da edição do capítulo:", new Error("falha de rede")],
  ]);
});

test("Editar Capítulo delega somente a notificação após o Diário", () => {
  assert.match(
    pageSource,
    /import \{ atualizarNotificacaoCapituloSupabase \} from "\.\/actions\/atualizar-notificacao-capitulo";/,
  );
  assert.doesNotMatch(pageSource, /async function atualizarNotificacaoCapituloSupabase\(/);
  assert.match(source, /export async function atualizarNotificacaoCapituloSupabase\(/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage|router|<\w/);
  assert.match(source, /supabase\.rpc\(\s*"criar_notificacoes_capitulo"/);
  assert.match(source, /p_titulo: "Capítulo atualizado"/);
  assert.match(source, /p_mensagem: `\$\{tituloCapitulo\} foi atualizado em \$\{obra\.titulo\}\.`/);
  assert.match(source, /p_tipo: "novo-capitulo"/);
  assert.match(source, /p_criado_em: atualizadoEm/);
  assert.match(
    pageSource,
    /await registrarDiarioEdicaoCapitulo\([\s\S]*?\);\s*\n\s*await atualizarNotificacaoCapituloSupabase\(/,
  );
});
