import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-content-report-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

function trecho(inicio, fim) {
  const indiceInicio = hookSource.indexOf(inicio);
  const indiceFim = hookSource.indexOf(fim, indiceInicio);

  assert.notEqual(indiceInicio, -1, `início ausente: ${inicio}`);
  assert.notEqual(indiceFim, -1, `fim ausente: ${fim}`);

  return hookSource.slice(indiceInicio, indiceFim);
}

test("a página delega as cinco ações de denúncias de conteúdo ao hook", () => {
  assert.match(
    pageSource,
    /import \{ useAdminComunidadeContentReportActions \} from "\.\/hooks\/use-admin-comunidade-content-report-actions";/,
  );
  assert.match(pageSource, /useAdminComunidadeContentReportActions\(\{/);

  for (const nome of [
    "atualizarStatusDenuncia",
    "removerConteudoDenunciado",
    "arquivarDenuncia",
    "restaurarDenunciaArquivada",
    "removerDenunciaResolvida",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`async function ${nome}\\(`));
  }

  assert.match(
    pageSource,
    /onAtualizarStatus=\{\(denunciaId, novoStatus\) =>\s*void atualizarStatusDenuncia\(denunciaId, novoStatus\)\s*\}/,
  );
  assert.match(
    pageSource,
    /onRemoverConteudoDenunciado=\{\(denunciaAtual\) =>\s*void removerConteudoDenunciado\(denunciaAtual\)\s*\}/,
  );
  assert.match(
    pageSource,
    /onArquivarDenuncia=\{\(denunciaId\) =>\s*void arquivarDenuncia\(denunciaId\)\s*\}/,
  );
  assert.match(
    pageSource,
    /onRestaurarDenunciaArquivada=\{\(denunciaId\) =>\s*void restaurarDenunciaArquivada\(denunciaId\)\s*\}/,
  );
  assert.match(
    pageSource,
    /onRemoverDenunciaResolvida=\{\(denunciaId\) =>\s*void removerDenunciaResolvida\(denunciaId\)\s*\}/,
  );
  assert.match(pageSource, /useAdminComunidadeInitialData\(\{/);
  assert.match(pageSource, /denuncias,\s*setDenuncias,/);
  assert.match(pageSource, /observacoes,\s*setObservacoes,/);
  assert.match(
    pageSource,
    /useAdminComunidadeModerationActionState\(\)/,
  );
});

test("o hook preserva o contrato de atualização de status", () => {
  const fonte = trecho(
    "async function atualizarStatusDenuncia",
    "async function removerConteudoDenunciado",
  );

  assert.match(fonte, /novoStatus: StatusDenuncia/);
  assert.match(fonte, /if \(!usuarioId \|\| !ehAdmin\)/);
  assert.match(fonte, /const chaveAcao = `\$\{denunciaId\}-\$\{novoStatus\}`;/);
  assert.match(fonte, /if \(acaoEmAndamento\)/);
  assert.match(fonte, /setAcaoEmAndamento\(chaveAcao\);\s*setErro\(""\);\s*setSucesso\(""\);/);
  assert.match(fonte, /const observacaoAtual = observacoes\[denunciaId\]\?\.trim\(\) \|\| "";/);
  assert.match(fonte, /const analisadoEm = new Date\(\)\.toISOString\(\);/);
  assert.match(fonte, /await persistirStatusDenunciaModeracao\(/);
  assert.match(fonte, /observacaoAdmin: observacaoAtual\.slice\(0, 800\)/);
  assert.match(fonte, /analisadoPor: usuarioId/);
  assert.match(fonte, /STATUS_LABEL\[novoStatus\]\.toLowerCase\(\)/);
  assert.match(fonte, /criarMensagemErro\("Erro ao atualizar denúncia", error\)/);
  assert.match(fonte, /finally \{\s*setAcaoEmAndamento\(""\);\s*\}/);
});

test("o hook preserva a remoção de conteúdo, inclusive a ordem de efeitos", () => {
  const fonte = trecho(
    "async function removerConteudoDenunciado",
    "async function arquivarDenuncia",
  );

  assert.match(fonte, /if \(!usuarioId \|\| !ehAdmin\)/);
  assert.match(fonte, /denuncia\.arquivada/);
  assert.match(fonte, /denuncia\.status !== "pendente"/);
  assert.match(fonte, /denuncia\.status !== "em_analise"/);
  assert.match(fonte, /textoConfirmacaoRemocaoAdminComunidade\(denuncia\.alvoTipo, language\)/);
  assert.match(fonte, /localeAdminComunidade\(language\)/);
  assert.match(fonte, /const chaveAcao = `\$\{denuncia\.id\}-remover-conteudo`;/);
  assert.match(fonte, /await removerConteudoDenunciadoModeracao\(/);
  assert.match(fonte, /denunciaAtual\.alvoTipo === denuncia\.alvoTipo/);
  assert.match(fonte, /denunciaAtual\.alvoId === denuncia\.alvoId/);
  assert.match(fonte, /status: "resolvida"/);
  assert.match(fonte, /Registro anterior: \$\{denunciaAtual\.alvoResumo\}/);
  assert.match(fonte, /setObservacoes\(/);
  assert.match(fonte, /rotuloSucessoRemocaoAlvo\(\s*denuncia\.alvoTipo\s*\)/);

  const indiceAutorizacao = fonte.indexOf("if (!usuarioId || !ehAdmin)");
  const indiceConfirmacao = fonte.indexOf("window.confirm");
  const indiceAcao = fonte.indexOf("setAcaoEmAndamento(chaveAcao)");
  const indicePersistencia = fonte.indexOf("await removerConteudoDenunciadoModeracao");
  const indiceFinally = fonte.indexOf("finally {");
  const indiceAtualizacaoLocal = fonte.indexOf("setDenuncias(");
  const indiceObservacoes = fonte.indexOf("setObservacoes(");
  const indiceSucesso = fonte.lastIndexOf("setSucesso(");

  assert.ok(indiceAutorizacao < indiceConfirmacao);
  assert.ok(indiceConfirmacao < indiceAcao);
  assert.ok(indicePersistencia < indiceFinally);
  assert.ok(indiceFinally < indiceAtualizacaoLocal);
  assert.ok(indiceAtualizacaoLocal < indiceObservacoes);
  assert.ok(indiceObservacoes < indiceSucesso);
});

test("o hook preserva arquivamento, restauração e remoção da denúncia resolvida", () => {
  const arquivamento = trecho(
    "async function arquivarDenuncia",
    "async function restaurarDenunciaArquivada",
  );
  const restauracao = trecho(
    "async function restaurarDenunciaArquivada",
    "async function removerDenunciaResolvida",
  );
  const remocao = trecho("async function removerDenunciaResolvida", "return {");

  assert.match(arquivamento, /\$\{denunciaId\}-arquivar/);
  assert.match(arquivamento, /setMenuDenunciaAbertoId\(""\);/);
  assert.match(arquivamento, /persistirArquivamentoDenunciaModeracao/);
  assert.match(arquivamento, /arquivada: true/);
  assert.match(restauracao, /\$\{denunciaId\}-restaurar/);
  assert.match(restauracao, /persistirRestauracaoDenunciaModeracao/);
  assert.match(restauracao, /arquivada: false/);
  assert.match(remocao, /denuncias\.find\(\(item\) => item\.id === denunciaId\)/);
  assert.match(remocao, /denuncia\.status !== "resolvida"/);
  assert.match(remocao, /\$\{denunciaId\}-remover-denuncia/);
  assert.match(remocao, /persistirRemocaoDenunciaResolvidaModeracao/);
  assert.match(remocao, /denunciasAtuais\.filter/);
  assert.match(remocao, /const proximasObservacoes = \{ \.\.\.observacoesAtuais \};/);
  assert.match(remocao, /delete proximasObservacoes\[denunciaId\];/);
});

test("o hook é somente uma fronteira de ações de conteúdo", () => {
  assert.match(hookSource, /return \{\s*atualizarStatusDenuncia,\s*removerConteudoDenunciado,\s*arquivarDenuncia,\s*restaurarDenunciaArquivada,\s*removerDenunciaResolvida,\s*\};/);
  assert.doesNotMatch(
    hookSource,
    /useState|useEffect|useMemo|useRouter|localStorage|supabase\.from|return\s*\(\s*</,
  );
});
