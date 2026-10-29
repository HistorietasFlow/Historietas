import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-theme.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarTemaExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      'import type { TemaCategoriaExplorar } from "../components/explorar-section-components";\n\n',
      "",
    )
    .replace(/: TemaCategoriaExplorar/g, "")
    .replace("export function obterTemaCategoria", "function obterTemaCategoria")
    .replace(
      "export function criarTemaPaginaVisualExplorar",
      "function criarTemaPaginaVisualExplorar",
    );

  return new Function(
    `${executable}\nreturn { obterTemaCategoria, criarTemaPaginaVisualExplorar };`,
  )();
}

const temaEsperado = {
  accent: "#FFFFFF",
  secondary: "#A1A1AA",
  bgStart: "#000000",
  bgMid: "#000000",
  bgEnd: "#000000",
  glowPrimary: "transparent",
  glowSecondary: "transparent",
  titleTo: "#FFFFFF",
  activeSurface: "rgba(255,255,255,0.10)",
  secondarySurface: "rgba(255,255,255,0.06)",
  secondaryButtonText: "#FFFFFF",
  activeBackground: "#050505",
  pageBackground: "#000000",
  heroBackground: "#000000",
};

test("os helpers de tema preservam tipo, propriedades, valores e delegação", async () => {
  const [source, pageRaw, tema] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
    carregarTemaExplorar(),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  assert.match(
    source,
    /import type \{ TemaCategoriaExplorar \} from "\.\.\/components\/explorar-section-components";/,
  );
  assert.match(source, /export function obterTemaCategoria\(\): TemaCategoriaExplorar/);
  assert.match(
    source,
    /export function criarTemaPaginaVisualExplorar\(\): TemaCategoriaExplorar/,
  );
  assert.match(source, /return obterTemaCategoria\(\);/);
  assert.deepEqual(tema.obterTemaCategoria(), temaEsperado);
  assert.deepEqual(tema.criarTemaPaginaVisualExplorar(), temaEsperado);
  assert.match(
    page,
    /import \{\n  criarTemaPaginaVisualExplorar,\n  obterTemaCategoria,\n\} from "\.\/lib\/explorar-theme";/,
  );
  assert.doesNotMatch(page, /function obterTemaCategoria/);
  assert.doesNotMatch(page, /function criarTemaPaginaVisualExplorar/);
  assert.match(page, /const temaPagina = criarTemaPaginaVisualExplorar\(\);/);
  assert.match(page, /tema=\{obterTemaCategoria\(\)\}/);
});
