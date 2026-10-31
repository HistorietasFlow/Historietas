import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-profile-report-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("hook de denúncias de perfil preserva atualização de status", () => {
  assert.match(hook, /DenunciaPerfilComContexto/);
  assert.match(hook, /StatusDenunciaPerfil/);
  assert.match(hook, /async function atualizarStatusDenunciaPerfil\(/);
  assert.match(
    hook,
    /if \(!usuarioId \|\| !ehAdmin\) \{\s*setErro\("Apenas moderadores podem atualizar denúncias de perfis\."\);/,
  );
  assert.match(hook, /const chaveAcao = `perfil-\$\{denunciaId\}-\$\{novoStatus\}`;/);
  assert.match(hook, /if \(acaoEmAndamento\) \{\s*return;/);

  const inicio = hook.indexOf("setAcaoEmAndamento(chaveAcao)");
  const limparErro = hook.indexOf('setErro("")', inicio);
  const limparSucesso = hook.indexOf('setSucesso("")', limparErro);
  const atualizadoEm = hook.indexOf("new Date().toISOString()", limparSucesso);
  const persistir = hook.indexOf(
    "await persistirStatusDenunciaPerfilModeracao({",
    atualizadoEm,
  );
  assert.ok(inicio >= 0 && inicio < limparErro && limparErro < limparSucesso);
  assert.ok(limparSucesso < atualizadoEm && atualizadoEm < persistir);
  assert.match(hook, /denunciasAtuais\.map\(/);
  assert.match(hook, /STATUS_PERFIL_LABEL\[\s*novoStatus\s*\]/);
  assert.match(hook, /Denúncia de perfil marcada como/);
  assert.match(
    hook,
    /criarMensagemErro\("Erro ao atualizar denúncia de perfil", error\)/,
  );
  assert.match(hook, /finally \{\s*setAcaoEmAndamento\(""\);/);
});

test("hook de denúncias de perfil preserva remoção apenas quando resolvida", () => {
  assert.match(hook, /async function removerDenunciaPerfilResolvida\(/);
  assert.match(
    hook,
    /Apenas moderadores podem remover denúncias de perfis resolvidas\./,
  );
  assert.match(hook, /denunciasPerfis\.find\(\(item\) => item\.id === denunciaId\)/);
  assert.match(hook, /denuncia\.status !== "resolvida"/);
  assert.match(
    hook,
    /Somente denúncias de perfis resolvidas podem ser removidas do painel\./,
  );
  assert.match(
    hook,
    /const chaveAcao = `perfil-\$\{denunciaId\}-remover-denuncia`;/,
  );

  const fecharMenu = hook.indexOf('setMenuDenunciaAbertoId("")');
  const iniciarAcao = hook.indexOf("setAcaoEmAndamento(chaveAcao)", fecharMenu);
  const limparErro = hook.indexOf('setErro("")', iniciarAcao);
  const limparSucesso = hook.indexOf('setSucesso("")', limparErro);
  const persistir = hook.indexOf(
    "await persistirRemocaoDenunciaPerfilResolvidaModeracao({",
    limparSucesso,
  );
  assert.ok(fecharMenu >= 0 && fecharMenu < iniciarAcao);
  assert.ok(iniciarAcao < limparErro && limparErro < limparSucesso);
  assert.ok(limparSucesso < persistir);
  assert.match(hook, /denunciasAtuais\.filter\(/);
  assert.match(hook, /Denúncia de perfil resolvida removida do painel\./);
  assert.match(
    hook,
    /criarMensagemErro\("Erro ao remover denúncia de perfil resolvida", error\)/,
  );
  assert.match(hook, /finally \{\s*setAcaoEmAndamento\(""\);/);
});

test("página delega ações de denúncias de perfil e preserva callbacks dos cards", () => {
  assert.match(
    page,
    /import \{ useAdminComunidadeProfileReportActions \} from "\.\/hooks\/use-admin-comunidade-profile-report-actions";/,
  );
  assert.match(page, /useAdminComunidadeProfileReportActions\(\{/);
  assert.doesNotMatch(page, /async function atualizarStatusDenunciaPerfil/);
  assert.doesNotMatch(page, /async function removerDenunciaPerfilResolvida/);
  assert.match(
    page,
    /onAtualizarStatus=\{\(denunciaId, status\) =>\s*void atualizarStatusDenunciaPerfil\(denunciaId, status\)\s*\}/,
  );
  assert.match(
    page,
    /onRemoverDenunciaResolvida=\{\(denunciaId\) =>\s*void removerDenunciaPerfilResolvida\(denunciaId\)\s*\}/,
  );
});

test("hook não incorpora estado, ciclo de vida, rotas, Supabase ou JSX", () => {
  assert.doesNotMatch(
    hook,
    /useState|useEffect|useMemo|router|localStorage|supabase|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
