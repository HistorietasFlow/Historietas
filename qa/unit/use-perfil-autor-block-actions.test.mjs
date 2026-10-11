import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/hooks/use-perfil-autor-block-actions.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  authUserId = "22222222-2222-4222-8222-222222222222",
  idValido = true,
  bloquearResultado = {
    ok: true,
    erro: "",
    estado: {
      bloqueadoPorMim: true,
      bloqueadoPeloPerfil: false,
      existeBloqueio: true,
    },
  },
  desbloquearResultado = {
    ok: true,
    erro: "",
    estado: {
      bloqueadoPorMim: false,
      bloqueadoPeloPerfil: false,
      existeBloqueio: false,
    },
  },
} = {}) {
  const chamadas = [];
  globalThis.__profileBlockDependencies = {
    supabase: {
      auth: {
        async getUser() {
          chamadas.push(["getUser"]);
          return {
            data: {
              user: authUserId ? { id: authUserId } : null,
            },
          };
        },
      },
    },
    async bloquear(id) {
      chamadas.push(["bloquear", id]);
      return bloquearResultado;
    },
    async desbloquear(id) {
      chamadas.push(["desbloquear", id]);
      return desbloquearResultado;
    },
    idValido(id) {
      chamadas.push(["id-valido", id]);
      return idValido;
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace('import type { Dispatch, SetStateAction } from "react";\n', "")
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileBlockDependencies.supabase;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/historietasPrivacy";/,
        "const bloquearUsuario = globalThis.__profileBlockDependencies.bloquear;\nconst desbloquearUsuario = globalThis.__profileBlockDependencies.desbloquear;",
      )
      .replace('import type { AutorPerfil } from "../types";\n', "")
      .replace(
        'import { idAutorSupabaseValido } from "../lib/profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profileBlockDependencies.idValido;",
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

  return { ...modulo, chamadas };
}

function criarAcoes(
  modulo,
  {
    usuarioIdLogado = "22222222-2222-4222-8222-222222222222",
    bloqueadoPorMim = false,
    confirmou = true,
  } = {},
) {
  const chamadas = [];
  globalThis.window = {
    confirm(mensagem) {
      chamadas.push(["confirm", mensagem]);
      return confirmou;
    },
  };

  return {
    ...modulo.usePerfilAutorBlockActions({
      podeEditarPerfil: false,
      perfilParaMostrar: {
        autorId: "11111111-1111-4111-8111-111111111111",
        nome: "Autora",
      },
      bloqueioPerfilSalvando: false,
      usuarioIdLogado,
      estadoBloqueioPerfil: {
        bloqueadoPorMim,
        bloqueadoPeloPerfil: false,
        existeBloqueio: bloqueadoPorMim,
      },
      avisarLoginNecessario(mensagem) {
        chamadas.push(["login", mensagem]);
      },
      setMenuPerfilAberto(valor) {
        chamadas.push(["menu", valor]);
      },
      setMensagemAcao(valor) {
        chamadas.push(["mensagem", valor]);
      },
      setBloqueioPerfilSalvando(valor) {
        chamadas.push(["salvando", valor]);
      },
      setEstadoBloqueioPerfil(valor) {
        chamadas.push(["estado", valor]);
      },
      setSeguindoUsuarioPerfil(valor) {
        chamadas.push(["seguindo", valor]);
      },
      setEstadoRelacionamentoPerfil(valor) {
        chamadas.push(["relacionamento", valor]);
      },
      setPermissoesAbasPerfil(valor) {
        chamadas.push(["permissoes", valor]);
      },
    }),
    chamadas,
  };
}

test("bloqueia perfil preservando confirmação, estados e permissões", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.alternarBloqueioPerfil();

  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "bloquear"),
    true,
  );
  assert.deepEqual(
    acoes.chamadas.filter((chamada) => chamada[0] === "salvando"),
    [["salvando", true], ["salvando", false]],
  );
  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "relacionamento"),
    ["relacionamento", "nenhum"],
  );
  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "permissoes")[1],
    {
      obras: false,
      sobre: false,
      diario: false,
      comunidade: false,
      biblioteca: false,
      atividades: false,
    },
  );
  assert.deepEqual(acoes.chamadas.at(-1), [
    "mensagem",
    "Autora foi bloqueado.",
  ]);
});

test("desbloqueia sem limpar relacionamento e permissões", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, { bloqueadoPorMim: true });

  await acoes.alternarBloqueioPerfil();

  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "desbloquear"),
    true,
  );
  assert.equal(
    acoes.chamadas.some((chamada) => chamada[0] === "relacionamento"),
    false,
  );
  assert.equal(
    acoes.chamadas.some((chamada) => chamada[0] === "permissoes"),
    false,
  );
  assert.deepEqual(acoes.chamadas.at(-1), [
    "mensagem",
    "Autora foi desbloqueado.",
  ]);
});

test("sem usuário confirmado pede login e não bloqueia", async () => {
  const modulo = await carregarModulo({ authUserId: "" });
  const acoes = criarAcoes(modulo, { usuarioIdLogado: "" });

  await acoes.alternarBloqueioPerfil();

  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "login"),
    ["login", "Entre na sua conta para bloquear este usuário."],
  );
  assert.equal(
    modulo.chamadas.some((chamada) =>
      chamada[0] === "bloquear" || chamada[0] === "desbloquear"
    ),
    false,
  );
});

test("cancelamento da confirmação não executa ação remota", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, { confirmou: false });

  await acoes.alternarBloqueioPerfil();

  assert.equal(
    modulo.chamadas.some((chamada) =>
      chamada[0] === "bloquear" || chamada[0] === "desbloquear"
    ),
    false,
  );
});

test("Perfil de Autor delega bloqueio para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorBlockActions \} from "\.\/hooks\/use-perfil-autor-block-actions";/,
  );
  assert.match(
    pagina,
    /const \{ alternarBloqueioPerfil \} = usePerfilAutorBlockActions\(\{/,
  );
  assert.doesNotMatch(pagina, /async function alternarBloqueioPerfil\(/);
  assert.match(source, /async function alternarBloqueioPerfil\(\)/);
  assert.match(source, /await bloquearUsuario\(perfilUserId\)/);
  assert.match(source, /await desbloquearUsuario\(perfilUserId\)/);
});
