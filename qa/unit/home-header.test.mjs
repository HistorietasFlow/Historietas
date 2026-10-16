import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync(
  new URL("../../components/HomeHeader.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

test("HomeHeader preserva a fronteira client, as props e os estilos do shell", () => {
  assert.match(header, /^"use client";/);
  assert.match(header, /export default function HomeHeader\(/);
  assert.match(header, /isDesktop: boolean;/);
  assert.match(header, /busca: string;/);
  assert.match(header, /setBusca: Dispatch<SetStateAction<string>>;/);
  assert.match(header, /buscaMobileAberta: boolean;/);
  assert.match(header, /setBuscaMobileAberta: Dispatch<SetStateAction<boolean>>;/);
  assert.match(header, /notificacoesNaoLidas: number;/);
  assert.match(header, /usuarioLogado: boolean;/);
  assert.match(header, /from "\.\.\/app\/lib\/home-shell-header-styles";/);
  assert.doesNotMatch(header, /useState|useEffect|supabase|localStorage/);
});

test("HomeHeader preserva navegação, busca desktop e ações autenticadas", () => {
  assert.match(header, /className="historietas-home-header"/);
  assert.match(header, /isDesktop \? desktopNavStyle : mobileNavStyle/);

  assert.match(
    header,
    /<Link href="\/" className="historietas-home-desktop-link" style=\{desktopActiveLinkStyle\}>\s*Início/,
  );
  for (const [href, texto] of [
    ["/explorar", "Explorar"],
    ["/publicar", "Publicar"],
    ["/comunidade", "Comunidade"],
    ["/seguindo", "Seguindo"],
  ]) {
    assert.match(
      header,
      new RegExp(
        `<Link href="${href}" className="historietas-home-desktop-link" style=\\{desktopLinkStyle\\}>\\s*${texto}`,
      ),
    );
  }

  assert.match(header, /aria-label="Buscar obras, autor, gênero\.\.\."/);
  assert.match(header, /onChange=\{\(event\) => setBusca\(event\.target\.value\)\}/);
  assert.match(header, /href="\/notificacoes"/);
  assert.match(header, /Notificações: \$\{notificacoesNaoLidas\} novas/);
  assert.match(header, /usuarioLogado && notificacoesNaoLidas > 0/);
  assert.match(header, /notificacoesNaoLidas > 99 \? "99\+" : notificacoesNaoLidas/);
  assert.match(header, /href="\/configuracoes"/);
  assert.match(header, /href="\/perfil-autor"/);
  assert.match(header, /strokeLinecap="round"/);
  assert.match(header, /strokeLinejoin="round"/);
});

test("HomeHeader preserva a busca mobile e a Home mantém seus controladores", () => {
  assert.match(header, /buscaMobileAberta \? \(/);
  assert.match(header, /aria-label="Buscar\.\.\."/);
  assert.match(header, /autoComplete="off"/);
  assert.match(header, /autoCorrect="off"/);
  assert.match(header, /spellCheck=\{false\}/);
  assert.match(header, /maxLength=\{90\}/);
  assert.match(header, /autoFocus/);
  assert.match(header, /onClick=\{\(\) => setBuscaMobileAberta\(\(aberta\) => !aberta\)\}/);
  assert.match(header, /buscaMobileAberta \? "Fechar busca" : "Abrir busca"/);
  assert.match(header, /aria-pressed=\{buscaMobileAberta\}/);
  assert.match(header, /mobileSearchToggleActiveStyle[\s\S]*?mobileSearchToggleStyle/);

  assert.match(pagina, /import HomeHeader from "\.\.\/components\/HomeHeader";/);
  assert.match(pagina, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    pagina,
    /const \[buscaMobileAberta, setBuscaMobileAberta\] = useState\(false\);/,
  );
  assert.match(pagina, /const \{ notificacoesNaoLidas \} = useNotificacoes\(\);/);
  assert.match(pagina, /<HomeHeader[\s\S]*?usuarioLogado=\{usuarioLogado\}/);
  assert.doesNotMatch(pagina, /<header className="historietas-home-header"/);
});
