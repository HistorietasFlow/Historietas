import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-backup-restore-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript
  .transpileModule(utilsSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { obterChavesBackupArquivoPainel } from "./painel-autor-file-backup-key-utils";',
    'const obterChavesBackupArquivoPainel = () => ["primeira", "segunda", "terceira"];',
  )
  .replace(
    'import { normalizarArquivoObra } from "./painel-autor-file-normalizer";',
    'const normalizarArquivoObra = (arquivo) => arquivo?.valido ? arquivo : null;',
  );
const { restaurarArquivoObraComBackup } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const arquivoValido = {
  valido: true,
  nome: "arquivo.txt",
  tipo: "text/plain",
  tamanho: 12,
  conteudo: "conteúdo",
  categoria: "texto",
  criadoEm: "2026-01-01",
};

test("restaurarArquivoObraComBackup preserva a obra quando já há arquivo", () => {
  const obra = { id: "1", slug: "obra", titulo: "Obra", arquivoObra: arquivoValido };

  assert.strictEqual(
    restaurarArquivoObraComBackup(obra, { primeira: arquivoValido }),
    obra,
  );
});

test("restaurarArquivoObraComBackup usa o primeiro backup válido na ordem das chaves", () => {
  const obra = { id: "1", slug: "obra", titulo: "Obra", arquivoObra: null };
  const terceiroArquivo = { ...arquivoValido, nome: "terceiro.txt" };

  const resultado = restaurarArquivoObraComBackup(obra, {
    primeira: { valido: false },
    segunda: arquivoValido,
    terceira: terceiroArquivo,
  });

  assert.deepEqual(resultado, { ...obra, arquivoObra: arquivoValido });
  assert.notStrictEqual(resultado, obra);
  assert.strictEqual(resultado.arquivoObra, arquivoValido);
});

test("restaurarArquivoObraComBackup preserva referência sem backup válido", () => {
  const obra = { id: "1", slug: "obra", titulo: "Obra" };

  assert.strictEqual(
    restaurarArquivoObraComBackup(obra, {
      primeira: { valido: false },
      segunda: null,
    }),
    obra,
  );
});

test("Painel do Autor delega somente a restauração de backup ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{ restaurarArquivoObraComBackup \} from "\.\/lib\/painel-autor-file-backup-restore-utils";/,
  );
  assert.doesNotMatch(pagina, /function restaurarArquivoObraComBackup\(/);
  assert.equal((pagina.match(/\brestaurarArquivoObraComBackup\b/g) || []).length, 2);
  assert.match(pagina, /const backupArquivosObras = carregarBackupArquivosObras\(usuarioIdLogado\);/);
  assert.match(
    utilsSource,
    /import \{ obterChavesBackupArquivoPainel \} from "\.\/painel-autor-file-backup-key-utils";/,
  );
  assert.match(
    utilsSource,
    /import \{ normalizarArquivoObra \} from "\.\/painel-autor-file-normalizer";/,
  );
  assert.doesNotMatch(utilsSource, /localStorage|supabase|useState|useEffect/);
});
