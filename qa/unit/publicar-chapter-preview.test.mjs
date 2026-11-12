import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import test from "node:test";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import {renderToStaticMarkup} from "react-dom/server";
import typescript from "typescript";

function carregar(caminho, mocks = {}) {
  const cache = new Map();
  function modulo(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    const exports = {};
    cache.set(url.href, exports);
    const javascript = typescript.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: {module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022, jsx: typescript.JsxEmit.ReactJSX},
    }).outputText;
    const require = (nome) => {
      if (Object.hasOwn(mocks, nome)) return mocks[nome];
      if (nome === "react") return React;
      if (nome === "react/jsx-runtime") return jsxRuntime;
      assert.ok(nome.startsWith("."), `Dependência inesperada: ${nome}`);
      const destino = [".ts", ".tsx", ".mjs"].map(ext => new URL(nome + ext, url)).find(existsSync);
      assert.ok(destino, `Módulo local ausente: ${nome}`);
      return modulo(destino);
    };
    new Function("require", "exports", javascript)(require, exports);
    return exports;
  }
  return modulo(new URL(`../../${caminho}`, import.meta.url));
}

const {obterTextoPublicar} = carregar("app/publicar/lib/publicar-translations.ts");
const {PublicarWorkPreview} = carregar("app/publicar/components/PublicarWorkPreview.tsx");
const texto = "  Ler prévia completa\n\n  Parágrafo intacto.\n<script>não executar</script>\n**Marcação literal**  ";
const props = {arquivoCapituloMinutos: 1, arquivoCapituloPalavras: 20, arquivoCapituloTitulo: "Capítulo do autor",
  arquivoCapituloTexto: texto, autor: "Autor", capa: "", classificacaoTexto: "Livre", formatoFinal: "Conto",
  generoFinal: "Fantasia", idioma: "pt-BR", isDesktop: false, previewTemConteudo: true,
  t: chave => obterTextoPublicar("pt-BR", chave), temCapituloImportado: true, titulo: "Obra"};

test("prévia recebe o texto já validado, literal, e traduz somente os controles em PT/EN/ES", () => {
  for (const [idioma, label] of [["pt-BR", "Ler prévia completa"], ["en", "Read full preview"], ["es", "Leer vista previa completa"]]) {
    const html = renderToStaticMarkup(React.createElement(PublicarWorkPreview, {...props, idioma, t: chave => obterTextoPublicar(idioma, chave)}));
    assert.ok(html.includes(`>${label}</button>`));
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /-webkit-line-clamp:2/);
    assert.match(html, /Ler prévia completa\n\n  Parágrafo intacto\./);
    assert.match(html, /&lt;script&gt;não executar&lt;\/script&gt;\n\*\*Marcação literal\*\*/);
    assert.doesNotMatch(html, /<script|<strong>Marcação/);
  }
});

test("prévia vazia, anexo completo e ausência de conteúdo não oferecem leitura de capítulo", () => {
  for (const estado of [{arquivoCapituloTexto: ""}, {arquivoCapituloTexto: "   "}, {temCapituloImportado: false}, {previewTemConteudo: false}]) {
    const html = renderToStaticMarkup(React.createElement(PublicarWorkPreview, {...props, ...estado}));
    assert.doesNotMatch(html, /aria-expanded|Parágrafo intacto/);
  }
  const html = renderToStaticMarkup(React.createElement(PublicarWorkPreview, {...props, arquivoCapituloTexto: "Texto novo substitui o capítulo anterior sem releitura."}));
  assert.match(html, /Texto novo substitui/);
  assert.doesNotMatch(html, /Parágrafo intacto/);
});

function encontrar(arvore, tipo) {
  if (!React.isValidElement(arvore)) return [];
  return [arvore.type === tipo ? arvore : null, ...React.Children.toArray(arvore.props.children).flatMap(filho => encontrar(filho, tipo))].filter(Boolean);
}

