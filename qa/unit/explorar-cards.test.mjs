import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const autorCodigo = ler("../../app/explorar/components/explorar-autor-card.tsx");
const obraCodigo = ler("../../app/explorar/components/explorar-obra-publicada-card.tsx");
const secoesCriativasAutoresCodigo = ler("../../app/explorar/components/explorar-creative-author-sections.tsx");
const secoesAutoresGeneroCodigo = ler("../../app/explorar/components/explorar-genre-author-sections.tsx");
const secoesAutoresFiltradosCodigo = ler("../../app/explorar/components/explorar-filtered-authors-section.tsx");
const secoesCriativasCodigo = ler("../../app/explorar/components/explorar-creative-work-sections.tsx");
const secoesGeneroCodigo = ler("../../app/explorar/components/explorar-genre-work-sections.tsx");
const secoesFiltradasCodigo = ler("../../app/explorar/components/explorar-filtered-works-section.tsx");
const auxiliaresCodigo = ler("../../app/explorar/components/explorar-section-components.tsx");
const estiloCodigo = ler("../../app/explorar/lib/explorar-content-styles.ts");
const rotaCodigo = ler("../../app/explorar/lib/explorar-author-route-utils.ts");
const hash = (valor) => createHash("sha256").update(valor).digest("hex");

function compilar(codigo, dependencias = {}) {
  const js = typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      jsx: typescript.JsxEmit.React,
    },
  }).outputText;
  const modulo = { exports: {} };
  const carregar = (nome) => {
    assert.ok(Object.hasOwn(dependencias, nome), `dependência inesperada: ${nome}`);
    return dependencias[nome];
  };
  new Function("require", "module", "exports", "React", js)(
    carregar, modulo, modulo.exports, React,
  );
  return modulo.exports;
}

const utils = compilar(ler("../../lib/utils.ts"));
const traducoes = compilar(ler("../../app/explorar/lib/explorar-translations.ts"), {
  "../../../lib/utils": utils,
});
const layout = compilar(ler("../../app/explorar/lib/explorar-layout-styles.ts"));
const estilos = compilar(estiloCodigo, { "./explorar-layout-styles": layout });
const normalizadores = compilar(ler("../../app/explorar/lib/explorar-work-normalizers.ts"), {
  "../../../lib/utils": utils,
  "../../../lib/historietasAdultContent": {},
});
const perfis = compilar(ler("../../app/explorar/lib/explorar-author-profile-utils.ts"), {
  "../../../lib/supabase/client": {},
  "../../../lib/metricas": {},
  "./explorar-translations": traducoes,
});
const rotas = compilar(rotaCodigo);
let language = "pt-BR";
const Link = ({ children, ...props }) => React.createElement("a", props, children);
const Image = ({ unoptimized, ...props }) => {
  assert.equal(unoptimized, true);
  return React.createElement("img", props);
};
const comuns = {
  "next/link": { default: Link },
  "../../../components/HistorietasLanguageProvider": {
    useHistorietasLanguage: () => ({ language }),
  },
  "../lib/explorar-translations": traducoes,
  "../lib/explorar-content-styles": estilos,
};
const {
  EstadoVazioExplorar,
  SectionHeader,
  ExplorarCarouselRow,
} = compilar(auxiliaresCodigo, {
  ...comuns,
  react: React,
});
const AutorCard = compilar(autorCodigo, {
  ...comuns,
  "next/image": { default: Image },
  "../lib/explorar-author-profile-utils": perfis,
}).default;
const ObraCard = compilar(obraCodigo, {
  ...comuns,
  "../../../lib/utils": utils,
  "../lib/explorar-work-normalizers": normalizadores,
  "../lib/explorar-author-route-utils": rotas,
}).default;

const autor = {
  chave: "autor-1", nome: "Ana Silva", autorId: "user-1", avatar: "",
  bio: "Bio original", totalObras: 1, totalCurtidas: 0, totalComentarios: 0,
  generos: [], href: "/perfil-autor?autor=Ana", avaliacao: undefined,
};
const obra = {
  titulo: "Aventura", autor: "Ana Silva", autorId: "user-1",
  slug: "", capa: "", genero: "Ação", formato: "Livro",
  classificacaoIndicativa: "Livre", publicado: true, sinopse: "Sinopse",
  visualizacoes: 8, totalCurtidas: 3, totalComentarios: 2,
  capitulos: [], arquivoObra: null,
};
const html = (Componente, props) => renderToStaticMarkup(React.createElement(Componente, props));

