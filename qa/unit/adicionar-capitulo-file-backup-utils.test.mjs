import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-file-backup-utils.ts", import.meta.url), "utf8");
const normalizerSource = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-file-normalizer.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");
const transpilar = (source) => typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const normalizerUrl = `data:text/javascript;base64,${Buffer.from(transpilar(normalizerSource)).toString("base64")}`;
const utilsUrl = `data:text/javascript;base64,${Buffer.from('export const criarSlugBase = (titulo) => titulo.toLowerCase().replace(/\\s+/g, "-"); export const normalizarTexto = (titulo) => titulo.trim().toLowerCase();').toString("base64")}`;
const utilsJavascript = transpilar(
  utilsSource
    .replace('"../../../lib/utils"', JSON.stringify(utilsUrl))
    .replace('"./adicionar-capitulo-file-normalizer"', JSON.stringify(normalizerUrl)),
);
const { obterChavesBackupArquivoAdicionarCapitulo, restaurarArquivoObraComBackup } = await import(`data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`);

test("backup preserva chaves, ordem e fallbacks", () => {
  assert.deepEqual(obterChavesBackupArquivoAdicionarCapitulo({ id: "id", slug: "slug", titulo: " Título ", link: "/obra/slug" }), ["id:id", "id", "slug:slug", "titulo:título", "link:/obra/slug"]);
  assert.deepEqual(obterChavesBackupArquivoAdicionarCapitulo({ id: "", slug: "", titulo: "Título da obra", link: "" }), ["id:", "slug:título-da-obra", "titulo:título da obra"]);
});

test("backup restaura somente o primeiro arquivo válido sem alterar os demais campos", () => {
  const obra = { id: "id", slug: "slug", titulo: "Título", link: "/obra/slug", outro: true };
  assert.equal(restaurarArquivoObraComBackup({ ...obra, arquivoObra: { existente: true } }, { "id:id": { nome: "x", conteudo: "y" } }).arquivoObra.existente, true);
  assert.equal(restaurarArquivoObraComBackup(obra, {}), obra);
  const restaurada = restaurarArquivoObraComBackup(obra, { "id:id": { nome: " ", conteudo: "x" }, id: { nome: "arquivo.txt", conteudo: "conteúdo", categoria: "texto" } });
  assert.notEqual(restaurada, obra);
  assert.equal(restaurada.outro, true);
  assert.deepEqual(restaurada.arquivoObra, { nome: "arquivo.txt", tipo: "", tamanho: 0, conteudo: "conteúdo", categoria: "texto", criadoEm: "" });
});

test("Adicionar Capítulo delega somente os helpers puros de backup", () => {
  assert.match(pageSource, /import \{[\s\S]*?obterChavesBackupArquivoAdicionarCapitulo,[\s\S]*?restaurarArquivoObraComBackup,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-file-backup-utils";/);
  assert.doesNotMatch(pageSource, /function obterChavesBackupArquivoAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function restaurarArquivoObraComBackup\(/);
  assert.match(pageSource, /function carregarBackupArquivosObras\(/);
  assert.match(pageSource, /function sincronizarBackupArquivosObras\(/);
  assert.match(utilsSource, /normalizarArquivoObra\(backup\[chave\]\)/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect|router/);
});
