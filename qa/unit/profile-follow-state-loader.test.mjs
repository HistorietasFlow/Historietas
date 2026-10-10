import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-follow-state-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
let indiceModulo = 0;

function criarConsulta(resposta, chamadas, tabela) {
  const chamada = { tabela, select: null, eq: [], maybeSingle: false };
  chamadas.push(chamada);
  const consulta = {
    select(campos, opcoes) {
      chamada.select = [campos, opcoes];
      return consulta;
    },
    eq(campo, valor) {
      chamada.eq.push([campo, valor]);
      return consulta;
    },
    maybeSingle() {
      chamada.maybeSingle = true;
      return Promise.resolve(resposta);
    },
    then(resolve, reject) {
      return Promise.resolve(resposta).then(resolve, reject);
    },
  };
  return consulta;
}

async function carregarModulo(configurar) {
  const dependencias = {
    chamadas: [],
    respostas: [],
    idAutorSupabaseValido: (id) => id.startsWith("usuario-"),
    supabase: {
      from(tabela) {
        const resposta = dependencias.respostas.shift();
        if (resposta instanceof Error) {
          throw resposta;
        }
        return criarConsulta(resposta, dependencias.chamadas, tabela);
      },
    },
  };
  configurar(dependencias);
  globalThis.__profileFollowStateDependencies = dependencias;
  const javascript = typescript.transpileModule(
    loaderSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileFollowStateDependencies.supabase;",
      )
      .replace(
        'import { idAutorSupabaseValido } from "./profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profileFollowStateDependencies.idAutorSupabaseValido;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );
  return { ...modulo, dependencias };
}

test("retorna zero para identificador inválido sem consultar seguidores", async () => {
  const { contarSeguimentoUsuarioPerfil, dependencias } = await carregarModulo(
    () => {},
  );
  assert.equal(
    await contarSeguimentoUsuarioPerfil("seguido_id", "invalido"),
    0,
  );
  assert.deepEqual(dependencias.chamadas, []);
});

test("conta seguidores com a consulta exata e mantém fallback de erro", async () => {
  const { contarSeguimentoUsuarioPerfil, dependencias } = await carregarModulo(
    (deps) => {
      deps.respostas.push({ count: 7, error: null }, { count: null, error: { message: "falhou" } });
    },
  );
  assert.equal(await contarSeguimentoUsuarioPerfil("seguido_id", "usuario-2"), 7);
  assert.equal(await contarSeguimentoUsuarioPerfil("seguidor_id", "usuario-2"), 0);
  assert.deepEqual(dependencias.chamadas, [
    {
      tabela: "seguindo_usuarios",
      select: ["id", { count: "exact", head: true }],
      eq: [["seguido_id", "usuario-2"]],
      maybeSingle: false,
    },
    {
      tabela: "seguindo_usuarios",
      select: ["id", { count: "exact", head: true }],
      eq: [["seguidor_id", "usuario-2"]],
      maybeSingle: false,
    },
  ]);
});

test("mantém o retorno seguro para perfil inválido e para o próprio perfil", async () => {
  const invalido = await carregarModulo(() => {});
  assert.deepEqual(
    await invalido.carregarEstadoSeguimentoUsuarioPerfil("usuario-1", ""),
    { seguindo: false, seguidoresTotal: 0, seguindoTotal: 0 },
  );
  assert.deepEqual(invalido.dependencias.chamadas, []);

  const proprio = await carregarModulo((deps) => {
    deps.respostas.push({ count: 4, error: null }, { count: 2, error: null });
  });
  assert.deepEqual(
    await proprio.carregarEstadoSeguimentoUsuarioPerfil("usuario-2", "usuario-2"),
    { seguindo: false, seguidoresTotal: 4, seguindoTotal: 2 },
  );
  assert.equal(proprio.dependencias.chamadas.length, 2);
  assert.equal(proprio.dependencias.chamadas.some((chamada) => chamada.maybeSingle), false);
});

test("distingue contagens de seguidores e seguindo do relacionamento existente", async () => {
  const { carregarEstadoSeguimentoUsuarioPerfil, dependencias } = await carregarModulo(
    (deps) => {
      deps.respostas.push(
        { count: 9, error: null },
        { count: 3, error: null },
        { data: { seguidor_id: "usuario-1" }, error: null },
      );
    },
  );
  assert.deepEqual(
    await carregarEstadoSeguimentoUsuarioPerfil("usuario-1", "usuario-2"),
    { seguindo: true, seguidoresTotal: 9, seguindoTotal: 3 },
  );
  assert.deepEqual(dependencias.chamadas[2], {
    tabela: "seguindo_usuarios",
    select: ["seguidor_id", undefined],
    eq: [["seguidor_id", "usuario-1"], ["seguido_id", "usuario-2"]],
    maybeSingle: true,
  });
});

test("mantém retorno seguro para relacionamento ausente e falhas Supabase", async () => {
  const ausente = await carregarModulo((deps) => {
    deps.respostas.push(
      { count: 1, error: null },
      { count: 5, error: null },
      { data: null, error: null },
    );
  });
  assert.deepEqual(
    await ausente.carregarEstadoSeguimentoUsuarioPerfil("usuario-1", "usuario-2"),
    { seguindo: false, seguidoresTotal: 1, seguindoTotal: 5 },
  );

  const falha = await carregarModulo((deps) => {
    deps.respostas.push(
      { count: 1, error: null },
      { count: 5, error: null },
      new Error("indisponível"),
    );
  });
  assert.deepEqual(
    await falha.carregarEstadoSeguimentoUsuarioPerfil("usuario-1", "usuario-2"),
    { seguindo: false, seguidoresTotal: 1, seguindoTotal: 5 },
  );
});

test("Perfil de Autor delega o carregador de estado de seguidores", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarEstadoSeguimentoUsuarioPerfil,[\s\S]*?\} from "\.\/lib\/profile-follow-state-loader";/,
  );
  assert.match(
    loaderSource,
    /export async function contarSeguimentoUsuarioPerfil\(/,
  );
  assert.match(
    loaderSource,
    /export async function carregarEstadoSeguimentoUsuarioPerfil\(/,
  );
  assert.doesNotMatch(pagina, /async function contarSeguimentoUsuarioPerfil\(/);
  assert.doesNotMatch(
    pagina,
    /async function carregarEstadoSeguimentoUsuarioPerfil\(/,
  );
  assert.match(
    pagina,
    /carregarEstadoSeguimentoUsuarioPerfil\([\s\S]*?usuarioAtualId,[\s\S]*?perfilUserId,\s*\)/,
  );
  assert.doesNotMatch(loaderSource, /useState|useEffect|localStorage/);
});
