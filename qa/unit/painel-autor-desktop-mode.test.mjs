import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hook = await readFile(
  "app/painel-autor/hooks/use-painel-autor-desktop-mode.ts",
  "utf8",
);
const hookSessao = await readFile(
  "app/painel-autor/hooks/use-painel-autor-auth-session.ts",
  "utf8",
);
const pagina = await readFile("app/painel-autor/page.tsx", "utf8");
const secao = await readFile(
  "app/painel-autor/components/painel-autor-section.tsx",
  "utf8",
);
const workCard = await readFile(
  "app/painel-autor/components/painel-autor-work-card.tsx",
  "utf8",
);

test("usePainelAutorDesktopMode preserva o lifecycle responsivo síncrono", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePainelAutorDesktopMode\(\)/);
  assert.match(hook, /useState\(false\)/);
  assert.match(hook, /function atualizarLayoutDesktop\(\)/);
  assert.match(hook, /setIsDesktop\(window\.innerWidth >= 1024\)/);
  assert.match(hook, /atualizarLayoutDesktop\(\);/);
  assert.doesNotMatch(hook, /setTimeout/);
  assert.match(
    hook,
    /window\.addEventListener\("resize", atualizarLayoutDesktop\)/,
  );
  assert.match(
    hook,
    /window\.removeEventListener\("resize", atualizarLayoutDesktop\)/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Painel do Autor delega somente o modo desktop", () => {
  assert.match(
    pagina,
    /import \{ usePainelAutorDesktopMode \} from "\.\/hooks\/use-painel-autor-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = usePainelAutorDesktopMode\(\);/);
  assert.doesNotMatch(pagina, /const \[isDesktop, setIsDesktop\] = useState\(false\)/);
  assert.doesNotMatch(pagina, /setIsDesktop\(/);
  assert.doesNotMatch(pagina, /window\.innerWidth >= 1024/);
  assert.doesNotMatch(pagina, /addEventListener\("resize", atualizarLayoutDesktop\)/);
  assert.match(
    pagina,
    /<PainelSecao<ObraComMetricas>[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(secao, /isDesktop,/);
  assert.match(
    secao,
    /style=\{isDesktop \? desktopSectionStyle : sectionStyle\}/,
  );
  assert.match(
    secao,
    /style=\{isDesktop \? desktopWorksGridStyle : worksGridStyle\}/,
  );
  assert.match(secao, /<Card[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(
    pagina,
    /import \{ ObraPainelCard \} from "\.\/components\/painel-autor-work-card";/,
  );
  assert.doesNotMatch(pagina, /function ObraPainelCard\(/);
  assert.match(pagina, /Card=\{ObraPainelCard\}/);
  assert.match(workCard, /isDesktop,/);
  assert.match(workCard, /style=\{isDesktop \? desktopWorkCardStyle : workCardStyle\}/);
  assert.match(workCard, /style=\{isDesktop \? desktopWorkContentStyle : workContentStyle\}/);
  assert.match(
    pagina,
    /import \{ PainelAutorLanguageBridge \} from "\.\/components\/painel-autor-language-bridge";/,
  );
});

test("usePainelAutorAuthSession preserva o lifecycle autenticado", () => {
  assert.match(hookSessao, /^"use client";/);
  assert.match(hookSessao, /export function usePainelAutorAuthSession\(\)/);
  assert.match(hookSessao, /const \[usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\);/);
  assert.match(hookSessao, /const \[verificandoUsuario, setVerificandoUsuario\] = useState\(true\);/);
  assert.match(hookSessao, /let componenteAtivo = true;/);
  assert.match(hookSessao, /async function carregarUsuarioAtual\(\)/);
  assert.match(hookSessao, /const \{ data \} = await supabase\.auth\.getUser\(\);/);
  assert.match(hookSessao, /const usuario = data\.user;/);
  assert.match(hookSessao, /if \(!componenteAtivo\) \{[\s\S]*?return;/);
  assert.match(hookSessao, /setUsuarioIdLogado\(usuario\?\.id \|\| ""\);[\s\S]*?setVerificandoUsuario\(false\);/);
  assert.match(hookSessao, /catch \{[\s\S]*?if \(componenteAtivo\) \{[\s\S]*?setUsuarioIdLogado\(""\);[\s\S]*?setVerificandoUsuario\(false\);/);
  assert.match(hookSessao, /void carregarUsuarioAtual\(\);/);
  assert.match(hookSessao, /supabase\.auth\.onAuthStateChange\(/);
  assert.match(hookSessao, /setUsuarioIdLogado\(sessao\?\.user\?\.id \|\| ""\);[\s\S]*?setVerificandoUsuario\(false\);/);
  assert.match(hookSessao, /componenteAtivo = false;[\s\S]*?listener\.subscription\.unsubscribe\(\);/);
  assert.match(hookSessao, /\}, \[\]\);/);
  assert.match(hookSessao, /return \{ usuarioIdLogado, verificandoUsuario \};/);
  assert.doesNotMatch(hookSessao, /useRouter|router\.replace|localStorage/);
});

test("Painel do Autor delega a sessao e mantem o redirect na pagina", () => {
  assert.match(
    pagina,
    /import \{ usePainelAutorAuthSession \} from "\.\/hooks\/use-painel-autor-auth-session";/,
  );
  assert.match(
    pagina,
    /const \{ usuarioIdLogado, verificandoUsuario \} =[\s\S]*?usePainelAutorAuthSession\(\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[verificandoUsuario, setVerificandoUsuario\] = useState\(true\);/,
  );
  assert.doesNotMatch(pagina, /async function carregarUsuarioAtual\(/);
  assert.doesNotMatch(pagina, /supabase\.auth\.onAuthStateChange\(/);
  assert.match(
    pagina,
    /if \(!verificandoUsuario && !usuarioIdLogado\) \{[\s\S]*?router\.replace\(criarLoginHrefPainelAutor\(\)\);/,
  );
});
