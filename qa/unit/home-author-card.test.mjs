import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeAuthorCard.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);
test("HomeAuthorCard preserva a apresentação e os contratos do MobileAutorCard", () => {
  assert.match(componente, /^"use client";/);
  assert.match(componente, /export default function MobileAutorCard\(/);
  assert.match(componente, /autor: AutorHome;/);
  assert.match(componente, /avaliacao\?: AvaliacaoAutorHome;/);
  assert.match(componente, /isDesktop\?: boolean;/);
  assert.match(componente, /const \{ language \} = useHistorietasLanguage\(\);/);
  assert.match(componente, /autor\.generos\.length > 0 \? autor\.generos : \["Historietas"\]/);
  assert.match(componente, /<Image[\s\S]*?width=\{68\}[\s\S]*?height=\{68\}[\s\S]*?unoptimized/);
  assert.match(componente, /criarIniciaisAutor\(autor\.nome\)/);
  assert.match(componente, /traduzirBioAutorHome\(autor\.bio, language\)/);
  assert.match(componente, /autor\.totalObras === 1 \? "obra publicada" : "obras publicadas"/);
  assert.match(componente, /formatarMediaAvaliacaoAutorHome\(avaliacao\)/);
  assert.match(componente, /Autor ainda sem avaliações/);
  assert.match(componente, /★/);
  assert.match(componente, /autor\.totalCurtidas > 0/);
  assert.match(componente, /autor\.totalComentarios > 0/);
  assert.match(componente, /generosAutor\.slice\(0, 2\)/);
  assert.match(componente, /key=\{`\$\{autor\.chave\}-\$\{genero\}`\}/);
  assert.match(componente, />Ver perfil<\/span>/);
  assert.match(componente, /aria-label=\{`Abrir perfil do autor \$\{autor\.nome\}`\}/);
  assert.match(componente, /from "\.\.\/app\/lib\/home-author-card-styles";/);
});

test("Home delega o MobileAutorCard sem manter sua implementação local", () => {
  assert.match(secoes, /import MobileAutorCard from "\.\/HomeAuthorCard";/);
  assert.match(secoes, /<MobileAutorCard[\s\S]*?autor=\{autor\}[\s\S]*?avaliacao=\{avaliacoesAutoresHome\[autor\.autorId\]\}[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.doesNotMatch(pagina, /function MobileAutorCard\(/);
});
