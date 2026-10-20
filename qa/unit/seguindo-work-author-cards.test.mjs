import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const workCard = readFileSync(
  new URL("../../app/seguindo/components/seguindo-work-card.tsx", import.meta.url),
  "utf8",
);
const followedAuthorCard = readFileSync(
  new URL("../../app/seguindo/components/seguindo-followed-author-card.tsx", import.meta.url),
  "utf8",
);

test("Seguindo delega os cards de obras e autores sem mover dados ou ações", () => {
  assert.match(page, /import \{ SeguindoWorkCard \} from "\.\/components\/seguindo-work-card";/);
  assert.match(page, /import \{ SeguindoFollowedAuthorCard \} from "\.\/components\/seguindo-followed-author-card";/);
  assert.match(page, /<SeguindoWorkCard/);
  assert.match(page, /<SeguindoFollowedAuthorCard/);
  assert.match(page, /void deixarDeSeguirObra\(/);
  assert.match(page, /void deixarDeSeguirAutor\(/);

  assert.match(workCard, /^"use client";/);
  assert.match(workCard, /criarSlugBase/);
  assert.match(workCard, /criarHrefPerfilAutorSeguindo/);
  assert.match(workCard, /criarCoverStyle/);
  assert.match(workCard, /formatarGeneroSeguindo/);
  assert.match(workCard, /mostrarClassificacao/);
  assert.match(workCard, /visualizandoListaSocialDoPerfil/);
  assert.match(workCard, /Ver obra/);
  assert.match(workCard, /Deixar de seguir/);
  assert.match(workCard, /isDesktop \? "32px" : "28px"/);

  assert.match(followedAuthorCard, /^"use client";/);
  assert.match(followedAuthorCard, /criarHrefPerfilAutorSeguindo/);
  assert.match(followedAuthorCard, /desktopAuthorFollowedCardStyle/);
  assert.match(followedAuthorCard, /desktopAuthorFollowedAvatarStyle/);
  assert.match(followedAuthorCard, /autor\.obras\.length === 1 \? "obra" : "obras"/);
  assert.match(followedAuthorCard, /autor\.totalEmLeitura > 0/);
  assert.match(followedAuthorCard, /Abrir perfil/);
  assert.match(followedAuthorCard, /Deixar de seguir/);

  for (const component of [workCard, followedAuthorCard]) {
    assert.doesNotMatch(component, /supabase|localStorage|useEffect|useState/);
  }
});
