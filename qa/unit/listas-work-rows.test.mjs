import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const linhaPerfil = readFileSync(
  new URL(
    "../../app/listas/components/listas-profile-work-row.tsx",
    import.meta.url,
  ),
  "utf8",
);
const anotacao = readFileSync(
  new URL(
    "../../app/listas/components/listas-diary-annotation-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const obraPublica = readFileSync(
  new URL(
    "../../app/listas/components/listas-public-work-row.tsx",
    import.meta.url,
  ),
  "utf8",
);
const autor = readFileSync(
  new URL("../../app/listas/components/listas-author-row.tsx", import.meta.url),
  "utf8",
);
const itemPerfil = readFileSync(
  new URL(
    "../../app/listas/components/listas-profile-work-item.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pageRenderers = readFileSync(
  new URL("../../app/listas/hooks/use-listas-page-renderers.tsx", import.meta.url),
  "utf8",
);
const profileWorkRenderer = readFileSync(
  new URL(
    "../../app/listas/components/listas-profile-work-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileItemRenderer = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-profile-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Listas delega as quatro apresentações das linhas sem mover o domínio", () => {
  assert.match(
    pagina,
    /import \{ useListasProfileItemRenderer \} from "\.\/hooks\/use-listas-profile-item-renderer";/,
  );
  assert.match(profileItemRenderer, /<ListasProfileWorkRenderer\b/);
  assert.match(
    profileWorkRenderer,
    /import \{ ListasProfileWorkItem \} from "\.\/listas-profile-work-item";/,
  );
  assert.match(
    profileWorkRenderer,
    /ComponentProps<typeof ListasProfileWorkItem>/,
  );
  assert.match(profileWorkRenderer, /<ListasProfileWorkItem \{\.\.\.props\} \/>/);
  for (const componente of ["ListasPublicWorkRow", "ListasAuthorRow"]) {
    assert.match(
      pageRenderers,
      new RegExp(`import \\{ ${componente} \\} from "\\.\\.\\/components\\/`),
    );
    assert.match(pageRenderers, new RegExp(`<${componente}\\b`));
  }

  for (const contrato of [
    "categoriaAtual",
    "abrirMenuObra",
    "alternarCurtidaAnotacaoListas",
    "abrirComentariosDiario",
  ]) {
    assert.match(profileItemRenderer, new RegExp(`\\b${contrato}\\b`));
  }

  assert.match(
    pageRenderers,
    /const href = idUsuarioValido\(autor\.id\)[\s\S]*?ListasAuthorRow/,
  );
  assert.match(profileItemRenderer, /key=\{item\.chave\}/);
  assert.match(pageRenderers, /key=\{obra\.id\}/);
  assert.match(pageRenderers, /key=\{autor\.id \|\| autor\.nome\}/);
});

test("linha do perfil preserva mídia, destaque, nota, toggle e opções", () => {
  assert.match(linhaPerfil, /export function ListasProfileWorkRow/);
  assert.match(profileItemRenderer, /historietas-list-row-highlight/);
  assert.match(itemPerfil, /export function ListasProfileWorkItem/);
  assert.match(itemPerfil, /ListasDiaryAnnotationCard/);
  assert.match(linhaPerfil, /data-historietas-user-content="true"/);
  assert.match(linhaPerfil, /aria-expanded=\{annotationOpen\}/);
  assert.match(linhaPerfil, /aria-controls=\{`anotacao-\$\{workId\}`\}/);
  assert.match(linhaPerfil, /event\.key !== "Enter" && event\.key !== " "/);
  assert.equal((linhaPerfil.match(/event\.preventDefault\(\)/g) || []).length, 2);
  assert.equal((linhaPerfil.match(/event\.stopPropagation\(\)/g) || []).length, 2);
  assert.match(linhaPerfil, /Abrir opções de \$\{titulo\}/);
  assert.match(linhaPerfil, /✎ Anotação/);
  assert.match(linhaPerfil, /annotation/);
});

test("card da anotação preserva contadores, spoiler, curtida e comentários", () => {
  assert.match(anotacao, /export function ListasDiaryAnnotationCard/);
  assert.match(anotacao, /className="historietas-list-annotation"/);
  assert.match(anotacao, /Anotação de \{authorName\}/);
  assert.match(anotacao, /disabled=\{isSavingLike\}/);
  assert.match(anotacao, /aria-pressed=\{isLiked\}/);
  assert.match(anotacao, /historietas-list-heart-pop 260ms ease-out/);
  assert.match(anotacao, /aria-label=\{likeAriaLabel\}/);
  assert.match(anotacao, /aria-label=\{commentAriaLabel\}/);
  assert.match(anotacao, /Esta anotação contém spoiler/);
  assert.match(anotacao, />\s*Revelar\s*</);
  assert.match(anotacao, />\s*Ocultar\s*</);
  assert.match(anotacao, /data-historietas-user-content="true"/);
});

test("linhas pública e de autor preservam links, avatar e pluralização", () => {
  assert.match(obraPublica, /export function ListasPublicWorkRow/);
  assert.match(obraPublica, /href=\{href\}/);
  assert.match(obraPublica, /data-historietas-user-content="true"/);
  assert.match(obraPublica, /Abrir opções de \$\{titulo\}/);
  assert.match(autor, /export function ListasAuthorRow/);
  assert.match(autor, /href=\{href\}/);
  assert.match(
    autor,
    /!avatar \? nome\.slice\(0, 1\)\.toLocaleUpperCase\("pt-BR"\) : ""/,
  );
  assert.match(autor, /totalObras === 1 \? "obra" : "obras"/);
});
