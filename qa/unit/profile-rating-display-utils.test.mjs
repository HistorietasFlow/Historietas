import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-rating-display-utils.ts", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { obterEstadoAvaliacaoPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const avaliacaoAutor = {
  media: 4,
  total: 10,
  minhaNota: 0,
  carregado: true,
  salvando: false,
};
const avaliacaoDiario = {
  media: 3,
  total: 5,
  minhaNota: 0,
  carregado: true,
  salvando: false,
  visivel: true,
  mostrar: true,
  podeAvaliar: true,
};

function perfil(totalObras) {
  return {
    autorId: "user-a",
    nome: "Ana",
    obras: Array.from({ length: totalObras }, (_, i) => ({
      id: String(i),
    })),
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: totalObras,
  };
}

test("autor com obras usa avaliação do autor", () => {
  const resultado = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar: perfil(1),
    podeEditarPerfil: false,
    avaliacaoAutor,
    avaliacaoDiario,
  });

  assert.equal(resultado.autorPodeReceberAvaliacao, true);
  assert.equal(resultado.perfilUsaAvaliacaoDiario, false);
  assert.equal(resultado.avaliacaoResumoPerfilVisivel, true);
  assert.equal(resultado.avaliacaoResumoPerfil, avaliacaoAutor);
  assert.equal(resultado.avaliacaoResumoEhDiario, false);
});

test("perfil sem obras usa avaliação do Diário", () => {
  const resultado = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar: perfil(0),
    podeEditarPerfil: false,
    avaliacaoAutor,
    avaliacaoDiario,
  });

  assert.equal(resultado.autorPodeReceberAvaliacao, false);
  assert.equal(resultado.perfilUsaAvaliacaoDiario, true);
  assert.equal(resultado.avaliacaoDiarioPrivada, false);
  assert.equal(resultado.avaliacaoDiarioResumoVisivel, true);
  assert.equal(resultado.avaliacaoResumoPerfil, avaliacaoDiario);
  assert.equal(resultado.avaliacaoResumoEhDiario, true);
});

test("avaliação privada continua visível no resumo do Diário", () => {
  const resultado = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar: perfil(0),
    podeEditarPerfil: false,
    avaliacaoAutor,
    avaliacaoDiario: {
      ...avaliacaoDiario,
      mostrar: false,
      visivel: false,
    },
  });

  assert.equal(resultado.avaliacaoDiarioPrivada, true);
  assert.equal(resultado.avaliacaoDiarioResumoVisivel, true);
  assert.equal(resultado.avaliacaoResumoPerfilVisivel, true);
});

test("perfil próprio pode ver resumo do Diário mesmo sem visibilidade pública", () => {
  const resultado = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar: perfil(0),
    podeEditarPerfil: true,
    avaliacaoAutor,
    avaliacaoDiario: {
      ...avaliacaoDiario,
      mostrar: true,
      visivel: false,
    },
  });

  assert.equal(resultado.avaliacaoDiarioPrivada, false);
  assert.equal(resultado.avaliacaoDiarioResumoVisivel, true);
});

test("sem perfil não mostra resumo", () => {
  const resultado = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar: null,
    podeEditarPerfil: false,
    avaliacaoAutor,
    avaliacaoDiario,
  });

  assert.equal(resultado.autorPodeReceberAvaliacao, false);
  assert.equal(resultado.perfilUsaAvaliacaoDiario, false);
  assert.equal(resultado.avaliacaoResumoPerfilVisivel, false);
  assert.equal(resultado.avaliacaoResumoEhDiario, true);
});
