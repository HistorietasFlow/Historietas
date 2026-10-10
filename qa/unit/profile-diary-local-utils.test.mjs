import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-local-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const diaryLoaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(
  utilsSource
    .replace(
      'import { obterLocaleDocumentoPerfilAutor } from "../translations";',
      `const obterLocaleDocumentoPerfilAutor = () => {
  const idioma = globalThis.document?.documentElement?.lang?.toLowerCase() || "";
  if (idioma.startsWith("en")) return "en-US";
  if (idioma.startsWith("es")) return "es-ES";
  return "pt-BR";
};`,
    )
    .replace(
      'import { pegarTexto } from "./data-normalizers";',
      'const pegarTexto = (valor, fallback = "") => typeof valor === "string" && valor.trim() ? valor.trim() : fallback;',
    )
    .replace(
      'import { colecaoTemObraPerfilBiblioteca } from "./library-normalizers";',
      `const colecaoTemObraPerfilBiblioteca = (colecao, obra) =>
  colecao.includes(obra.id) || colecao.includes(obra.slug) || colecao.includes(obra.titulo);`,
    )
    .replace(
      'import { criarItemDiarioPerfil } from "./profile-diary-item-utils";',
      `const criarItemDiarioPerfil = (tipo, obra, data, descricao, complemento = {}) => ({
  chave: \`${"${tipo}"}-${"${obra.id}"}-${"${data || obra.id}"}\`,
  tipo,
  titulo: obra.titulo,
  descricao,
  data,
  obra,
  href: obra.link,
  ...complemento,
});`,
    )
    .replace(
      'import { ordenarItensDiarioPerfil } from "./profile-diary-merge-utils";',
      `const ordenarItensDiarioPerfil = (itens) => [...itens].sort(
  (itemA, itemB) => new Date(itemB.data).getTime() - new Date(itemA.data).getTime(),
);`,
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  coletarObraIdsRegistrosDiarioPerfil,
  dataDiarioPerfilFormatada,
  montarDiarioPerfilLocal,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

function comIdioma(idioma, executar) {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { documentElement: { lang: idioma } },
  });

  try {
    return executar();
  } finally {
    if (anterior) {
      Object.defineProperty(globalThis, "document", anterior);
    } else {
      delete globalThis.document;
    }
  }
}

function criarObra(indice, sobrescrever = {}) {
  return {
    id: `obra-${indice}`,
    titulo: `Obra ${indice}`,
    slug: `obra-${indice}`,
    link: `/obra/obra-${indice}`,
    progressoLeitura: 0,
    ultimaLeituraEm: "",
    criadaEm: `2026-01-${String(indice).padStart(2, "0")}T12:00:00.000Z`,
    ...sobrescrever,
  };
}

function criarPerfil(obras) {
  return { autorId: "autor-1", nome: "Autora", obras };
}

test("coleta IDs com a precedência e os fallbacks originais", () => {
  assert.deepEqual(
    coletarObraIdsRegistrosDiarioPerfil([
      { obra_id: " obra-1 ", obraId: "obra-ignorada" },
      { obraId: " obra-2 " },
      { obra_id: "" },
      { obra_id: 12 },
      {},
    ]),
    ["obra-1", "obra-2"],
  );
});

test("formata datas válidas por idioma e preserva o fallback de data inválida", () => {
  const data = "2026-02-10T12:00:00.000Z";

  assert.equal(comIdioma("pt-BR", () => dataDiarioPerfilFormatada(data)), "10/02/2026");
  assert.equal(comIdioma("es", () => dataDiarioPerfilFormatada(data)), "10/02/2026");
  assert.equal(comIdioma("en", () => dataDiarioPerfilFormatada(data)), "02/10/2026");
  assert.equal(dataDiarioPerfilFormatada(""), "Data não informada");
  assert.equal(dataDiarioPerfilFormatada("data inválida"), "Data não informada");
});

