import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-rating-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  authUserId = "22222222-2222-4222-8222-222222222222",
  autorValido = true,
  erroRemoto = null,
} = {}) {
  const chamadas = [];

  globalThis.__profileAuthorRatingDependencies = {
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
      from(tabela) {
        chamadas.push(["from", tabela]);

        return {
          async upsert(payload, options) {
            chamadas.push(["upsert", tabela, payload, options]);
            return { error: erroRemoto };
          },
          delete() {
            chamadas.push(["delete", tabela]);
            let eqs = 0;
            const cadeia = {
              eq(campo, valor) {
                chamadas.push(["eq", tabela, campo, valor]);
                eqs += 1;
                return eqs >= 2
                  ? Promise.resolve({ error: erroRemoto })
                  : cadeia;
              },
            };
            return cadeia;
          },
        };
      },
    },
    execucaoAtual({ identidadeEsperada, identidadeAtual }) {
      return (
        identidadeEsperada.usuarioId === identidadeAtual.usuarioId &&
        identidadeEsperada.versao === identidadeAtual.versao
      );
    },
    calcular(avaliacaoAtual, nota) {
      chamadas.push(["calcular", nota]);
      return {
        ...avaliacaoAtual,
        minhaNota: nota,
        carregado: true,
        salvando: false,
      };
    },
    autorValido(id) {
      chamadas.push(["autor-valido", id]);
      return autorValido;
    },
    salvarLocal(perfil, nota, userId) {
      chamadas.push(["salvar-local", perfil.autorId, nota, userId]);
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace('import type { Dispatch, SetStateAction } from "react";\n', "")
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileAuthorRatingDependencies.supabase;",
      )
      .replace(
        'import type { AutorPerfil, AvaliacaoAutorPublica } from "../types";\n',
        "",
      )
      .replace(
        /import \{\n  execucaoCarregamentoPerfilAutorEstaAtual,\n  type IdentidadeAutenticadaPerfilAutor,\n\} from "\.\.\/lib\/profile-auth-identity";/,
        "const execucaoCarregamentoPerfilAutorEstaAtual = globalThis.__profileAuthorRatingDependencies.execucaoAtual;",
      )
      .replace(
        /import \{\n  calcularProximaAvaliacaoAutor,\n  idAutorSupabaseValido,\n\} from "\.\.\/lib\/profile-formatters";/,
        "const calcularProximaAvaliacaoAutor = globalThis.__profileAuthorRatingDependencies.calcular;\nconst idAutorSupabaseValido = globalThis.__profileAuthorRatingDependencies.autorValido;",
      )
      .replace(
        'import { salvarAvaliacaoAutorLocal } from "../lib/profile-local-author-utils";',
        "const salvarAvaliacaoAutorLocal = globalThis.__profileAuthorRatingDependencies.salvarLocal;",
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
    usuarioId = "22222222-2222-4222-8222-222222222222",
    perfilParaMostrar = {
      autorId: "11111111-1111-4111-8111-111111111111",
      nome: "Autora",
    },
    autorPodeReceberAvaliacao = true,
    perfilPertenceAoUsuario = false,
  } = {},
) {
  const identidade = {
    current: { usuarioId, versao: 7 },
  };
  const estados = [];
  const mensagens = [];
  const avisos = [];
  let estadoAtual = {
    media: 4,
    total: 2,
    minhaNota: 0,
    carregado: true,
    salvando: false,
  };

  return {
    ...modulo.usePerfilAutorRatingActions({
      identidadeAutenticadaPerfilRef: identidade,
      perfilParaMostrar,
      autorPodeReceberAvaliacao,
      perfilPertenceAoUsuario,
      usuarioIdLogado: usuarioId,
      avaliacaoAutor: estadoAtual,
      avisarLoginNecessario(mensagem) {
        avisos.push(mensagem);
      },
      setAvaliacaoAutor(valor) {
        estadoAtual =
          typeof valor === "function" ? valor(estadoAtual) : valor;
        estados.push(estadoAtual);
      },
      setMensagemAcao(mensagem) {
        mensagens.push(mensagem);
      },
    }),
    identidade,
    estados,
    mensagens,
    avisos,
    obterEstado() {
      return estadoAtual;
    },
  };
}

