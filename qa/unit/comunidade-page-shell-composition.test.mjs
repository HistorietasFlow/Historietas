import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const composicao = readFileSync(new URL("../../app/comunidade/components/community-page-shell-composition.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/comunidade/page.tsx", import.meta.url), "utf8");

test("o shell preserva a estrutura visual e a ordem dos slots", () => {
  assert.match(composicao, /import \{ CommunityPageContainer \} from "\.\/community-page-container"/);
  assert.match(composicao, /import \{ CommunityLanguageBridge \} from "\.\/community-language-bridge"/);
  assert.match(composicao, /import \{ CommunityThemeStyles \} from "\.\/community-theme-styles"/);
  assert.match(composicao, /import \{ CommunityTopWaterFade \} from "\.\/community-top-water-fade"/);
  assert.match(composicao, /import \{ CommunityContentContainer \} from "\.\/community-content-container"/);
  assert.match(composicao, /import \{ CommunityMainLayout \} from "\.\/community-main-layout"/);
  assert.match(composicao, /import \{ CommunityFeedColumn \} from "\.\/community-feed-column"/);
  assert.match(composicao, /<CommunityPageContainer style=\{pageThemeStyle\}>[\s\S]*?<CommunityLanguageBridge \/>[\s\S]*?<CommunityThemeStyles \/>[\s\S]*?<CommunityTopWaterFade isDesktop=\{isDesktop\} \/>/);
  assert.match(composicao, /<CommunityContentContainer isDesktop=\{isDesktop\}>[\s\S]*?\{desktopHeader\}[\s\S]*?<CommunityMainLayout isDesktop=\{isDesktop\}>[\s\S]*?<CommunityFeedColumn isDesktop=\{isDesktop\}>[\s\S]*?\{feedErrorNotice\}[\s\S]*?\{feedControls\}[\s\S]*?\{feedCenter\}/);
  assert.match(composicao, /<\/CommunityContentContainer>[\s\S]*?\{composerPortal\}[\s\S]*?\{interactionOverlays\}/);
  assert.doesNotMatch(composicao, /supabase\./);
  assert.doesNotMatch(composicao, /use[A-Z]\w*\(/);
});

test("a pagina mantem a orquestracao e fornece slots preparados", () => {
  assert.match(pagina, /import \{ CommunityPageShellComposition \} from "\.\/components\/community-page-shell-composition"/);
  assert.match(pagina, /if \(carregandoFeed\) \{[\s\S]*?<CommunityFeedLoadingState style=\{pageThemeStyle\}>/);
  assert.match(pagina, /<CommunityPageShellComposition[\s\S]*?pageThemeStyle=\{pageThemeStyle\}[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(pagina, /desktopHeader=\{isDesktop \? \(/);
  assert.match(pagina, /feedErrorNotice=\{[\s\S]*?usuario && erro && !composerAberto/);
  assert.match(pagina, /feedControls=\{[\s\S]*?<CommunityFeedTopComposition/);
  assert.match(pagina, /feedCenter=\{[\s\S]*?<CommunityFeedCenterComposition/);
  assert.match(pagina, /composerPortal=\{[\s\S]*?<CommunityPostComposerPortal/);
  assert.match(pagina, /interactionOverlays=\{[\s\S]*?<CommunityInteractionOverlaysComposition/);
  assert.match(pagina, /const renderizarPostComunidade = \(post: PostComunidade\) => \{/);
  assert.match(pagina, /removerPostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerPost\(/);
  assert.doesNotMatch(pagina, /<CommunityPageContainer\s/);
  assert.doesNotMatch(pagina, /<CommunityContentContainer\s/);
  assert.doesNotMatch(pagina, /<CommunityMainLayout\s/);
});
