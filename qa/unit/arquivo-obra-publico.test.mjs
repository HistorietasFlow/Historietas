import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const arquivoObraPublico = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/arquivo-obra-publico.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("arquivo publico preserva props, preload de imagem privada e cancelamento", () => {
  for (const trecho of [
    '"use client";',
    "obraId: string;",
    "arquivo: ArquivoObraLocal;",
    "tituloObra: string;",
    "isDesktop: boolean;",
    "const DURACAO_UTIL_URL_ARQUIVO_OBRA_MS = 9 * 60 * 1000;",
    'if (!caminhoStorageArquivo || arquivo.categoria !== "imagem") {',
    "let cancelado = false;",
    "const controlador = new AbortController();",
    "controlador.signal,",
    "if (!cancelado) {",
    "cancelado = true;",
    "controlador.abort();",
    "}, [arquivo.categoria, caminhoStorageArquivo, obraId]);",
    "arquivoAssinado.caminho === caminhoStorageArquivo",
    "arquivoAssinado.expiraEm > Date.now()",
    "Date.now() + DURACAO_UTIL_URL_ARQUIVO_OBRA_MS",
    'erro: "Não foi possível liberar este arquivo agora.",',
  ]) {
    assert.ok(arquivoObraPublico.includes(trecho), trecho);
  }
});

test("arquivo publico preserva cache e renovacao da URL assinada", () => {
  const indiceCache = arquivoObraPublico.indexOf(
    "if (\n      assinaturaAtual &&\n      arquivoAssinado.url &&\n      arquivoAssinado.expiraEm > Date.now()",
  );
  const indiceRenovacao = arquivoObraPublico.indexOf(
    "const url = await solicitarUrlTemporariaArquivoObra(obraId);",
  );

  assert.ok(indiceCache >= 0);
  assert.ok(indiceRenovacao > indiceCache);
  assert.ok(arquivoObraPublico.includes("return arquivoConteudo;"));
  assert.ok(arquivoObraPublico.includes("throw error;"));
});

test("arquivo publico abre antes do await e preserva os fallbacks seguros", () => {
  const indicePreventDefault = arquivoObraPublico.indexOf(
    "event.preventDefault();\n    const novaJanela = window.open(\"about:blank\", \"_blank\");",
  );
  const indiceAwait = arquivoObraPublico.indexOf(
    "const url = await obterUrlArquivoAtual();",
  );

  assert.ok(indicePreventDefault >= 0);
  assert.ok(indiceAwait > indicePreventDefault);

  for (const trecho of [
    "novaJanela.opener = null;",
    "novaJanela.location.replace(url);",
    "window.location.assign(url);",
    "novaJanela?.close();",
  ]) {
    assert.ok(arquivoObraPublico.includes(trecho), trecho);
  }
});

test("arquivo publico preserva download por Blob e fallback direto", () => {
  const indiceFetch = arquivoObraPublico.indexOf("const resposta = await fetch(urlArquivo);");
  const indiceBlob = arquivoObraPublico.indexOf("const arquivoBlob = await resposta.blob();");
  const indiceObjeto = arquivoObraPublico.indexOf("window.URL.createObjectURL(arquivoBlob);");

  assert.ok(indiceFetch >= 0);
  assert.ok(indiceBlob > indiceFetch);
  assert.ok(indiceObjeto > indiceBlob);

  for (const trecho of [
    "const urlArquivo = await obterUrlArquivoAtual().catch(() => \"\");",
    "linkDownload.download = nomeArquivoDownload;",
    "window.URL.revokeObjectURL(arquivoUrlTemporaria);",
    "}, 1000);",
    'linkDownload.rel = "noopener noreferrer";',
  ]) {
    assert.ok(arquivoObraPublico.includes(trecho), trecho);
  }
});

test("arquivo publico preserva apresentacao, estados e acessibilidade", () => {
  for (const trecho of [
    "isDesktop ? desktopFileBoxStyle : fileBoxStyle",
    "isDesktop ? desktopFileInfoCardStyle : fileInfoCardStyle",
    "isDesktop ? desktopFileActionsStyle : fileActionsStyle",
    "aria-label={`Abrir arquivo ${arquivo.nome}`}",
    "aria-disabled={arquivoIndisponivel}",
    'pointerEvents: arquivoIndisponivel ? "none" : "auto"',
    "opacity: arquivoIndisponivel ? 0.56 : 1",
    "width={74}",
    "height={74}",
    "unoptimized",
    'label="Preparando arquivo"',
    'label="Preparando download"',
    '"Tentar novamente"',
    '"Abrir arquivo"',
    '"Baixar arquivo"',
    "disabled={arquivoIndisponivel}",
    'cursor: arquivoIndisponivel\n                  ? "not-allowed"',
  ]) {
    assert.ok(arquivoObraPublico.includes(trecho), trecho);
  }
});

test("cliente preserva condicao e as quatro props do arquivo", () => {
  for (const trecho of [
    "obra.arquivoObra && (",
    "<ArquivoObraPublico",
    "obraId={obra.id}",
    "arquivo={obra.arquivoObra}",
    "tituloObra={obra.titulo}",
    "isDesktop={isDesktop}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }

  assert.doesNotMatch(
    paginaObra,
    /function ArquivoObraPublico|DURACAO_UTIL_URL_ARQUIVO_OBRA_MS/,
  );
});
