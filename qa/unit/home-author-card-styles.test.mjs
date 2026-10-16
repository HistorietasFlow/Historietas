import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const primitives = readFileSync(
  new URL("../../app/lib/home-card-style-primitives.ts", import.meta.url),
  "utf8",
);
const estilosAutor = readFileSync(
  new URL("../../app/lib/home-author-card-styles.ts", import.meta.url),
  "utf8",
);
const componente = readFileSync(
  new URL("../../components/HomeAuthorCard.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);
const estilosAutorEsperados = [
  "authorCardStyle",
  "desktopAuthorCardStyle",
  "authorCardGlowStyle",
  "authorCardTopStyle",
  "authorAvatarShellStyle",
  "authorAvatarImageStyle",
  "authorAvatarInitialsStyle",
  "authorIdentityStyle",
  "authorCardNameStyle",
  "authorCardBioStyle",
  "authorMetaRowStyle",
  "authorMetaBadgeStyle",
  "authorRatingStarStyle",
  "authorBottomRowStyle",
  "authorGenreRowStyle",
  "authorGenreBadgeStyle",
  "authorProfileButtonStyle",
];

test("home-author-card-styles delega os primitives e os estilos do card de autor", () => {
  for (const nome of [
    "safeTextStyle",
    "listaWorkTitleTypographyStyle",
    "listaAuthorMetaTypographyStyle",
  ]) {
    assert.match(primitives, new RegExp(`export const ${nome}: CSSProperties =`));
  }

  for (const nome of estilosAutorEsperados) {
    assert.match(estilosAutor, new RegExp(`export const ${nome}: CSSProperties =`));
  }

  assert.match(
    estilosAutor,
    /import \{[\s\S]*?listaAuthorMetaTypographyStyle,[\s\S]*?listaWorkTitleTypographyStyle,[\s\S]*?safeTextStyle,[\s\S]*?\} from "\.\/home-card-style-primitives";/,
  );
  assert.match(primitives, /overflowWrap: "anywhere",\s*wordBreak: "break-word",/);
  assert.match(primitives, /fontWeight: 500,\s*letterSpacing: "-0\.01em",/);
  assert.match(primitives, /fontWeight: 450,\s*lineHeight: 1\.25,/);
  assert.match(estilosAutor, /\.\.\.authorCardStyle,\s*flex: "0 0 356px"/);
  assert.match(estilosAutor, /WebkitLineClamp: 1,/);
  assert.match(estilosAutor, /WebkitLineClamp: 2,/);
  assert.match(estilosAutor, /\.\.\.safeTextStyle,/);
  assert.match(estilosAutor, /background: "transparent",/);
  assert.match(estilosAutor, /borderRadius: "999px",/);
  assert.doesNotMatch(primitives, /supabase|localStorage|useState|useEffect|useMemo/);
  assert.doesNotMatch(estilosAutor, /supabase|localStorage|useState|useEffect|useMemo/);
});

test("MobileAutorCard consome a nova fronteira de estilos", () => {
  assert.match(componente, /from "\.\.\/app\/lib\/home-author-card-styles";/);
  assert.match(componente, /style=\{isDesktop \? desktopAuthorCardStyle : authorCardStyle\}/);
  assert.match(componente, /style=\{authorAvatarImageStyle\}/);
  assert.match(componente, /style=\{authorCardNameStyle\}/);
  assert.match(componente, /style=\{authorCardBioStyle\}/);
  assert.match(componente, /style=\{authorMetaBadgeStyle\}/);
  assert.match(componente, /style=\{authorGenreBadgeStyle\}/);
  assert.match(componente, /style=\{authorProfileButtonStyle\}/);
  assert.match(secoes, /import MobileAutorCard from "\.\/HomeAuthorCard";/);
  assert.doesNotMatch(pagina, /function MobileAutorCard\(/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/home-card-style-primitives";/);

  for (const nome of [
    "safeTextStyle",
    "listaWorkTitleTypographyStyle",
    "listaAuthorMetaTypographyStyle",
    ...estilosAutorEsperados,
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nome}: CSSProperties =`));
  }
});
