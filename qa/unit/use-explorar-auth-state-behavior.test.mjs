import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const codigo = readFileSync(
  new URL("../../app/explorar/hooks/use-explorar-auth-state.ts", import.meta.url),
  "utf8",
)
  .replace(/\r\n/g, "\n")
  .replace(/^import[\s\S]*?from "[^"]+";\n/gm, "");
const injecao = `
const useEffect = (...args) => globalThis.__explorarAuthTeste.useEffect(...args);
const supabase = {
  auth: {
    getUser: (...args) => globalThis.__explorarAuthTeste.supabase.auth.getUser(...args),
    onAuthStateChange: (...args) => globalThis.__explorarAuthTeste.supabase.auth.onAuthStateChange(...args),
  },
};
`;
const javascript = typescript.transpileModule(injecao + codigo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const modulo = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const adiar = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolver, rejeitar) => {
    resolve = resolver;
    reject = rejeitar;
  });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

function preparar(t, respostaGetUser) {
  const estado = {};
  let efeito;
  let authCallback;
  let unsubscribeChamado = false;
  globalThis.__explorarAuthTeste = {
    useEffect(fn) {
      efeito = fn;
    },
    supabase: {
      auth: {
        getUser: () => respostaGetUser,
        onAuthStateChange(callback) {
          authCallback = callback;
          return {
            data: {
              subscription: {
                unsubscribe() {
                  unsubscribeChamado = true;
                },
              },
            },
          };
        },
      },
    },
  };
  t.after(() => {
    delete globalThis.__explorarAuthTeste;
  });

  modulo.useExplorarAuthState({
    setUsuarioIdExplorar: (valor) => { estado.usuarioId = valor; },
    setUsuarioLogado: (valor) => { estado.logado = valor; },
    setMensagemLogin: (valor) => { estado.mensagem = valor; },
    setFiltroColecao: (valor) => { estado.filtro = valor; },
  });
  const cleanup = efeito();

  return {
    estado,
    emitir(evento, userId) {
      authCallback(evento, userId ? { user: { id: userId } } : null);
    },
    cleanup,
    unsubscribeChamado: () => unsubscribeChamado,
  };
}

test("getUser inicial estabelece a identidade quando nenhum evento mais novo ocorre", async (t) => {
  const c = preparar(t, Promise.resolve({ data: { user: { id: "A" } } }));
  await tick();
  assert.deepEqual(c.estado, { usuarioId: "A", logado: true });
  c.cleanup();
  assert.equal(c.unsubscribeChamado(), true);
});

test("evento B invalida getUser atrasado de A e logout limpa o filtro pessoal", async (t) => {
  const respostaA = adiar();
  const c = preparar(t, respostaA.promise);

  c.emitir("SIGNED_IN", "B");
  respostaA.resolve({ data: { user: { id: "A" } } });
  await tick();
  assert.equal(c.estado.usuarioId, "B");
  assert.equal(c.estado.logado, true);
  assert.equal(c.estado.mensagem, "");

  c.emitir("SIGNED_OUT", "");
  assert.equal(c.estado.usuarioId, "");
  assert.equal(c.estado.logado, false);
  assert.equal(c.estado.filtro, "todos");

  c.emitir("SIGNED_IN", "C");
  assert.equal(c.estado.usuarioId, "C");
  assert.equal(c.estado.logado, true);
});

test("erro atrasado de getUser não apaga a identidade recebida por evento", async (t) => {
  const respostaA = adiar();
  const c = preparar(t, respostaA.promise);
  c.emitir("SIGNED_IN", "B");
  respostaA.reject(new Error("sessão antiga"));
  await tick();
  assert.equal(c.estado.usuarioId, "B");
  assert.equal(c.estado.logado, true);
});
