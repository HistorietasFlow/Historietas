import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utils = readFileSync(
  new URL("../../app/listas/lib/listas-row-media-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const diaryStyles = readFileSync(
  new URL(
    "../../app/listas/lib/listas-diary-comments-styles.ts",
    import.meta.url,
  ),
  "utf8",
);
const linhaAutor = readFileSync(
  new URL("../../app/listas/components/listas-author-row.tsx", import.meta.url),
  "utf8",
);
const linhaPerfil = readFileSync(
  new URL(
    "../../app/listas/components/listas-profile-work-row.tsx",
    import.meta.url,
  ),
  "utf8",
);
const linhaObraPublica = readFileSync(
  new URL(
    "../../app/listas/components/listas-public-work-row.tsx",
    import.meta.url,
  ),
  "utf8",
);
const painelComentarios = readFileSync(
  new URL("../../app/listas/components/listas-diary-comments-panel.tsx", import.meta.url),
  "utf8",
);
const pageRenderers = readFileSync(
  new URL("../../app/listas/hooks/use-listas-page-renderers.tsx", import.meta.url),
  "utf8",
);
const profileItemRenderer = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-profile-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const executavel = utils
  .replace(/\r\n/g, "\n")
  .replace('import type { CSSProperties } from "react";\n\n', "");
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarAvatarStyle, criarCapaStyle } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("criarCapaStyle preserva fallback, URL e valores da capa", () => {
  const fallback = criarCapaStyle("");
  const capa = criarCapaStyle(" https://cdn.test/capa.png ");

  assert.equal(fallback.width, "62px");
  assert.equal(fallback.height, "86px");
  assert.equal(fallback.borderRadius, "9px");
  assert.equal(
    fallback.background,
    "linear-gradient(145deg, rgba(124,58,237,0.28), rgba(249,115,22,0.14)), #111111",
  );
  assert.equal(capa.backgroundImage, "url( https://cdn.test/capa.png )");
  assert.equal(capa.backgroundSize, "cover");
  assert.equal(capa.backgroundPosition, "center");
  assert.equal(criarCapaStyle("   ").backgroundImage, "url(   )");
});

test("criarAvatarStyle preserva fallback, URL e valores do avatar", () => {
  const fallback = criarAvatarStyle("");
  const avatar = criarAvatarStyle(" https://cdn.test/avatar.png ");

  assert.equal(fallback.width, "62px");
  assert.equal(fallback.height, "62px");
  assert.equal(fallback.borderRadius, "999px");
  assert.equal(fallback.fontSize, "24px");
  assert.equal(fallback.fontWeight, 950);
  assert.equal(
    fallback.background,
    "linear-gradient(145deg, rgba(124,58,237,0.34), rgba(249,115,22,0.18)), #111111",
  );
  assert.equal(avatar.backgroundImage, "url( https://cdn.test/avatar.png )");
  assert.equal(avatar.backgroundSize, "cover");
  assert.equal(avatar.backgroundPosition, "center");
  assert.equal(criarAvatarStyle("   ").backgroundImage, "url(   )");
});

test("Listas delega somente os helpers de mídia das linhas", () => {
  assert.match(
    pagina,
    /import \{ criarAvatarStyle, criarCapaStyle \} from "\.\/lib\/listas-row-media-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarCapaStyle\(/);
  assert.doesNotMatch(pagina, /function criarAvatarStyle\(/);
  for (const estilo of [
    "coverStyle",
    "coverEmptyStyle",
    "authorAvatarStyle",
    "authorAvatarEmptyStyle",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`const ${estilo}: CSSProperties`),
    );
  }
  assert.equal(
    (pagina.match(/criarCapaStyle\(/g) || []).length +
      (pageRenderers.match(/criarCapaStyle\(/g) || []).length +
      (profileItemRenderer.match(/criarCapaStyle\(/g) || []).length,
    2,
  );
  assert.equal(
    (pagina.match(/criarAvatarStyle\(/g) || []).length +
      (pageRenderers.match(/criarAvatarStyle\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?criarAvatarPerfilDiarioListasStyle,[\s\S]*?\} from "\.\/lib\/listas-diary-comments-styles";/,
  );
  assert.match(
    painelComentarios,
    /import \{ criarAvatarComentarioDiarioListasStyle \} from "\.\.\/lib\/listas-diary-comments-styles";/,
  );
  assert.doesNotMatch(pagina, /function criarAvatarPerfilDiarioListasStyle\(/);
  assert.doesNotMatch(pagina, /function criarAvatarComentarioDiarioListasStyle\(/);
  assert.match(
    diaryStyles,
    /export function criarAvatarPerfilDiarioListasStyle\(avatar: string\): CSSProperties/,
  );
  assert.match(
    diaryStyles,
    /export function criarAvatarComentarioDiarioListasStyle\(/,
  );
  assert.match(
    pageRenderers,
    /<ListasAuthorRow[\s\S]*?avatar=\{autor\.avatar\}[\s\S]*?avatarStyle=\{criarAvatarStyle\(autor\.avatar\)\}/,
  );
  assert.match(
    linhaAutor,
    /\{!avatar \? nome\.slice\(0, 1\)\.toLocaleUpperCase\("pt-BR"\) : ""\}/,
  );
  assert.equal(
    [linhaPerfil, linhaObraPublica, linhaAutor].reduce(
      (total, linha) => total + (linha.match(/aria-hidden="true"/g) || []).length,
      0,
    ) >= 3,
    true,
  );
  assert.doesNotMatch(utils, /\.trim\(/);
  assert.doesNotMatch(utils, /supabase|useState|useEffect/);
});
