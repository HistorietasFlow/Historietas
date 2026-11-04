import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutSource = await readFile(new URL("../../app/layout.tsx", import.meta.url), "utf8");
const bottomNavSource = layoutSource.match(
  /<nav[\s\S]*?className="historietas-bottom-nav"[\s\S]*?<AdminBottomNavItem \/>[\s\S]*?<\/nav>/,
)?.[0];

assert.ok(bottomNavSource, "A navegação inferior persistente deve existir no layout");

function obterLinkPorHref(href) {
  const hrefEscapado = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return bottomNavSource.match(new RegExp(`<Link\\b[^>]*href="${hrefEscapado}"[^>]*>`))?.[0];
}

test("desativa prefetch somente nos quatro destinos persistentes solicitados", () => {
  const destinosSemPrefetch = ["/explorar", "/publicar", "/comunidade", "/perfil-autor"];

  for (const href of destinosSemPrefetch) {
    const link = obterLinkPorHref(href);
    assert.ok(link, `O link ${href} deve continuar presente na bottom nav`);
    assert.match(link, /prefetch=\{false\}/, `O link ${href} deve desativar o prefetch automático`);
    assert.match(link, /className="historietas-bottom-nav-item"/);
    assert.match(link, /aria-label="[^"]+"/);
  }

  assert.equal(
    [...bottomNavSource.matchAll(/prefetch=\{false\}/g)].length,
    destinosSemPrefetch.length,
    "A fase não deve alterar outras navegações",
  );
});

test("mantém o prefetch padrão do link Home", () => {
  const homeLink = obterLinkPorHref("/");

  assert.ok(homeLink, "O link Home deve continuar presente na bottom nav");
  assert.doesNotMatch(homeLink, /prefetch=/);
  assert.match(homeLink, /data-nav-exact="true"/);
  assert.match(homeLink, /aria-label="Home"/);
});
