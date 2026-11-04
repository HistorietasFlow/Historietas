import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const identidadeFonte = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-auth-identity.ts", import.meta.url),
  "utf8",
);
const identidadeJs = typescript.transpileModule(identidadeFonte, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const {
  atualizarIdentidadeAutenticadaLeitor,
  execucaoAutenticacaoLeitorEstaAtual,
  execucaoIdentidadeLeitorEstaAtual,
  removerEstadoUsuarioObrasLeitor,
} = await import(`data:text/javascript;base64,${Buffer.from(identidadeJs).toString("base64")}`);

const pagina = readFileSync(
  new URL("../../app/ler-capitulo/page.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
const lifecycle = readFileSync(
  new URL("../../app/ler-capitulo/hooks/use-ler-capitulo-auth-identity-lifecycle.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

test("versiona A para B, A para logout e logout para B sem confundir identidades", () => {
  const identidadeA = { usuarioId: "usuario-a", versao: 4 };
  const identidadeB = atualizarIdentidadeAutenticadaLeitor(
    identidadeA,
    "usuario-b",
  ).identidade;
  const logout = atualizarIdentidadeAutenticadaLeitor(
    identidadeA,
    "",
  ).identidade;
  const loginB = atualizarIdentidadeAutenticadaLeitor(
    logout,
    "usuario-b",
  ).identidade;

  assert.deepEqual(identidadeB, { usuarioId: "usuario-b", versao: 5 });
  assert.deepEqual(logout, { usuarioId: "", versao: 5 });
  assert.deepEqual(loginB, { usuarioId: "usuario-b", versao: 6 });
  assert.equal(
    execucaoIdentidadeLeitorEstaAtual({
      cancelada: false,
      identidadeEsperada: identidadeA,
      identidadeAtual: identidadeB,
    }),
    false,
  );
  assert.equal(
    atualizarIdentidadeAutenticadaLeitor(identidadeB, "usuario-b").mudou,
    false,
  );
});

test("evento de auth mais novo invalida getUser atrasado da conta anterior", () => {
  assert.equal(
    execucaoAutenticacaoLeitorEstaAtual({
      cancelada: false,
      versaoEsperada: 1,
      versaoAtual: 2,
    }),
    false,
  );
  assert.equal(
    execucaoAutenticacaoLeitorEstaAtual({
      cancelada: false,
      versaoEsperada: 2,
      versaoAtual: 2,
    }),
    true,
  );
});

test("reset remove estado privado e interações de A preservando conteúdo público", () => {
  const obras = [
    {
      id: "publica",
      publicado: true,
      capitulos: [
        { id: "publicado", publicado: true, curtiu: true, salvo: true, comentario: "A", lido: true, lidoEm: "data" },
        { id: "rascunho", publicado: false, curtiu: true, salvo: true, comentario: "A", lido: true, lidoEm: "data" },
      ],
      ultimoCapituloLidoId: "publicado",
      ultimaLeituraEm: "data",
      progressoLeitura: 100,
    },
    {
      id: "privada-a",
      publicado: false,
      capitulos: [],
      ultimoCapituloLidoId: "",
      ultimaLeituraEm: "",
      progressoLeitura: 0,
    },
  ];

  const [publica] = removerEstadoUsuarioObrasLeitor(obras);

  assert.equal(publica.id, "publica");
  assert.equal(publica.capitulos.length, 1);
  assert.deepEqual(
    publica.capitulos[0],
    {
      id: "publicado",
      publicado: true,
      curtiu: false,
      salvo: false,
      comentario: "",
      lido: false,
      lidoEm: "",
    },
  );
  assert.equal(publica.progressoLeitura, 0);
  assert.equal(publica.ultimoCapituloLidoId, "");
});

test("página centraliza reset, recarga e guards antes das persistências", () => {
  assert.match(lifecycle, /versaoConsultaAutenticacaoLeitorRef/);
  assert.match(lifecycle, /supabase\.auth\.onAuthStateChange/);
  assert.match(lifecycle, /subscription\.unsubscribe\(\)/);
  assert.match(pagina, /onIdentidadeMudou: limparEstadoContaAnterior/);
  assert.match(pagina, /removerEstadoUsuarioObrasLeitor\(obrasAtuais\)/);
  assert.match(pagina, /identidadeDadosAplicada,/);
  assert.match(pagina, /execucaoIdentidadeAcaoEstaAtual,/);
  assert.match(pagina, /usuarioIdDadosAplicados/);
});
