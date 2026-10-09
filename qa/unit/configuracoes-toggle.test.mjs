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
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);

test("ConfiguracoesToggle preserva a primitive visual e os estilos literais", () => {
  assert.match(componente, /import type \{ CSSProperties \} from "react";/);
  assert.match(componente, /export function Toggle\(/);
  assert.match(componente, /checked: boolean;/);
  assert.match(componente, /onChange: \(\) => void;/);
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

test("Configuracoes mantem os tres consumidores e a fronteira do Toggle", () => {
  assert.match(
    pagina,
    /import \{ Toggle \} from "\.\/components\/configuracoes-toggle";/,
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

  assert.equal((pagina.match(/<Toggle/g) || []).length, 3);
  assert.match(
    pagina,
    /checked=\{privacidade\.perfilPrivado\}[\s\S]*?onChange=\{alternarPerfilPrivado\}/,
  );
  assert.match(
    pagina,
    /checked=\{privacidade\.aprovarNovosSeguidores\}[\s\S]*?onChange=\{alternarAprovacaoNovosSeguidores\}/,
  );
  assert.match(
    pagina,
    /checked=\{preferencias\.receberAvisos\}[\s\S]*?onChange=\{alternarReceberAvisos\}/,
  );
  assert.equal((pagina.match(/ariaLabel=\{t\(/g) || []).length >= 3, true);

  assert.match(pagina, /function SettingsRow\(/);
  assert.match(pagina, /function SettingsInput\(/);
  assert.match(
    pagina,
    /import \{ SvgIcon \} from "\.\/components\/configuracoes-svg-icon";/,
  );
});
