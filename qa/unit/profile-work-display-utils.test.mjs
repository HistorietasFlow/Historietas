import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-work-display-utils.ts", import.meta.url),
  "utf8",
);

globalThis.__profileWorkDisplayDependencies = {
  ehClassificacao18(valor) {
    return valor === "18+";
  },
  normalizarTexto(valor) {
    return String(valor).trim().toLowerCase();
  },
  TOP_FIVE_MAXIMO: 5,
  mesclarObrasPorIdSlug(principais, extras) {
    const mapa = new Map();
    for (const obra of [...principais, ...extras]) {
      const chave = obra.id || obra.slug || obra.titulo;
      if (!mapa.has(chave)) mapa.set(chave, obra);
    }
    return [...mapa.values()];
  },
  encontrarObraPorIdentificadorTopFivePerfil(obras, identificador) {
    return (
      obras.find(
        (obra) =>
          obra.id === identificador ||
          obra.slug === identificador ||
          String(obra.titulo).trim().toLowerCase() ===
            String(identificador).trim().toLowerCase(),
      ) || null
    );
  },
  obterTimestampData(valor) {
    const timestamp = Date.parse(valor);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      'import { ehClassificacao18 } from "../../../lib/historietasAdultContent";',
      "const { ehClassificacao18 } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { normalizarTexto } from "../../../lib/utils";',
      "const { normalizarTexto } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { TOP_FIVE_MAXIMO } from "../constants";',
      "const { TOP_FIVE_MAXIMO } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { mesclarObrasPorIdSlug } from "./data-normalizers";',
      "const { mesclarObrasPorIdSlug } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { encontrarObraPorIdentificadorTopFivePerfil } from "./library-normalizers";',
      "const { encontrarObraPorIdentificadorTopFivePerfil } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { obterTimestampData } from "./profile-formatters";',
      "const { obterTimestampData } = globalThis.__profileWorkDisplayDependencies;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const {
  obterObrasVisiveisPerfilAutor,
  obterObrasDestaquePerfilAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function obra(id, {
  titulo = id,
  slug = id,
  classificacaoIndicativa = "Livre",
  criadaEm = "2026-01-01T00:00:00.000Z",
} = {}) {
  return {
    id,
    titulo,
    slug,
    classificacaoIndicativa,
    criadaEm,
  };
}

function perfil(obras) {
  return {
    autorId: "autor-1",
    nome: "Ana",
    obras,
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: obras.length,
  };
}

test("visitante não vê 18+ e recebe obras da mais recente para a mais antiga", () => {
  const antiga = obra("antiga", { criadaEm: "2025-01-01T00:00:00.000Z" });
  const adulta = obra("adulta", {
    classificacaoIndicativa: "18+",
    criadaEm: "2027-01-01T00:00:00.000Z",
  });
  const nova = obra("nova", { criadaEm: "2026-06-01T00:00:00.000Z" });

  assert.deepEqual(
    obterObrasVisiveisPerfilAutor({
      perfilParaMostrar: perfil([antiga, adulta, nova]),
      perfilPertenceAoUsuario: false,
    }).map((item) => item.id),
    ["nova", "antiga"],
  );
});

test("perfil próprio preserva obras 18+ e ordenação", () => {
  const adulta = obra("adulta", {
    classificacaoIndicativa: "18+",
    criadaEm: "2027-01-01T00:00:00.000Z",
  });
  const comum = obra("comum", { criadaEm: "2026-01-01T00:00:00.000Z" });

  assert.deepEqual(
    obterObrasVisiveisPerfilAutor({
      perfilParaMostrar: perfil([comum, adulta]),
      perfilPertenceAoUsuario: true,
    }).map((item) => item.id),
    ["adulta", "comum"],
  );
});

test("sem perfil retorna lista vazia", () => {
  assert.deepEqual(
    obterObrasVisiveisPerfilAutor({
      perfilParaMostrar: null,
      perfilPertenceAoUsuario: false,
    }),
    [],
  );
});

test("TOP 5 preserva ordem selecionada, deduplica e filtra 18+ para visitante", () => {
  const a = obra("a");
  const b = obra("b");
  const adulta = obra("adulta", { classificacaoIndicativa: "18+" });

  const resultado = obterObrasDestaquePerfilAutor({
    topFiveObraIds: ["b", "adulta", "a", "b"],
    obras: [a, b, adulta],
    obrasPerfil: [],
    perfilPertenceAoUsuario: false,
  });

  assert.deepEqual(resultado.map((item) => item.id), ["b", "a"]);
});

test("TOP 5 limita a cinco obras e permite 18+ para o próprio perfil", () => {
  const obras = [
    obra("1", { classificacaoIndicativa: "18+" }),
    obra("2"),
    obra("3"),
    obra("4"),
    obra("5"),
    obra("6"),
  ];

  const resultado = obterObrasDestaquePerfilAutor({
    topFiveObraIds: ["1", "2", "3", "4", "5", "6"],
    obras,
    obrasPerfil: [],
    perfilPertenceAoUsuario: true,
  });

  assert.deepEqual(resultado.map((item) => item.id), ["1", "2", "3", "4", "5"]);
});

test("TOP 5 vazio retorna lista vazia sem depender das obras carregadas", () => {
  assert.deepEqual(
    obterObrasDestaquePerfilAutor({
      topFiveObraIds: [],
      obras: [obra("a")],
      obrasPerfil: [obra("b")],
      perfilPertenceAoUsuario: false,
    }),
    [],
  );
});
