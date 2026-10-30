import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const deleteWorkHook = readFileSync(
  new URL("../../app/painel-autor/hooks/use-painel-autor-delete-work.ts", import.meta.url),
  "utf8",
);
const cleanupSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-deleted-work-storage-cleanup.ts",
    import.meta.url,
  ),
  "utf8",
);

const chamadasRemocao = [];
const caminhosComFalha = new Set();
globalThis.__painelAutorStorageCleanupSupabase = {
  storage: {
    from(bucket) {
      return {
        async remove(caminhos) {
          chamadasRemocao.push({ bucket, caminhos });
          const caminho = caminhos[0];
          return caminhosComFalha.has(`${bucket}:${caminho}`)
            ? { error: { message: `falha em ${caminho}` } }
            : { error: null };
        },
      };
    },
  },
};

const cleanupJavascript = typescript.transpileModule(
  cleanupSource.replace(
    'import { supabase } from "../../../lib/supabase/client";',
    "const supabase = globalThis.__painelAutorStorageCleanupSupabase;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { removerArquivosStorageObraExcluidaPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(cleanupJavascript).toString("base64")}`,
);

test("removerArquivosStorageObraExcluidaPainel deduplica caminhos, remove todos e mantém falhas isoladas", async () => {
  chamadasRemocao.length = 0;
  caminhosComFalha.clear();
  caminhosComFalha.add("arquivos-obras:falho.pdf");
  const avisos = [];
  const warnOriginal = console.warn;
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    await removerArquivosStorageObraExcluidaPainel([
      { bucket: "capas-obras", caminho: " capa.png " },
      { bucket: "capas-obras", caminho: "capa.png" },
      { bucket: "arquivos-obras", caminho: " falho.pdf " },
      { bucket: "arquivos-obras", caminho: " " },
      { bucket: "arquivos-obras", caminho: "capa.png" },
    ]);
  } finally {
    console.warn = warnOriginal;
  }

  assert.deepEqual(chamadasRemocao, [
    { bucket: "capas-obras", caminhos: ["capa.png"] },
    { bucket: "arquivos-obras", caminhos: ["falho.pdf"] },
    { bucket: "arquivos-obras", caminhos: ["capa.png"] },
  ]);
  assert.equal(avisos.length, 1);
  assert.equal(
    avisos[0][0],
    "Não consegui remover o arquivo de arquivos-obras:",
  );
  assert.equal(avisos[0][1].message, "falha em falho.pdf");
});

test("hook de exclusão delega a limpeza de Storage", () => {
  assert.match(
    deleteWorkHook,
    /import \{[\s\S]*?removerArquivosStorageObraExcluidaPainel,[\s\S]*?\} from "\.\.\/lib\/painel-autor-deleted-work-storage-cleanup";/,
  );
  assert.doesNotMatch(
    deleteWorkHook,
    /async function removerArquivosStorageObraExcluidaPainel\(/,
  );
  assert.match(
    deleteWorkHook,
    /await removerArquivosStorageObraExcluidaPainel\([\s\S]*?arquivosStorageParaRemover[\s\S]*?\);/,
  );
  assert.match(cleanupSource, /export async function removerArquivosStorageObraExcluidaPainel\(/);
  assert.match(cleanupSource, /new Map\([\s\S]*?`\$\{arquivo\.bucket\}:\$\{arquivo\.caminho\.trim\(\)\}`/);
  assert.match(cleanupSource, /Promise\.allSettled/);
  assert.match(
    cleanupSource,
    /supabase\.storage[\s\S]*?\.from\(arquivo\.bucket\)[\s\S]*?\.remove\(\[arquivo\.caminho\]\)/,
  );
  assert.match(
    cleanupSource,
    /Não consegui remover o arquivo de \$\{arquivosUnicos\[index\]\?\.bucket\}:/,
  );
});
