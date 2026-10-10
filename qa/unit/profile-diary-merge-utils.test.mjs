import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-merge-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const collectionsSyncSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-user-collections-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(
  utilsSource.replace(
    'import { obterTimestampData } from "./profile-formatters";',
    `const obterTimestampData = (dataIso) => {
  const data = new Date(dataIso).getTime();
  return Number.isNaN(data) ? 0 : data;
};`,
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  ordenarItensDiarioPerfil,
  criarChaveMesclaDiarioPerfil,
  criarChaveCardAtualDiarioPerfil,
  mesclarItensDiarioPerfil,
  mesclarDiarioPerfilComLocal,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const criarItem = (sobrescrever = {}) => ({
  chave: "item",
  tipo: "lendo",
  titulo: "Uma obra",
  descricao: "Descrição",
  data: "2026-01-01T00:00:00.000Z",
  obra: null,
  ...sobrescrever,
});

const criarDiario = (sobrescrever = {}) => ({
  lendoAgora: [],
  queroLer: [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  reviews: [],
  atividades: [],
  ...sobrescrever,
});

test("ordenarItensDiarioPerfil preserva data, fallback e referências", () => {
  const maisAntigo = criarItem({ chave: "antigo", data: "2024-01-01" });
  const invalido = criarItem({ chave: "invalido", data: "invalida" });
  const recente = criarItem({ chave: "recente", data: "2026-01-01" });
  const itens = [maisAntigo, invalido, recente];

  const ordenados = ordenarItensDiarioPerfil(itens);

  assert.deepEqual(
    ordenados.map((item) => item.chave),
    ["recente", "antigo", "invalido"],
  );
  assert.notEqual(ordenados, itens);
  assert.equal(ordenados[0], recente);
});

test("chaves de mesclagem preservam fallback, trim e capítulo", () => {
  const comObra = criarItem({
    tipo: "favorita",
    chave: "fallback",
    obra: { id: " obra-1 ", ultimoCapituloLidoId: "capitulo-2" },
  });
  const semObra = criarItem({ tipo: "review", chave: " chave local " });

  assert.equal(
    criarChaveMesclaDiarioPerfil(comObra),
    "favorita:: obra-1 ::capitulo-2",
  );
  assert.equal(
    criarChaveCardAtualDiarioPerfil(comObra),
    "favorita::obra-1",
  );
  assert.equal(
    criarChaveMesclaDiarioPerfil(semObra),
    "review:: chave local ::",
  );
  assert.equal(
    criarChaveCardAtualDiarioPerfil(semObra),
    "review:: chave local ",
  );
});

test("mesclarItensDiarioPerfil prioriza itens principais e deduplica por card", () => {
  const complementar = criarItem({
    chave: "local",
    data: "2025-01-01",
    obra: { id: "obra-1", ultimoCapituloLidoId: "capitulo-1" },
  });
  const principal = criarItem({
    chave: "supabase",
    data: "2026-01-01",
    obra: { id: "obra-1", ultimoCapituloLidoId: "capitulo-2" },
  });
  const outro = criarItem({
    chave: "outro",
    data: "2024-01-01",
    obra: { id: "obra-2" },
  });

  const mesclados = mesclarItensDiarioPerfil(
    [principal, outro],
    [complementar],
  );

  assert.deepEqual(
    mesclados.map((item) => item.chave),
    ["supabase", "outro"],
  );
  assert.equal(mesclados[0], principal);
});

test("mesclarDiarioPerfilComLocal preserva listas, atividades únicas e limite oito", () => {
  const principal = criarItem({
    chave: "principal",
    data: "2026-02-01",
    obra: { id: "obra-1" },
  });
  const complementar = criarItem({
    chave: "complementar",
    data: "2025-02-01",
    obra: { id: "obra-1" },
  });
  const atividadesSupabase = Array.from({ length: 8 }, (_, indice) =>
    criarItem({
      chave: `atividade-${indice}`,
      tipo: "atividade",
      data: `2026-01-${String(indice + 1).padStart(2, "0")}`,
      obra: { id: `obra-${indice + 10}` },
    }),
  );
  const atividadeDuplicadaLocal = criarItem({
    chave: "substitui-atividade-7",
    tipo: "atividade",
    data: "2026-03-01",
    obra: { id: "obra-17" },
  });

  const diario = mesclarDiarioPerfilComLocal(
    criarDiario({ lendoAgora: [principal], atividades: atividadesSupabase }),
    criarDiario({
      lendoAgora: [complementar],
      atividades: [atividadeDuplicadaLocal],
    }),
  );

  assert.deepEqual(diario.lendoAgora, [principal]);
  assert.equal(diario.atividades.length, 8);
  assert.equal(diario.atividades[0], atividadeDuplicadaLocal);
  assert.equal(
    diario.atividades.filter((item) => item.obra?.id === "obra-17").length,
    1,
  );
});

test("Perfil de Autor delega somente os helpers puros de ordenação e mesclagem", () => {
  assert.match(
    utilsSource,
    /import type \{ DiarioPerfilItem, DiarioPerfilSemCarregando \} from "\.\.\/types";/,
  );
  assert.match(
    utilsSource,
    /import \{ obterTimestampData \} from "\.\/profile-formatters";/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?mesclarDiarioPerfilComLocal,[\s\S]*?ordenarItensDiarioPerfil,[\s\S]*?\} from "\.\/lib\/profile-diary-merge-utils";/,
  );

  for (const helper of [
    "ordenarItensDiarioPerfil",
    "criarChaveMesclaDiarioPerfil",
    "criarChaveCardAtualDiarioPerfil",
    "mesclarItensDiarioPerfil",
    "mesclarDiarioPerfilComLocal",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(pagina, /mesclarDiarioPerfilComLocal\(diarioSupabase, diarioLocal\)/);
  assert.doesNotMatch(pagina, /supabase\s*\.from\("seguindo_obras"\)/);
  assert.match(
    collectionsSyncSource,
    /supabase\s*\.from\("seguindo_obras"\)/,
  );
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect|localStorage/);
});
