import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comments-load-pagination.ts",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("lifecycle de leitura e paginacao de comentarios esta delegado ao hook", () => {
  assert.match(hook, /export function useObraCommentsLoadPagination/);
  assert.match(hook, /const comentariosConsultaVersaoRef = useRef\(0\)/);
  assert.match(hook, /if \(!comentariosAbertos\) \{\s*return;\s*\}/);
  assert.match(
    hook,
    /carregarComentariosObraLocais\(usuarioIdLogado, obraIdComentarios\)/,
  );
  assert.match(
    hook,
    /carregarPaginaComentariosObraSupabase\(\s*obraIdComentarios,\s*0,/,
  );
  assert.match(hook, /salvarComentariosObraLocais\(/);
  assert.match(hook, /return \(\) => \{\s*cancelado = true;/);
  assert.match(hook, /async function carregarMaisComentariosObra\(\)/);
  assert.match(hook, /execucaoIdentidadeObraEstaAtual/);
  assert.match(hook, /mesclarComentariosObraPorId/);
  assert.match(hook, /comentariosConsultaVersaoRef\.current === versaoConsulta/);
  assert.match(
    paginaObra,
    /const \{ carregarMaisComentariosObra, comentariosRemotosConfirmados \} = useObraCommentsLoadPagination\(/,
  );
  assert.doesNotMatch(paginaObra, /async function carregarMaisComentariosObra\(\)/);
  assert.doesNotMatch(paginaObra, /const comentariosConsultaVersaoRef = useRef\(0\)/);
});

function criarHarness(buscar, locais = []) {
  let estado = null, depsAtuais, efeitoPendente, cleanup;
  const ref = {current: 0};
  const identidade = {current: {usuarioId: "autor", versao: 1}};
  const parametros = {
    comentariosAbertos: true, obraIdComentarios: "obra-1", usuarioIdLogado: "autor", versaoIdentidade: 1,
    identidadeAutenticadaObraRef: identidade, comentariosCarregando: false,
    comentariosCarregandoMais: false, comentariosTemMais: false, comentariosProximoOffset: 0,
  };
  for (const nome of ["setComentariosObra", "setTotalComentariosObra", "setComentariosCarregando", "setComentariosCarregandoMais", "setComentariosTemMais", "setComentariosProximoOffset", "setComentarioStatus"]) {
    parametros[nome] = () => {};
  }
  const dependencias = {
    react: {
      useRef: () => ref,
      useState: () => [estado, (novo) => { estado = novo; }],
      useEffect: (efeito, deps) => {
        if (!depsAtuais || deps.some((valor, indice) => !Object.is(valor, depsAtuais[indice]))) {
          cleanup?.(); depsAtuais = deps; efeitoPendente = efeito;
        }
      },
    },
    "../../../../lib/utils": {idObraSupabaseValido: () => true},
    "../lib/obra-auth-identity": {execucaoIdentidadeObraEstaAtual: ({identidadeEsperada, identidadeAtual, cancelada}) =>
      !cancelada && identidadeEsperada.usuarioId === identidadeAtual.usuarioId && identidadeEsperada.versao === identidadeAtual.versao},
    "../lib/obra-local-comment-storage-utils": {carregarComentariosObraLocais: () => locais, salvarComentariosObraLocais: () => {}},
    "../lib/obra-comment-utils": {mesclarComentariosObraPorId: (atuais, novos) => [...atuais, ...novos]},
    "../lib/obra-supabase-comments-page-loader": {carregarPaginaComentariosObraSupabase: buscar},
  };
  const js = typescript.transpileModule(hook, {compilerOptions: {module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022}}).outputText;
  const modulo = {exports: {}};
  new Function("require", "module", "exports", js)((nome) => {
    assert.ok(Object.hasOwn(dependencias, nome), `dependência inesperada: ${nome}`);
    return dependencias[nome];
  }, modulo, modulo.exports);
  return {
    parametros, identidade,
    render() {
      const resultado = modulo.exports.useObraCommentsLoadPagination(parametros);
      if (efeitoPendente) { const efeito = efeitoPendente; efeitoPendente = null; cleanup = efeito(); }
      return resultado;
    },
    fechar: () => cleanup?.(),
  };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
const pagina = {comentarios: [], temMais: false, proximoOffset: 0};

test("confirma dados remotos uma vez e não certifica cache após falha; reabrir permite recuperação", async () => {
  let chamadas = 0, falhar = true;
  const harness = criarHarness(async () => { chamadas++; if (falhar) throw Error("rede"); return pagina; }, [{local: false}]);
  assert.equal(harness.render().comentariosRemotosConfirmados, false);
  await tick();
  assert.equal(harness.render().comentariosRemotosConfirmados, false);
  falhar = false;
  harness.parametros.comentariosAbertos = false; harness.render();
  harness.parametros.comentariosAbertos = true; harness.render();
  await tick();
  assert.equal(harness.render().comentariosRemotosConfirmados, true);
  harness.render(); harness.render();
  assert.equal(chamadas, 2);
  harness.fechar();
});

test("troca de conta/obra e respostas atrasadas não reaproveitam confirmação anterior", async () => {
  const pendentes = [];
  const harness = criarHarness(() => new Promise((resolve) => pendentes.push(resolve)));
  harness.render();
  harness.identidade.current = {usuarioId: "outra-conta", versao: 2};
  harness.parametros.usuarioIdLogado = "outra-conta";
  harness.parametros.versaoIdentidade = 2;
  harness.render();
  pendentes[0](pagina); await tick();
  assert.equal(harness.render().comentariosRemotosConfirmados, false);
  pendentes[1](pagina); await tick();
  assert.equal(harness.render().comentariosRemotosConfirmados, true);
  harness.parametros.obraIdComentarios = "obra-2";
  assert.equal(harness.render().comentariosRemotosConfirmados, false);
  harness.identidade.current = {usuarioId: "", versao: 3};
  harness.parametros.usuarioIdLogado = "";
  harness.parametros.versaoIdentidade = 3;
  harness.render();
  pendentes[2](pagina); await tick();
  assert.equal(harness.render().comentariosRemotosConfirmados, false);
  harness.fechar();
});
