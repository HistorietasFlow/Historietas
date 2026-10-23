import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(new URL("../../app/publicar/hooks/use-publicar-desktop-mode.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");
const controladorPagina = readFileSync(new URL("../../app/publicar/hooks/use-publicar-page-controller.ts", import.meta.url), "utf8");
const controladorFormulario = readFileSync(new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url), "utf8");
const propsComponentesPagina = readFileSync(new URL("../../app/publicar/lib/publicar-page-component-props.ts", import.meta.url), "utf8");
const acaoSubmissao = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hookSubmissao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);
const shell = readFileSync(new URL("../../app/publicar/components/PublicarPageShell.tsx", import.meta.url), "utf8");
const conteudoPagina = readFileSync(new URL("../../app/publicar/components/PublicarPageContent.tsx", import.meta.url), "utf8");
const cabecalho = readFileSync(new URL("../../app/publicar/components/PublicarPageHeader.tsx", import.meta.url), "utf8");
const progresso = readFileSync(new URL("../../app/publicar/components/PublicarProgress.tsx", import.meta.url), "utf8");
const previa = readFileSync(new URL("../../app/publicar/components/PublicarWorkPreview.tsx", import.meta.url), "utf8");
const acoesFormulario = readFileSync(new URL("../../app/publicar/components/PublicarFormActions.tsx", import.meta.url), "utf8");
const formularioPublicacao = readFileSync(
  new URL("../../app/publicar/components/PublicarPublicationForm.tsx", import.meta.url),
  "utf8",
);

test("usePublicarDesktopMode preserva o lifecycle responsivo", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /useState\(false\)/);
  assert.match(hook, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(hook, /setIsDesktop\(mediaQuery\.matches\)/);
  assert.match(hook, /window\.setTimeout\(\s*atualizarModoDesktop,\s*0\s*\)/);
  assert.match(hook, /addEventListener\("change", atualizarModoDesktop\)/);
  assert.match(hook, /removeEventListener\("change", atualizarModoDesktop\)/);
  assert.match(hook, /addListener\(atualizarModoDesktop\)/);
  assert.match(hook, /removeListener\(atualizarModoDesktop\)/);
  assert.equal((hook.match(/window\.clearTimeout\(atualizarModoDesktopTimer\)/g) || []).length, 2);
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Publicar delega somente o modo desktop", () => {
  assert.match(pagina, /import \{ usePublicarPageController \} from "\.\/hooks\/use-publicar-page-controller";/);
  assert.match(controladorPagina, /import \{ usePublicarDesktopMode \} from "\.\/use-publicar-desktop-mode";/);
  assert.match(controladorPagina, /const isDesktop = usePublicarDesktopMode\(\);/);
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(pagina, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(pagina, /from "\.\/components\/PublicarPageContent"/);
  assert.match(pagina, /<PublicarPageContent[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(shell, /<PublicarPageHeader[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(conteudoPagina, /<PublicarPublicationForm \{\.\.\.publicationFormProps\} \/>/);
  assert.match(formularioPublicacao, /<PublicarFormActions[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(conteudoPagina, /<PublicarWorkPreview \{\.\.\.workPreviewProps\} \/>/);
  assert.match(propsComponentesPagina, /publicationFormProps:[\s\S]*?isDesktop,/);
  assert.match(propsComponentesPagina, /workPreviewProps:[\s\S]*?isDesktop,/);
  assert.match(cabecalho, /isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle/);
  assert.match(progresso, /isDesktop[\s\S]*?desktopProgressBoxStyle[\s\S]*?progressBoxStyle/);
  assert.match(acoesFormulario, /<PublicarProgress[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(previa, /isDesktop \? desktopPreviewPanelStyle : previewPanelStyle/);
  assert.match(pagina, /import \{ usePublicarPageController \} from "\.\/hooks\/use-publicar-page-controller";/);
  assert.match(controladorPagina, /import \{ usePublicarFormController \} from "\.\/use-publicar-form-controller";/);
  assert.match(controladorFormulario, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(pagina, /async function salvarObra/);
  assert.match(hookSubmissao, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.match(hookSubmissao, /async function salvarObra/);
  assert.doesNotMatch(pagina, /supabase\.auth\.getUser/);
  assert.match(acaoSubmissao, /export async function salvarObraPublicar/);
  assert.match(acaoSubmissao, /supabase\.auth\.getUser/);
});
