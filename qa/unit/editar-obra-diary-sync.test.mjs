import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-diary-sync.ts",
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
const diaryActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-diary-action.ts",
    import.meta.url,
  ),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo() {
  const chamadas = [];
  globalThis.__editarObraDiarySyncDependencies = {
    async registrarDiarioEdicaoObra(dados) {
      chamadas.push(dados);
    },
  };

  const javascript = typescript
    .transpileModule(
      source.replace(
        'import { registrarDiarioEdicaoObra } from "./editar-obra-diary-action";',
        "const registrarDiarioEdicaoObra = globalThis.__editarObraDiarySyncDependencies.registrarDiarioEdicaoObra;",
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

function criarObra(valor = {}) {
  return {
    id: "obra-1",
    titulo: "Obra atualizada",
    formato: "HQ",
    genero: "Fantasia",
    link: "/obra/obra-atualizada",
    slug: "obra-atualizada",
    publicado: false,
    ...valor,
  };
}

test("sincroniza o Diário com a obra atualizada e a visibilidade atual", async () => {
  const modulo = await carregarModulo();
  const obraAtualizada = criarObra({ publicado: true });

  await modulo.sincronizarDiarioEdicaoObra({
    userId: "usuario-1",
    novasObrasDoUsuario: [criarObra({ id: "outra" }), obraAtualizada],
    obraId: "obra-1",
    atualizadoEm: "2026-11-01T00:00:00.000Z",
  });

  assert.deepEqual(modulo.chamadas, [{
    userId: "usuario-1",
    obra: obraAtualizada,
    visibilidade: "publico",
    atualizadoEm: "2026-11-01T00:00:00.000Z",
  }]);
});

test("não registra Diário quando a obra atualizada não existe na lista da conta", async () => {
  const modulo = await carregarModulo();

  await modulo.sincronizarDiarioEdicaoObra({
    userId: "usuario-2",
    novasObrasDoUsuario: [criarObra({ id: "outra", publicado: true })],
    obraId: "obra-ausente",
    atualizadoEm: "2026-11-01T00:00:00.000Z",
  });

  assert.deepEqual(modulo.chamadas, []);
});

test("o hook delega somente a sincronização do Diário ao helper dedicado", () => {
  assert.match(
    saveActionSource,
    /import \{ sincronizarDiarioEdicaoObra \} from "\.\.\/lib\/editar-obra-diary-sync";/,
  );
  assert.match(
    saveActionSource,
    /await sincronizarDiarioEdicaoObra\(\{[\s\S]*?userId,[\s\S]*?novasObrasDoUsuario,[\s\S]*?obraId,[\s\S]*?atualizadoEm: agora,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(saveActionSource, /registrarDiarioEdicaoObra\(/);
  assert.match(
    source,
    /import \{ registrarDiarioEdicaoObra \} from "\.\/editar-obra-diary-action";/,
  );
  assert.match(source, /const obraAtualizadaDiario = novasObrasDoUsuario\.find\(/);
  assert.match(source, /visibilidade: obraAtualizadaDiario\.publicado \? "publico" : "privado"/);
  assert.match(source, /atualizadoEm,/);
  assert.match(diaryActionSource, /export async function registrarDiarioEdicaoObra\(/);
  assert.doesNotMatch(source, /supabase|useState|useEffect|setObras|setProcessando/);
});
