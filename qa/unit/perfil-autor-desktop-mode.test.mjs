import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const stylesSource = readFileSync(
  new URL("../../app/perfil-autor/styles.ts", import.meta.url),
  "utf8",
);
const profileLoadSyncSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-profile-load-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const authIdentitySyncSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-auth-identity-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const storageUtils = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-local-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const heroIdentitySource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero-identity.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroActionsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("usePerfilAutorDesktopMode preserva o lifecycle responsivo síncrono", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorDesktopMode\(\) \{/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(hook, /function atualizarTelaDesktop\(\) \{/);
  assert.match(hook, /setIsDesktop\(window\.innerWidth >= 1024\);/);
  assert.match(
    hook,
    /function atualizarTelaDesktop\(\) \{[\s\S]*?\}\s*\n\s*atualizarTelaDesktop\(\);/,
  );
  assert.doesNotMatch(hook, /setTimeout/);
  assert.match(
    hook,
    /window\.addEventListener\("resize", atualizarTelaDesktop\);/,
  );
  assert.match(
    hook,
    /window\.removeEventListener\("resize", atualizarTelaDesktop\);/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Perfil de Autor delega somente o modo desktop e mantém suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorDesktopMode \} from "\.\/hooks\/use-perfil-autor-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = usePerfilAutorDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(pagina, /window\.innerWidth >= 1024/);
  assert.doesNotMatch(pagina, /addEventListener\("resize"/);
  assert.doesNotMatch(pagina, /removeEventListener\("resize"/);
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 24);
  assert.match(
    pagina,
    /import \{ ProfileHero \} from "\.\/components\/profile-hero";/,
  );
  assert.match(pagina, /<ProfileHero[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(
    pagina,
    /<ProfileRatingsPanel[\s\S]*?isDesktop=\{isDesktop\}/,
  );
  assert.match(heroSource, /<ProfileHeroIdentity[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(heroIdentitySource, /<ProfileAvatar[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(
    heroIdentitySource,
    /<ProfileHeaderInfo autorNome=\{autorNome\} isDesktop=\{isDesktop\}>/,
  );
  assert.match(heroIdentitySource, /<ProfileStats[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.doesNotMatch(pagina, /useEffect\(/);
  assert.match(profileLoadSyncSource, /useEffect\(\(\) => \{/);
  assert.match(authIdentitySyncSource, /supabase\.auth\.getUser\(\)/);
  assert.match(
    profileLoadSyncSource,
    /import \{[\s\S]*?carregarJsonUsuarioPerfilAutor,[\s\S]*?carregarListaIdsPerfilBiblioteca,[\s\S]*?salvarJsonUsuarioPerfilAutor,[\s\S]*?salvarListaIdsPerfilBiblioteca,[\s\S]*?\} from "\.\.\/lib\/profile-local-storage-utils";/,
  );
  assert.match(
    storageUtils,
    /localStorage\.getItem\(chaveParaLer\)/,
  );
  assert.match(authIdentitySyncSource, /onAuthStateChange/);
});


test("estilos responsivos do Perfil de Autor ficam centralizados", () => {
  assert.match(
    pagina,
    /obterEstilosResponsivosPerfilAutor,[\s\S]*?from "\.\/styles";/,
  );
  assert.match(
    pagina,
    /\} = obterEstilosResponsivosPerfilAutor\(isDesktop\);/,
  );
  assert.match(
    stylesSource,
    /export function obterEstilosResponsivosPerfilAutor\(isDesktop: boolean\)/,
  );
  assert.match(
    pagina,
    /import \{ ProfileHeader \} from "\.\/components\/profile-header";/,
  );
  assert.match(pagina, /<ProfileHeader[\s\S]*?headerStyle=\{profileHeaderAtualStyle\}/);
  assert.match(
    pagina,
    /<div style=\{topWaterFadeAtualStyle\} aria-hidden="true" \/>/,
  );
  assert.doesNotMatch(
    pagina,
    /desktopTopWaterFadeStyle|mobileTopWaterFadeStyle/,
  );
  assert.doesNotMatch(
    pagina,
    /isDesktop \? profileHeaderDesktopStyle : profileHeaderStyle/,
  );

  assert.match(
    pagina,
    /const profileActionsExibicaoStyle = podeEditarPerfil[\s\S]{0,120}\? profileActionsAtualStyle[\s\S]{0,120}: profileVisitorActionsAtualStyle;/,
  );
  assert.match(
    pagina,
    /<ProfileHero[\s\S]*?actionsStyle=\{profileActionsExibicaoStyle\}/,
  );
  assert.match(heroSource, /<ProfileHeroActions[\s\S]*?actionsStyle=\{actionsStyle\}/);
  assert.match(heroActionsSource, /<div style=\{actionsStyle\}>/);
  assert.doesNotMatch(
    pagina,
    /style=\{[\s\S]{0,120}?podeEditarPerfil[\s\S]{0,120}?profileActionsAtualStyle[\s\S]{0,120}?profileVisitorActionsAtualStyle/,
  );

  for (const [atual, desktop, mobile] of [
    ["containerAtualStyle", "desktopContainerStyle", "containerStyle"],
    ["heroAtualStyle", "desktopHeroBoxStyle", "heroBoxStyle"],
    ["authorTopRowAtualStyle", "desktopAuthorTopRowStyle", "authorTopRowStyle"],
    ["avatarActionsAtualStyle", "desktopAvatarActionsStyle", "avatarActionsStyle"],
    ["avatarSmallButtonAtualStyle", "desktopAvatarSmallButtonStyle", "avatarSmallButtonStyle"],
    ["avatarRemoveButtonAtualStyle", "desktopAvatarRemoveButtonStyle", "avatarRemoveButtonStyle"],
    ["profileActionsAtualStyle", "desktopProfileActionsStyle", "profileActionsStyle"],
    ["profileVisitorActionsAtualStyle", "desktopProfileVisitorActionsStyle", "profileVisitorActionsStyle"],
    ["profileHeaderAtualStyle", "profileHeaderDesktopStyle", "profileHeaderStyle"],
    ["topWaterFadeAtualStyle", "desktopTopWaterFadeStyle", "mobileTopWaterFadeStyle"],
    ["menuSheetAtualStyle", "desktopMenuSheetStyle", "menuSheetStyle"],
  ]) {
    assert.match(
      stylesSource,
      new RegExp(
        atual +
          ":[\\s\\S]{0,120}isDesktop[\\s\\S]{0,120}" +
          desktop +
          "[\\s\\S]{0,120}" +
          mobile,
      ),
      atual,
    );
  }
});
