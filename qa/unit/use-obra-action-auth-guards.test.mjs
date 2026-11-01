import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const guardsAutenticacao = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-action-auth-guards.ts",
    import.meta.url,
  ),
  "utf8",
);

test("cliente delega guards de autenticacao das acoes ao hook", () => {
  assert.match(
    paginaObra,
    /import \{ useObraActionAuthGuards \} from "\.\/hooks\/use-obra-action-auth-guards";/,
  );
  assert.match(
    paginaObra,
    /const \{[\s\S]*?obterIdentidadeLogadaParaAcao,[\s\S]*?criarGuardIdentidadeAcao,[\s\S]*?\} = useObraActionAuthGuards\(\{[\s\S]*?identidadeAutenticadaObraRef,[\s\S]*?setMensagemAcao,[\s\S]*?redirecionarParaLogin: \(href\) => router\.push\(href\),[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(paginaObra, /async function obterIdentidadeLogadaParaAcao\(/);
  assert.doesNotMatch(paginaObra, /function criarGuardIdentidadeAcao\(/);
});

test("hook preserva a identidade versionada e a autenticacao remota", () => {
  for (const trecho of [
    "export function useObraActionAuthGuards",
    "const identidadeEsperada = identidadeAutenticadaObraRef.current;",
    "execucaoIdentidadeObraEstaAtual({",
    "const { data } = await supabase.auth.getUser();",
    "userId === identidadeEsperada.usuarioId",
    "function criarGuardIdentidadeAcao(",
    "identidadeAtual: identidadeAutenticadaObraRef.current",
  ]) {
    assert.ok(guardsAutenticacao.includes(trecho), trecho);
  }
});

test("hook preserva mensagem e redirect de login nos mesmos ramos", () => {
  const inicio = guardsAutenticacao.indexOf(
    "async function obterIdentidadeLogadaParaAcao(",
  );
  const fim = guardsAutenticacao.indexOf(
    "function criarGuardIdentidadeAcao(",
    inicio,
  );

  assert.ok(inicio >= 0);
  assert.ok(fim > inicio);

  const autenticacaoAcao = guardsAutenticacao.slice(inicio, fim);
  assert.match(
    autenticacaoAcao,
    /if \(!userId && !identidadeEsperada\.usuarioId\) \{[\s\S]*?const loginHref = await criarLoginHrefObraPublica\(\);[\s\S]*?if \(execucaoAtual\(\)\) \{[\s\S]*?setMensagemAcao\(mensagem\);[\s\S]*?redirecionarParaLogin\(loginHref\);/,
  );
  assert.match(
    autenticacaoAcao,
    /catch \{[\s\S]*?if \(!execucaoAtual\(\)\) \{[\s\S]*?return null;[\s\S]*?const loginHref = await criarLoginHrefObraPublica\(\);[\s\S]*?setMensagemAcao\(mensagem\);[\s\S]*?redirecionarParaLogin\(loginHref\);/,
  );
});

test("hook nao incorpora mutations nem apresentacao", () => {
  for (const trecho of [
    "enviarComentarioObra",
    "alternarSeguirObra",
    "avaliarObra",
    "compartilharObra",
    "<Obra",
  ]) {
    assert.doesNotMatch(guardsAutenticacao, new RegExp(trecho, "i"));
  }
});
