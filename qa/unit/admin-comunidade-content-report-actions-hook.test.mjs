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

test("orquestrador mantém autorização, trava compartilhada e aplicação de recibos", () => {
  assert.match(hookSource, /iniciarAcaoModeracao\(controleModeracao, usuarioId, ehAdmin\)/);
  assert.match(hookSource, /validarAcaoModeracao\(controleModeracao, acao\)/);
  assert.match(hookSource, /mesmaDenunciaModeracao/);
  assert.match(hookSource, /finalizarAcaoModeracao\(controleModeracao, acao\)/);
  assert.match(hookSource, /contextoVigente\(\) \? aplicar\(lista\) : lista/);
  assert.match(hookSource, /window\.confirm\(textoConfirmacaoRemocaoAdminComunidade/);
  assert.doesNotMatch(hookSource, /status: "resolvida"|analisadoPor: usuarioId/);
});

test("hook mantém somente ações de conteúdo e delega a persistência", () => {
  for (const name of ["atualizarStatusDenuncia", "removerConteudoDenunciado", "arquivarDenuncia", "restaurarDenunciaArquivada", "removerDenunciaResolvida"]) assert.match(hookSource, new RegExp(`async function ${name}`));
  assert.doesNotMatch(hookSource, /useState|useEffect|useMemo|useRouter|localStorage|supabase\.from|return\s*\(\s*</);
});
