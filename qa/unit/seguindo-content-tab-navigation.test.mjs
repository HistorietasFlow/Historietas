import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-content-tab-navigation.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estados e URL ao trocar aba de conteúdo", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /setAbaSeguimento\([\s\S]*?novaAba === "seguidores" \? "seguidores" : "seguindo"/,
  );
  assert.match(hook, /setBusca\(""\);/);
  assert.match(
    hook,
    /setFiltro\(novaAba === "obras" \? "todos" : "usuarios"\);/,
  );
  assert.match(hook, /setOrdenacao\("padrao"\);/);
  assert.match(
    hook,
    /if \(typeof window === "undefined"\) \{[\s\S]*?return;/,
  );
  assert.match(
    hook,
    /const params = new URLSearchParams\(window\.location\.search\);/,
  );
  assert.match(hook, /params\.set\("conteudo", novaAba\);/);
  assert.match(
    hook,
    /novaAba === "seguidores"[\s\S]*?params\.set\("aba", "seguidores"\)/,
  );
  assert.match(
    hook,
    /novaAba === "pessoas"[\s\S]*?params\.set\("aba", "seguindo"\)/,
  );
  assert.match(hook, /params\.delete\("aba"\);/);
  assert.match(
    hook,
    /perfilIdParaUrl && visualizandoListaSocialDoPerfil[\s\S]*?params\.set\("userId", perfilIdParaUrl\);[\s\S]*?params\.set\("autorId", perfilIdParaUrl\);/,
  );
  assert.match(
    hook,
    /perfilSocialNome\.trim\(\)[\s\S]*?params\.set\("autor", perfilSocialNome\.trim\(\)\);/,
  );
  assert.match(
    hook,
    /window\.history\.replaceState\([\s\S]*?`\/seguindo\?\$\{params\.toString\(\)\}`/,
  );
});

test("página delega a troca de aba ao hook de navegação", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoContentTabNavigation \} from "\.\/hooks\/use-seguindo-content-tab-navigation";/,
  );
  assert.match(
    pagina,
    /const trocarAbaConteudo = useSeguindoContentTabNavigation\(\{[\s\S]*?perfilSocialId,[\s\S]*?perfilSocialNome,[\s\S]*?usuarioLogadoId,[\s\S]*?visualizandoListaSocialDoPerfil,[\s\S]*?setAbaConteudo,[\s\S]*?setAbaSeguimento,[\s\S]*?setBusca,[\s\S]*?setFiltro,[\s\S]*?setOrdenacao,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(
    pagina,
    /function trocarAbaConteudo\(/,
  );
  assert.doesNotMatch(
    pagina,
    /new URLSearchParams\(window\.location\.search\)/,
  );
  assert.doesNotMatch(pagina, /window\.history\.replaceState/);
});
