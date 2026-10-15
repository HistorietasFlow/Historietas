import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/hooks/use-home-auth-session.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("useHomeAuthSession preserva estados, lifecycle e subscription da Home", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useEffect, useState \} from "react";/);
  assert.match(hook, /import \{ useRouter \} from "next\/navigation";/);
  assert.match(hook, /import \{ supabase \} from "\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(hook, /import \{ criarLoginHrefHome \} from "\.\.\/lib\/home-route-utils";/);
  assert.match(hook, /const \[usuarioLogado, setUsuarioLogado\] = useState\(false\);/);
  assert.match(hook, /const \[usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\);/);
  assert.match(hook, /const \[avisoLogin, setAvisoLogin\] = useState\(""\);/);
  assert.match(hook, /let cancelado = false;/);
  assert.match(hook, /async function carregarUsuarioHome\(\)/);
  assert.match(hook, /const \{ data \} = await supabase\.auth\.getUser\(\);/);
  assert.match(hook, /const logado = Boolean\(data\.user\);/);
  assert.match(hook, /if \(!cancelado\) \{[\s\S]*?setUsuarioLogado\(logado\);[\s\S]*?setUsuarioIdLogado\(data\.user\?\.id \|\| ""\);[\s\S]*?if \(logado\) \{\s*setAvisoLogin\(""\);/);
  assert.match(hook, /catch \{\s*if \(!cancelado\) \{\s*setUsuarioLogado\(false\);\s*setUsuarioIdLogado\(""\);/);
  assert.match(hook, /void carregarUsuarioHome\(\);/);
  assert.match(hook, /supabase\.auth\.onAuthStateChange\(\(_evento, session\) => \{[\s\S]*?setUsuarioLogado\(logado\);[\s\S]*?setUsuarioIdLogado\(session\?\.user\.id \|\| ""\);[\s\S]*?if \(logado\) \{\s*setAvisoLogin\(""\);/);
  assert.match(hook, /return \(\) => \{\s*cancelado = true;\s*subscription\.unsubscribe\(\);\s*\};\s*\}, \[\]\);/);
});

test("useHomeAuthSession preserva a exigência de login e seus fallbacks", () => {
  assert.match(hook, /async function exigirLoginHome\(mensagem: string\)/);
  assert.match(hook, /setUsuarioLogado\(logado\);\s*setUsuarioIdLogado\(data\.user\?\.id \|\| ""\);/);
  assert.match(hook, /if \(logado\) \{\s*setAvisoLogin\(""\);\s*return true;/);
  assert.match(hook, /catch \{\s*setUsuarioLogado\(false\);\s*setUsuarioIdLogado\(""\);\s*\}/);
  assert.match(hook, /setAvisoLogin\(mensagem\);\s*router\.push\(criarLoginHrefHome\(\)\);\s*return false;/);
  assert.match(hook, /return \{[\s\S]*?usuarioLogado,[\s\S]*?usuarioIdLogado,[\s\S]*?avisoLogin,[\s\S]*?setAvisoLogin,[\s\S]*?exigirLoginHome,[\s\S]*?\};/);
});

test("Home delega somente o lifecycle de autenticação e mantém consumidores remanescentes", () => {
  assert.match(pagina, /import useHomeAuthSession from "\.\/hooks\/use-home-auth-session";/);
  assert.match(pagina, /const \{[\s\S]*?usuarioLogado,[\s\S]*?usuarioIdLogado,[\s\S]*?avisoLogin,[\s\S]*?setAvisoLogin,[\s\S]*?exigirLoginHome,[\s\S]*?\} = useHomeAuthSession\(\);/);
  assert.doesNotMatch(pagina, /useRouter\(/);
  assert.doesNotMatch(pagina, /const \[usuarioLogado, setUsuarioLogado\]/);
  assert.doesNotMatch(pagina, /const \[usuarioIdLogado, setUsuarioIdLogado\]/);
  assert.doesNotMatch(pagina, /const \[avisoLogin, setAvisoLogin\]/);
  assert.doesNotMatch(pagina, /onAuthStateChange/);
  assert.doesNotMatch(pagina, /async function exigirLoginHome/);
  assert.doesNotMatch(pagina, /criarLoginHrefHome/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /await exigirLoginHome\(/);
});
