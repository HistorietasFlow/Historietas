import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/em-alta/components/em-alta-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("EmAltaHeader preserva o cabeçalho responsivo e acessível de Em Alta", () => {
  assert.match(componente, /import Link from "next\/link";/);
  assert.match(
    componente,
    /export function EmAltaHeader\(\{[\s\S]*?isDesktop: boolean;[\s\S]*?titulo: string;/,
  );
  assert.match(
    componente,
    /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}>/,
  );
  assert.match(componente, /href="\/"/);
  assert.match(componente, /aria-label="Voltar para a Home"/);
  assert.match(
    componente,
    /isDesktop \? desktopHeaderTitleLinkStyle : headerTitleLinkStyle/,
  );
  assert.match(
    componente,
    /isDesktop \? desktopHeaderTitleMarkStyle : headerTitleMarkStyle/,
  );
  assert.match(
    componente,
    /isDesktop \? desktopHeaderTitleTextStyle : headerTitleTextStyle/,
  );
  assert.match(componente, /className="historietas-em-alta-logo-mark"/);
  assert.match(componente, />\s*H\s*<\/span>/);
  assert.match(componente, /className="historietas-em-alta-hero-title"/);
  assert.match(componente, /\{titulo\}/);
});

test("EmAlta delega somente o cabeçalho sem reter sua composição local", () => {
  assert.match(
    pagina,
    /import \{ EmAltaHeader \} from "\.\/components\/em-alta-header";/,
  );
  assert.match(
    pagina,
    /<EmAltaHeader isDesktop=\{isDesktop\} titulo=\{tituloCabecalho\} \/>/,
  );
  assert.doesNotMatch(pagina, /import Link from "next\/link";/);
  assert.doesNotMatch(pagina, /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}>/);
  assert.doesNotMatch(pagina, /aria-label="Voltar para a Home"/);
});

test("EmAltaHeader permanece uma fronteira visual sem runtime de dados", () => {
  for (const proibido of [
    /\buse[A-Z]\w*\b/,
    /supabase/i,
    /localStorage/,
    /\bwindow\b/,
    /\bdocument\b/,
  ]) {
    assert.doesNotMatch(componente, proibido);
  }
});
