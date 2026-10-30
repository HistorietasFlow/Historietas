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
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const ratingViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-rating-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const ratingActionSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-rating-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);
const ratingsPanelSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-ratings-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);

const {
  obterEstadoAvaliacaoPerfilAutor,
  obterVisibilidadeAcoesAvaliacaoPerfilAutor,
} = await import(
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


test("visibilidade das ações de avaliação preserva autor e Diário", () => {
  assert.deepEqual(
    obterVisibilidadeAcoesAvaliacaoPerfilAutor({
      autenticacaoCarregada: true,
      autorPodeReceberAvaliacao: true,
      perfilUsaAvaliacaoDiario: false,
      podeEditarPerfil: false,
      avaliacaoDiarioVisivel: false,
      avaliacaoDiarioPodeAvaliar: false,
    }),
    {
      avaliacaoAutorAcaoVisivel: true,
      avaliacaoDiarioAcaoVisivel: false,
    },
  );

  assert.deepEqual(
    obterVisibilidadeAcoesAvaliacaoPerfilAutor({
      autenticacaoCarregada: true,
      autorPodeReceberAvaliacao: false,
      perfilUsaAvaliacaoDiario: true,
      podeEditarPerfil: false,
      avaliacaoDiarioVisivel: true,
      avaliacaoDiarioPodeAvaliar: true,
    }),
    {
      avaliacaoAutorAcaoVisivel: false,
      avaliacaoDiarioAcaoVisivel: true,
    },
  );

  assert.deepEqual(
    obterVisibilidadeAcoesAvaliacaoPerfilAutor({
      autenticacaoCarregada: true,
      autorPodeReceberAvaliacao: true,
      perfilUsaAvaliacaoDiario: true,
      podeEditarPerfil: true,
      avaliacaoDiarioVisivel: true,
      avaliacaoDiarioPodeAvaliar: true,
    }),
    {
      avaliacaoAutorAcaoVisivel: false,
      avaliacaoDiarioAcaoVisivel: false,
    },
  );
});

test("helper de estado visual delega a visibilidade das ações de avaliação", () => {
  assert.match(
    ratingViewStateSource,
    /obterVisibilidadeAcoesAvaliacaoPerfilAutor,[\s\S]*?from "\.\/profile-rating-display-utils";/,
  );
  assert.equal(
    (ratingViewStateSource.match(/obterVisibilidadeAcoesAvaliacaoPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /<ProfileRatingsPanel[\s\S]*?avaliacaoAutorAcaoVisivel=\{avaliacaoAutorAcaoVisivel\}[\s\S]*?avaliacaoDiarioAcaoVisivel=\{avaliacaoDiarioAcaoVisivel\}/,
  );
  assert.doesNotMatch(
    pagina,
    /autenticacaoCarregada &&[\s\S]{0,140}?autorPodeReceberAvaliacao &&/,
  );
});

test("página mantém as condições e delega a composição das avaliações", () => {
  assert.match(
    pagina,
    /import \{ ProfileRatingsPanel \} from "\.\/components\/profile-ratings-panel";/,
  );
  assert.equal((pagina.match(/<ProfileRatingsPanel/g) || []).length, 1);
  assert.match(
    pagina,
    /<ProfileRatingsPanel[\s\S]*?avaliacaoAutorMinhaNota=\{avaliacaoAutor\.minhaNota\}[\s\S]*?onAvaliarAutor=\{avaliarAutor\}/,
  );
  assert.match(
    pagina,
    /<ProfileRatingsPanel[\s\S]*?avaliacaoDiarioMinhaNota=\{avaliacaoDiario\.minhaNota\}[\s\S]*?avaliacaoDiarioSalvando=\{avaliacaoDiario\.salvando\}[\s\S]*?onAvaliarDiarioPerfil=\{avaliarDiarioPerfil\}/,
  );
  assert.match(
    ratingsPanelSource,
    /\{avaliacaoAutorAcaoVisivel && \([\s\S]*?<ProfileRatingAction[\s\S]*?ariaLabel="Avaliação do autor"[\s\S]*?entidadeAvaliacao="autor"[\s\S]*?keyPrefix="avaliacao-autor"[\s\S]*?minhaNota=\{avaliacaoAutorMinhaNota\}[\s\S]*?onRate=\{onAvaliarAutor\}/,
  );
  assert.match(
    ratingsPanelSource,
    /\{avaliacaoDiarioAcaoVisivel && \([\s\S]*?<ProfileRatingAction[\s\S]*?ariaLabel="Avaliação do Diário"[\s\S]*?entidadeAvaliacao="Diário"[\s\S]*?keyPrefix="avaliacao-diario-perfil"[\s\S]*?minhaNota=\{avaliacaoDiarioMinhaNota\}[\s\S]*?salvando=\{avaliacaoDiarioSalvando\}[\s\S]*?onRate=\{onAvaliarDiarioPerfil\}/,
  );
  assert.doesNotMatch(pagina, /<ProfileRatingBox/);
  assert.match(
    ratingActionSource,
    /import \{ ProfileRatingBox \} from "\.\/profile-rating-box";/,
  );
  assert.match(
    ratingActionSource,
    /<ProfileRatingBox[\s\S]*?ariaLabel=\{ariaLabel\}[\s\S]*?entidadeAvaliacao=\{entidadeAvaliacao\}[\s\S]*?keyPrefix=\{keyPrefix\}[\s\S]*?minhaNota=\{minhaNota\}[\s\S]*?salvando=\{salvando\}[\s\S]*?onRate=\{onRate\}/,
  );
});
