import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const persistenceSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloLocalPersistence.ts",
    import.meta.url,
  ),
  "utf8",
);

test("Adicionar Capítulo delega a persistência local sem alterar a orquestração", () => {
  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloLocalPersistence \} from "\.\/hooks\/useAdicionarCapituloLocalPersistence";/,
  );
  assert.match(
    pageSource,
    /const \{ salvarObras \} = useAdicionarCapituloLocalPersistence\(\{\s*usuarioIdLogado,\s*setObras,\s*\}\);/,
  );
  assert.doesNotMatch(pageSource, /function salvarObras\(/);
  assert.match(
    pageSource,
    /useAdicionarCapituloCreateAction\(\{[\s\S]*?salvarObras,[\s\S]*?\}\);/,
  );
});

test("hook preserva backup, isolamento por conta e ordem da persistência", () => {
  assert.match(
    persistenceSource,
    /type ObraLocalAdicionarCapitulo = ReturnType<typeof carregarObrasLocais>\[number\];/,
  );
  assert.match(persistenceSource, /carregarBackupArquivosObras\(usuarioIdLogado\)/);
  assert.match(
    persistenceSource,
    /restaurarArquivoObraComBackup\(\s*normalizarObra\(obra, index\),\s*backupArquivosObras,?\s*\)/,
  );
  assert.match(
    persistenceSource,
    /if \(!usuarioIdLogado\) \{\s*setObras\(obrasNormalizadas\);\s*return;\s*\}/,
  );
  assert.match(
    persistenceSource,
    /let todasObrasLocaisAtuais: ObraLocalAdicionarCapitulo\[\] = \[\];/,
  );
  assert.match(persistenceSource, /todasObrasLocaisAtuais = carregarObrasLocais\(usuarioIdLogado\);/);
  assert.match(persistenceSource, /catch \{\s*todasObrasLocaisAtuais = \[\];\s*\}/);
  assert.match(
    persistenceSource,
    /atualizarObrasLocaisDoUsuario\(\s*todasObrasLocaisAtuais,\s*obrasNormalizadas,\s*usuarioIdLogado,?\s*\)/,
  );

  const storage = persistenceSource.indexOf("salvarObrasAdicionarCapituloStorage(");
  const state = persistenceSource.lastIndexOf("setObras(obrasNormalizadas);");

  assert.ok(storage >= 0);
  assert.ok(storage < state);
  assert.doesNotMatch(
    persistenceSource,
    /supabase|\buseState\b|\buseEffect\b|\buseRouter\b|<\/[A-Za-z]/i,
  );
});
