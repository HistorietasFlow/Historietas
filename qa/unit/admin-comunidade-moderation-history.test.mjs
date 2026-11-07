import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const loaderSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-historico-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-history-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const componentSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-moderation-history.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

function importarTypescript(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(`${javascript}\n// ${Math.random()}`).toString("base64")}`,
  );
}

async function importarLoader(supabase) {
  const javascript = typescript.transpileModule(
    loaderSource
      .replace(
        'import { supabase } from "../../../../lib/supabase/client";',
        "const supabase = globalThis.__supabaseHistoricoTeste;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/lib\/admin-comunidade-profile-utils";/,
        "const { criarMapaNomesPerfisModeracao } = globalThis.__utilsHistoricoTeste;",
      )
      .replace(
        /import \{[\s\S]*?\} from "\.\.\/lib\/admin-comunidade-history-utils";/,
        "const { normalizarAcaoHistoricoModeracao, normalizarOrigemHistoricoModeracao } = globalThis.__utilsHistoricoTeste;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  globalThis.__supabaseHistoricoTeste = supabase;
  globalThis.__utilsHistoricoTeste = {
    criarMapaNomesPerfisModeracao(perfis) {
      return new Map(
        perfis.flatMap((perfil) =>
          [perfil.id, perfil.user_id]
            .filter(Boolean)
            .map((id) => [id, perfil.nome?.trim() || "Usuário sem nome"]),
        ),
      );
    },
    normalizarAcaoHistoricoModeracao(valor) {
      return valor === "status_alterado" ? valor : "atualizada";
    },
    normalizarOrigemHistoricoModeracao(valor) {
      return valor === "perfil" ? "perfil" : "conteudo";
    },
  };

  return import(
    `data:text/javascript;base64,${Buffer.from(`${javascript}\n// ${Math.random()}`).toString("base64")}`,
  );
}

function criarSupabaseHistorico({ historico, perfis = [], erro = null }) {
  const chamadas = [];

  return {
    chamadas,
    cliente: {
      from(tabela) {
        chamadas.push(["from", tabela]);

        if (tabela === "moderacao_historico") {
          return {
            select(campos) {
              chamadas.push(["select", campos]);
              return {
                order(campo, opcoes) {
                  chamadas.push(["order", campo, opcoes]);
                  return {
                    order(segundoCampo, segundasOpcoes) {
                      chamadas.push(["order", segundoCampo, segundasOpcoes]);
                      return {
                        range(inicio, fim) {
                          chamadas.push(["range", inicio, fim]);
                          return Promise.resolve({ data: historico, error: erro });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }

        return {
          select() {
            return {
              in(campo, ids) {
                chamadas.push(["in", campo, ids]);
                return {
                  limit(limite) {
                    chamadas.push(["limit", limite]);
                    return Promise.resolve({ data: perfis, error: null });
                  },
                };
              },
            };
          },
        };
      },
    },
  };
}

test("helpers normalizam decisões, estados e responsáveis sem usar ID como nome", async () => {
  const utils = await importarTypescript(utilsSource);

  assert.equal(utils.normalizarOrigemHistoricoModeracao("perfil"), "perfil");
  assert.equal(utils.normalizarOrigemHistoricoModeracao("desconhecida"), "conteudo");
  assert.equal(
    utils.normalizarAcaoHistoricoModeracao("status_alterado"),
    "status_alterado",
  );
  assert.equal(utils.normalizarAcaoHistoricoModeracao("outra"), "atualizada");
  assert.equal(utils.rotuloAcaoHistoricoModeracao("excluida"), "Denúncia removida do painel");
  assert.equal(utils.rotuloStatusHistoricoModeracao("em_analise"), "Em análise");
  assert.equal(
    utils.rotuloResponsavelHistoricoModeracao({
      acao: "status_alterado",
      moderadorId: "moderador-1",
      moderadorNome: "Ada",
    }),
    "Ada",
  );
  assert.equal(
    utils.rotuloResponsavelHistoricoModeracao({
      acao: "criada",
      moderadorId: "",
      moderadorNome: "",
    }),
    "Usuário denunciante",
  );
});

test("loader pagina, resolve o responsável e preserva observação interna", async () => {
  const linhas = Array.from({ length: 31 }, (_, index) => ({
    id: `evento-${index}`,
    origem: index === 0 ? "perfil" : "conteudo",
    denuncia_id: `denuncia-${index}`,
    acao: index === 0 ? "status_alterado" : "atualizada",
    status_anterior: "pendente",
    status_novo: "resolvida",
    observacao_admin: index === 0 ? "Decisão interna" : "",
    moderador_id: index === 0 ? "moderador-1" : null,
    criado_em: "2026-11-06T12:00:00.000Z",
  }));
  const supabase = criarSupabaseHistorico({
    historico: linhas,
    perfis: [{ id: "perfil-1", user_id: "moderador-1", nome: "Ada" }],
  });
  const loader = await importarLoader(supabase.cliente);
  const resultado = await loader.buscarPaginaHistoricoModeracao(0);

  assert.equal(resultado.eventos.length, 30);
  assert.equal(resultado.temMais, true);
  assert.deepEqual(resultado.eventos[0], {
    id: "evento-0",
    origem: "perfil",
    denunciaId: "denuncia-0",
    acao: "status_alterado",
    statusAnterior: "pendente",
    statusNovo: "resolvida",
    observacaoAdmin: "Decisão interna",
    moderadorId: "moderador-1",
    moderadorNome: "Ada",
    criadoEm: "2026-11-06T12:00:00.000Z",
  });
  assert.ok(
    supabase.chamadas.some(
      (chamada) => chamada[0] === "range" && chamada[1] === 0 && chamada[2] === 30,
    ),
  );
});

test("loader usa página segura, evita consulta de perfis vazia e propaga erro", async () => {
  const vazio = criarSupabaseHistorico({ historico: [] });
  const loaderVazio = await importarLoader(vazio.cliente);
  assert.deepEqual(await loaderVazio.buscarPaginaHistoricoModeracao(-4), {
    eventos: [],
    temMais: false,
  });
  assert.equal(
    vazio.chamadas.filter((chamada) => chamada[0] === "from").length,
    1,
  );

  const falha = new Error("falha simulada");
  const comErro = criarSupabaseHistorico({ historico: [], erro: falha });
  const loaderComErro = await importarLoader(comErro.cliente);
  await assert.rejects(
    () => loaderComErro.buscarPaginaHistoricoModeracao(1),
    falha,
  );
});

test("painel carrega sob demanda, permite retry/paginação e fica restrito à rota admin", () => {
  assert.match(componentSource, /aria-label="Histórico de moderação"/);
  assert.match(componentSource, /aria-expanded=\{aberto\}/);
  assert.match(componentSource, /buscarPaginaHistoricoModeracao\(proximaPagina\)/);
  assert.match(componentSource, /carregarPagina\(0, true\)/);
  assert.match(componentSource, /carregarPagina\(pagina \+ 1\)/);
  assert.match(componentSource, /role="alert"/);
  assert.match(componentSource, /evento\.observacaoAdmin/);
  assert.match(componentSource, /rotuloResponsavelHistoricoModeracao/);
  assert.match(pageSource, /<AdminComunidadeModerationHistory \/>/);
  assert.doesNotMatch(loaderSource, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
