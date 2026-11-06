import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/library-normalizers.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

const executable = typescript.transpileModule(
  source
    .replace(
      'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
      `const criarSlugBase = (valor) => String(valor).trim().toLowerCase().replace(/\\s+/g, "-");
const normalizarTexto = (valor) => String(valor).trim().toLowerCase();`,
    )
    .replace(/import type \{[\s\S]*?\} from "\.\.\/types";\n/, "")
    .replace(
      'import { obterTimestampData } from "./profile-formatters";',
      `const obterTimestampData = (valor) => {
  const tempo = Date.parse(valor);
  return Number.isNaN(tempo) ? 0 : tempo;
};`,
    )
    .replace(
      'import { encontrarCapituloParaContinuar } from "./work-normalizers";',
      `const encontrarCapituloParaContinuar = (obra) => {
  const indice = obra.capitulos.findIndex((capitulo) => capitulo.id === obra.ultimoCapituloLidoId);
  return obra.capitulos.slice(indice + 1).find((capitulo) => !capitulo.lido) || null;
};`,
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const {
  converterCapitulosSalvosParaBiblioteca,
  converterItensDiarioParaBiblioteca,
  obterNumeroCapituloPerfilAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(executable).toString("base64")}`
);

function criarObra(capitulos) {
  return {
    id: "obra-1",
    slug: "obra-1",
    titulo: "Obra 1",
    criadaEm: "2026-01-01T00:00:00.000Z",
    ultimaLeituraEm: "2026-01-02T00:00:00.000Z",
    ultimoCapituloLidoId: "capitulo-1",
    capitulos,
  };
}

test("Biblioteca usa a ordem canônica ao retomar leitura e abrir capítulo salvo", () => {
  const obra = criarObra([
    { id: "capitulo-1", ordem: 1, lido: true, lidoEm: "2026-01-02T00:00:00.000Z" },
    { id: "capitulo-4", ordem: 4, lido: false, lidoEm: "", salvo: true },
  ]);
  const [lendoAgora] = converterItensDiarioParaBiblioteca(
    [{ chave: "lendo-1", tipo: "lendo", data: obra.ultimaLeituraEm, obra }],
    "lendo-agora",
  );
  const [salvo] = converterCapitulosSalvosParaBiblioteca([obra]);

  assert.equal(lendoAgora.capitulo.id, "capitulo-4");
  assert.equal(lendoAgora.numeroCapitulo, 4);
  assert.equal(salvo.capitulo.id, "capitulo-4");
  assert.equal(salvo.numeroCapitulo, 4);
});

test("Biblioteca preserva o fallback posicional de dados locais antigos", () => {
  const obra = criarObra([
    { id: "capitulo-1", lido: true },
    { id: "capitulo-2", lido: false },
  ]);

  assert.equal(
    obterNumeroCapituloPerfilAutor(obra, obra.capitulos[1]),
    2,
  );
});
