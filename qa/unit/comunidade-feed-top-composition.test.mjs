import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const composicao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-feed-top-composition.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("a composicao superior preserva o cabecalho desktop e sua busca", () => {
  assert.match(composicao, /area: "desktop-header"/);
  assert.match(composicao, /<CommunityDesktopHeader>/);
  assert.match(composicao, /<CommunityDesktopTitle>Comunidade<\/CommunityDesktopTitle>/);
  assert.match(composicao, /<CommunityDesktopSearchContainer>/);
  assert.match(composicao, /<CommunityDesktopSearchIcon \/>/);
  assert.match(composicao, /<CommunityDesktopSearchInput[\s\S]*?value=\{props\.termoBusca\}/);
  assert.match(composicao, /<CommunityDesktopFilterButton[\s\S]*?expanded=\{props\.menuAcoesRapidasComunidadeAberto\}/);
});

test("a composicao superior preserva controles e actions sheet sem regra de dominio", () => {
  assert.match(composicao, /area: "feed-controls"/);
  assert.match(composicao, /<CommunityFeedControls[\s\S]*?onSelecionarAba=\{props\.onSelecionarAba\}/);
  assert.match(composicao, /props\.menuAcoesRapidasComunidadeAberto && \(/);
  assert.match(composicao, /<CommunityFeedActionsSheet[\s\S]*?onSelecionarMaisComentadas=\{props\.onSelecionarMaisComentadas\}/);
  assert.doesNotMatch(composicao, /supabase\./);
  assert.doesNotMatch(composicao, /use[A-Z]\w*\(/);
});

test("a pagina permanece orquestradora da composicao visual superior", () => {
  assert.match(
    pagina,
    /import \{ CommunityFeedTopComposition \} from "\.\/components\/community-feed-top-composition";/,
  );
  assert.match(pagina, /area="desktop-header"[\s\S]*?onAlternarMenuAcoes=/);
  assert.match(pagina, /area="feed-controls"[\s\S]*?onPublicar=[\s\S]*?onSelecionarMaisComentadas=/);
  assert.match(pagina, /carregarPostsComunidade: carregarPostsComunidadeDaPagina/);
  assert.match(pagina, /removerPostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerPost\(/);
  assert.doesNotMatch(pagina, /<CommunityDesktopHeader>/);
  assert.doesNotMatch(pagina, /<CommunityFeedControls/);
  assert.doesNotMatch(pagina, /<CommunityFeedActionsSheet/);
});
