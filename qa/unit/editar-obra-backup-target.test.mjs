import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-backup-target.ts",
    import.meta.url,
  ),
  "utf8",
);
const saveActionSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const localPersistenceSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-persistence.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source.replace(
      'import { criarSlugBase } from "../../../lib/utils";',
      'const criarSlugBase = (titulo) => titulo.trim().toLowerCase().replace(/\\s+/g, "-");',
    ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { criarAlvoBackupArquivoEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("alvo de backup de Editar Obra preserva prioridades de slug e link", () => {
  assert.deepEqual(
    criarAlvoBackupArquivoEdicaoObra({
      obraId: "obra-1",
      obraLocalAtual: { slug: "slug-local", link: "/obra/link-local" },
      tituloFinal: "Titulo final",
    }),
    {
      id: "obra-1",
      slug: "slug-local",
      titulo: "Titulo final",
      link: "/obra/link-local",
    },
  );

  assert.deepEqual(
    criarAlvoBackupArquivoEdicaoObra({
      obraId: "obra-2",
      obraLocalAtual: { slug: "", link: "" },
      tituloFinal: " Minha Obra ",
    }),
    {
      id: "obra-2",
      slug: "minha-obra",
      titulo: " Minha Obra ",
      link: "/obra/minha-obra",
    },
  );
});

test("Editar Obra delega somente a construção do alvo de backup", () => {
  assert.match(
    saveActionSource,
    /import \{ persistirObraLocalEBackupEdicaoObra \} from "\.\.\/lib\/editar-obra-local-persistence";/,
  );
  assert.match(
    localPersistenceSource,
    /if \(arquivoObraRemovidoManualmente\) \{[\s\S]*?salvarArquivoObraNoBackup\([\s\S]*?criarAlvoBackupArquivoEdicaoObra\(\{[\s\S]*?obraId,[\s\S]*?obraLocalAtual,[\s\S]*?tituloFinal,[\s\S]*?\}\),[\s\S]*?null,[\s\S]*?userId[\s\S]*?\);[\s\S]*?\} else \{[\s\S]*?sincronizarBackupArquivosObras\(novasObrasDoUsuario, userId\);/,
  );
  assert.match(
    localPersistenceSource,
    /import \{ criarAlvoBackupArquivoEdicaoObra \} from "\.\/editar-obra-backup-target";/,
  );
  assert.doesNotMatch(saveActionSource, /criarAlvoBackupArquivoEdicaoObra\(/);
  assert.match(
    source,
    /import \{ criarSlugBase \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    source,
    /const slug = obraLocalAtual\?\.slug \|\| criarSlugBase\(tituloFinal\);/,
  );
  assert.match(source, /link: obraLocalAtual\?\.link \|\| `\/obra\/\$\{slug\}`/);
  assert.doesNotMatch(source, /supabase|storage|localStorage|useState|useEffect|await|new Date/);
});
