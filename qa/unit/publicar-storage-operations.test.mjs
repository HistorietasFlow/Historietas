import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storage = readFileSync(new URL("../../app/publicar/lib/publicar-storage-operations.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");
const acaoSubmissao = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hookSubmissao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);

test("operações de Storage de Publicar preservam upload, limpeza e rollback", () => {
  for (const helper of ["enviarArquivoStorage", "removerArquivosStoragePublicar", "desfazerPublicacaoParcialPublicar"]) {
    assert.match(storage, new RegExp(`export async function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${helper}\\(`));
  }
  assert.match(storage, /supabase\.storage\.from\(bucket\)\.upload/);
  assert.match(storage, /new Map\(/);
  assert.match(storage, /from\("capitulos"\)\.delete\(\)\.eq\("obra_id", obraIdLimpo\)/);
  assert.match(storage, /from\("obras"\)\s*\.delete\(\)\s*\.eq\("id", obraIdLimpo\)/);
  assert.match(pagina, /import \{ usePublicarSubmission \} from "\.\/hooks\/use-publicar-submission";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-submission-action";/);
  assert.match(hookSubmissao, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-storage-operations";/);
  assert.match(acaoSubmissao, /from "\.\/publicar-storage-operations";/);
  assert.match(acaoSubmissao, /enviarArquivoStorage\("capas-obras", userId, capaArquivo\)/);
  assert.match(acaoSubmissao, /desfazerPublicacaoParcialPublicar\(/);
});
