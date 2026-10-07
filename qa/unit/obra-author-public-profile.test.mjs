import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-author-public-profile.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estado, cancelamento e timers do perfil publico do autor", () => {
  assert.match(hook, /useState<PerfilPublicoObra \| null>\(null\)/);
  assert.match(hook, /let cancelado = false;/);
  assert.match(
    hook,
    /if \(!autorId\) \{[\s\S]*?window\.setTimeout\(\(\) => \{[\s\S]*?if \(!cancelado\) \{[\s\S]*?setPerfilAutorObra\(null\);/,
  );
  assert.match(
    hook,
    /const perfilAutor = await carregarPerfilPublicoObra\(autorId, autor\);/,
  );
  assert.match(
    hook,
    /window\.setTimeout\(\(\) => \{[\s\S]*?if \(!cancelado\) \{[\s\S]*?setPerfilAutorObra\(perfilAutor\);/,
  );
  assert.equal((hook.match(/window\.setTimeout/g) || []).length, 2);
  assert.equal((hook.match(/cancelado = true;/g) || []).length, 1);
  assert.doesNotMatch(hook, /window\.clearTimeout/);
  assert.match(hook, /\}, \[autorId, autor\]\);/);
  assert.match(hook, /return perfilAutorObra;/);
});

test("cliente delega somente o perfil do autor e preserva seus dados preparados", () => {
  assert.match(
    cliente,
    /import \{ useObraAuthorPublicProfile \} from "\.\/hooks\/use-obra-author-public-profile";/,
  );
  assert.match(
    cliente,
    /const perfilAutorObra = useObraAuthorPublicProfile\(\s*obra\?\.autorId,\s*obra\?\.autor \?\? "",\s*\);/,
  );
  assert.doesNotMatch(cliente, /setPerfilAutorObra/);
  assert.match(
    cliente,
    /obterNomeAutorObraExibido\(perfilAutorObra, obra\)/,
  );
  assert.match(
    cliente,
    /perfilAutorObra\?\.userId \|\| obra\?\.autorId \|\| ""/,
  );
});
