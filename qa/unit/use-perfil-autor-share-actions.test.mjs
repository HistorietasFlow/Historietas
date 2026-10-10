import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-share-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({ copiarResultado = true, cancelado = false } = {}) {
  const chamadas = [];
  globalThis.__profileShareActionsDependencies = {
    criarUrlAbsolutaCompartilhamentoPerfilAutor(url) {
      chamadas.push(["url", url]);
      return "https://historietas.app/perfil/ana";
    },
    async copiarTextoComFallbackPerfilAutor(url) {
      chamadas.push(["copiar", url]);
      return copiarResultado;
    },
    erroCompartilhamentoFoiCanceladoPerfilAutor() {
      chamadas.push(["cancelado"]);
      return cancelado;
    },
  };

  const javascript = typescript.transpileModule(
    source.replace(
      /import \{[\s\S]*?\} from "\.\.\/lib\/profile-sharing-utils";/,
      [
        "const {",
        "  copiarTextoComFallbackPerfilAutor,",
        "  criarUrlAbsolutaCompartilhamentoPerfilAutor,",
        "  erroCompartilhamentoFoiCanceladoPerfilAutor,",
        "} = globalThis.__profileShareActionsDependencies;",
      ].join("\n"),
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
    autorHandlePerfil = "@ana",
    perfilParaMostrar = { nome: "Ana" },
    perfilUsuarioRemotoAtivo = { username: "ana" },
  } = {},
) {
  const mensagens = [];
  const menus = [];
  return {
    ...modulo.usePerfilAutorShareActions({
      autorHandlePerfil,
      perfilParaMostrar,
      perfilUsuarioRemotoAtivo,
      setMensagemAcao(mensagem) {
        mensagens.push(mensagem);
      },
      setMenuPerfilAberto(aberto) {
        menus.push(aberto);
      },
    }),
    mensagens,
    menus,
  };
}

async function comNavigator(valor, executar) {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: valor });
  try {
    return await executar();
  } finally {
    if (anterior) Object.defineProperty(globalThis, "navigator", anterior);
    else delete globalThis.navigator;
  }
}

const dados = {
  url: "/perfil/ana",
  titulo: "Ana no HISTORIETAS",
  texto: "Confira o perfil de Ana.",
  mensagemCompartilhado: "Compartilhamento aberto.",
  mensagemCopiado: "Link copiado.",
  mensagemErro: "Falha ao compartilhar.",
};

test("usa Web Share quando disponível e permitido", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);
  const compartilhados = [];

  await comNavigator({
    canShare() { return true; },
    async share(payload) { compartilhados.push(payload); },
  }, () => acoes.compartilharLinkPerfilAutor(dados));

  assert.deepEqual(compartilhados, [{
    title: dados.titulo,
    text: dados.texto,
    url: "https://historietas.app/perfil/ana",
  }]);
  assert.deepEqual(acoes.mensagens, ["Compartilhamento aberto."]);
  assert.equal(modulo.chamadas.some((chamada) => chamada[0] === "copiar"), false);
});

test("usa cópia como fallback e preserva mensagem de erro", async () => {
  const sucesso = await carregarModulo({ copiarResultado: true });
  const acoesSucesso = criarAcoes(sucesso);
  await comNavigator({}, () => acoesSucesso.compartilharLinkPerfilAutor(dados));
  assert.deepEqual(acoesSucesso.mensagens, ["Link copiado."]);

  const falha = await carregarModulo({ copiarResultado: false });
  const acoesFalha = criarAcoes(falha);
  await comNavigator({}, () => acoesFalha.compartilharLinkPerfilAutor(dados));
  assert.deepEqual(acoesFalha.mensagens, ["Falha ao compartilhar."]);
});