test("corpos dos cards, rota e capa preservam literalmente a base", () => {
  const funcao = (codigo, inicio, fim) => {
    const posicao = codigo.indexOf(inicio);
    assert.notEqual(posicao, -1);
    const final = fim ? codigo.indexOf(fim, posicao) : codigo.length;
    assert.notEqual(final, -1);
    return codigo.slice(posicao, final).trimEnd();
  };
  assert.equal(hash(funcao(autorCodigo, "function AutorExplorarCard(", null)),
    "8e7cc547db96aff0b09f04635e4744cde2351fb49bb3ecaa405e8a87a6cb2ede");
  assert.equal(hash(funcao(obraCodigo, "function ObraPublicadaCard(", null)),
    "d1bf1a4f8f135dd675f49b61a7a391e678de82cfe0190e5b278a8b64b46b8a93");
  assert.equal(hash(funcao(rotaCodigo, "function criarPerfilAutorHrefExplorar(", null)),
    "7306b91d6f610228f3024fa05f88475cafd251f6f260aeb6b1c32e79f94a6845");
  assert.equal(hash(funcao(estiloCodigo, "function criarPublishedCoverStyle(", "\n\nexport function criarDesktopPublishedCoverStyle(")),
    "15c2f9a43c7e41ace7002ecbdd05aeca7d0aa93eb848d4b9428e691c9482314e");
  for (const codigo of [autorCodigo, obraCodigo]) assert.match(codigo, /^"use client";/);
  assert.doesNotMatch(pagina, /import AutorExplorarCard from "\.\/components\/explorar-autor-card"/);
  assert.doesNotMatch(pagina, /import ObraPublicadaCard from "\.\/components\/explorar-obra-publicada-card"/);
  for (const codigo of [
    secoesCriativasAutoresCodigo,
    secoesAutoresGeneroCodigo,
    secoesAutoresFiltradosCodigo,
  ]) {
    assert.match(codigo, /import AutorExplorarCard from "\.\/explorar-autor-card"/);
    assert.match(codigo, /<AutorExplorarCard\b/);
  }
  for (const codigo of [
    secoesCriativasCodigo,
    secoesGeneroCodigo,
    secoesFiltradasCodigo,
  ]) {
    assert.match(codigo, /import ObraPublicadaCard from "\.\/explorar-obra-publicada-card"/);
    assert.match(codigo, /<ObraPublicadaCard\b/);
  }
  assert.doesNotMatch(
    pagina,
    /function (?:AutorExplorarCard|ObraPublicadaCard|EstadoVazioExplorar|SectionHeader|ExplorarCarouselRow)\(/,
  );
  assert.match(
    pagina,
    /from "\.\/components\/explorar-section-components"/,
  );
  for (const nome of ["EstadoVazioExplorar", "SectionHeader", "ExplorarCarouselRow"]) {
    assert.match(auxiliaresCodigo, new RegExp(`export function ${nome}\\(`));
  }
});

test("componentes auxiliares preservam vazio, cabeçalho e regras do carrossel", () => {
  language = "pt-BR";
  assert.match(
    html(EstadoVazioExplorar, {
      possuiObrasPublicadas: false,
      modoConteudo: "obras",
    }),
    /PUBLIQUE SUA HISTÓRIA/,
  );
  assert.match(
    html(EstadoVazioExplorar, {
      possuiObrasPublicadas: true,
      modoConteudo: "autores",
    }),
    /Nenhum autor encontrado/,
  );

  language = "en";
  const cabecalho = html(SectionHeader, {
    title: "Explorar",
    tema: {},
    isDesktop: true,
    href: "/listas",
  });
  assert.match(cabecalho, />Explore<\/h2>/);
  assert.match(cabecalho, /href="\/listas"/);
  assert.match(cabecalho, /aria-label="View all in Explore"/);

  language = "pt-BR";
  const filhos = [1, 2, 3, 4].map((item) =>
    React.createElement("span", { key: item }, item),
  );
  const comSetas = html(ExplorarCarouselRow, {
    children: filhos,
    isDesktop: true,
    variant: "obra",
  });
  assert.match(comSetas, /Rolar carrossel para a esquerda/);
  assert.match(comSetas, /Rolar carrossel para a direita/);
  const semSetas = html(ExplorarCarouselRow, {
    children: filhos.slice(0, 3),
    isDesktop: true,
    variant: "autor",
  });
  assert.doesNotMatch(semSetas, /<button/);

  assert.match(auxiliaresCodigo, /const totalItems = Children\.count\(children\);/);
  assert.match(auxiliaresCodigo, /const precisaSetas = isDesktop && totalItems > 3;/);
  assert.match(auxiliaresCodigo, /row\.scrollLeft = 0;[\s\S]*?\}, \[isDesktop, totalItems, variant\]\);/);
  assert.match(auxiliaresCodigo, /left: direcao \* 460,[\s\S]*?behavior: "smooth"/);
});

