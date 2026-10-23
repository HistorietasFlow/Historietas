import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const portal = readFileSync(new URL("../../app/comunidade/components/community-post-composer-portal.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/comunidade/page.tsx", import.meta.url), "utf8");

test("o portal do composer preserva a condição e o destino visual", () => {
  assert.match(portal, /composerAberto && usuario && typeof document !== "undefined"/);
  assert.match(portal, /createPortal\(<CommunityPostComposer \{\.\.\.composerProps\} \/>, document\.body\)/);
  assert.doesNotMatch(portal, /supabase\./);
  assert.doesNotMatch(portal, /use[A-Z]\w*\(/);
});

test("a pagina permanece orquestradora das props e callbacks do composer", () => {
  assert.match(pagina, /import \{ CommunityPostComposerPortal \} from "\.\/components\/community-post-composer-portal";/);
  assert.match(pagina, /<CommunityPostComposerPortal[\s\S]*?composerAberto=\{composerAberto\}[\s\S]*?usuario=\{usuario\}/);
  assert.match(pagina, /composerProps=\{\{[\s\S]*?publicandoPost,[\s\S]*?onSubmit: publicarPost,[\s\S]*?onAlternarSpoiler:/);
  assert.match(pagina, /selecionarTipoPublicacaoPost\(/);
  assert.match(pagina, /normalizarVisibilidadePostComunidade\(/);
  assert.match(pagina, /selecionarObraRelacionada\(/);
  assert.match(pagina, /prepararEnqueteComunidade\(/);
  assert.match(pagina, /aplicarSugestaoPublicacaoComunidade\(/);
  assert.doesNotMatch(pagina, /createPortal\(/);
  assert.doesNotMatch(pagina, /<CommunityPostComposer\s/);
});
