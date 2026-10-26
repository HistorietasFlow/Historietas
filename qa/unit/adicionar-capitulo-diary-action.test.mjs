import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/actions/registrar-diario-novo-capitulo.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo(resultados = []) {
  const chamadas = [];
  globalThis.__adicionarCapituloDiaryDependencies = {
    supabase: {
      from(tabela) {
        chamadas.push(["from", tabela]);
        return {
          async insert(payload) {
            chamadas.push(["insert", tabela, payload]);
            return resultados.shift() || { error: null };
          },
        };
      },
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
          "const supabase = globalThis.__adicionarCapituloDiaryDependencies.supabase;",
        )
        .replace(
          'import { criarHrefLeituraCapitulo } from "../lib/adicionar-capitulo-route-utils";',
          "const criarHrefLeituraCapitulo = globalThis.__adicionarCapituloDiaryDependencies.criarHrefLeituraCapitulo;",
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
  titulo: "Obra de teste",
  slug: "obra-de-teste",
  publicado: true,
};
const capitulo = { id: "capitulo-1", titulo: "Capítulo de teste" };
const parametros = {
  userId: "usuario-1",
  obra,
  capitulo,
  numeroCapitulo: 3,
  criadoEm: "2026-10-26T00:00:00.000Z",
};

test("Diário de Adicionar Capítulo mantém o payload completo e não usa fallback no sucesso", async () => {
  const modulo = await carregarModulo();

  await modulo.registrarDiarioNovoCapitulo(parametros);

  assert.deepEqual(modulo.chamadas, [
    ["href", obra, capitulo, 3],
    ["from", "diario_atividades"],
    ["insert", "diario_atividades", {
      user_id: "usuario-1",
      tipo: "publicou_capitulo",
      obra_id: "obra-1",
      capitulo_id: "capitulo-1",
      texto: "",
      visibilidade: "publico",
      metadata: {
        obra_titulo: "Obra de teste",
        titulo_obra: "Obra de teste",
        capitulo_titulo: "Capítulo de teste",
        numero_capitulo: 3,
        href: "/leitura/obra-1/capitulo-1/3",
      },
      criado_em: "2026-10-26T00:00:00.000Z",
      atualizado_em: "2026-10-26T00:00:00.000Z",
    }],
  ]);
});

test("Diário de Adicionar Capítulo usa fallback sem metadata ou atualização", async () => {
  const modulo = await carregarModulo([{ error: { message: "metadata indisponível" } }]);

  await modulo.registrarDiarioNovoCapitulo(parametros);

  const insercoes = modulo.chamadas.filter(([tipo]) => tipo === "insert");
  assert.equal(insercoes.length, 2);
  assert.deepEqual(insercoes[1], ["insert", "diario_atividades", {
    user_id: "usuario-1",
    tipo: "publicou_capitulo",
    obra_id: "obra-1",
    capitulo_id: "capitulo-1",
    texto: "",
    visibilidade: "publico",
    criado_em: "2026-10-26T00:00:00.000Z",
  }]);
  assert.equal("metadata" in insercoes[1][2], false);
  assert.equal("atualizado_em" in insercoes[1][2], false);
});

test("Adicionar Capítulo delega o registro do Diário ao action", () => {
  assert.match(
    pageSource,
    /import \{ registrarDiarioNovoCapitulo \} from "\.\/actions\/registrar-diario-novo-capitulo";/,
  );
  assert.doesNotMatch(pageSource, /async function registrarDiarioNovoCapitulo\(/);
  assert.match(pageSource, /void registrarDiarioNovoCapitulo\(/);
  assert.doesNotMatch(pageSource, /await registrarDiarioNovoCapitulo\(/);
  assert.match(source, /export async function registrarDiarioNovoCapitulo\(/);
  assert.match(source, /\.from\("diario_atividades"\)\.insert\(payload\)/);
  assert.match(source, /tipo: "publicou_capitulo"/);
  assert.match(source, /metadata:/);
  assert.match(source, /obra_titulo:/);
  assert.match(source, /titulo_obra:/);
  assert.match(source, /capitulo_titulo:/);
  assert.match(source, /numero_capitulo:/);
  assert.match(source, /criarHrefLeituraCapitulo\(/);
});