test("autor preserva variantes, iniciais, fallback de gênero e métricas condicionais", () => {
  language = "pt-BR";
  assert.equal(AutorCard({ autor }).props.style, estilos.autorExplorarCardStyle);
  assert.equal(AutorCard({ autor, isDesktop: true }).props.style, estilos.desktopAutorExplorarCardStyle);
  assert.equal(AutorCard({ autor, emGrade: true }).props.style, estilos.autorExplorarGridCardStyle);
  assert.equal(AutorCard({ autor, emGrade: true, isDesktop: true }).props.style, estilos.desktopAutorExplorarGridCardStyle);
  const saida = html(AutorCard, { autor });
  assert.match(saida, /href="\/perfil-autor\?autor=Ana"/);
  assert.match(saida, /aria-label="Abrir perfil do autor Ana Silva"/);
  assert.match(saida, />AS<\/span>/);
  assert.match(saida, /Bio original/);
  assert.match(saida, /aria-label="1 obra publicada"/);
  assert.match(saida, /Autor ainda sem avaliações/);
  assert.match(saida, /Historietas/);
  assert.doesNotMatch(saida, /❤️|💬/);
});

test("autor preserva avatar, avaliação, gêneros e traduções em inglês e espanhol", () => {
  const dados = { ...autor, avatar: "/avatar.png", nome: "Autor não informado", totalObras: 2,
    totalCurtidas: 4, totalComentarios: 3, generos: ["Ação", "Fantasia", "Drama"],
    avaliacao: { media: 4.5, total: 2 } };
  language = "en";
  const ingles = html(AutorCard, { autor: dados });
  assert.match(ingles, /src="\/avatar.png"/);
  assert.match(ingles, /width="68" height="68"/);
  assert.match(ingles, /Open author profile for/);
  assert.match(ingles, /Average rating 4\.5 out of 5, from 2 ratings/);
  assert.match(ingles, /❤️ 4/);
  assert.match(ingles, /💬 3/);
  assert.match(ingles, />Action<\/span>/);
  assert.match(ingles, />Fantasy<\/span>/);
  assert.doesNotMatch(ingles, />Drama<\/span>/);
  assert.match(ingles, /View profile/);
  language = "es";
  assert.match(html(AutorCard, { autor: dados }), /Abrir el perfil del autor/);
});

test("obra preserva rota, capa mobile/desktop, métricas e progresso", () => {
  language = "pt-BR";
  const dados = { ...obra, capa: "capa.png", capitulos: [
    { lido: true, curtiu: true, comentario: "" },
    { lido: false, curtiu: false, comentario: "" },
  ] };
  const mobile = ObraCard({ obra: dados });
  const desktop = ObraCard({ obra: dados, isDesktop: true });
  assert.deepEqual(mobile.props.style, estilos.criarPublishedCardTemaStyle());
  assert.deepEqual(desktop.props.style, estilos.criarDesktopPublishedCardTemaStyle());
  assert.deepEqual(mobile.props.children[0].props.style, estilos.criarPublishedCoverStyle("capa.png"));
  assert.deepEqual(desktop.props.children[0].props.style, estilos.criarDesktopPublishedCoverStyle("capa.png"));
  const saida = html(ObraCard, { obra: dados, isDesktop: true });
  assert.match(saida, /href="\/obra\/aventura"/);
  assert.match(saida, /perfil-autor\?autor=Ana\+Silva&amp;autorId=user-1&amp;userId=user-1/);
  assert.match(saida, /Sinopse/);
  assert.match(saida, /👁️<\/span>8/);
  assert.match(saida, /❤️<\/span>3/);
  assert.match(saida, /💬<\/span>2/);
  assert.match(saida, /📚<\/span>2/);
  assert.match(saida, /50%/);
  assert.match(saida, /Ver obra/);
  assert.doesNotMatch(html(ObraCard, { obra: dados }), /Sinopse/);
});

test("obra preserva fallback de capa, arquivo, rascunho e traduções", () => {
  language = "en";
  const dados = { ...obra, titulo: "Obra sem título", autor: "Autor não informado",
    publicado: false, arquivoObra: { nome: "arquivo" } };
  const saida = html(ObraCard, { obra: dados });
  assert.match(saida, /Untitled work/);
  assert.match(saida, /Draft/);
  assert.match(saida, /📄<\/span>1/);
  assert.match(saida, /View work/);
  assert.match(saida, /Action/);
  assert.deepEqual(ObraCard({ obra: dados }).props.children[0].props.style,
    estilos.criarPublishedCoverTemaStyle());
  language = "es";
  const espanhol = html(ObraCard, { obra: dados });
  assert.match(espanhol, /Obra sin título/);
  assert.match(espanhol, /Borrador/);
});

test("rota de autor mantém trim, parâmetros e fallback", () => {
  assert.equal(rotas.criarPerfilAutorHrefExplorar("", ""), "/perfil-autor");
  assert.equal(rotas.criarPerfilAutorHrefExplorar(" Ana Silva ", " id "), "/perfil-autor?autor=Ana+Silva&autorId=id&userId=id");
  assert.equal(rotas.criarPerfilAutorHrefExplorar("", " id "), "/perfil-autor?autorId=id&userId=id");
});
