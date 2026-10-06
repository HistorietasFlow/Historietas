import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho) {
  const texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  return typescript.transpileModule(texto, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const consultaJavascript = [
  "export async function consultarPerfisPublicosObraPorCampo(ids, campo) {",
  "  globalThis.chamadasPerfisPublicos.push({ ids, campo });",
  "  return globalThis.respostasPerfisPublicos.shift() || [];",
  "}",
].join("\n");
const textoJavascript = [
  "export function obterTextoPerfilObra(registro, chave) {",
  "  const valor = registro[chave];",
  "  return typeof valor === \"string\" && valor.trim() ? valor.trim() : \"\";",
  "}",
  "export function normalizarPerfilPublicoObra(profile, userId, fallback) {",
  "  return { userId, nome: obterTextoPerfilObra(profile, \"nome\") || fallback, avatar: obterTextoPerfilObra(profile, \"avatar_url\"), bio: obterTextoPerfilObra(profile, \"bio\") };",
  "}",
].join("\n");
const utilsJavascript = [
  "export function idObraSupabaseValido(id) {",
  "  return id.startsWith(\"valido-\");",
  "}",
].join("\n");
const consultaUrl = criarUrlModulo(consultaJavascript);
const textoUrl = criarUrlModulo(textoJavascript);
const utilsUrl = criarUrlModulo(utilsJavascript);
const loaderJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-public-profile-loader.ts",
)
  .replace(
    'from "../../../../lib/utils";',
    `from "${utilsUrl}";`,
  )
  .replace(
    'from "./obra-public-profile-query";',
    `from "${consultaUrl}";`,
  )
  .replace('from "./obra-text-utils";', `from "${textoUrl}";`);
const { carregarPerfisPublicosObra } = await import(
  criarUrlModulo(loaderJavascript),
);

function prepararConsultas(...respostas) {
  globalThis.chamadasPerfisPublicos = [];
  globalThis.respostasPerfisPublicos = respostas;
}

test("retorna Map vazio sem consultar para IDs vazios ou inválidos", async () => {
  prepararConsultas();

  const perfis = await carregarPerfisPublicosObra(["", "  ", "invalido"]);

  assert.ok(perfis instanceof Map);
  assert.deepEqual(Array.from(perfis.entries()), []);
  assert.deepEqual(globalThis.chamadasPerfisPublicos, []);
});

test("normaliza, deduplica IDs e consulta primeiro por user_id na ordem atual", async () => {
  prepararConsultas([
    { user_id: " valido-b ", id: "perfil-b", nome: " B " },
    { user_id: "valido-a", id: "perfil-a", nome: "A" },
  ]);

  const perfis = await carregarPerfisPublicosObra([
    " valido-b ",
    "valido-a",
    "valido-b",
  ]);

  assert.deepEqual(globalThis.chamadasPerfisPublicos, [
    { ids: ["valido-b", "valido-a"], campo: "user_id" },
  ]);
  assert.deepEqual(Array.from(perfis.entries()), [
    [
      "valido-b",
      { userId: "valido-b", nome: "B", avatar: "", bio: "" },
    ],
    [
      "valido-a",
      { userId: "valido-a", nome: "A", avatar: "", bio: "" },
    ],
  ]);
});

test("consulta somente faltantes por id e prioriza user_id sobre id", async () => {
  prepararConsultas(
    [
      { id: "valido-a", user_id: "valido-a", nome: "A" },
      { id: "valido-b", nome: "B" },
    ],
    [
      {
        id: "valido-c",
        user_id: "valido-c-prioritario",
        nome: "C",
        avatar_url: "avatar-c",
        bio: "bio-c",
      },
    ],
  );

  const perfis = await carregarPerfisPublicosObra([
    "valido-a",
    "valido-b",
    "valido-c",
  ]);

  assert.deepEqual(globalThis.chamadasPerfisPublicos, [
    { ids: ["valido-a", "valido-b", "valido-c"], campo: "user_id" },
    { ids: ["valido-c"], campo: "id" },
  ]);
  assert.deepEqual(Array.from(perfis.entries()), [
    [
      "valido-a",
      { userId: "valido-a", nome: "A", avatar: "", bio: "" },
    ],
    [
      "valido-b",
      { userId: "valido-b", nome: "B", avatar: "", bio: "" },
    ],
    [
      "valido-c-prioritario",
      {
        userId: "valido-c-prioritario",
        nome: "C",
        avatar: "avatar-c",
        bio: "bio-c",
      },
    ],
  ]);
});
