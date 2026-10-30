import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/ler-capitulo/hooks/use-ler-capitulo-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ler-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const estilosLayout = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-layout-styles.ts", import.meta.url),
  "utf8",
);
const sheet = readFileSync(
  new URL("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx", import.meta.url),
  "utf8",
);
const conteudo = readFileSync(
  new URL("../../app/ler-capitulo/components/ler-capitulo-reader-content.tsx", import.meta.url),
  "utf8",
);
const acoes = readFileSync(
  new URL("../../app/ler-capitulo/lib/ler-capitulo-comment-actions.ts", import.meta.url),
  "utf8",
);
const inicializacao = readFileSync(
  new URL("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts", import.meta.url),
  "utf8",
);
const acesso18 = readFileSync(
  new URL(
    "../../app/ler-capitulo/hooks/use-ler-capitulo-content-18-access.ts",
    import.meta.url,
  ),
  "utf8",
);

test("useLerCapituloDesktopMode preserva o lifecycle responsivo do leitor", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useLerCapituloDesktopMode\(\)/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(
    hook,
    /const mediaQuery = window\.matchMedia\("\(min-width: 1024px\)"\);/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktopTimer = window\.setTimeout\(\s*atualizarModoDesktop,\s*0\s*\);/,
  );
  assert.doesNotMatch(hook, /atualizarModoDesktop\(\);/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);[\s\S]*?window\.clearTimeout\(atualizarModoDesktopTimer\);[\s\S]*?mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /mediaQuery\.addListener\(atualizarModoDesktop\);[\s\S]*?window\.clearTimeout\(atualizarModoDesktopTimer\);[\s\S]*?mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Leitor delega apenas o modo desktop e preserva consumidores responsivos", () => {
  assert.match(
    pagina,
    /import \{ useLerCapituloDesktopMode \} from "\.\/hooks\/use-ler-capitulo-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useLerCapituloDesktopMode\(\);/);
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 6);
  assert.equal((conteudo.match(/\bisDesktop\b/g) || []).length, 16);
  assert.equal((sheet.match(/\bisDesktop\b/g) || []).length, 7);
  assert.equal((estilosLayout.match(/\bisDesktop\b/g) || []).length, 7);
  assert.match(
    pagina,
    /<ComentariosCapituloSheet[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(pagina, /<LerCapituloReaderContent[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(conteudo, /<section style=\{isDesktop \? desktopContainerStyle : containerStyle\}>/);
  assert.match(
    pagina,
    /<section style=\{isDesktop \? desktopContainerStyle : containerStyle\}>/,
  );
  assert.match(pagina, /await supabase\.auth\.getUser\(\)/);
  assert.match(
    pagina,
    /import \{ useLerCapituloContent18Access \} from "\.\/hooks\/use-ler-capitulo-content-18-access";/,
  );
  assert.match(acesso18, /acessoConteudo18Confirmado\(\)/);
  assert.match(pagina, /useLerCapituloInitialLoad\(\{/);
  assert.match(inicializacao, /async function carregarDados\(\)/);
  assert.match(pagina, /criarAcoesComentariosCapitulo\(\{/);
  assert.match(acoes, /async function enviarComentarioCapitulo\(/);
});
