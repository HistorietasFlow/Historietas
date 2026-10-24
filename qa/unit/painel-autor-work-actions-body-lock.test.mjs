import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-work-actions-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const workCardSource = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-work-card.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("usePainelAutorWorkActionsBodyLock preserva o lifecycle do action sheet", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /export function usePainelAutorWorkActionsBodyLock\(acoesAbertas: boolean\)/,
  );
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(
    hook,
    /if \(!acoesAbertas \|\| typeof document === "undefined"\) \{\s*return;\s*\}/,
  );
  assert.match(
    hook,
    /const overflowAnterior = document\.body\.style\.getPropertyValue\("overflow"\);/,
  );
  assert.match(
    hook,
    /const overscrollAnterior = document\.documentElement\.style\.getPropertyValue\(\s*"overscroll-behavior",?\s*\);/,
  );
  assert.match(hook, /document\.body\.style\.setProperty\("overflow", "hidden"\);/);
  assert.match(
    hook,
    /document\.documentElement\.style\.setProperty\("overscroll-behavior", "none"\);/,
  );
  assert.match(
    hook,
    /if \(overflowAnterior\) \{\s*document\.body\.style\.setProperty\("overflow", overflowAnterior\);\s*\} else \{\s*document\.body\.style\.removeProperty\("overflow"\);\s*\}/,
  );
  assert.match(
    hook,
    /if \(overscrollAnterior\) \{\s*document\.documentElement\.style\.setProperty\(\s*"overscroll-behavior",\s*overscrollAnterior,?\s*\);\s*\} else \{\s*document\.documentElement\.style\.removeProperty\("overscroll-behavior"\);\s*\}/,
  );
  assert.match(hook, /\}, \[acoesAbertas\]\);/);
  assert.doesNotMatch(hook, /return \{|useState/);
});

test("Painel do Autor delega somente o body lock do action sheet", () => {
  assert.match(
    workCardSource,
    /import \{ usePainelAutorWorkActionsBodyLock \} from "\.\.\/hooks\/use-painel-autor-work-actions-body-lock";/,
  );
  assert.match(
    pagina,
    /import \{ ObraPainelCard \} from "\.\/components\/painel-autor-work-card";/,
  );
  assert.doesNotMatch(pagina, /function ObraPainelCard\(/);
  assert.match(workCardSource, /usePainelAutorWorkActionsBodyLock\(acoesAbertas\);/);
  assert.doesNotMatch(
    workCardSource,
    /useEffect\(\(\) => \{[\s\S]*?!acoesAbertas \|\| typeof document === "undefined"/,
  );
  assert.match(
    workCardSource,
    /const \[acoesAbertas, setAcoesAbertas\] = useState\(false\);/,
  );
  assert.match(workCardSource, /aria-expanded=\{acoesAbertas\}/);
  assert.match(workCardSource, /\{acoesAbertas && \(/);
  assert.match(workCardSource, /setAcoesAbertas\(false\)/);
  assert.match(workCardSource, /stopPropagation\(\)/);
  assert.match(workCardSource, /const obraHref =/);
  assert.match(pagina, /async function carregarDadosPainelAutor\(\)/);
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
});