test("monta coleções locais, preserva visibilidades e limita atividades a oito", () => {
  const obras = Array.from({ length: 10 }, (_, indice) =>
    criarObra(indice + 1, {
      progressoLeitura: indice === 0 || indice === 8 ? 45 : 0,
      ultimaLeituraEm: `2026-02-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`,
    }),
  );
  const diario = montarDiarioPerfilLocal(
    criarPerfil(obras),
    ["obra-2"],
    ["obra-3", "obra-9"],
    ["obra-4", "obra-9"],
  );

  assert.deepEqual(diario.lendoAgora.map((item) => item.obra.id), ["obra-1"]);
  assert.deepEqual(diario.favoritas.map((item) => item.obra.id), ["obra-2"]);
  assert.deepEqual(diario.concluidas.map((item) => item.obra.id), ["obra-9", "obra-3"]);
  assert.deepEqual(diario.queroLer.map((item) => item.obra.id), ["obra-4"]);
  assert.equal(diario.lendoAgora[0].visibilidade, "privado");
  assert.equal(diario.favoritas[0].visibilidade, "parcial");
  assert.equal(diario.concluidas[0].visibilidade, "parcial");
  assert.equal(diario.queroLer[0].visibilidade, "publico");
  assert.equal(diario.atividades.length, 5);
  assert.equal(diario.atividades[0].obra.id, "obra-9");
  assert.deepEqual(diario.avaliacoes, []);
  assert.deepEqual(diario.reviews, []);
});

test("mantém somente as oito atividades locais mais recentes", () => {
  const obras = Array.from({ length: 12 }, (_, indice) => criarObra(indice + 1));
  const diario = montarDiarioPerfilLocal(
    criarPerfil(obras),
    obras.map((obra) => obra.id),
    [],
    [],
  );

  assert.equal(diario.favoritas.length, 12);
  assert.equal(diario.atividades.length, 8);
  assert.deepEqual(
    diario.atividades.map((item) => item.obra.id),
    ["obra-12", "obra-11", "obra-10", "obra-9", "obra-8", "obra-7", "obra-6", "obra-5"],
  );
  assert.deepEqual(
    diario.atividades.map((item) => item.data),
    [
      "2026-01-12T12:00:00.000Z",
      "2026-01-11T12:00:00.000Z",
      "2026-01-10T12:00:00.000Z",
      "2026-01-09T12:00:00.000Z",
      "2026-01-08T12:00:00.000Z",
      "2026-01-07T12:00:00.000Z",
      "2026-01-06T12:00:00.000Z",
      "2026-01-05T12:00:00.000Z",
    ],
  );
});

test("usa obras do perfil quando a coleção disponível está vazia", () => {
  const obra = criarObra(1, { progressoLeitura: 20 });
  const diario = montarDiarioPerfilLocal(
    criarPerfil([obra]),
    [],
    [],
    [],
    [],
  );

  assert.equal(diario.lendoAgora[0].obra, obra);
  assert.equal(diario.atividades[0].obra, obra);
});

test("Perfil de Autor mantém helpers locais e delega coleta de IDs ao carregador remoto", () => {
  assert.match(
    utilsSource,
    /import \{ obterLocaleDocumentoPerfilAutor \} from "\.\.\/translations";/,
  );
  assert.match(
    utilsSource,
    /import type \{ AutorPerfil, DiarioPerfilEstado, ObraLocal \} from "\.\.\/types";/,
  );
  assert.match(utilsSource, /import \{ pegarTexto \} from "\.\/data-normalizers";/);
  assert.match(
    utilsSource,
    /import \{ colecaoTemObraPerfilBiblioteca \} from "\.\/library-normalizers";/,
  );
  assert.match(utilsSource, /import \{ criarItemDiarioPerfil \} from "\.\/profile-diary-item-utils";/);
  assert.match(utilsSource, /import \{ ordenarItensDiarioPerfil \} from "\.\/profile-diary-merge-utils";/);
  assert.match(
    pagina,
    /import \{[\s\S]*?dataDiarioPerfilFormatada,[\s\S]*?montarDiarioPerfilLocal,[\s\S]*?\} from "\.\/lib\/profile-diary-local-utils";/,
  );
  assert.match(
    diaryLoaderSource,
    /import \{ coletarObraIdsRegistrosDiarioPerfil \} from "\.\/profile-diary-local-utils";/,
  );

  for (const helper of [
    "coletarObraIdsRegistrosDiarioPerfil",
    "dataDiarioPerfilFormatada",
    "montarDiarioPerfilLocal",
  ]) {
    assert.match(utilsSource, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    diaryLoaderSource,
    /coletarObraIdsRegistrosDiarioPerfil\(diarioAtividades\)/,
  );
  assert.match(pagina, /montarDiarioPerfilLocal\([\s\S]*?obrasSeguidasBiblioteca,[\s\S]*?obras,/);
  assert.match(pagina, /formattedDate=\{dataDiarioPerfilFormatada\(item\.data\)\}/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect|localStorage/);
});
