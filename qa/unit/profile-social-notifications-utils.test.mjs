import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const moduloSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-social-notifications-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
let indiceModulo = 0;

function criarConsulta(resposta, chamadas, tabela) {
  const chamada = { tabela, delete: false, eq: [], in: [] };
  chamadas.push(chamada);
  const consulta = {
    delete() {
      chamada.delete = true;
      return consulta;
    },
    eq(campo, valor) {
      chamada.eq.push([campo, valor]);
      return consulta;
    },
    in(campo, valores) {
      chamada.in.push([campo, valores]);
      return consulta;
    },
    then(resolve, reject) {
      return Promise.resolve(resposta).then(resolve, reject);
    },
  };
  return consulta;
}

function definirJanela(janela) {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: janela,
  });
  return () => {
    if (anterior) {
      Object.defineProperty(globalThis, "window", anterior);
    } else {
      delete globalThis.window;
    }
  };
}

async function carregarModulo(configurar) {
  const dependencias = {
    chamadas: [],
    respostasDelete: [],
    chamadasRpc: [],
    respostaRpc: { error: null },
    idAutorSupabaseValido: (id) => id.startsWith("usuario-"),
    supabase: {
      from(tabela) {
        const resposta = dependencias.respostasDelete.shift();
        if (resposta instanceof Error) {
          throw resposta;
        }
        return criarConsulta(resposta, dependencias.chamadas, tabela);
      },
      rpc(nome, parametros) {
        dependencias.chamadasRpc.push([nome, parametros]);
        if (dependencias.respostaRpc instanceof Error) {
          throw dependencias.respostaRpc;
        }
        return Promise.resolve(dependencias.respostaRpc);
      },
    },
  };
  configurar(dependencias);
  globalThis.__profileSocialNotificationsDependencies = dependencias;
  const javascript = typescript.transpileModule(
    moduloSource
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profileSocialNotificationsDependencies.supabase;",
      )
      .replace(
        'import type { NotificacaoSocialPerfilAutorPayload } from "../types";\n',
        "",
      )
      .replace(
        'import { idAutorSupabaseValido } from "./profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profileSocialNotificationsDependencies.idAutorSupabaseValido;",
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

function payloadSobrescrito(valores = {}) {
  return {
    receptorId: "usuario-2",
    tipo: "novo-seguidor",
    titulo: "Novo seguidor",
    mensagem: "Uma pessoa começou a seguir você.",
    link: "/perfil-autor?autor=leitor",
    notificacaoId: "seguir:usuario-1:usuario-2",
    ...valores,
  };
}

test("recusa identificadores inválidos sem consultar ou emitir evento", async () => {
  const eventos = [];
  const restaurarJanela = definirJanela({
    dispatchEvent(evento) {
      eventos.push(evento.type);
    },
  });
  try {
    const { removerNotificacoesSociaisPerfilAutor, criarNotificacaoSocialPerfilAutor, dependencias } = await carregarModulo(() => {});
    assert.equal(await removerNotificacoesSociaisPerfilAutor(" ", [" id "]), false);
    assert.equal(await removerNotificacoesSociaisPerfilAutor("usuario-2", [" ", ""]), false);
    assert.equal(await criarNotificacaoSocialPerfilAutor(payloadSobrescrito({ tipo: " " })), false);
    assert.deepEqual(dependencias.chamadas, []);
    assert.deepEqual(dependencias.chamadasRpc, []);
    assert.deepEqual(eventos, []);
  } finally {
    restaurarJanela();
  }
});

test("deduplica IDs e remove notificações sociais somente após sucesso", async () => {
  const eventos = [];
  const restaurarJanela = definirJanela({
    dispatchEvent(evento) {
      eventos.push(evento.type);
    },
  });
  try {
    const { removerNotificacoesSociaisPerfilAutor, dependencias } = await carregarModulo((deps) => {
      deps.respostasDelete.push({ error: null });
    });
    assert.equal(
      await removerNotificacoesSociaisPerfilAutor(" usuario-2 ", [" antigo ", "antigo", "novo", " "]),
      true,
    );
    assert.deepEqual(dependencias.chamadas, [{
      tabela: "notificacoes",
      delete: true,
      eq: [["user_id", "usuario-2"]],
      in: [["notificacao_id", ["antigo", "novo"]]],
    }]);
    assert.deepEqual(eventos, ["historietas:notificacoes-atualizadas"]);
  } finally {
    restaurarJanela();
  }
});

test("mantém retorno seguro para falhas na exclusão Supabase", async () => {
  const eventos = [];
  const restaurarJanela = definirJanela({ dispatchEvent: (evento) => eventos.push(evento.type) });
  try {
    const comErro = await carregarModulo((deps) => {
      deps.respostasDelete.push({ error: { message: "falhou" } });
    });
    assert.equal(await comErro.removerNotificacoesSociaisPerfilAutor("usuario-2", ["id"]), false);
    const comExcecao = await carregarModulo((deps) => {
      deps.respostasDelete.push(new Error("indisponível"));
    });
    assert.equal(await comExcecao.removerNotificacoesSociaisPerfilAutor("usuario-2", ["id"]), false);
    assert.deepEqual(eventos, []);
  } finally {
    restaurarJanela();
  }
});

test("cria notificação pela RPC com trims, fallbacks e evento de sucesso", async () => {
  const eventos = [];
  const restaurarJanela = definirJanela({ dispatchEvent: (evento) => eventos.push(evento.type) });
  try {
    const { criarNotificacaoSocialPerfilAutor, dependencias } = await carregarModulo(() => {});
    assert.equal(
      await criarNotificacaoSocialPerfilAutor(payloadSobrescrito({
        receptorId: " usuario-2 ",
        tipo: " novo-seguidor ",
        titulo: " ",
        mensagem: " ",
        link: " ",
        notificacaoId: " seguir:1 ",
      })),
      true,
    );
    assert.deepEqual(dependencias.chamadasRpc, [["criar_notificacao_social", {
      p_user_id: "usuario-2",
      p_tipo: "novo-seguidor",
      p_titulo: "Nova notificação",
      p_mensagem: "Você recebeu uma nova notificação.",
      p_link: "/notificacoes",
      p_notificacao_id: "seguir:1",
    }]]);
    assert.deepEqual(eventos, ["historietas:notificacoes-atualizadas"]);
  } finally {
    restaurarJanela();
  }
});

test("não emite evento para falha da RPC e tolera ausência de window", async () => {
  const restaurarJanela = definirJanela(undefined);
  try {
    const comErro = await carregarModulo((deps) => {
      deps.respostaRpc = { error: { message: "falhou" } };
    });
    assert.equal(await comErro.criarNotificacaoSocialPerfilAutor(payloadSobrescrito()), false);

    const semJanela = await carregarModulo(() => {});
    assert.equal(await semJanela.criarNotificacaoSocialPerfilAutor(payloadSobrescrito()), true);
    assert.doesNotThrow(() => semJanela.avisarAtualizacaoNotificacoesPerfilAutor());
  } finally {
    restaurarJanela();
  }
});

test("Perfil de Autor delega apenas os helpers sociais extraídos", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarNotificacaoSocialPerfilAutor,[\s\S]*?removerNotificacoesSociaisPerfilAutor,[\s\S]*?\} from "\.\/lib\/profile-social-notifications-utils";/,
  );
  assert.doesNotMatch(pagina, /NotificacaoSocialPerfilAutorPayload/);
  for (const helper of [
    "avisarAtualizacaoNotificacoesPerfilAutor",
    "removerNotificacoesSociaisPerfilAutor",
    "criarNotificacaoSocialPerfilAutor",
  ]) {
    assert.match(moduloSource, new RegExp(`export (?:async )?function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`(?:async )?function ${helper}\\(`));
  }
  assert.match(pagina, /await removerNotificacoesSociaisPerfilAutor\(/);
  assert.match(pagina, /await criarNotificacaoSocialPerfilAutor\(/);
  assert.doesNotMatch(moduloSource, /useState|useEffect|localStorage/);
});
