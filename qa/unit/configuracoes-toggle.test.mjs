import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-toggle.tsx",
    import.meta.url,
  ),
  "utf8",
);
const callbackTypes = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-callback-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const callbackPrimitives = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-callback-primitives.ts",
    import.meta.url,
  ),
  "utf8",
);
const toggleTypes = readFileSync(
  new URL(
    "../../app/configuracoes/lib/configuracoes-toggle-types.ts",
    import.meta.url,
  ),
  "utf8",
);
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
const secoesPreferencias = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-preferences-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoPrivacidadePerfil = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-privacy-section.tsx",
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

test("ConfiguracoesToggle preserva a primitive visual e os estilos literais", () => {
  assert.match(componente, /import type \{ CSSProperties \} from "react";/);
  assert.match(componente, /AlternarConfiguracao/);
  assert.match(componente, /export function Toggle\(/);
  assert.match(componente, /checked: boolean;/);
  assert.match(componente, /onChange: AlternarConfiguracao;/);
  assert.match(componente, /ariaLabel: string;/);
  assert.match(componente, /type="button"/);
  assert.match(componente, /onClick=\{onChange\}/);
  assert.match(componente, /aria-label=\{ariaLabel\}/);
  assert.match(componente, /aria-pressed=\{checked\}/);
  assert.match(
    componente,
    /style=\{checked \? toggleOnStyle : toggleOffStyle\}/,
  );
  assert.match(
    componente,
    /<span style=\{checked \? toggleKnobOnStyle : toggleKnobOffStyle\} \/>/,
  );

  for (const estilo of [
    "toggleBaseStyle",
    "toggleOnStyle",
    "toggleOffStyle",
    "toggleKnobBaseStyle",
    "toggleKnobOnStyle",
    "toggleKnobOffStyle",
  ]) {
    assert.match(componente, new RegExp(`const ${estilo}: CSSProperties =`));
  }

  assert.match(componente, /width: "52px"/);
  assert.match(componente, /height: "31px"/);
  assert.match(componente, /borderRadius: "999px"/);
  assert.match(componente, /padding: "3px"/);
  assert.match(componente, /transition: "background 160ms ease"/);
  assert.match(componente, /\.\.\.toggleBaseStyle,/);
  assert.match(componente, /justifyContent: "flex-end"/);
  assert.match(
    componente,
    /background: "var\(--historietas-accent, #F97316\)"/,
  );
  assert.match(componente, /justifyContent: "flex-start"/);
  assert.match(
    componente,
    /background: "var\(--configuracoes-control-bg, rgba\(255,255,255,0\.18\)\)"/,
  );
  assert.match(componente, /width: "25px"/);
  assert.match(componente, /height: "25px"/);
  assert.match(
    componente,
    /background: "var\(--configuracoes-toggle-knob-bg, #FFFFFF\)"/,
  );
  assert.match(componente, /boxShadow: "0 4px 10px rgba\(0,0,0,0\.28\)"/);
  assert.equal((componente.match(/\.\.\.toggleKnobBaseStyle,/g) || []).length, 2);
});

test("Toggle reutiliza o contrato compartilhado de alternância", () => {
  assert.match(
    callbackPrimitives,
    /export type ExecutarAcaoConfiguracoes = \(\) => void;/,
  );
  assert.match(
    toggleTypes,
    /export type AlternarConfiguracao = ExecutarAcaoConfiguracoes;/,
  );
  for (const contrato of [
    "AlternarPerfilPrivadoConfiguracoes",
    "AlternarAprovacaoNovosSeguidoresConfiguracoes",
    "AlternarReceberAvisosConfiguracoes",
    "AlternarUsuariosBloqueadosConfiguracoes",
  ]) {
    assert.match(
      toggleTypes,
      new RegExp("export type " + contrato + " =\\s+AlternarConfiguracao;"),
    );
  }
});

test("Configuracoes mantem os consumidores e a fronteira do Toggle", () => {
  assert.match(
    secaoPrivacidadePerfil,
    /import \{ Toggle \} from "\.\/configuracoes-toggle";/,
  );
  assert.doesNotMatch(pagina, /function Toggle\(/);

  for (const estilo of [
    "toggleBaseStyle",
    "toggleOnStyle",
    "toggleOffStyle",
    "toggleKnobBaseStyle",
    "toggleKnobOnStyle",
    "toggleKnobOffStyle",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`const ${estilo}: CSSProperties =`));
  }

  assert.equal((pagina.match(/<Toggle/g) || []).length, 0);
  assert.equal((secaoPrivacidadePerfil.match(/<Toggle/g) || []).length, 2);
  assert.match(
    secaoPrivacidadePerfil,
    /checked=\{privacidade\.perfilPrivado\}[\s\S]*?onChange=\{onAlternarPerfilPrivado\}/,
  );
  assert.match(
    secaoPrivacidadePerfil,
    /checked=\{privacidade\.aprovarNovosSeguidores\}[\s\S]*?onChange=\{onAlternarAprovacaoNovosSeguidores\}/,
  );
  assert.match(
    secoesPreferencias,
    /checked=\{preferencias\.receberAvisos\}[\s\S]*?onChange=\{onAlternarReceberAvisos\}/,
  );
  assert.match(
    content,
    /<ConfiguracoesPreferencesSection[\s\S]*?onAlternarReceberAvisos=\{onAlternarReceberAvisos\}/,
  );
  assert.match(
    content,
    /<ConfiguracoesProfilePrivacySection[\s\S]*?onAlternarPerfilPrivado=\{onAlternarPerfilPrivado\}/,
  );
  assert.equal(
    (secaoPrivacidadePerfil.match(/ariaLabel=\{t\(/g) || []).length,
    2,
  );
  assert.equal(
    (secoesPreferencias.match(/ariaLabel=\{t\(/g) || []).length,
    1,
  );

  assert.match(
    secaoConta,
    /from "\.\/configuracoes-settings-primitives";/,
  );
  assert.doesNotMatch(
    pagina,
    /from "\.\/components\/configuracoes-settings-primitives";/,
  );
  assert.doesNotMatch(pagina, /function SettingsRow\(/);
  assert.doesNotMatch(pagina, /function SettingsInput\(/);
  assert.doesNotMatch(
    pagina,
    /import \{ SvgIcon \} from "\.\/components\/configuracoes-svg-icon";/,
  );
});
