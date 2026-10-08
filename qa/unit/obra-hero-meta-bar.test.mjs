import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const metaBarHero = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-hero-meta-bar.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("barra inferior do hero preserva props, autor mobile e estilos", () => {
  for (const trecho of [
    "isDesktop: boolean;",
    "autorNome: string;",
    "autorHref: string;",
    "autorBio: string;",
    "visualizacoes: string;",
    "curtidas: string;",
    "comentarios: string;",
    "isDesktop\n          ? desktopHeroBottomMetaBarStyle\n          : heroBottomMetaBarStyle",
    "!isDesktop ? (",
    "href={autorHref}",
    "style={heroBottomAuthorLinkStyle}",
    "aria-label={`Abrir perfil do autor ${autorNome}`}",
    "title={autorBio || undefined}",
    'data-historietas-i18n-ignore="true"',
    "{autorNome}",
    "isDesktop\n            ? desktopHeroStatsStyle\n            : heroBottomMetricsStyle",
  ]) {
    assert.ok(metaBarHero.includes(trecho), trecho);
  }
});

test("barra inferior preserva exatamente as tres metricas na ordem e seus estilos", () => {
  const visualizacoes = metaBarHero.indexOf(
    '<span style={metricEmojiIconStyle}>👁</span>',
  );
  const curtidas = metaBarHero.indexOf(
    '<span style={metricEmojiIconStyle}>❤️</span>',
  );
  const comentarios = metaBarHero.indexOf(
    '<span style={metricEmojiIconStyle}>💬</span>',
  );

  assert.ok(visualizacoes >= 0);
  assert.ok(curtidas > visualizacoes);
  assert.ok(comentarios > curtidas);
  assert.equal(
    (metaBarHero.match(/<span style=\{heroBottomMetricStyle\}>/g) || []).length,
    3,
  );
  assert.equal(
    (metaBarHero.match(/<span style=\{metricInlineContentStyle\}>/g) || [])
      .length,
    3,
  );
  assert.equal(
    (metaBarHero.match(/<span style=\{metricEmojiIconStyle\}>/g) || []).length,
    3,
  );
  assert.equal(
    (metaBarHero.match(/<span style=\{metricWhiteNumberStyle\}>/g) || [])
      .length,
    3,
  );
  assert.ok(metaBarHero.includes("{visualizacoes}"));
  assert.ok(metaBarHero.includes("{curtidas}"));
  assert.ok(metaBarHero.includes("{comentarios}"));
});

test("cliente preserva dados, formatacao e preparacao da barra de metadados", () => {
  for (const trecho of [
    "const [metricasObra, setMetricasObra]",
    "const [totalComentariosObra, setTotalComentariosObra]",
    "formatarNumeroCompacto",
    "criarLinkPerfilAutor",
    "autorNome: autorObraNome",
    "autorId: autorObraId",
    "const perfilAutorObra = useObraAuthorPublicProfile(",
    "obterContextoAutorObra(perfilAutorObra, obra, usuarioIdLogado)",
    "<ObraHeroMetaBar",
    "autorNome={autorObraNome}",
    "autorHref={criarLinkPerfilAutor(autorObraNome, autorObraId)}",
    'autorBio={perfilAutorObra?.bio || ""}',
    "visualizacoes={formatarNumeroCompacto(metricasObra.visualizacoes)}",
    "curtidas={formatarNumeroCompacto(metricasObra.curtidas)}",
    "comentarios={formatarNumeroCompacto(totalComentariosObra)}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }
});
