import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho, substituicoes = []) {
  let texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  substituicoes.forEach(([padrao, substituicao]) => {
    texto = texto.replace(padrao, substituicao);
  });

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

const utilsJavascript = [
  "export const criarSlugBase = (texto) => String(texto)",
  '.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")',
  '.toLowerCase().trim().replace(/\\s+/g, "-");',
  "export const idObraSupabaseValido = () => false;",
].join(" ");
const metricasJavascript = [
  "export const normalizarContadorObraPublica = (valor) => typeof valor === \"number\" ? valor : 0;",
  "export const totalComentariosObraPublica = () => 0;",
  "export const totalCurtidasObraPublica = () => 0;",
  "export const totalVisualizacoesObraPublica = () => 0;",
].join("\n");
const leituraJavascript = [
  "export const calcularProgressoLeitura = () => 0;",
  "export const obraLocalEstaDisponivelParaLeitura = () => false;",
  "export const normalizarCapituloLocal = (capitulo, index) => ({",
  "  id: typeof capitulo.id === \"string\" && capitulo.id.trim() ? capitulo.id : `capitulo-${index + 1}` ,",
  "  titulo: typeof capitulo.titulo === \"string\" && capitulo.titulo.trim() ? capitulo.titulo : \"Capítulo sem título\",",
  "  texto: typeof capitulo.texto === \"string\" ? capitulo.texto : \"\",",
  "  publicado: capitulo.publicado !== false,",
  "  curtiu: Boolean(capitulo.curtiu), salvo: Boolean(capitulo.salvo), comentario: \"\", criadoEm: \"\",",
  "  lido: false, lidoEm: \"\", totalCurtidas: 0, totalComentarios: 0, totalSalvos: 0, totalLidos: 0,",
  "});",
].join("\n");
const adultoJavascript = [
  "export const ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO = true;",
  "export const ehClassificacao18 = (classificacao) => classificacao === \"18+\";",
  "export const normalizarAvisosConteudo18 = () => [];",
].join("\n");
const utilsUrl = criarUrlModulo(utilsJavascript);
const metricasUrl = criarUrlModulo(metricasJavascript);
const leituraUrl = criarUrlModulo(leituraJavascript);
const adultoUrl = criarUrlModulo(adultoJavascript);
const arquivoObraJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-file-utils.ts",
  [[/from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/, `from "${utilsUrl}";`]],
);
const arquivoObraUrl = criarUrlModulo(arquivoObraJavascript);
const storageUsuarioJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-user-storage.ts",
);
const storageUsuarioUrl = criarUrlModulo(storageUsuarioJavascript);
const backupArquivosJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-file-backup-utils.ts",
)
  .replace('from "./obra-file-utils";', `from "${arquivoObraUrl}";`)
  .replace('from "./obra-user-storage";', `from "${storageUsuarioUrl}";`);
const backupArquivosUrl = criarUrlModulo(backupArquivosJavascript);
const dadosObraJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-data-utils.ts",
)
  .replace(
    'from "../../../../lib/historietasAdultContent";',
    `from "${adultoUrl}";`,
  )
  .replace('from "../../../../lib/utils";', `from "${utilsUrl}";`)
  .replace('from "./obra-metric-utils";', `from "${metricasUrl}";`)
  .replace('from "./obra-reading-utils";', `from "${leituraUrl}";`)
  .replace('from "./obra-file-utils";', `from "${arquivoObraUrl}";`);
const dadosObraUrl = criarUrlModulo(dadosObraJavascript);
const obrasLocaisJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-local-works-utils.ts",
)
  .replace(
    'from "../../../../lib/historietasAdultContent";',
    `from "${adultoUrl}";`,
  )
  .replace('from "./obra-file-backup-utils";', `from "${backupArquivosUrl}";`)
  .replace('from "./obra-data-utils";', `from "${dadosObraUrl}";`)
  .replace('from "./obra-user-storage";', `from "${storageUsuarioUrl}";`);
const { carregarObrasLocaisComBackup } = await import(
  criarUrlModulo(obrasLocaisJavascript),
);

const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