test("página encaminha o buffer do controlador e oculta o corpo durante seleção pendente ou erro", () => {
  let estado = {...props, arquivoTextoPendente: null, arquivoCapituloErro: "", arquivoObraErro: ""};
  const Preview = () => null;
  const vazio = () => null;
  const {default: Pagina} = carregar("app/publicar/page.tsx", {
    "next/navigation": {useRouter: () => ({})},
    "./hooks/use-publicar-desktop-mode": {usePublicarDesktopMode: () => false},
    "./hooks/use-publicar-initial-access": {usePublicarInitialAccess: vazio},
    "./hooks/use-publicar-page-state": {usePublicarPageState: () => ({verificandoAutenticacao: false})},
    "./hooks/use-publicar-page-presentation": {usePublicarPagePresentation: () => ({t: props.t, traduzirClassificacao: valor => valor})},
    "./hooks/use-publicar-form-controller": {usePublicarFormController: () => estado},
    "./components/PublicarPageShell": {PublicarPageShell: vazio, PublicarLoadingShell: vazio},
    "./components/PublicarPageBackdrop": {PublicarPageBackdrop: vazio},
    "./components/PublicarPublicationForm": {PublicarPublicationForm: vazio},
    "./components/PublicarWorkPreview": {PublicarWorkPreview: Preview},
  });
  const textoRecebido = () => {
    const elementos = encontrar(Pagina(), Preview);
    assert.equal(elementos.length, 1);
    return elementos[0].props.arquivoCapituloTexto;
  };
  assert.equal(textoRecebido(), texto);
  for (const alteracao of [{arquivoTextoPendente: {name: "novo.md"}}, {arquivoCapituloErro: "Pouco texto"}, {arquivoObraErro: "Arquivo inválido"}]) {
    estado = {...props, arquivoTextoPendente: null, arquivoCapituloErro: "", arquivoObraErro: "", ...alteracao};
    assert.equal(textoRecebido(), "");
    assert.equal(estado.arquivoCapituloTexto, texto);
  }
  estado = {...props, arquivoTextoPendente: null, arquivoCapituloErro: "", arquivoObraErro: ""};
  assert.equal(textoRecebido(), texto, "cancelar a nova escolha pode retomar o buffer anterior");
});

function criarUpload() {
  const slots = [];
  let cursor = 0;
  const readers = [];
  const anterior = globalThis.FileReader;
  globalThis.FileReader = class {
    constructor() { readers.push(this); }
    readAsText(arquivo, encoding) { this.arquivo = arquivo; this.encoding = encoding; }
    readAsDataURL(arquivo) { this.arquivo = arquivo; }
    concluir(valor) { this.result = valor; this.onload(); }
  };
  const react = {
    useState(inicial) {
      const indice = cursor++;
      if (!(indice in slots)) slots[indice] = inicial;
      return [slots[indice], valor => {slots[indice] = typeof valor === "function" ? valor(slots[indice]) : valor;}];
    },
    useRef(inicial) {
      const indice = cursor++;
      if (!(indice in slots)) slots[indice] = {current: inicial};
      return slots[indice];
    },
  };
  const {usePublicarContentFileUpload} = carregar("app/publicar/hooks/use-publicar-content-file-upload.ts", {react});
  const render = () => {cursor = 0; return Reflect.apply(usePublicarContentFileUpload, null, [{setErro: () => {}}]);};
  const selecionar = arquivo => render().selecionarConteudoArquivo({target: {files: [arquivo], value: arquivo.name}});
  return {readers, render, selecionar, restaurar: () => {globalThis.FileReader = anterior;}};
}

const arquivoA = {name: "primeiro.txt", type: "text/plain", size: 100};
const arquivoB = {name: "segundo.md", type: "text/markdown", size: 100};
const textoA = "Primeiro capítulo com texto validado suficiente.";
const textoB = "Segundo capítulo com outro texto validado suficiente.";

