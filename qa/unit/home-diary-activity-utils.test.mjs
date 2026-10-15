import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-diary-activity-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const estado = {
  chamadas: [],
  erroInsert: null,
};
globalThis.__homeDiaryActivityUtilsState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../lib/supabase/client";\n',
    `const supabase = {
  from(tabela) {
    globalThis.__homeDiaryActivityUtilsState.chamadas.push({ tabela, payload: null });
    const chamada = globalThis.__homeDiaryActivityUtilsState.chamadas.at(-1);
    return {
      async insert(payload) {
        chamada.payload = payload;
        if (globalThis.__homeDiaryActivityUtilsState.erroInsert) {
          throw globalThis.__homeDiaryActivityUtilsState.erroInsert;
        }
        return { error: null };
      },
    };
  },
};
`,
  )
  .replace(
    'import { idObraSupabaseValido } from "../../lib/utils";\n',
    'const idObraSupabaseValido = (id) => id === "obra-valida";\n',
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { registrarAtividadeDiarioHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const obra = {
  id: "obra-valida",
  titulo: "História da Home",
  slug: "historia-da-home",
  autor: "Autora da Home",
};

function resetarEstado() {
  estado.chamadas.length = 0;
  estado.erroInsert = null;
}

test("home-diary-activity-utils ignora usuário vazio, espaços e obra inválida", async () => {
  resetarEstado();
  await registrarAtividadeDiarioHome({
    userId: "",
    tipo: "favoritou_obra",
    obra,
    texto: "texto",
  });
  await registrarAtividadeDiarioHome({
    userId: "  ",
    tipo: "favoritou_obra",
    obra,
    texto: "texto",
  });
  await registrarAtividadeDiarioHome({
    userId: "usuario-1",
    tipo: "favoritou_obra",
    obra: { ...obra, id: "inválida" },
    texto: "texto",
  });

  assert.equal(estado.chamadas.length, 0);
});

test("home-diary-activity-utils persiste favorito com o payload literal", async () => {
  resetarEstado();
  await registrarAtividadeDiarioHome({
    userId: " usuario-original ",
    tipo: "favoritou_obra",
    obra,
    texto: "  Adicionou à lista  ",
  });

  assert.deepEqual(estado.chamadas, [{
    tabela: "diario_atividades",
    payload: {
      user_id: " usuario-original ",
      tipo: "favoritou_obra",
      obra_id: "obra-valida",
      texto: "Adicionou à lista",
      visibilidade: "parcial",
      metadata: {
        obra_titulo: "História da Home",
        obra_slug: "historia-da-home",
        autor: "Autora da Home",
        origem: "home",
      },
    },
  }]);
});

test("home-diary-activity-utils persiste conclusão e converte texto vazio em null", async () => {
  resetarEstado();
  await registrarAtividadeDiarioHome({
    userId: "usuario-2",
    tipo: "concluiu_obra",
    obra,
    texto: "   ",
  });

  assert.equal(estado.chamadas[0].tabela, "diario_atividades");
  assert.equal(estado.chamadas[0].payload.tipo, "concluiu_obra");
  assert.equal(estado.chamadas[0].payload.texto, null);
  assert.equal(estado.chamadas[0].payload.visibilidade, "parcial");
  assert.equal(estado.chamadas[0].payload.metadata.origem, "home");
});

test("home-diary-activity-utils mantém falhas silenciosas sem warning", async () => {
  resetarEstado();
  estado.erroInsert = new Error("indisponível");
  const warnOriginal = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);
  try {
    await assert.doesNotReject(() => registrarAtividadeDiarioHome({
      userId: "usuario-3",
      tipo: "favoritou_obra",
      obra,
      texto: "texto",
    }));
  } finally {
    console.warn = warnOriginal;
  }
  assert.equal(avisos.length, 0);
});

test("home-diary-activity-utils estabelece a fronteira isolada da atividade", () => {
  assert.match(
    pagina,
    /import \{ registrarAtividadeDiarioHome \} from "\.\/lib\/home-diary-activity-utils";/,
  );
  assert.doesNotMatch(pagina, /async function registrarAtividadeDiarioHome\b/);
  assert.match(modulo, /export async function registrarAtividadeDiarioHome\b/);
  assert.match(modulo, /tipo: "favoritou_obra" \| "concluiu_obra";/);
  assert.match(modulo, /\.from\("diario_atividades"\)\.insert\(/);
  assert.match(modulo, /texto: texto\.trim\(\) \|\| null/);
  assert.match(modulo, /visibilidade: "parcial"/);
  assert.match(modulo, /origem: "home"/);
  assert.match(modulo, /\/\/ A Home não deve travar se o Diário não registrar a atividade\./);
  assert.doesNotMatch(modulo, /console\.warn|useEffect|useState|localStorage/);
  assert.match(pagina, /function encontrarObraLocalPorHeroHome\(/);
  assert.match(pagina, /async function carregarObrasSupabaseHome\(/);
});
