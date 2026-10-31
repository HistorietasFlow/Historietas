import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textImportSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-text-import.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const importActionSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloImportAction.ts",
    import.meta.url,
  ),
  "utf8",
);
const chamadasEstatisticas = [];

globalThis.__editarCapituloTextImport = {
  contarLetrasNumeros: (texto) => texto.match(/[\p{L}\p{N}]/gu)?.length || 0,
  criarTituloPorNomeArquivo: (nomeArquivo) =>
    nomeArquivo
      .replace(/\.(txt|md)$/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  calcularEstatisticasCapitulo: (titulo, texto, numeroCapitulo) => {
    chamadasEstatisticas.push({ titulo, texto, numeroCapitulo });
    return { palavras: 3, minutosLeitura: 1 };
  },
};

const javascriptImportacao = typescript.transpileModule(
  textImportSource
    .replace(
      /import \{\r?\n  contarLetrasNumeros,\r?\n  criarTituloPorNomeArquivo,\r?\n\} from "\.\/editar-capitulo-text-utils";/,
      "const { contarLetrasNumeros, criarTituloPorNomeArquivo } = globalThis.__editarCapituloTextImport;",
    )
    .replace(
      'import { calcularEstatisticasCapitulo } from "./editar-capitulo-metrics-utils";',
      "const { calcularEstatisticasCapitulo } = globalThis.__editarCapituloTextImport;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  MAX_TEXT_FILE_SIZE_BYTES,
  prepararImportacaoArquivoTextoEditarCapitulo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptImportacao).toString("base64")}`,
);

globalThis.__editarCapituloImportAction = {
  prepararImportacaoArquivoTextoEditarCapitulo: async () => ({
    ok: true,
    textoImportado: "Texto importado",
    tituloArquivo: "Título importado",
    resumoArquivo: "arquivo.txt • 2 palavras • 1 min",
  }),
};
const importActionJavascript = typescript.transpileModule(
  importActionSource.replace(
    'import { prepararImportacaoArquivoTextoEditarCapitulo } from "../lib/editar-capitulo-text-import";',
    "const { prepararImportacaoArquivoTextoEditarCapitulo } = globalThis.__editarCapituloImportAction;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useEditarCapituloImportAction } = await import(
  `data:text/javascript;base64,${Buffer.from(importActionJavascript).toString("base64")}`,
);

function criarArquivo({ nome, tamanho = 10, conteudo = "Texto válido com números 123.", falhar = false }) {
  let leituras = 0;
  return {
    name: nome,
    size: tamanho,
    get leituras() {
      return leituras;
    },
    async text() {
      leituras += 1;
      if (falhar) throw new Error("falhou");
      return conteudo;
    },
  };
}

test("importação aceita .txt e .md, normaliza CRLF e prepara o resumo", async () => {
  chamadasEstatisticas.length = 0;
  const arquivoTxt = criarArquivo({
    nome: "Capitulo_final.TXT",
    conteudo: "\r\nTexto válido com números 123.\r\n",
  });
  const resultadoTxt = await prepararImportacaoArquivoTextoEditarCapitulo(
    arquivoTxt,
    "Título atual",
    4,
  );

  assert.deepEqual(resultadoTxt, {
    ok: true,
    textoImportado: "Texto válido com números 123.",
    tituloArquivo: "Capitulo final",
    resumoArquivo: "Capitulo_final.TXT • 3 palavras • 1 min",
  });
  assert.deepEqual(chamadasEstatisticas, [
    {
      titulo: "Capitulo final",
      texto: "Texto válido com números 123.",
      numeroCapitulo: 4,
    },
  ]);

  const arquivoMd = criarArquivo({ nome: "capitulo.md" });
  assert.equal(
    (await prepararImportacaoArquivoTextoEditarCapitulo(arquivoMd, "", 1)).ok,
    true,
  );
});

test("importação valida extensão e tamanho antes de ler o arquivo", async () => {
  const invalido = criarArquivo({ nome: "capitulo.pdf", tamanho: MAX_TEXT_FILE_SIZE_BYTES + 1 });
  assert.deepEqual(
    await prepararImportacaoArquivoTextoEditarCapitulo(invalido, "", 1),
    {
      ok: false,
      erro: "Envie um arquivo .txt ou .md para importar o texto do capítulo.",
    },
  );
  assert.equal(invalido.leituras, 0);

  const grande = criarArquivo({
    nome: "capitulo.txt",
    tamanho: MAX_TEXT_FILE_SIZE_BYTES + 1,
  });
  assert.deepEqual(
    await prepararImportacaoArquivoTextoEditarCapitulo(grande, "", 1),
    {
      ok: false,
      erro: "Esse arquivo é grande demais. Use um arquivo de até 700 KB.",
    },
  );
  assert.equal(grande.leituras, 0);
});

test("importação preserva validação mínima, fallbacks e falha de leitura", async () => {
  const curto = criarArquivo({ nome: "curto.txt", conteudo: "a 1" });
  assert.deepEqual(
    await prepararImportacaoArquivoTextoEditarCapitulo(curto, "", 1),
    {
      ok: false,
      erro: "O arquivo foi lido, mas não tem texto suficiente para formar um capítulo.",
    },
  );

  chamadasEstatisticas.length = 0;
  const semTituloArquivo = criarArquivo({ nome: ".txt" });
  await prepararImportacaoArquivoTextoEditarCapitulo(
    semTituloArquivo,
    "Título atual",
    0,
  );
  assert.deepEqual(chamadasEstatisticas, [
    {
      titulo: "Título atual",
      texto: "Texto válido com números 123.",
      numeroCapitulo: 1,
    },
  ]);

  const falhaLeitura = criarArquivo({ nome: "capitulo.md", falhar: true });
  assert.deepEqual(
    await prepararImportacaoArquivoTextoEditarCapitulo(falhaLeitura, "", 1),
    {
      ok: false,
      erro: "Não consegui ler esse arquivo. Tente salvar como .txt ou .md e importar novamente.",
    },
  );
});

test("a ação de importação preserva limpeza condicional, guard e ordem de atualização", async () => {
  const eventos = [];
  const { marcarAlteracao, importarArquivoTexto } = useEditarCapituloImportAction({
    salvou: true,
    erro: "Erro anterior",
    arquivoImportadoErro: "Falha anterior",
    titulo: "",
    numeroCapitulo: 3,
    setSalvou: (valor) => eventos.push(["salvou", valor]),
    setErro: (valor) => eventos.push(["erro", valor]),
    setArquivoImportadoErro: (valor) => eventos.push(["erro-arquivo", valor]),
    setArquivoImportadoNome: (valor) => eventos.push(["nome-arquivo", valor]),
    setTexto: (valor) => eventos.push(["texto", valor]),
    setTitulo: (valor) => eventos.push(["titulo", valor]),
  });
  const eventoSemArquivo = { target: { files: [], value: "selecionado" } };

  await importarArquivoTexto(eventoSemArquivo);
  assert.equal(eventoSemArquivo.target.value, "");
  assert.deepEqual(eventos, []);

  marcarAlteracao();
  assert.deepEqual(eventos, [
    ["salvou", false],
    ["erro", ""],
    ["erro-arquivo", ""],
  ]);

  eventos.length = 0;
  const eventoComArquivo = {
    target: { files: [criarArquivo({ nome: "arquivo.txt" })], value: "selecionado" },
  };
  await importarArquivoTexto(eventoComArquivo);
  assert.equal(eventoComArquivo.target.value, "");
  assert.deepEqual(eventos, [
    ["salvou", false],
    ["erro", ""],
    ["erro-arquivo", ""],
    ["nome-arquivo", ""],
    ["erro-arquivo", ""],
    ["texto", "Texto importado"],
    ["titulo", "Título importado"],
    ["nome-arquivo", "arquivo.txt • 2 palavras • 1 min"],
  ]);
});

test("Editar Capítulo delega a preparação de importação e mantém o JSX", () => {
  assert.match(
    textImportSource,
    /import \{[\s\S]*?contarLetrasNumeros,[\s\S]*?criarTituloPorNomeArquivo,[\s\S]*?\} from "\.\/editar-capitulo-text-utils";/,
  );
  assert.match(
    textImportSource,
    /import \{ calcularEstatisticasCapitulo \} from "\.\/editar-capitulo-metrics-utils";/,
  );
  assert.match(textImportSource, /const MAX_TEXT_FILE_SIZE_BYTES = 700 \* 1024;/);
  assert.match(textImportSource, /const conteudoArquivo = await arquivo\.text\(\);/);
  assert.match(textImportSource, /numeroCapitulo \|\| 1/);
  assert.match(
    importActionSource,
    /import \{ prepararImportacaoArquivoTextoEditarCapitulo \} from "\.\.\/lib\/editar-capitulo-text-import";/,
  );
  assert.match(
    pageSource,
    /import \{ useEditarCapituloImportAction \} from "\.\/hooks\/useEditarCapituloImportAction";/,
  );
  assert.match(
    pageSource,
    /const \{ marcarAlteracao, importarArquivoTexto \} =\s*useEditarCapituloImportAction\(/,
  );
  assert.doesNotMatch(pageSource, /function marcarAlteracao\(/);
  assert.doesNotMatch(pageSource, /async function importarArquivoTexto/);
  assert.doesNotMatch(pageSource, /prepararImportacaoArquivoTextoEditarCapitulo/);
  assert.match(pageSource, /setTitulo\(event\.target\.value\);[\s\S]*?marcarAlteracao\(\);/);
  assert.match(pageSource, /setTexto\(event\.target\.value\);[\s\S]*?marcarAlteracao\(\);/);
  assert.match(
    pageSource,
    /accept="\.txt,\.md,text\/plain,text\/markdown"[\s\S]*?onChange=\{importarArquivoTexto\}/,
  );
  assert.match(importActionSource, /event\.target\.files\?\.\[0\] \|\| null/);
  assert.match(importActionSource, /event\.target\.value = "";/);
  assert.match(importActionSource, /if \(!arquivo\) \{[\s\S]*?return;/);
  assert.doesNotMatch(importActionSource, /arquivo\.name\.toLowerCase\(\)/);
  assert.doesNotMatch(importActionSource, /await arquivo\.text\(\)/);

  const inicioHandler = importActionSource.indexOf("async function importarArquivoTexto");
  const fimHandler = importActionSource.indexOf("return { marcarAlteracao, importarArquivoTexto }", inicioHandler);
  const handler = importActionSource.slice(inicioHandler, fimHandler);
  assert.ok(handler.indexOf('event.target.value = "";') < handler.indexOf("if (!arquivo)"));
  assert.ok(handler.indexOf("if (!arquivo)") < handler.indexOf("marcarAlteracao();"));
  assert.ok(handler.indexOf("marcarAlteracao();") < handler.indexOf("prepararImportacaoArquivoTextoEditarCapitulo"));
  assert.ok(handler.indexOf("setTexto(resultado.textoImportado);") < handler.indexOf("setTitulo(resultado.tituloArquivo);"));
  assert.ok(handler.indexOf("setTitulo(resultado.tituloArquivo);") < handler.indexOf("setArquivoImportadoNome(resultado.resumoArquivo);"));
  assert.doesNotMatch(
    importActionSource,
    /supabase|localStorage|useState|useEffect|useRouter|^\s*<[A-Za-z]/m,
  );
});
