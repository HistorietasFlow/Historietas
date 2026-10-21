import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const overlays = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-overlays.tsx",
    import.meta.url,
  ),
  "utf8",
);
const modalSenha = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-security-password-modal.tsx",
    import.meta.url,
  ),
  "utf8",
);
const modalExclusao = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-deletion-modal.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("modais de segurança preservam diálogos, ações e tradução", () => {
  assert.match(modalSenha, /export function ConfiguracoesSecurityPasswordModal\(/);
  assert.match(modalSenha, /aria-labelledby="titulo-seguranca-configuracoes"/);
  assert.match(modalSenha, /onMouseDown=\{\(event\) => \{/);
  assert.match(modalSenha, /event\.target === event\.currentTarget/);
  assert.match(modalSenha, /onSubmit=\{onSubmit\}/);
  assert.match(modalSenha, /senhaAlterada \?/);
  assert.match(modalSenha, /Senha alterada com sucesso/);
  assert.match(modalSenha, /autoComplete="current-password"/);
  assert.equal((modalSenha.match(/autoComplete="new-password"/g) || []).length, 2);
  assert.match(modalSenha, /minLength=\{8\}/);
  assert.match(modalSenha, /erroSenha \?/);
  assert.match(modalSenha, /salvandoSenha \?/);
  assert.match(modalSenha, /<LoadingSpinner/);
  assert.match(modalSenha, /<SvgIcon name="lock" size=\{24\} strokeWidth=\{2\.2\} \/>/);
  assert.match(modalSenha, /<SvgIcon name="check" size=\{25\} strokeWidth=\{2\.4\} \/>/);
  assert.match(modalSenha, /from "\.\.\/lib\/configuracoes-security-styles";/);
  assert.doesNotMatch(modalSenha, /supabase|localStorage|useState|useEffect/);

  assert.match(modalExclusao, /export function ConfiguracoesAccountDeletionModal\(/);
  assert.match(modalExclusao, /import Link from "next\/link";/);
  assert.match(modalExclusao, /aria-labelledby="titulo-exclusao-conta"/);
  assert.match(modalExclusao, /event\.target === event\.currentTarget/);
  assert.match(modalExclusao, /href="\/excluir-conta"/);
  assert.match(modalExclusao, /Digite EXCLUIR para confirmar/);
  assert.match(modalExclusao, /autoComplete="current-password"/);
  assert.match(modalExclusao, /autoComplete="off"/);
  assert.match(modalExclusao, /spellCheck=\{false\}/);
  assert.match(modalExclusao, /erroExclusaoConta \?/);
  assert.match(modalExclusao, /excluindoConta \?/);
  assert.match(modalExclusao, /<LoadingSpinner/);
  assert.match(modalExclusao, /<SvgIcon name="trash" size=\{24\} strokeWidth=\{2\.2\} \/>/);
  assert.match(modalExclusao, /from "\.\.\/lib\/configuracoes-security-styles";/);
  assert.doesNotMatch(modalExclusao, /supabase|localStorage|useState|useEffect/);
});

test("Configurações orquestra os modais sem manter os JSXs duplicados", () => {
  assert.match(
    pagina,
    /import \{ ConfiguracoesPageOverlays \} from "\.\/components\/configuracoes-page-overlays";/,
  );
  assert.match(pagina, /<ConfiguracoesPageOverlays/);
  assert.match(pagina, /onAlterarSenha=\{alterarSenha\}/);
  assert.match(pagina, /onExcluirConta=\{excluirConta\}/);
  assert.match(
    overlays,
    /import \{ ConfiguracoesSecurityPasswordModal \} from "\.\/configuracoes-security-password-modal";/,
  );
  assert.match(
    overlays,
    /import \{ ConfiguracoesAccountDeletionModal \} from "\.\/configuracoes-account-deletion-modal";/,
  );
  assert.match(overlays, /mostrarSeguranca \?/);
  assert.match(overlays, /<ConfiguracoesSecurityPasswordModal/);
  assert.match(overlays, /onSubmit=\{onAlterarSenha\}/);
  assert.match(overlays, /mostrarExclusaoConta \?/);
  assert.match(overlays, /<ConfiguracoesAccountDeletionModal/);
  assert.match(overlays, /onSubmit=\{onExcluirConta\}/);
  assert.doesNotMatch(pagina, /aria-labelledby="titulo-seguranca-configuracoes"/);
  assert.doesNotMatch(pagina, /aria-labelledby="titulo-exclusao-conta"/);
  assert.doesNotMatch(pagina, /href="\/excluir-conta"/);
});
