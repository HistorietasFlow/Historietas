import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/editar-obra/lib/editar-obra-current-assets-preparation.ts", import.meta.url),
  "utf8",
);
const saveAssetsPreparationSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-assets-preparation.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript
  .transpileModule(
    source
      .replace(
        /import \{[\s\S]*?\} from "\.\/editar-obra-file-normalization";/,
        `const ehDataUrlEdicaoObra = (valor) => valor.trim().startsWith("data:");
const normalizarArquivoObraPersistivel = (valor) => valor && valor.nome && valor.conteudo && !ehDataUrlEdicaoObra(valor.conteudo) ? valor : null;`,
      )
      .replace(
        'import { obterChavesBackupArquivoEdicaoObra } from "./editar-obra-file-backup-key-utils";',
        'const obterChavesBackupArquivoEdicaoObra = (obra) => [`id:${obra.id}`, `slug:${obra.slug}`];',
      )
      .replace(
        'import { obterCaminhoStorageEdicaoObra } from "./editar-obra-storage-path-utils";',
        'const obterCaminhoStorageEdicaoObra = (bucket, referencia) => referencia ? `${bucket}:${referencia}` : "";',
      )
      .replace(
        'import { criarArquivoRemotoEdicaoObra } from "./editar-obra-supabase-file-converter";',
        `const criarArquivoRemotoEdicaoObra = (obra) => obra.arquivo_url && obra.arquivo_nome
  ? { nome: obra.arquivo_nome.trim(), tipo: obra.arquivo_tipo || "", tamanho: obra.arquivo_tamanho || 0, conteudo: obra.arquivo_url.trim(), categoria: obra.arquivo_categoria || "outro", criadoEm: obra.criada_em || "" }
  : null;`,
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { prepararAssetsAtuaisEdicaoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const obraLocal = {
  id: "obra-1",
  slug: "obra",
  titulo: "Obra",
  link: "/obra/obra",
  arquivoObra: { nome: "local.pdf", conteudo: "local.pdf", tipo: "application/pdf", tamanho: 2, categoria: "documento", criadoEm: "local" },
};

test("prioriza assets remotos e remove capa local em Data URL", () => {
  const assets = prepararAssetsAtuaisEdicaoObra({
    capa: " data:image/png;base64,abc ",
    capaNome: " Capa local ",
    arquivoObra: { nome: "novo.pdf", conteudo: "novo.pdf" },
    obraRemotaAtual: {
      capa_url: " capa-remota.png ",
      capa_nome: " Capa remota ",
      arquivo_url: " arquivo-remoto.pdf ",
      arquivo_nome: " Arquivo remoto ",
      arquivo_tipo: "application/pdf",
      arquivo_tamanho: 5,
      arquivo_categoria: "documento",
      criada_em: "remoto",
    },
    obraLocalAtual: obraLocal,
    backupArquivosObras: {},
    capaRemovidaManualmente: false,
    arquivoObraRemovidoManualmente: false,
  });

  assert.equal(assets.capaLocalPersistivel, "");
  assert.equal(assets.capaFinalInicial, "capa-remota.png");
  assert.equal(assets.capaNomeFinalInicial, "Capa remota");
  assert.equal(assets.arquivoObraFinalInicial?.conteudo, "arquivo-remoto.pdf");
  assert.equal(assets.caminhoCapaRemotaAtual, "capas-obras:capa-remota.png");
  assert.equal(assets.caminhoArquivoRemotoAtual, "arquivos-obras:arquivo-remoto.pdf");
});

test("preserva prioridades local, backup e remoções manuais", () => {
  const comBackup = prepararAssetsAtuaisEdicaoObra({
    capa: " capa-local.png ",
    capaNome: " Nome local ",
    arquivoObra: { nome: "temporario.txt", conteudo: "data:text/plain,conteudo" },
    obraRemotaAtual: {},
    obraLocalAtual: { ...obraLocal, arquivoObra: { nome: "invalido", conteudo: "data:text/plain,x" } },
    backupArquivosObras: {
      "id:obra-1": { nome: "backup.txt", conteudo: "backup.txt", tipo: "text/plain", tamanho: 1, categoria: "texto", criadoEm: "backup" },
    },
    capaRemovidaManualmente: false,
    arquivoObraRemovidoManualmente: false,
  });

  assert.equal(comBackup.capaFinalInicial, "capa-local.png");
  assert.equal(comBackup.capaNomeFinalInicial, "Nome local");
  assert.equal(comBackup.arquivoObraFinalInicial?.nome, "backup.txt");

  const removidos = prepararAssetsAtuaisEdicaoObra({
    capa: "capa-local.png",
    capaNome: "Nome local",
    arquivoObra: obraLocal.arquivoObra,
    obraRemotaAtual: {},
    obraLocalAtual: obraLocal,
    backupArquivosObras: {},
    capaRemovidaManualmente: true,
    arquivoObraRemovidoManualmente: true,
  });

  assert.equal(removidos.capaFinalInicial, "");
  assert.equal(removidos.capaNomeFinalInicial, "");
  assert.equal(removidos.arquivoObraFinalInicial, null);
});

test("Editar Obra delega somente a preparação pura dos assets atuais", () => {
  assert.match(
    saveAssetsPreparationSource,
    /import \{ prepararAssetsAtuaisEdicaoObra \} from "\.\/editar-obra-current-assets-preparation";/,
  );
  assert.match(saveAssetsPreparationSource, /const assetsAtuais = prepararAssetsAtuaisEdicaoObra\(\{[\s\S]*?obraRemotaAtual,[\s\S]*?backupArquivosObras,[\s\S]*?\}\);/);
  assert.match(saveAssetsPreparationSource, /let capaFinal = assetsAtuais\.capaFinalInicial;/);
  assert.match(saveAssetsPreparationSource, /let capaNomeFinal = assetsAtuais\.capaNomeFinalInicial;/);
  assert.match(saveAssetsPreparationSource, /assetsAtuais\.arquivoObraFinalInicial;/);
  assert.match(source, /obterChavesBackupArquivoEdicaoObra\(obraLocalAtual\)/);
  assert.match(source, /criarArquivoRemotoEdicaoObra\(obraRemotaAtual\)/);
  assert.match(source, /obterCaminhoStorageEdicaoObra\([\s\S]*?"capas-obras"/);
  assert.match(source, /obterCaminhoStorageEdicaoObra\([\s\S]*?"arquivos-obras"/);
  assert.doesNotMatch(source, /supabase\.|localStorage|useState|useEffect|await/);
});
