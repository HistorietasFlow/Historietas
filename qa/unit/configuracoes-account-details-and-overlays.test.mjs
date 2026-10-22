import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const content = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-details-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const overlays = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-overlays.tsx",
    import.meta.url,
  ),
  "utf8",
);
const acoesCamposOverlay = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-overlay-field-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const acoesConteudo = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-content-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const acoesPagina = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-page-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("seção da conta preserva inputs, filtro, loading e segurança", () => {
  assert.match(secaoConta, /export function ConfiguracoesAccountDetailsSection\(/);
  assert.match(secaoConta, /PreferenciasConta/);
  assert.match(
    secaoConta,
    /import type \{ TraduzirTextoConfiguracoes \} from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(secaoConta, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.doesNotMatch(secaoConta, /type TraduzirTexto =/);
  assert.match(secaoConta, /normalizarUsernameConfiguracoes/);
  assert.match(secaoConta, /"Sua conta", "Your account", "Tu cuenta"/);
  assert.match(secaoConta, /nomeExibicao/);
  assert.match(secaoConta, /emailContato/);
  assert.match(secaoConta, /@username/);
  assert.match(secaoConta, /onLimparErroUsername\(\);/);
  assert.match(secaoConta, /helperText=\{erroUsername \|\| undefined\}/);
  assert.match(secaoConta, /error=\{Boolean\(erroUsername\)\}/);
  assert.match(secaoConta, /<LoadingSpinner/);
  assert.match(secaoConta, /hideChevron=\{salvando\}/);
  assert.match(secaoConta, /onClick=\{onSalvar\}/);
  assert.match(secaoConta, /onClick=\{onAbrirSeguranca\}/);
  assert.doesNotMatch(
    secaoConta,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
  );
});

test("overlays preservam as condições, handlers e componentes existentes", () => {
  assert.match(overlays, /export function ConfiguracoesPageOverlays\(/);
  assert.match(
    overlays,
    /from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(overlays, /MensagemAcaoConfiguracoesVisual \| null/);
  assert.match(overlays, /TraduzirTextoConfiguracoes/);
  assert.doesNotMatch(overlays, /type MensagemAcao =/);
  assert.doesNotMatch(overlays, /type TraduzirTexto =/);
  assert.match(
    overlays,
    /from "\.\/configuracoes-security-password-modal";/,
  );
  assert.match(
    overlays,
    /from "\.\/configuracoes-account-deletion-modal";/,
  );
  assert.match(overlays, /from "\.\/configuracoes-action-toast";/);
  assert.match(overlays, /mostrarSeguranca \?/);
  assert.match(overlays, /<ConfiguracoesSecurityPasswordModal/);
  assert.match(overlays, /onSubmit=\{onAlterarSenha\}/);
  assert.match(overlays, /mostrarExclusaoConta \?/);
  assert.match(overlays, /<ConfiguracoesAccountDeletionModal/);
  assert.match(overlays, /onSubmit=\{onExcluirConta\}/);
  assert.match(overlays, /mensagemAcao \?/);
  assert.match(overlays, /<ConfiguracoesActionToast/);
  assert.match(overlays, /onFechar=\{onFecharMensagemAcao\}/);
  assert.doesNotMatch(
    overlays,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
  );
});

test("página preserva a orquestração e delega apenas a apresentação", () => {
  assert.match(pagina, /<ConfiguracoesPageContent/);
  assert.match(
    content,
    /import \{ ConfiguracoesAccountDetailsSection \} from "\.\/configuracoes-account-details-section";/,
  );
  assert.match(
    pagina,
    /import \{ ConfiguracoesPageOverlays \} from "\.\/components\/configuracoes-page-overlays";/,
  );
  assert.match(content, /<ConfiguracoesAccountDetailsSection/);
  assert.match(
    content,
    /import type \{ TraduzirTextoConfiguracoes \} from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(content, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.doesNotMatch(content, /type TraduzirTexto =/);
  assert.match(content, /onAtualizarPreferencia=\{onAtualizarPreferencia\}/);
  assert.match(
    acoesPagina,
    /import \{ criarAcoesConteudoConfiguracoes \} from "\.\/configuracoes-content-actions";/,
  );
  assert.match(pagina, /criarAcoesPaginaConfiguracoes\(\{/);
  assert.match(acoesPagina, /criarAcoesConteudoConfiguracoes\(\{/);
  assert.match(pagina, /onLimparErroUsername=\{onLimparErroUsername\}/);
  assert.match(pagina, /onSalvar=\{salvar\}/);
  assert.match(pagina, /onAbrirSeguranca=\{abrirSeguranca\}/);
  assert.match(pagina, /<ConfiguracoesPageOverlays/);
  assert.match(pagina, /onAlterarSenha=\{alterarSenha\}/);
  assert.match(pagina, /onExcluirConta=\{excluirConta\}/);
  assert.match(
    acoesPagina,
    /import \{ criarAcoesCamposOverlayConfiguracoes \} from "\.\/configuracoes-overlay-field-actions";/,
  );
  assert.match(acoesPagina, /criarAcoesCamposOverlayConfiguracoes\(\{/);
  assert.ok(
    acoesPagina.indexOf("criarAcoesCamposOverlayConfiguracoes({") <
      acoesPagina.indexOf("criarAcoesConteudoConfiguracoes({"),
  );
  assert.match(acoesPagina, /\.\.\.acoesCamposOverlay,/);
  assert.match(acoesPagina, /\.\.\.acoesConteudo,/);
  assert.match(pagina, /onFecharMensagemAcao=\{onFecharMensagemAcao\}/);
  assert.match(pagina, /useConfiguracoesAccountActionHandlers\(\{/);
  assert.doesNotMatch(pagina, /<SettingsInput/);
  assert.doesNotMatch(pagina, /<ConfiguracoesSecurityPasswordModal/);
  assert.doesNotMatch(pagina, /<ConfiguracoesAccountDeletionModal/);
  assert.doesNotMatch(pagina, /<ConfiguracoesActionToast/);
});

test("aÃ§Ãµes de conteÃºdo preservam a navegaÃ§Ã£o e a limpeza do username", () => {
  assert.match(
    acoesConteudo,
    /export function criarAcoesConteudoConfiguracoes\(/,
  );
  assert.match(acoesConteudo, /onVoltar\(\) \{\s+router\.back\(\);/);
  assert.match(
    acoesConteudo,
    /onLimparErroUsername\(\) \{\s+setErroUsername\(""\);/,
  );
  assert.doesNotMatch(
    acoesConteudo,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
});

test("ações dos campos dos overlays preservam as limpezas de feedback", () => {
  assert.match(
    acoesCamposOverlay,
    /export function criarAcoesCamposOverlayConfiguracoes\(/,
  );
  assert.match(acoesCamposOverlay, /onSenhaAtualChange\(valor: string\)/);
  assert.match(acoesCamposOverlay, /onNovaSenhaChange\(valor: string\)/);
  assert.match(
    acoesCamposOverlay,
    /onConfirmarNovaSenhaChange\(valor: string\)/,
  );
  assert.match(
    acoesCamposOverlay,
    /onSenhaExclusaoContaChange\(valor: string\)/,
  );
  assert.match(
    acoesCamposOverlay,
    /onConfirmacaoExclusaoContaChange\(valor: string\)/,
  );
  assert.equal((acoesCamposOverlay.match(/setErroSenha\(""\);/g) || []).length, 3);
  assert.equal(
    (acoesCamposOverlay.match(/setErroExclusaoConta\(""\);/g) || []).length,
    2,
  );
  assert.match(
    acoesCamposOverlay,
    /onFecharMensagemAcao\(\) \{\s+setMensagemAcao\(null\);/,
  );
  assert.doesNotMatch(
    acoesCamposOverlay,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
  assert.doesNotMatch(
    acoesPagina,
    /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch|JSX/,
  );
});
