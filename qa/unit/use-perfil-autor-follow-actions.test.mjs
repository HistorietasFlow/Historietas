import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/hooks/use-perfil-autor-follow-actions.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  authUserId = "22222222-2222-4222-8222-222222222222",
  solicitarResultado = { ok: true, estado: "seguindo", erro: "" },
  cancelarResultado = { ok: true, estado: "nenhum", erro: "" },
  deixarResultado = { ok: true, estado: "nenhum", erro: "" },
} = {}) {
  const chamadas = [];

  globalThis.__profileFollowDependencies = {
    supabase: {
      auth: {
        async getUser() {
          chamadas.push(["getUser"]);
          return { data: { user: authUserId ? { id: authUserId } : null } };
        },
      },
    },
    async cancelar(id) {
      chamadas.push(["cancelar", id]);
      return cancelarResultado;
    },
    async deixar(id) {
      chamadas.push(["deixar", id]);
      return deixarResultado;
    },
    async solicitar(id) {
      chamadas.push(["solicitar", id]);
      return solicitarResultado;
    },
    key: "author-follow",
    criarChave(id, nome) {
      return id.trim().toLowerCase() || nome.trim().toLowerCase();
    },
    criarHref(nome, id) {
      chamadas.push(["href", nome, id]);
      return `/perfil-autor?autor=${nome}&autorId=${id}`;
    },
    idValido(id) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    },
    normalizarNome(nome) {
      return nome.trim().toLowerCase();
    },
    salvarJson(chave, userId, valor) {
      chamadas.push(["salvar-json", chave, userId, valor]);
    },
    async sincronizar(autor, ativo) {
      chamadas.push(["sincronizar", autor, ativo]);
    },
    async criarNotificacao(payload) {
      chamadas.push(["criar-notificacao", payload]);
      return true;
    },
    async removerNotificacoes(receptorId, ids) {
      chamadas.push(["remover-notificacoes", receptorId, ids]);
      return true;
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace('import type { Dispatch, SetStateAction } from "react";\n', "")
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileFollowDependencies.supabase;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/historietasPrivacy";/,
        "const cancelarSolicitacaoSeguidor = globalThis.__profileFollowDependencies.cancelar;\nconst deixarDeSeguirUsuario = globalThis.__profileFollowDependencies.deixar;\nconst solicitarOuSeguirUsuario = globalThis.__profileFollowDependencies.solicitar;",
      )
      .replace('import type { AutorPerfil } from "../types";\n', "")
      .replace(
        'import { AUTHOR_FOLLOW_STORAGE_KEY } from "../constants";',
        "const AUTHOR_FOLLOW_STORAGE_KEY = globalThis.__profileFollowDependencies.key;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/lib\/profile-formatters";/,
        "const criarChaveAutorPerfil = globalThis.__profileFollowDependencies.criarChave;\nconst criarPerfilAutorHref = globalThis.__profileFollowDependencies.criarHref;\nconst idAutorSupabaseValido = globalThis.__profileFollowDependencies.idValido;\nconst normalizarNomeAutor = globalThis.__profileFollowDependencies.normalizarNome;",
      )
      .replace(
        'import { salvarJsonUsuarioPerfilAutor } from "../lib/profile-local-storage-utils";',
        "const salvarJsonUsuarioPerfilAutor = globalThis.__profileFollowDependencies.salvarJson;",
      )
      .replace(
        'import { sincronizarAutorSeguidoSupabase } from "../lib/profile-user-collections-sync";',
        "const sincronizarAutorSeguidoSupabase = globalThis.__profileFollowDependencies.sincronizar;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/lib\/profile-social-notifications-utils";/,
        "const criarNotificacaoSocialPerfilAutor = globalThis.__profileFollowDependencies.criarNotificacao;\nconst removerNotificacoesSociaisPerfilAutor = globalThis.__profileFollowDependencies.removerNotificacoes;",
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
    perfilParaMostrar = {
      autorId: "11111111-1111-4111-8111-111111111111",
      nome: "Autora",
    },
    usuarioIdLogado = "22222222-2222-4222-8222-222222222222",
    estadoRelacionamentoPerfil = "nenhum",
    seguindoUsuarioPerfil = false,
    seguindoAutor = false,
    autoresSeguidos = [],
  } = {},
) {
  const chamadas = [];
  let seguidoresTotal = 10;

  return {
    ...modulo.usePerfilAutorFollowActions({
      perfilParaMostrar,
      seguirUsuarioSalvando: false,
      usuarioIdLogado,
      estadoRelacionamentoPerfil,
      seguindoUsuarioPerfil,
      perfilDoUsuarioLogado: {
        autorId: usuarioIdLogado,
        nome: "Leitora",
      },
      seguindoAutor,
      autoresSeguidos,
      avisarLoginNecessario(mensagem) {
        chamadas.push(["login", mensagem]);
      },
      setMensagemAcao(mensagem) {
        chamadas.push(["mensagem", mensagem]);
      },
      setSeguirUsuarioSalvando(valor) {
        chamadas.push(["salvando", valor]);
      },
      setEstadoRelacionamentoPerfil(valor) {
        chamadas.push(["estado", valor]);
      },
      setSeguindoUsuarioPerfil(valor) {
        chamadas.push(["seguindo", valor]);
      },
      setSeguidoresUsuarioPerfilTotal(atualizar) {
        seguidoresTotal =
          typeof atualizar === "function" ? atualizar(seguidoresTotal) : atualizar;
        chamadas.push(["total", seguidoresTotal]);
      },
      setAutoresSeguidos(valor) {
        chamadas.push(["autores", valor]);
      },
    }),
    chamadas,
    obterSeguidoresTotal() {
      return seguidoresTotal;
    },
  };
}

