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

test("ações de perfil compartilham trava e revalidação com conteúdo", () => {
  assert.match(hook, /iniciarAcaoModeracao\(controleModeracao, usuarioId, ehAdmin\)/);
  assert.match(hook, /validarAcaoModeracao\(controleModeracao, acao\)/);
  assert.match(hook, /finalizarAcaoModeracao\(controleModeracao, acao\)/);
  assert.match(hook, /esperada\.status !== "resolvida"/);
  assert.match(hook, /\.\.\.confirmado/);
  assert.match(hook, /contextoVigente\(\) \? aplicar\(lista\) : lista/);
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
