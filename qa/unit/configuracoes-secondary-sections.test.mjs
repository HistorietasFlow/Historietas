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
const moderacao = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-moderation-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const preferencias = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-preferences-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const acoesConta = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-account-actions-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("seções secundárias preservam permissões, preferências e ações da conta", () => {
  assert.match(
    moderacao,
    /export function ConfiguracoesModerationSection\(/,
  );
  assert.match(
    moderacao,
    /import type \{ TraduzirTextoConfiguracoes \} from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(moderacao, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.doesNotMatch(moderacao, /type TraduzirTexto =/);
  assert.match(moderacao, /adminLiberado: boolean/);
  assert.match(moderacao, /!adminLiberado \|\| !deveMostrar\("moderação", "admin", "comunidade"\)/);
  assert.match(moderacao, /Área de moderação/);
  assert.match(moderacao, /href="\/admin\/comunidade"/);

  assert.match(
    preferencias,
    /export function ConfiguracoesPreferencesSection\(/,
  );
  assert.match(
    preferencias,
    /import type \{ TraduzirTextoConfiguracoes \} from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(preferencias, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.doesNotMatch(preferencias, /type TraduzirTexto =/);
  assert.match(preferencias, /preferencias: PreferenciasConta/);
  assert.match(preferencias, /onAlternarReceberAvisos: \(\) => void/);
  assert.match(preferencias, /import LanguageSelect from "\.\.\/\.\.\/\.\.\/components\/LanguageSelect"/);
  assert.match(preferencias, /width: "clamp\(120px, 34vw, 128px\)"/);
  assert.match(preferencias, /transform: "translateX\(22px\)"/);
  assert.match(preferencias, /checked=\{preferencias\.receberAvisos\}/);
  assert.match(preferencias, /onChange=\{onAlternarReceberAvisos\}/);
  assert.match(preferencias, /Ativar ou desativar avisos/);

  assert.match(
    acoesConta,
    /export function ConfiguracoesAccountActionsSection\(/,
  );
  assert.match(
    acoesConta,
    /import type \{ TraduzirTextoConfiguracoes \} from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(acoesConta, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.doesNotMatch(acoesConta, /type TraduzirTexto =/);
  assert.match(acoesConta, /onAbrirExclusaoConta: \(\) => void/);
  assert.match(acoesConta, /onSairDaConta: \(\) => void/);
  assert.match(acoesConta, /Zona de risco/);
  assert.match(acoesConta, /Excluir minha conta/);
  assert.match(acoesConta, /onClick=\{onAbrirExclusaoConta\}/);
  assert.match(acoesConta, /Sair da conta/);
  assert.match(acoesConta, /onClick=\{onSairDaConta\}/);
  assert.equal((acoesConta.match(/danger/g) || []).length, 2);
});

test("Configurações mantém estados e handlers, delegando somente as seções secundárias", () => {
  assert.match(pagina, /<ConfiguracoesPageContent/);
  assert.match(
    content,
    /import \{ ConfiguracoesModerationSection \} from "\.\/configuracoes-moderation-section";/,
  );
  assert.match(
    content,
    /import \{ ConfiguracoesPreferencesSection \} from "\.\/configuracoes-preferences-section";/,
  );
  assert.match(
    content,
    /import \{ ConfiguracoesAccountActionsSection \} from "\.\/configuracoes-account-actions-section";/,
  );
  assert.match(content, /<ConfiguracoesModerationSection/);
  assert.match(content, /adminLiberado=\{adminLiberado\}/);
  assert.match(content, /<ConfiguracoesPreferencesSection/);
  assert.match(content, /onAlternarReceberAvisos=\{onAlternarReceberAvisos\}/);
  assert.match(content, /<ConfiguracoesAccountActionsSection/);
  assert.match(content, /onAbrirExclusaoConta=\{onAbrirExclusaoConta\}/);
  assert.match(content, /onSairDaConta=\{onSairDaConta\}/);
  assert.doesNotMatch(content, /href="\/admin\/comunidade"/);
  assert.doesNotMatch(content, /title=\{t\("Idioma do site", "Site language", "Idioma del sitio"\)\}/);
  assert.doesNotMatch(content, /title=\{t\("Excluir minha conta",/);
});

test("componentes secundários não introduzem runtime de dados", () => {
  for (const source of [moderacao, preferencias, acoesConta]) {
    assert.doesNotMatch(
      source,
      /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
    );
  }
});
