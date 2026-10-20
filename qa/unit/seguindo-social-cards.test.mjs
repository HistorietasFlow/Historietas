import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const peopleSections = readFileSync(
  new URL("../../app/seguindo/components/seguindo-people-sections.tsx", import.meta.url),
  "utf8",
);
const followRequestCard = readFileSync(
  new URL("../../app/seguindo/components/seguindo-follow-request-card.tsx", import.meta.url),
  "utf8",
);
const socialUserCard = readFileSync(
  new URL("../../app/seguindo/components/seguindo-social-user-card.tsx", import.meta.url),
  "utf8",
);
const suggestedUserCard = readFileSync(
  new URL("../../app/seguindo/components/seguindo-suggested-user-card.tsx", import.meta.url),
  "utf8",
);

test("Seguindo delega os cards sociais sem mover dados ou ações", () => {
  assert.match(page, /import \{ SeguindoPeopleSections \} from "\.\/components\/seguindo-people-sections";/);
  assert.match(page, /<SeguindoPeopleSections/);
  assert.match(peopleSections, /import \{ SeguindoFollowRequestCard \} from "\.\/seguindo-follow-request-card";/);
  assert.match(peopleSections, /import \{ SeguindoSocialUserCard \} from "\.\/seguindo-social-user-card";/);
  assert.match(peopleSections, /import \{ SeguindoSuggestedUserCard \} from "\.\/seguindo-suggested-user-card";/);
  assert.match(peopleSections, /void onResponderSolicitacao\(/);
  assert.match(peopleSections, /void onRemoverSeguidorUsuario\(/);
  assert.match(peopleSections, /void onDeixarDeSeguirUsuario\(/);
  assert.match(peopleSections, /void onSeguirUsuarioSugestao\(/);

  assert.match(followRequestCard, /^"use client";/);
  assert.match(followRequestCard, /criarHrefPerfilUsuarioSeguindo/);
  assert.match(followRequestCard, /Responder solicitação/);
  assert.match(followRequestCard, /"Aceitar"/);
  assert.match(followRequestCard, /"Recusar"/);
  assert.match(followRequestCard, /disabled=\{respondendo\}/);

  assert.match(socialUserCard, /^"use client";/);
  assert.match(socialUserCard, /useRouter/);
  assert.match(socialUserCard, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(socialUserCard, /event\.stopPropagation\(\)/);
  assert.match(socialUserCard, /"Remover seguidor"/);
  assert.match(socialUserCard, /"Deixar de seguir"/);

  assert.match(suggestedUserCard, /^"use client";/);
  assert.match(suggestedUserCard, /criarHrefPerfilUsuarioSeguindo/);
  assert.match(suggestedUserCard, /solicitacaoPendente/);
  assert.match(suggestedUserCard, /"Cancelar"/);
  assert.match(suggestedUserCard, /"Seguir"/);

  for (const component of [
    followRequestCard,
    socialUserCard,
    suggestedUserCard,
  ]) {
    assert.doesNotMatch(component, /supabase|localStorage|useEffect|useState/);
    assert.match(
      component,
      /desktopAuthorCardStyle[\s\S]*from "\.\.\/lib\/seguindo-author-card-styles";/,
    );
    assert.match(
      component,
      /desktopAuthorAvatarStyle[\s\S]*from "\.\.\/lib\/seguindo-desktop-author-avatar-styles";/,
    );
  }
});
