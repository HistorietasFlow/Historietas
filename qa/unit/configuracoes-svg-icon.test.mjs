import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-svg-icon.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const primitives = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-settings-primitives.tsx",
    import.meta.url,
  ),
  "utf8",
);

const iconNames = [
  "user",
  "mail",
  "lock",
  "shield",
  "bell",
  "book",
  "bookmark",
  "clock",
  "star",
  "trophy",
  "palette",
  "moon",
  "download",
  "copy",
  "database",
  "help",
  "file",
  "logout",
  "trash",
  "admin",
  "chart",
  "pen",
  "comment",
  "settings",
  "search",
  "arrowLeft",
  "chevronRight",
  "check",
  "layers",
  "spark",
];

test("ConfiguracoesSvgIcon preserva o renderer SVG literal", () => {
  assert.match(componente, /export type IconName =/);
  assert.match(componente, /export function SvgIcon\(/);
  assert.match(componente, /size = 24/);
  assert.match(componente, /strokeWidth = 2/);
  assert.match(componente, /fill: "none"/);
  assert.match(componente, /stroke: "currentColor"/);
  assert.match(componente, /strokeLinecap: "round" as const/);
  assert.match(componente, /strokeLinejoin: "round" as const/);
  assert.match(componente, /const paths: Record<IconName, ReactNode> =/);

  for (const iconName of iconNames) {
    assert.match(componente, new RegExp(`\\| "${iconName}"`));
  }

  assert.match(componente, /viewBox="0 0 24 24"/);
  assert.match(componente, /aria-hidden="true"/);
  assert.match(componente, /focusable="false"/);
  assert.match(componente, /\{paths\[name\]\}/);
});

test("Configuracoes mantem os consumidores e a fronteira do icone", () => {
  assert.match(
    pagina,
    /import \{ SvgIcon \} from "\.\/components\/configuracoes-svg-icon";/,
  );
  assert.match(primitives, /import \{ SvgIcon \} from "\.\/configuracoes-svg-icon";/);
  assert.match(
    primitives,
    /import type \{ IconName \} from "\.\/configuracoes-svg-icon";/,
  );
  assert.match(pagina, /import type \{ CSSProperties, FormEvent \} from "react";/);
  assert.doesNotMatch(pagina, /type IconName =/);
  assert.doesNotMatch(pagina, /function SvgIcon\(/);
  assert.doesNotMatch(pagina, /const paths: Record<IconName, ReactNode> =/);
  assert.doesNotMatch(pagina, /function SettingsRow\(/);
  assert.doesNotMatch(pagina, /function SettingsInput\(/);
  assert.match(primitives, /icon: IconName;/);
  assert.equal((pagina.match(/<SvgIcon/g) || []).length, 6);
  assert.equal((primitives.match(/<SvgIcon/g) || []).length, 3);

  for (const consumidor of [
    '<SvgIcon name="arrowLeft" size={25} strokeWidth={2.4} />',
    '<SvgIcon name="search" size={23} strokeWidth={2.3} />',
    '<SvgIcon name="lock" size={24} strokeWidth={2.2} />',
    '<SvgIcon name="check" size={25} strokeWidth={2.4} />',
    '<SvgIcon name="trash" size={24} strokeWidth={2.2} />',
  ]) {
    assert.ok(pagina.includes(consumidor));
  }
  assert.ok(
    primitives.includes('<SvgIcon name={icon} size={23} strokeWidth={2.15} />'),
  );
  assert.ok(
    primitives.includes(
      '<SvgIcon name="chevronRight" size={22} strokeWidth={2.6} />',
    ),
  );

  assert.match(
    pagina,
    /name=\{\s*mensagemAcao\.tipo === "sucesso"\s*\? "check"/,
  );
});