test("cancelamento do Web Share não mostra mensagem nem copia", async () => {
  const modulo = await carregarModulo({ cancelado: true });
  const acoes = criarAcoes(modulo);
  await comNavigator({
    async share() { throw new Error("cancelado"); },
  }, () => acoes.compartilharLinkPerfilAutor(dados));
  assert.deepEqual(acoes.mensagens, []);
  assert.equal(modulo.chamadas.some((chamada) => chamada[0] === "copiar"), false);
});

test("copia username preservando @ e não exibe mensagem no sucesso", async () => {
  const modulo = await carregarModulo({ copiarResultado: true });
  const acoes = criarAcoes(modulo, "@ana");

  await acoes.copiarUsernameCabecalho();

  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "copiar"),
    [["copiar", "@ana"]],
  );
  assert.deepEqual(acoes.mensagens, []);
});

test("adiciona @ ao username e preserva mensagem de erro na falha", async () => {
  const modulo = await carregarModulo({ copiarResultado: false });
  const acoes = criarAcoes(modulo, "ana");

  await acoes.copiarUsernameCabecalho();

  assert.deepEqual(
    modulo.chamadas.filter((chamada) => chamada[0] === "copiar"),
    [["copiar", "@ana"]],
  );
  assert.deepEqual(acoes.mensagens, [
    "Não foi possível copiar o username agora.",
  ]);
});

test("compartilha o perfil fechando o menu e preservando nome e username", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);
  const compartilhados = [];
  const windowOriginal = globalThis.window;

  globalThis.window = {
    location: { href: "https://historietas.app/perfil/ana" },
  };

  try {
    await comNavigator({
      async share(payload) {
        compartilhados.push(payload);
      },
    }, () => acoes.copiarLinkPerfil());
  } finally {
    if (windowOriginal === undefined) delete globalThis.window;
    else globalThis.window = windowOriginal;
  }

  assert.deepEqual(acoes.menus, [false]);
  assert.equal(compartilhados[0].title, "Ana no HISTORIETAS");
  assert.equal(
    compartilhados[0].text,
    "Confira o perfil de Ana (@ana) no HISTORIETAS.",
  );
});

test("usa fallback de nome quando o perfil não está disponível", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    perfilParaMostrar: null,
    perfilUsuarioRemotoAtivo: null,
  });
  const compartilhados = [];
  const windowOriginal = globalThis.window;

  globalThis.window = {
    location: { href: "https://historietas.app/perfil-autor" },
  };

  try {
    await comNavigator({
      async share(payload) {
        compartilhados.push(payload);
      },
    }, () => acoes.copiarLinkPerfil());
  } finally {
    if (windowOriginal === undefined) delete globalThis.window;
    else globalThis.window = windowOriginal;
  }

  assert.equal(compartilhados[0].title, "este autor no HISTORIETAS");
  assert.equal(
    compartilhados[0].text,
    "Confira o perfil de este autor no HISTORIETAS.",
  );
});

test("Perfil de Autor delega o fluxo genérico de compartilhamento para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorShareActions \} from "\.\/hooks\/use-perfil-autor-share-actions";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?compartilharLinkPerfilAutor,[\s\S]*?copiarLinkPerfil,[\s\S]*?copiarUsernameCabecalho,[\s\S]*?\} = usePerfilAutorShareActions\(\{[\s\S]*?autorHandlePerfil,[\s\S]*?perfilParaMostrar,[\s\S]*?perfilUsuarioRemotoAtivo,[\s\S]*?setMensagemAcao,[\s\S]*?setMenuPerfilAberto,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function compartilharLinkPerfilAutor\(/);
  assert.doesNotMatch(pagina, /async function copiarLinkPerfil\(/);
  assert.doesNotMatch(pagina, /async function copiarUsernameCabecalho\(/);
  assert.match(source, /await copiarTextoComFallbackPerfilAutor\(urlFinal\)/);
  assert.match(source, /await copiarTextoComFallbackPerfilAutor\(usernameCompleto\)/);
  assert.match(source, /setMenuPerfilAberto\(false\)/);
});
