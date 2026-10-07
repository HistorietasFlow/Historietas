import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const communitySection = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-community-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("secao Comunidade preserva layout, ordem, valores e fallbacks", () => {
  for (const trecho of [
    "isDesktop ? desktopCommunityBoxStyle : communityBoxStyle",
    "communityHeaderStyle",
    "communityTitleStyle",
    "COMUNIDADE",
    "communityGridStyle",
    'numero={carregado ? teorias : "—"}',
    'numero={carregado ? reviews : "—"}',
    'numero={carregado ? posts : "—"}',
    'rotulo="teorias"',
    'rotulo="reviews"',
    'rotulo="posts"',
    "href={hrefTeorias}",
    "href={hrefReviews}",
    "href={hrefPosts}",
  ]) {
    assert.ok(communitySection.includes(trecho), trecho);
  }

  assert.equal((communitySection.match(/<CommunityItem/g) || []).length, 3);
  assert.ok(
    communitySection.indexOf('rotulo="teorias"') <
      communitySection.indexOf('rotulo="reviews"'),
  );
  assert.ok(
    communitySection.indexOf('rotulo="reviews"') <
      communitySection.indexOf('rotulo="posts"'),
  );
});

test("cliente preserva metricas, formatacao e criacao dos links", () => {
  for (const trecho of [
    "metricasComunidadeObra",
    "setMetricasComunidadeObra",
    "formatarNumeroCompacto(metricasComunidadeObra.teorias)",
    "formatarNumeroCompacto(metricasComunidadeObra.reviews)",
    "formatarNumeroCompacto(metricasComunidadeObra.posts)",
    'criarLinkComunidadeObra(obra.titulo, "Teoria")',
    'criarLinkComunidadeObra(obra.titulo, "Review")',
    'criarLinkComunidadeObra(obra.titulo, "posts")',
    "<ObraCommunitySection",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }

  assert.doesNotMatch(communitySection, /supabase|useState|useEffect/);
  assert.doesNotMatch(communitySection, /formatarNumeroCompacto/);
  assert.doesNotMatch(communitySection, /criarLinkComunidadeObra/);
});