test("segue perfil remoto e cria notificação de novo seguidor", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.alternarSeguirAutor();

  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "solicitar"),
    true,
  );
  assert.deepEqual(
    acoes.chamadas.filter((chamada) => chamada[0] === "salvando"),
    [["salvando", true], ["salvando", false]],
  );
  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "estado"),
    ["estado", "seguindo"],
  );
  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "seguindo"),
    ["seguindo", true],
  );
  assert.equal(acoes.obterSeguidoresTotal(), 11);
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "criar-notificacao"),
    true,
  );
  assert.deepEqual(
    acoes.chamadas.find(
      (chamada) =>
        chamada[0] === "mensagem" &&
        chamada[1] === "Perfil adicionado aos seus seguindo.",
    ),
    ["mensagem", "Perfil adicionado aos seus seguindo."],
  );
});

test("cancela solicitação pendente e remove sua notificação", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    estadoRelacionamentoPerfil: "solicitado",
  });

  await acoes.alternarSeguirAutor();

  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "cancelar"),
    true,
  );
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "remover-notificacoes"),
    true,
  );
  assert.deepEqual(
    acoes.chamadas.find(
      (chamada) =>
        chamada[0] === "mensagem" &&
        chamada[1] === "Solicitação cancelada.",
    ),
    ["mensagem", "Solicitação cancelada."],
  );
});

test("sem usuário autenticado pede login e não altera seguimento", async () => {
  const modulo = await carregarModulo({ authUserId: "" });
  const acoes = criarAcoes(modulo, { usuarioIdLogado: "" });

  await acoes.alternarSeguirAutor();

  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "login"),
    ["login", "Entre na sua conta para seguir perfis."],
  );
  assert.equal(
    modulo.chamadas.some((chamada) =>
      ["solicitar", "cancelar", "deixar"].includes(chamada[0]),
    ),
    false,
  );
});

test("perfil local preserva fallback de lista e sincronização por autor", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    perfilParaMostrar: {
      autorId: "autor-local",
      nome: "Autora Local",
    },
    autoresSeguidos: [],
  });

  await acoes.alternarSeguirAutor();

  assert.deepEqual(
    modulo.chamadas.find((chamada) => chamada[0] === "salvar-json"),
    [
      "salvar-json",
      "author-follow",
      "22222222-2222-4222-8222-222222222222",
      ["autor-local"],
    ],
  );
  assert.deepEqual(
    modulo.chamadas.find((chamada) => chamada[0] === "sincronizar"),
    ["sincronizar", "autora local", true],
  );
  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "autores"),
    ["autores", ["autor-local"]],
  );
});

test("Perfil de Autor delega seguimento para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorFollowActions \} from "\.\/hooks\/use-perfil-autor-follow-actions";/,
  );
  assert.match(
    pagina,
    /const \{ alternarSeguirAutor \} = usePerfilAutorFollowActions\(\{/,
  );
  assert.doesNotMatch(pagina, /async function alternarSeguirAutor\(/);
  assert.match(source, /async function alternarSeguirAutor\(\)/);
  assert.match(source, /solicitarOuSeguirUsuario\(userIdPerfil\)/);
  assert.match(source, /cancelarSolicitacaoSeguidor\(userIdPerfil\)/);
  assert.match(source, /deixarDeSeguirUsuario\(userIdPerfil\)/);
  assert.match(source, /sincronizarAutorSeguidoSupabase\(/);
});