test("salva avaliação local e faz upsert remoto preservando payload", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.avaliarAutor(4.6);

  assert.equal(acoes.obterEstado().minhaNota, 4.5);
  assert.deepEqual(acoes.mensagens, ["", ""]);
  assert.deepEqual(
    modulo.chamadas.filter((chamada) =>
      ["salvar-local", "from"].includes(chamada[0]),
    ),
    [
      [
        "salvar-local",
        "11111111-1111-4111-8111-111111111111",
        4.5,
        "22222222-2222-4222-8222-222222222222",
      ],
      ["from", "autor_avaliacoes"],
    ],
  );

  const upsert = modulo.chamadas.find((chamada) => chamada[0] === "upsert");
  assert.equal(upsert[1], "autor_avaliacoes");
  assert.equal(upsert[2].autor_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(upsert[2].user_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(upsert[2].nota, 4.5);
  assert.equal(typeof upsert[2].atualizado_em, "string");
  assert.deepEqual(upsert[3], { onConflict: "autor_id,user_id" });
});

test("nota zero remove a avaliação remota", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  await acoes.avaliarAutor(0);

  assert.deepEqual(
    modulo.chamadas.filter((chamada) =>
      ["delete", "eq"].includes(chamada[0]),
    ),
    [
      ["delete", "autor_avaliacoes"],
      ["eq", "autor_avaliacoes", "autor_id", "11111111-1111-4111-8111-111111111111"],
      ["eq", "autor_avaliacoes", "user_id", "22222222-2222-4222-8222-222222222222"],
    ],
  );
});

test("sem sessão confirmada pede login e não grava avaliação", async () => {
  const modulo = await carregarModulo({ authUserId: "" });
  const acoes = criarAcoes(modulo, { usuarioId: "" });

  await acoes.avaliarAutor(4);

  assert.deepEqual(acoes.avisos, [
    "Entre na sua conta para avaliar este autor.",
  ]);
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "salvar-local"),
    false,
  );
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "from"),
    false,
  );
});

test("sessão diferente da identidade esperada aborta antes de gravar", async () => {
  const modulo = await carregarModulo({
    authUserId: "33333333-3333-4333-8333-333333333333",
  });
  const acoes = criarAcoes(modulo);

  await acoes.avaliarAutor(4);

  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "salvar-local"),
    false,
  );
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "from"),
    false,
  );
});

test("falha remota mantém avaliação local e encerra salvamento", async () => {
  const modulo = await carregarModulo({ erroRemoto: new Error("falha") });
  const acoes = criarAcoes(modulo);

  await acoes.avaliarAutor(3);

  assert.equal(acoes.obterEstado().minhaNota, 3);
  assert.equal(acoes.obterEstado().carregado, true);
  assert.equal(acoes.obterEstado().salvando, false);
  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "salvar-local"),
    true,
  );
});

test("Perfil de Autor delega avaliarAutor para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorRatingActions \} from "\.\/hooks\/use-perfil-autor-rating-actions";/,
  );
  assert.match(
    pagina,
    /const \{ avaliarAutor \} = usePerfilAutorRatingActions\(\{/,
  );
  assert.doesNotMatch(pagina, /async function avaliarAutor\(/);
  assert.match(source, /async function avaliarAutor\(nota: number\)/);
  assert.match(source, /from\("autor_avaliacoes"\)\.upsert/);
  assert.match(source, /from\("autor_avaliacoes"\)[\s\S]*?\.delete\(\)/);
  assert.match(source, /salvarAvaliacaoAutorLocal\(/);
  assert.match(source, /execucaoCarregamentoPerfilAutorEstaAtual\(/);
});
