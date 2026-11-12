import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";
import "./adicionar-capitulo-language-bridge.test.mjs";

const source = readFileSync(
  new URL("../../components/ChapterTextPreview.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022,
    jsx: typescript.JsxEmit.React,
  },
}).outputText;

function criarPrevia(id = "previa-capitulo-1") {
  let estado;
  const react = {
    ...React,
    useId: () => id,
    useState(inicial) {
      if (estado === undefined) estado = inicial;
      return [estado, (valor) => {
        estado = typeof valor === "function" ? valor(estado) : valor;
      }];
    },
  };
  const modulo = { exports: {} };
  new Function("require", "module", "exports", "React", javascript)(
    (nome) => {
      assert.equal(nome, "react", `dependência inesperada: ${nome}`);
      return react;
    },
    modulo,
    modulo.exports,
    React,
  );
  const Componente = modulo.exports.ChapterTextPreview ?? modulo.exports.default;
  assert.equal(typeof Componente, "function");
  return (props) => Reflect.apply(Componente, null, [props]);
}

function elementos(arvore, tipo, caminho = []) {
  if (!React.isValidElement(arvore)) return [];
  const encontrados = arvore.type === tipo ? [{ elemento: arvore, caminho }] : [];
  React.Children.forEach(arvore.props.children, (filho, indice) => {
    encontrados.push(...elementos(filho, tipo, [...caminho, indice]));
  });
  return encontrados;
}

function unico(arvore, tipo) {
  const encontrados = elementos(arvore, tipo);
  assert.equal(encontrados.length, 1, `esperado um único ${tipo}`);
  return encontrados[0];
}

const textStyle = Object.freeze({
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  fontSize: "11px",
  lineHeight: 1.45,
  color: "#D4D4D8",
});
const buttonStyle = Object.freeze({ minHeight: "44px", color: "#FFFFFF" });

test("prévia começa compacta e seu botão controla o texto sem submeter o formulário", () => {
  const render = criarPrevia();
  const children = React.createElement("span", {
    "data-historietas-i18n-ignore": "true",
  }, "Primeiro parágrafo.\n\nSegundo parágrafo.");
  const arvore = render({ children, textStyle, buttonStyle });
  const { elemento: texto } = unico(arvore, "p");
  const { elemento: botao } = unico(arvore, "button");

  assert.deepEqual(texto.props.style, textStyle);
  assert.strictEqual(texto.props.children, children);
  assert.equal(botao.props.type, "button");
  assert.equal(botao.props["aria-expanded"], false);
  assert.ok(texto.props.id);
  assert.equal(botao.props["aria-controls"], texto.props.id);
  assert.deepEqual(botao.props.style, buttonStyle);
  assert.match(renderToStaticMarkup(botao), />Ler prévia completa<\/button>/);
});

test("expandir e recolher preserva conteúdo, estilos recebidos e posição do botão", () => {
  const render = criarPrevia();
  const children = "Início.\n\n  Recuo preservado.\nÚltima linha.";
  const props = { children, textStyle, buttonStyle };
  const compacta = render(props);
  const controleInicial = unico(compacta, "button");
  const textoInicial = unico(compacta, "p").elemento;

  controleInicial.elemento.props.onClick();
  const expandida = render(props);
  const controleExpandido = unico(expandida, "button");
  const textoExpandido = unico(expandida, "p").elemento;

  assert.equal(controleExpandido.elemento.props["aria-expanded"], true);
  assert.equal(controleExpandido.elemento.props["aria-controls"], textoInicial.props.id);
  assert.equal(textoExpandido.props.id, textoInicial.props.id);
  assert.deepEqual(controleExpandido.caminho, controleInicial.caminho);
  assert.equal(controleExpandido.elemento.key, controleInicial.elemento.key);
  assert.equal(textoExpandido.props.children, children);
  assert.deepEqual(textoExpandido.props.style, {
    ...textStyle,
    display: "block",
    WebkitLineClamp: "unset",
    whiteSpace: "pre-wrap",
    fontSize: "16px",
    lineHeight: 1.7,
  });
  assert.match(renderToStaticMarkup(controleExpandido.elemento), />Recolher prévia<\/button>/);

  controleExpandido.elemento.props.onClick();
  const recolhida = render(props);
  assert.equal(unico(recolhida, "button").elemento.props["aria-expanded"], false);
  assert.deepEqual(unico(recolhida, "p").elemento.props.style, textStyle);
  assert.equal(unico(recolhida, "p").elemento.props.children, children);
  assert.equal(textStyle.WebkitLineClamp, 2);
  assert.equal(textStyle.fontSize, "11px");
});

test("texto completo permanece literal, inclusive marcação, whitespace e alterações ainda não salvas", () => {
  const render = criarPrevia();
  const original = "Título\n\n  Primeiro parágrafo.\n\tFim remoto.";
  const props = { children: original, textStyle, buttonStyle };
  unico(render(props), "button").elemento.props.onClick();

  const alterado = "Título\n\n  Primeiro parágrafo editado.\n\t<script>alert('prévia')</script>\n**Markdown literal**\nFim ainda não salvo.";
  const arvore = render({ ...props, children: alterado });
  const texto = unico(arvore, "p").elemento;
  const html = renderToStaticMarkup(texto);

  assert.equal(texto.props.children, alterado);
  assert.equal(texto.props.style.whiteSpace, "pre-wrap");
  assert.match(html, /Título\n\n  Primeiro parágrafo editado\.\n\t/);
  assert.match(html, /&lt;script&gt;alert\(/);
  assert.match(html, /\*\*Markdown literal\*\*\nFim ainda não salvo\./);
  assert.doesNotMatch(html, /<script|<strong|Fim remoto/);
  assert.equal(unico(arvore, "button").elemento.props["aria-expanded"], true);
});

test("instâncias independentes não compartilham expansão nem alvo acessível", () => {
  const primeira = criarPrevia("previa-primeira");
  const segunda = criarPrevia("previa-segunda");
  const props = { children: "Texto do capítulo", textStyle, buttonStyle };
  unico(primeira(props), "button").elemento.props.onClick();
  const primeiroBotao = unico(primeira(props), "button").elemento;
  const segundoBotao = unico(segunda(props), "button").elemento;

  assert.equal(primeiroBotao.props["aria-expanded"], true);
  assert.equal(segundoBotao.props["aria-expanded"], false);
  assert.notEqual(primeiroBotao.props["aria-controls"], segundoBotao.props["aria-controls"]);
});

test("rótulos opcionais traduzem somente os controles sem modificar o conteúdo", () => {
  const render = criarPrevia();
  const props = {children: "Ler prévia completa\n\nTexto do autor.", textStyle, buttonStyle,
    expandLabel: "Read full preview", collapseLabel: "Collapse preview"};
  const compacta = render(props);
  assert.equal(unico(compacta, "button").elemento.props.children, "Read full preview");
  unico(compacta, "button").elemento.props.onClick();
  const expandida = render(props);
  assert.equal(unico(expandida, "button").elemento.props.children, "Collapse preview");
  assert.equal(unico(expandida, "p").elemento.props.children, props.children);
  const espanhol = render({...props, expandLabel: "Leer vista previa completa", collapseLabel: "Contraer vista previa"});
  assert.equal(unico(espanhol, "button").elemento.props.children, "Contraer vista previa");
  assert.equal(unico(espanhol, "button").elemento.props["aria-expanded"], true);
});
