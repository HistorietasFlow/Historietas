import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const conteudo = ler("../../app/ler-capitulo/components/ler-capitulo-reader-content.tsx");
const inicio = conteudo.indexOf("      <section style={isDesktop ? desktopContainerStyle : containerStyle}>");
const fim = conteudo.indexOf("\n  );", inicio);

test("composição do leitor preserva literalmente as 368 linhas de JSX originais", () => {
  assert.ok(inicio >= 0 && fim > inicio);
  const jsx = conteudo.slice(inicio, fim).trimEnd();
  assert.equal(jsx.split("\n").length, 368);
  assert.equal(createHash("sha256").update(jsx).digest("hex"), "d19d3843218b0a0eb2eb8a35e64182308d1a6d19466f52a13a2f39adea44121d");
});

test("página mantém estados e repassa valores e callbacks sem wrappers", () => {
  assert.match(pagina, /import LerCapituloReaderContent, \{ type TamanhoFonte \} from "\.\/components\/ler-capitulo-reader-content";/);
  const chamada = pagina.match(/<LerCapituloReaderContent([\s\S]*?)\/>/);
  assert.ok(chamada);
  for (const nome of [
    "obraAtual", "capituloAtual", "isDesktop", "mostrarAjustes", "setMostrarAjustes",
    "language", "metricasCapitulo", "tamanhoFonte", "setTamanhoFonte",
    "mostrarLinhaProgresso", "setMostrarLinhaProgresso", "usuarioIdLogado",
    "obterAutorIdSeguro", "statusLeituraTexto", "totalPalavras", "trocarCapitulo",
    "abrirDenunciaCapituloAtual", "criarTextoLeituraDesktopStyle", "criarTextoLeituraStyle",
    "curtidaCapituloSalvando", "alternarCurtida", "salvoCapituloSalvando", "alternarSalvo",
    "alternarComentarioVisivel", "mostrarComentario", "lidoCapituloSalvando",
    "alternarLido", "mensagemAcao", "capituloAnterior", "proximoCapitulo",
    "voltarHref", "formatarContadorCapituloLeitor", "FONT_SCALE_VALUES",
  ]) {
    assert.match(chamada[1], new RegExp(`\\b${nome}=\\{${nome}\\}`));
  }
  assert.match(pagina, /const \{ alternarCurtida, alternarSalvo \} = criarAcoesInteracoesCapitulo\(\{/);
  assert.match(pagina, /const \{ alternarLido \} = criarAcaoProgressoLeituraCapitulo\(\{/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-navigation-actions";/);
  assert.match(pagina, /criarAcaoTrocaCapituloLeitor\(\{[\s\S]*?obraAtual,[\s\S]*?setCapituloId,/);
  assert.doesNotMatch(pagina, /function trocarCapitulo\(/);
  assert.match(pagina, /<ComentariosCapituloSheet/);
  assert.match(pagina, /<AdultContentGate/);
});

test("conteúdo mantém ações, acessibilidade, navegação e estilos responsivos", () => {
  assert.match(conteudo, /^"use client";/);
  assert.match(conteudo, /export default function LerCapituloReaderContent\(/);
  assert.match(conteudo, /from "\.\.\/lib\/ler-capitulo-layout-styles"/);
  assert.match(conteudo, /onClick=\{\(\) => void alternarCurtida\(\)\}/);
  assert.match(conteudo, /onClick=\{\(\) => void alternarSalvo\(\)\}/);
  assert.match(conteudo, /onClick=\{\(\) => void alternarLido\(\)\}/);
  assert.match(conteudo, /onClick=\{\(\) => void alternarComentarioVisivel\(\)\}/);
  assert.match(conteudo, /onClick=\{\(\) => void abrirDenunciaCapituloAtual\(\)\}/);
  assert.match(conteudo, /onChange=\{\(event\) => trocarCapitulo\(event.target.value\)\}/);
  assert.match(conteudo, /aria-pressed=\{metricasCapitulo.curtiu\}/);
  assert.match(conteudo, /aria-pressed=\{capituloAtual.lido\}/);
  assert.match(conteudo, /data-historietas-i18n-ignore="true"/);
  assert.match(conteudo, /💬/);
  assert.match(conteudo, /← Capítulo anterior/);
  assert.match(conteudo, /Próximo capítulo →/);
  assert.doesNotMatch(conteudo, /\b(?:supabase|localStorage|window|document|useEffect|useState)\b/i);
});
