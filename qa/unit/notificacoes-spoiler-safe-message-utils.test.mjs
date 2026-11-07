import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-spoiler-safe-message-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;

const {
  criarMensagemComentarioCapituloSemSpoiler,
  criarMensagemComentarioComunidadeSemSpoiler,
  criarMensagemComentarioDiarioSemSpoiler,
  criarMensagemReviewComunidadeSemSpoiler,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("mensagens fallback de comentarios nao reproduzem conteudo com spoiler", () => {
  const spoiler = "O culpado e o narrador e o heroi morre no final";

  const comunidade = criarMensagemComentarioComunidadeSemSpoiler({
    autorNome: "Leitora",
    texto: spoiler,
  });
  const capitulo = criarMensagemComentarioCapituloSemSpoiler({
    autorNome: "Leitora",
    contextoTitulo: "Capítulo 12",
    comentario: spoiler,
  });

  assert.equal(comunidade, "Leitora comentou na sua publicação.");
  assert.equal(capitulo, "Leitora comentou em Capítulo 12.");
  assert.doesNotMatch(`${comunidade} ${capitulo}`, new RegExp(spoiler, "i"));
});

test("mensagem fallback de review preserva contexto sem reproduzir a review", () => {
  const mensagem = criarMensagemReviewComunidadeSemSpoiler({
    autorNome: "Leitor",
    contextoTitulo: "Obra Segura",
    texto: "O final secreto revela o texto da review",
  });

  assert.equal(
    mensagem,
    "Leitor publicou uma review sobre Obra Segura.",
  );
  assert.doesNotMatch(mensagem, /final secreto|texto da review/i);
});

test("mensagens seguras mantem fallbacks sem aceitar corpo de comentario", () => {
  assert.equal(
    criarMensagemComentarioCapituloSemSpoiler({ autorNome: "Leitor" }),
    "Leitor comentou em seu capítulo.",
  );
  assert.equal(
    criarMensagemReviewComunidadeSemSpoiler({ autorNome: "Leitora" }),
    "Leitora publicou uma review sobre sua obra.",
  );
});

test("comentario ou resposta do Diario preserva contexto sem antecipar o texto", () => {
  const mensagem = criarMensagemComentarioDiarioSemSpoiler({
    autorNome: "Leitor",
    contextoTitulo: "avaliação",
    contextoSecundario: "Obra Segura",
    texto: "A identidade secreta e revelada no capitulo final",
  });

  assert.equal(
    mensagem,
    "Leitor comentou na sua avaliação sobre Obra Segura.",
  );
  assert.doesNotMatch(mensagem, /identidade secreta|capitulo final/i);
});
