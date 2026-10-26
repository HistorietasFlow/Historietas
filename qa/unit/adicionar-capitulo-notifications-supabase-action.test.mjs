import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/actions/registrar-notificacoes-novo-capitulo-supabase.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo(resultados = [], criarSupabase) {
  const chamadas = [];
  globalThis.__adicionarCapituloNotificationsDependencies = {
    supabase: criarSupabase?.(chamadas) || {
      async rpc(nome, parametros) {
        chamadas.push(["rpc", nome, parametros]);
        return resultados.shift() || { error: null };
      },
    },
    idObraSupabaseValido(id) {
      return id.startsWith("valido-");
    },
    criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo) {
      chamadas.push(["href", obra, capitulo, numeroCapitulo]);
      return `/leitura/${obra.id}/${capitulo.id}/${numeroCapitulo}`;
    },
  };

  const javascript = typescript
    .transpileModule(
      source
        .replace(
          'import { supabase } from "../../../lib/supabase/client";',
          "const supabase = globalThis.__adicionarCapituloNotificationsDependencies.supabase;",
        )
        .replace(
          'import { idObraSupabaseValido } from "../../../lib/utils";',
          "const idObraSupabaseValido = globalThis.__adicionarCapituloNotificationsDependencies.idObraSupabaseValido;",
        )
        .replace(
          'import { criarHrefLeituraCapitulo } from "../lib/adicionar-capitulo-route-utils";',
          "const criarHrefLeituraCapitulo = globalThis.__adicionarCapituloNotificationsDependencies.criarHrefLeituraCapitulo;",
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
  titulo: "Obra de teste",
  slug: "obra-de-teste",
  publicado: true,
};
const capitulo = { id: "valido-capitulo-1", titulo: "Capítulo de teste" };
const parametros = {
  userId: " usuario-1 ",
  obra,
  capitulo,
  numeroCapitulo: 2,
  criadoEm: "2026-10-26T00:00:00.000Z",
};

test("Notificações Supabase usam a RPC e payload do novo capítulo", async () => {
  const modulo = await carregarModulo();

  await modulo.registrarNotificacoesNovoCapituloSupabase(parametros);

  assert.deepEqual(modulo.chamadas, [
    ["href", obra, capitulo, 2],
    ["rpc", "criar_notificacoes_capitulo", {
      p_obra_id: "valido-obra-1",
      p_capitulo_id: "valido-capitulo-1",
      p_titulo: "Novo capítulo publicado",
      p_mensagem: "Capítulo de teste foi adicionado em Obra de teste.",
      p_href: "/leitura/valido-obra-1/valido-capitulo-1/2",
      p_tipo: "novo-capitulo",
      p_criado_em: "2026-10-26T00:00:00.000Z",
    }],
  ]);
});

test("Notificações Supabase não chamam a RPC para parâmetros inválidos", async () => {
  const modulo = await carregarModulo();

  await modulo.registrarNotificacoesNovoCapituloSupabase({ ...parametros, userId: "   " });
  await modulo.registrarNotificacoesNovoCapituloSupabase({
    ...parametros,
    obra: { ...obra, publicado: false },
  });
  await modulo.registrarNotificacoesNovoCapituloSupabase({
    ...parametros,
    obra: { ...obra, id: "local-obra" },
  });
  await modulo.registrarNotificacoesNovoCapituloSupabase({
    ...parametros,
    capitulo: { ...capitulo, id: "local-capitulo" },
  });

  assert.deepEqual(modulo.chamadas, []);
});

test("Notificações Supabase avisa erros retornados pela RPC", async () => {
  const erro = { message: "falha retornada" };
  const modulo = await carregarModulo([{ error: erro }]);
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);

  try {
    await modulo.registrarNotificacoesNovoCapituloSupabase(parametros);
  } finally {
    console.warn = warnAnterior;
  }

  assert.deepEqual(avisos, [[
    "Não consegui criar notificações do novo capítulo:",
    "falha retornada",
  ]]);
});

test("Notificações Supabase absorvem exceção real da RPC", async () => {
  const erro = new Error("falha simulada");
  const modulo = await carregarModulo([], () => ({
    rpc() {
      throw erro;
    },
  }));
  const warnAnterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);

  try {
    await assert.doesNotReject(() =>
      modulo.registrarNotificacoesNovoCapituloSupabase(parametros),
    );
  } finally {
    console.warn = warnAnterior;
  }

  assert.deepEqual(avisos, [[
    "Não consegui notificar leitores do novo capítulo:",
    erro,
  ]]);
});

test("Adicionar Capítulo delega notificações Supabase ao action", () => {
  assert.match(
    pageSource,
    /import \{ registrarNotificacoesNovoCapituloSupabase \} from "\.\/actions\/registrar-notificacoes-novo-capitulo-supabase";/,
  );
  assert.doesNotMatch(
    pageSource,
    /async function registrarNotificacoesNovoCapituloSupabase\(/,
  );
  assert.match(pageSource, /void registrarNotificacoesNovoCapituloSupabase\(/);
  assert.doesNotMatch(pageSource, /await registrarNotificacoesNovoCapituloSupabase\(/);
  assert.match(source, /export async function registrarNotificacoesNovoCapituloSupabase\(/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage|router|<\w/);
});
