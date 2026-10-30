import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-summary-stats.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const contentViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-content-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

globalThis.__profileSummaryStatsDependencies = {
  formatarGeneroPerfilAutor(genero) {
    const valor = String(genero || "").trim();
    return valor || "Não informado";
  },
  normalizarNumeroPerfilAutor(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
  },
};

const javascript = typescript.transpileModule(
  source.replace(
    /import \{[\s\S]*?\} from "\.\/profile-formatters";/,
    [
      "const {",
      "  formatarGeneroPerfilAutor,",
      "  normalizarNumeroPerfilAutor,",
      "} = globalThis.__profileSummaryStatsDependencies;",
    ].join("\n"),
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const { obterResumoEstatisticasPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function obra(id, genero, visualizacoes, capitulos = [{}]) {
  return {
    id,
    genero,
    visualizacoes,
    capitulos,
  };
}

function perfil(obras, totalPublicadas) {
  return {
    autorId: "autor-1",
    nome: "Ana",
    obras,
    totalPublicadas,
  };
}

test("sem perfil retorna resumo zerado", () => {
  assert.deepEqual(obterResumoEstatisticasPerfilAutor(null), {
    generosPrincipaisPerfil: [],
    generosEspecialidadesPerfil: ["Histórias variadas"],
    totalVisualizacoesPerfil: 0,
    totalRascunhosPerfil: 0,
    totalObrasSemCapitulosPerfil: 0,
    temObrasSemCapitulosPerfil: false,
  });
});

test("especialidades preservam gêneros principais e fallback quando vazio", () => {
  const comGeneros = obterResumoEstatisticasPerfilAutor(
    perfil([obra("1", "Fantasia", 0)], 1),
  );
  assert.deepEqual(comGeneros.generosEspecialidadesPerfil, ["Fantasia"]);

  const semGeneros = obterResumoEstatisticasPerfilAutor(
    perfil([obra("1", "", 0)], 1),
  );
  assert.deepEqual(semGeneros.generosEspecialidadesPerfil, ["Histórias variadas"]);
});


test("ordena gêneros por frequência e desempata alfabeticamente", () => {
  const resultado = obterResumoEstatisticasPerfilAutor(
    perfil(
      [
        obra("1", "Fantasia", 0),
        obra("2", "Drama", 0),
        obra("3", "Fantasia", 0),
        obra("4", "Aventura", 0),
        obra("5", "Drama", 0),
        obra("6", "Terror", 0),
      ],
      6,
    ),
  );

  assert.deepEqual(resultado.generosPrincipaisPerfil, [
    "Drama",
    "Fantasia",
    "Aventura",
    "Terror",
  ]);
});

test("ignora gênero não informado e limita a cinco gêneros", () => {
  const resultado = obterResumoEstatisticasPerfilAutor(
    perfil(
      [
        obra("1", "", 0),
        obra("2", "A", 0),
        obra("3", "B", 0),
        obra("4", "C", 0),
        obra("5", "D", 0),
        obra("6", "E", 0),
        obra("7", "F", 0),
      ],
      7,
    ),
  );

  assert.deepEqual(resultado.generosPrincipaisPerfil, ["A", "B", "C", "D", "E"]);
});

test("soma visualizações normalizadas e conta rascunhos e obras sem capítulos", () => {
  const resultado = obterResumoEstatisticasPerfilAutor(
    perfil(
      [
        obra("1", "A", 10.4, [{}]),
        obra("2", "B", "7", []),
        obra("3", "C", -5, []),
        obra("4", "D", "invalido", [{}]),
      ],
      2,
    ),
  );

  assert.equal(resultado.totalVisualizacoesPerfil, 17);
  assert.equal(resultado.totalRascunhosPerfil, 2);
  assert.equal(resultado.totalObrasSemCapitulosPerfil, 2);
  assert.equal(resultado.temObrasSemCapitulosPerfil, true);
});

test("resumo indica quando não existem obras sem capítulos", () => {
  const resultado = obterResumoEstatisticasPerfilAutor(
    perfil([obra("1", "A", 0, [{}])], 1),
  );

  assert.equal(resultado.totalObrasSemCapitulosPerfil, 0);
  assert.equal(resultado.temObrasSemCapitulosPerfil, false);
});


test("página reutiliza a presença de obras sem capítulos já derivada", () => {
  assert.match(pagina, /temObrasSemCapitulosPerfil,/);
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(
    pagina,
    /mostrarObrasSemCapitulos=\{temObrasSemCapitulosPerfil\}/,
  );
  assert.doesNotMatch(
    pagina,
    /totalObrasSemCapitulosPerfil > 0/,
  );
});


test("rascunhos nunca ficam negativos", () => {
  const resultado = obterResumoEstatisticasPerfilAutor(
    perfil([obra("1", "A", 0)], 5),
  );

  assert.equal(resultado.totalRascunhosPerfil, 0);
});


test("página reutiliza especialidades já derivadas no resumo", () => {
  assert.match(pagina, /generosEspecialidadesPerfil,/);
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(
    pagina,
    /<ProfileAboutSection[\s\S]*?generosEspecialidadesPerfil=\{generosEspecialidadesPerfil\}/,
  );
  assert.doesNotMatch(
    pagina,
    /generosPrincipaisPerfil\.length > 0[\s\S]*?Histórias variadas/,
  );
});


test("página usa resumo de estatísticas sem useMemo", () => {
  assert.match(
    contentViewStateSource,
    /\} = obterResumoEstatisticasPerfilAutor\(perfilParaMostrar\);/,
  );
  assert.doesNotMatch(
    contentViewStateSource,
    /obterResumoEstatisticasPerfilAutor\(perfilParaMostrar\)[\s\S]{0,120}\[perfilParaMostrar\]/,
  );
});
