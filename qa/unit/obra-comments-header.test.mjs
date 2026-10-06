import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cabecalhoComentarios = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comments-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("cabecalho preserva contador singular plural e trigger acessivel", () => {
  assert.match(
    cabecalhoComentarios,
    /totalComentarios === 1\s*\? "1 comentário"\s*:\s*`\$\{totalComentarios\} comentários`/,
  );
  assert.match(cabecalhoComentarios, /<header style=\{commentsSheetHeaderStyle\}>/);
  assert.match(
    cabecalhoComentarios,
    /<span style=\{commentsSheetHeaderSpacerStyle\} aria-hidden="true" \/>/,
  );
  assert.match(
    cabecalhoComentarios,
    /<strong style=\{commentsSheetTitleStyle\}>/,
  );
  assert.match(cabecalhoComentarios, />\s*\+\s*<\/button>/);
  assert.match(cabecalhoComentarios, /aria-label="Ordenar comentários"/);
  assert.match(cabecalhoComentarios, /aria-haspopup="menu"/);
  assert.match(cabecalhoComentarios, /aria-expanded=\{menuAberto\}/);
  assert.match(cabecalhoComentarios, /onClick=\{onAlternarMenu\}/);
});

test("cabecalho preserva menu, opcoes, estados ARIA e estilos", () => {
  assert.match(
    cabecalhoComentarios,
    /menuAberto \? \(\s*<div style=\{commentsSortMenuStyle\} role="menu">/,
  );
  assert.equal(
    (cabecalhoComentarios.match(/role="menuitemradio"/g) || []).length,
    2,
  );
  assert.match(
    cabecalhoComentarios,
    /onClick=\{onSelecionarRelevantes\}[\s\S]*?ordenacao === "relevantes"[\s\S]*?commentsSortMenuItemActiveStyle[\s\S]*?commentsSortMenuItemStyle[\s\S]*?aria-checked=\{ordenacao === "relevantes"\}[\s\S]*?>\s*Relevantes/,
  );
  assert.match(
    cabecalhoComentarios,
    /<div style=\{commentsSortMenuDividerStyle\} aria-hidden="true" \/>/,
  );
  assert.match(
    cabecalhoComentarios,
    /onClick=\{onSelecionarRecentes\}[\s\S]*?ordenacao === "recentes"[\s\S]*?commentsSortMenuItemActiveStyle[\s\S]*?commentsSortMenuItemStyle[\s\S]*?aria-checked=\{ordenacao === "recentes"\}[\s\S]*?>\s*Recentes/,
  );
});

test("estado e selecao do menu permanecem no cliente", () => {
  assert.match(
    paginaObra,
    /const \[ordenacaoComentarios, setOrdenacaoComentarios\] =\s*useState<OrdenacaoComentariosObra>\("relevantes"\);/,
  );
  assert.match(
    paginaObra,
    /const \[menuOrdenacaoComentariosAberto, setMenuOrdenacaoComentariosAberto\] =\s*useState\(false\);/,
  );
  assert.match(
    paginaObra,
    /const alternarMenuOrdenacaoComentarios = \(\) => \{\s*setMenuOrdenacaoComentariosAberto\(\(aberto\) => !aberto\);\s*\};/,
  );
  assert.match(
    paginaObra,
    /const selecionarComentariosRelevantes = \(\) => \{\s*setOrdenacaoComentarios\("relevantes"\);\s*setMenuOrdenacaoComentariosAberto\(false\);\s*\};/,
  );
  assert.match(
    paginaObra,
    /const selecionarComentariosRecentes = \(\) => \{\s*setOrdenacaoComentarios\("recentes"\);\s*setMenuOrdenacaoComentariosAberto\(false\);\s*\};/,
  );
  assert.match(
    paginaObra,
    /<ObraCommentsHeader\s*totalComentarios=\{totalComentariosObra\}\s*ordenacao=\{ordenacaoComentarios\}\s*menuAberto=\{menuOrdenacaoComentariosAberto\}\s*onAlternarMenu=\{alternarMenuOrdenacaoComentarios\}\s*onSelecionarRelevantes=\{selecionarComentariosRelevantes\}\s*onSelecionarRecentes=\{selecionarComentariosRecentes\}/,
  );
  assert.doesNotMatch(cabecalhoComentarios, /useState|setOrdenacaoComentarios|setMenuOrdenacaoComentariosAberto/);
});

test("abertura e fechamento do sheet continuam zerando o menu", () => {
  const aberturaInicio = paginaObra.indexOf("function abrirComentariosObra()");
  const fechamentoInicio = paginaObra.indexOf("function fecharComentariosObra()");
  const fim = paginaObra.indexOf("function iniciarArrasteComentariosObra", fechamentoInicio);

  assert.ok(aberturaInicio >= 0);
  assert.ok(fechamentoInicio > aberturaInicio);
  assert.ok(fim > fechamentoInicio);

  const abertura = paginaObra.slice(aberturaInicio, fechamentoInicio);
  const fechamento = paginaObra.slice(fechamentoInicio, fim);

  assert.match(abertura, /setMenuOrdenacaoComentariosAberto\(false\);/);
  assert.match(fechamento, /setMenuOrdenacaoComentariosAberto\(false\);/);
});