function criarLocalStorage(valoresIniciais = {}) {
  const valores = new Map(Object.entries(valoresIniciais));

  return {
    getItem(chave) {
      return valores.get(chave) ?? null;
    },
    setItem(chave, valor) {
      valores.set(chave, String(valor));
    },
  };
}

function executarComStorageNavegador(valoresIniciais, executar) {
  const windowAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const localStorageAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const localStorage = criarLocalStorage(valoresIniciais);

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });

  try {
    return executar(localStorage);
  } finally {
    if (windowAnterior) {
      Object.defineProperty(globalThis, "window", windowAnterior);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (localStorageAnterior) {
      Object.defineProperty(globalThis, "localStorage", localStorageAnterior);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  }
}

function criarArquivo(conteudo) {
  return {
    nome: "Arquivo da obra",
    tipo: "text/plain",
    tamanho: conteudo.length,
    conteudo,
    categoria: "texto",
    criadoEm: "",
  };
}

function criarObra({
  id,
  slug,
  titulo,
  publicado = true,
  classificacaoIndicativa = "Livre",
  arquivoObra = null,
}) {
  return {
    id,
    slug,
    titulo,
    publicado,
    classificacaoIndicativa,
    arquivoObra,
    capitulos: [{ id: `${id}-capitulo`, titulo: "Capítulo", publicado: true }],
  };
}

test("carrega por usuário, restaura aliases, filtra a lista e sincroniza todas as obras normalizadas", () => {
  executarComStorageNavegador(
    {
      [`${LOCAL_WORKS_STORAGE_KEY}:usuario-a`]: JSON.stringify([
        criarObra({
          id: "id-restaurada",
          slug: "slug-restaurada",
          titulo: "Obra Restaurada",
        }),
        criarObra({
          id: "id-nao-publicada",
          slug: "slug-nao-publicada",
          titulo: "Obra Não Publicada",
          publicado: false,
          arquivoObra: criarArquivo("não publicada"),
        }),
        criarObra({
          id: "id-adulta",
          slug: "slug-adulta",
          titulo: "Obra Adulta",
          classificacaoIndicativa: "18+",
          arquivoObra: criarArquivo("adulta"),
        }),
      ]),
      [`${FILE_BACKUP_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-restaurada": criarArquivo("restaurada"),
      }),
      [`${LOCAL_WORKS_STORAGE_KEY}:usuario-b`]: JSON.stringify([
        criarObra({
          id: "id-b",
          slug: "slug-b",
          titulo: "Obra B",
          arquivoObra: criarArquivo("b"),
        }),
      ]),
      [`${FILE_BACKUP_STORAGE_KEY}:usuario-b`]: JSON.stringify({
        "obra-b": criarArquivo("backup-b"),
      }),
    },
    (localStorage) => {
      const obrasPublicas = carregarObrasLocaisComBackup("usuario-a");

      assert.deepEqual(
        obrasPublicas.map((obra) => obra.id),
        ["id-restaurada"],
      );
      assert.equal(obrasPublicas[0].arquivoObra?.conteudo, "restaurada");

      const backupUsuarioA = JSON.parse(
        localStorage.getItem(`${FILE_BACKUP_STORAGE_KEY}:usuario-a`),
      );
      assert.equal(backupUsuarioA["id-restaurada"].conteudo, "restaurada");
      assert.equal(backupUsuarioA["slug-restaurada"].conteudo, "restaurada");
      assert.equal(backupUsuarioA["obra-restaurada"].conteudo, "restaurada");
      assert.equal(
        backupUsuarioA["id-nao-publicada"].conteudo,
        "não publicada",
      );
      assert.equal(backupUsuarioA["id-adulta"].conteudo, "adulta");
      assert.deepEqual(
        JSON.parse(localStorage.getItem(`${FILE_BACKUP_STORAGE_KEY}:usuario-b`)),
        { "obra-b": criarArquivo("backup-b") },
      );
    },
  );
});

test("propaga JSON inválido da lista local ao chamador", () => {
  executarComStorageNavegador(
    {
      [`${LOCAL_WORKS_STORAGE_KEY}:usuario-a`]: "{inválido",
    },
    () => {
      assert.throws(
        () => carregarObrasLocaisComBackup("usuario-a"),
        SyntaxError,
      );
    },
  );
});
