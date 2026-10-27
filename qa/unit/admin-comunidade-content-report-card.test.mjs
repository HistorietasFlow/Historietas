import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-content-report-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("cartão de conteúdo preserva estrutura, ações e acessibilidade", () => {
  assert.match(
    componentSource,
    /import type \{ DenunciaComContexto \} from "\.\.\/lib\/admin-comunidade-report-context-utils";/,
  );
  assert.match(componentSource, /STATUS_DENUNCIAS\.map\(/);
  assert.match(componentSource, /STATUS_LABEL\[denuncia\.status\]/);
  assert.match(
    componentSource,
    /rotuloTipoAlvoDenuncia\(denuncia\.alvoTipo\)/,
  );
  assert.match(
    componentSource,
    /rotuloRemocaoAlvoDenuncia\(\s*denuncia\.alvoTipo\s*\)/,
  );
  assert.match(componentSource, /formatarData\(denuncia\.criadoEm\)/);
  assert.match(componentSource, /encodeURIComponent\(\s*denuncia\.alvoPostId/);
  assert.match(componentSource, /\/ler-capitulo\?obraId=/);
  assert.match(componentSource, /\/obra\/\$\{encodeURIComponent/);
  assert.match(
    componentSource,
    /criarHrefDiarioDenunciado\(denuncia\)/,
  );
  assert.match(
    componentSource,
    /onArquivarDenuncia\(denuncia\.id\)/,
  );
  assert.match(
    componentSource,
    /onRestaurarDenunciaArquivada\(denuncia\.id\)/,
  );
  assert.match(
    componentSource,
    /onRemoverDenunciaResolvida\(denuncia\.id\)/,
  );
  assert.match(
    componentSource,
    /onRemoverConteudoDenunciado\(denuncia\)/,
  );
  assert.match(componentSource, /"Assumindo\.{3}"/);
  assert.match(componentSource, /"Removendo\.{3}"/);
  assert.match(componentSource, /"Salvando\.{3}"/);
  assert.match(
    componentSource,
    /conteudoIndisponivel \|\|\s*denunciaArquivada/,
  );
  assert.match(componentSource, /totalReincidencias > 1/);
  assert.match(componentSource, /denuncia\.alvoTemSpoiler/);
  assert.match(componentSource, /denuncia\.alvoCapituloTitulo/);
  assert.match(componentSource, /denuncia\.alvoObra/);
  assert.match(componentSource, /denuncia\.alvoCategoria/);
  assert.match(componentSource, /Sem detalhe adicional\./);
  assert.match(componentSource, /maxLength=\{800\}/);
  assert.match(componentSource, /rows=\{2\}/);
  assert.match(
    componentSource,
    /onChange=\{\(event\) => onAlterarObservacao\(event\.target\.value\)\}/,
  );
});

test("página mantém o map, cálculos e atualizações de estado", () => {
  assert.match(
    pageSource,
    /import \{ AdminComunidadeContentReportCard \} from "\.\/components\/admin-comunidade-content-report-card";/,
  );
  assert.match(
    pageSource,
    /denunciasFiltradas\.map\(\(denuncia\) => \{/,
  );
  assert.match(
    pageSource,
    /const acaoAtiva = acaoEmAndamento\.startsWith\(denuncia\.id\);/,
  );
  assert.match(
    pageSource,
    /const observacao = observacoes\[denuncia\.id\] \|\| "";/,
  );
  assert.match(
    pageSource,
    /const menuAberto = menuDenunciaAbertoId === denuncia\.id;/,
  );
  assert.match(
    pageSource,
    /const denunciaArquivada = denuncia\.arquivada;/,
  );
  assert.match(
    pageSource,
    /conteudoDenunciadoIndisponivel\(denuncia\)/,
  );
  assert.match(
    pageSource,
    /denuncia\.status === "resolvida" && conteudoIndisponivel/,
  );
  assert.match(
    pageSource,
    /reincidenciasPorUsuario\[denuncia\.alvoAutorId\] \|\| 0/,
  );
  assert.match(
    pageSource,
    /<AdminComunidadeContentReportCard/,
  );
  assert.match(
    pageSource,
    /setObservacoes\(\(observacoesAtuais\) => \(\{\s*\.\.\.observacoesAtuais,\s*\[denuncia\.id\]: novoValor,/,
  );
  assert.match(pageSource, /void arquivarDenuncia\(denunciaId\)/);
  assert.match(
    pageSource,
    /void restaurarDenunciaArquivada\(denunciaId\)/,
  );
  assert.match(
    pageSource,
    /void removerDenunciaResolvida\(denunciaId\)/,
  );
  assert.match(
    pageSource,
    /void atualizarStatusDenuncia\(denunciaId, novoStatus\)/,
  );
  assert.match(
    pageSource,
    /void removerConteudoDenunciado\(denunciaAtual\)/,
  );
});

test("cartão permanece uma fronteira visual sem infraestrutura", () => {
  assert.doesNotMatch(
    componentSource,
    /supabase|\.from\(|\.rpc\(|\.auth\.|localStorage|sessionStorage|fetch\(/i,
  );
});