test("importação mantém uma leitura UTF-8 e as normalizações existentes", () => {
  const upload = criarUpload();
  try {
    upload.selecionar(arquivoA);
    upload.render().transformarArquivoTextoEmCapitulo(arquivoA);
    assert.equal(upload.readers.length, 1);
    assert.equal(upload.readers[0].encoding, "UTF-8");
    upload.readers[0].concluir("  Primeiro capítulo.\r\n\r\n  Espaços internos e **marcação literal**.  ");
    assert.equal(upload.render().arquivoCapituloTexto, "Primeiro capítulo.\n\n  Espaços internos e **marcação literal**.");
    assert.equal(upload.render().arquivoTextoPendente, null);
  } finally {upload.restaurar();}
});

test("cancelar ou remover impede restauração por uma leitura tardia", () => {
  for (const acao of ["cancelarEscolhaArquivoTexto", "limparSelecaoConteudoArquivo"]) {
    const upload = criarUpload();
    try {
      upload.selecionar(arquivoA);
      upload.render().transformarArquivoTextoEmCapitulo(arquivoA);
      upload.render()[acao]();
      upload.readers[0].concluir(textoA);
      assert.equal(upload.render().arquivoCapituloTexto, "");
      assert.equal(upload.render().arquivoTextoPendente, null);
    } finally {upload.restaurar();}
  }
});

test("substituição descarta resultado e erro de leitores antigos sem alterar o texto novo", () => {
  const upload = criarUpload();
  try {
    upload.selecionar(arquivoA);
    upload.render().transformarArquivoTextoEmCapitulo(arquivoA);
    upload.selecionar(arquivoB);
    upload.render().transformarArquivoTextoEmCapitulo(arquivoB);
    upload.readers[1].concluir(textoB);
    upload.readers[0].concluir(textoA);
    upload.readers[0].onerror();
    assert.equal(upload.render().arquivoCapituloTexto, textoB);
    assert.equal(upload.render().arquivoCapituloNome, arquivoB.name);
    assert.equal(upload.render().arquivoCapituloErro, "");
  } finally {upload.restaurar();}
});

test("anexo completo conserva o contrato e uma leitura cancelada não substitui o capítulo", () => {
  const upload = criarUpload();
  try {
    upload.selecionar(arquivoA);
    upload.render().transformarArquivoTextoEmCapitulo(arquivoA);
    upload.readers[0].concluir(textoA);
    upload.selecionar(arquivoB);
    upload.render().anexarArquivoCompleto(arquivoB);
    upload.render().cancelarEscolhaArquivoTexto();
    upload.readers[1].concluir("data:text/markdown;base64,ZXhlbXBsbyBkZSBhbmV4bw==");
    assert.equal(upload.render().arquivoObra, null);
    assert.equal(upload.render().arquivoCapituloTexto, textoA);
    upload.selecionar(arquivoB);
    upload.render().anexarArquivoCompleto(arquivoB);
    upload.readers[2].concluir("data:text/markdown;base64,ZXhlbXBsbyBkZSBhbmV4bw==");
    assert.equal(upload.render().arquivoCapituloTexto, "");
    assert.equal(upload.render().arquivoObra.nome, arquivoB.name);
    assert.equal(upload.render().arquivoObraArquivo, arquivoB);
  } finally {upload.restaurar();}
});

test("erro do arquivo novo preserva o buffer anterior sem validá-lo como nova seleção", () => {
  const upload = criarUpload();
  try {
    upload.selecionar(arquivoA);
    upload.render().transformarArquivoTextoEmCapitulo(arquivoA);
    upload.readers[0].concluir(textoA);
    upload.selecionar(arquivoB);
    upload.render().transformarArquivoTextoEmCapitulo(arquivoB);
    upload.readers[1].concluir("Curto");
    assert.ok(upload.render().arquivoCapituloErro);
    assert.equal(upload.render().arquivoTextoPendente, arquivoB);
    assert.equal(upload.render().arquivoCapituloTexto, textoA);
    assert.equal(upload.render().arquivoCapituloNome, arquivoA.name);
    upload.render().cancelarEscolhaArquivoTexto();
    assert.equal(upload.render().arquivoCapituloErro, "");
    assert.equal(upload.render().arquivoCapituloTexto, textoA);
  } finally {upload.restaurar();}
});
