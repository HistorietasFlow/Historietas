import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-local-work-card-view-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const componente = readFileSync(
  new URL("../../components/HomeLocalWorkCard.tsx", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(
    /import \{ criarSlugBase \} from "\.\.\/\.\.\/lib\/utils";\r?\n/,
    `const criarSlugBase = (titulo) => titulo.toLowerCase().replaceAll(" ", "-");\n`,
  )
  .replace(
    /import \{ compactarNumeroHome \} from "\.\/home-format-utils";\r?\n/,
    `const compactarNumeroHome = (valor) => String(valor);\n`,
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/home-local-work-utils";\r?\n/,
    `const obterTotalCurtidasObraHome = (obra) => Math.max(obra.totalCurtidas || 0, obra.capitulos.filter((capitulo) => capitulo.curtiu).length);
const obterTotalComentariosObraHome = (obra) => Math.max(obra.totalComentarios || 0, obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length);
const obraTemArquivoAnexado = (obra) => Boolean(obra.arquivoObra?.nome?.trim() && obra.arquivoObra?.conteudo?.trim());
`,
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/home-reading-utils";\r?\n/,
    `const calcularProgressoLeitura = (capitulos) => capitulos.length ? Math.round((capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100) : 0;
const encontrarCapituloParaContinuar = (obra) => {
  if (!obra.capitulos.some((capitulo) => capitulo.lido)) return null;
  const indice = obra.ultimoCapituloLidoId ? obra.capitulos.findIndex((capitulo) => capitulo.id === obra.ultimoCapituloLidoId) : -1;
  return (indice >= 0 ? obra.capitulos.slice(indice + 1).find((capitulo) => !capitulo.lido) : null) || obra.capitulos.find((capitulo) => !capitulo.lido) || null;
};
`,
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/home-route-utils";\r?\n/,
    `const criarHrefLeituraCapituloHome = (obra, capitulo, numero) => "/ler/" + obra.id + "/" + capitulo.id + "/" + numero;
const criarHrefPerfilAutorHome = (autor, autorId = "") => "/perfil-autor?autor=" + encodeURIComponent(autor) + (autorId ? "&autorId=" + encodeURIComponent(autorId) + "&userId=" + encodeURIComponent(autorId) : "");
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarDadosObraLocalCardHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarCapitulo(id, sobrescritas = {}) {
  return {
    comentario: "",
    criadoEm: "2025-01-01T00:00:00.000Z",
    curtiu: false,
    id,
    lido: false,
    lidoEm: "",
    titulo: `Capítulo ${id}`,
    ...sobrescritas,
  };
}

function criarObra(sobrescritas = {}) {
  return {
    arquivoObra: undefined,
    autor: "Autora",
    autorId: "autor-1",
    capitulos: [],
    criadaEm: "2025-01-01T00:00:00.000Z",
    id: "obra-1",
    link: "",
    publicado: false,
    slug: "obra-local",
    titulo: "Obra Local",
    totalComentarios: 0,
    totalCurtidas: 0,
    ultimaLeituraEm: "",
    ultimoCapituloLidoId: "",
    visualizacoes: 0,
    ...sobrescritas,
  };
}

test("home-local-work-card-view-utils preserva métricas, conteúdo e continuidade", () => {
  const capitulos = [
    criarCapitulo("capitulo-1", { comentario: "Ótimo", curtiu: true, lido: true }),
    criarCapitulo("capitulo-2"),
  ];
  const dados = criarDadosObraLocalCardHome(
    criarObra({
      capitulos,
      ultimoCapituloLidoId: "capitulo-1",
      totalComentarios: 4,
      totalCurtidas: 3,
      visualizacoes: 20,
    }),
    "continuar",
  );

  assert.equal(dados.visualizacoesObra, "20");
  assert.equal(dados.totalCurtidas, "3");
  assert.equal(dados.totalComentarios, "4");
  assert.equal(dados.iconeConteudoObra, "📚");
  assert.equal(dados.totalConteudoObra, "2");
  assert.equal(dados.progressoLeitura, 50);
  assert.equal(dados.numeroCapituloContinuar, 2);
  assert.equal(dados.continuarLeituraHref, "/ler/obra-1/capitulo-2/2");
  assert.equal(dados.actionHref, dados.continuarLeituraHref);
  assert.equal(dados.actionLabel, "Continuar");
  assert.equal(dados.actionSubLabel, "Leitura Cap. 02");
  assert.equal(dados.cardComAlturaExtra, true);
});

test("home-local-work-card-view-utils preserva o último capítulo, arquivo e ação nova", () => {
  const dados = criarDadosObraLocalCardHome(
    criarObra({
      arquivoObra: { conteudo: "conteúdo", nome: "obra.pdf" },
      capitulos: [criarCapitulo("capitulo-1"), criarCapitulo("capitulo-2")],
    }),
    "novo-capitulo",
  );

  assert.equal(dados.iconeConteudoObra, "📄");
  assert.equal(dados.totalConteudoObra, "1");
  assert.equal(dados.ultimoCapituloPublicado?.id, "capitulo-2");
  assert.equal(dados.numeroUltimoCapitulo, 2);
  assert.equal(dados.ultimoCapituloHref, "/ler/obra-1/capitulo-2/2");
  assert.equal(dados.actionHref, dados.ultimoCapituloHref);
  assert.equal(dados.actionLabel, "Ler agora");
  assert.equal(dados.actionSubLabel, "Cap 2");
  assert.equal(dados.cardComAlturaExtra, true);
});

test("home-local-work-card-view-utils preserva fallbacks, rotas e ação de catálogo", () => {
  const dados = criarDadosObraLocalCardHome(
    criarObra({
      autor: "Nome & Sobrenome",
      autorId: "",
      link: "   ",
      slug: "",
      titulo: "Título da Obra",
    }),
    "catalogo",
  );

  assert.equal(dados.slugObra, "título-da-obra");
  assert.equal(dados.verObraHref, "/obra/título-da-obra");
  assert.equal(dados.continuarLeituraHref, dados.verObraHref);
  assert.equal(dados.ultimoCapituloHref, dados.verObraHref);
  assert.equal(dados.perfilAutorHref, "/perfil-autor?autor=Nome%20%26%20Sobrenome");
  assert.equal(dados.actionHref, dados.verObraHref);
  assert.equal(dados.actionLabel, "Ver obra");
  assert.equal(dados.actionSubLabel, "");
  assert.equal(dados.cardComAlturaExtra, false);
});

test("home-local-work-card-view-utils estabelece a fronteira pura do card local", () => {
  assert.match(modulo, /export function criarDadosObraLocalCardHome\(/);
  assert.match(modulo, /obra\.capitulos\.length > 0 \? obra\.capitulos\[obra\.capitulos\.length - 1\] : null/);
  assert.match(modulo, /const slugObra = obra\.slug \|\| criarSlugBase\(obra\.titulo\);/);
  assert.match(modulo, /obra\.link\?\.trim\(\) \|\| `\/obra\/\$\{slugObra\}`/);
  assert.match(modulo, /Leitura Cap\. \$\{String\(numeroCapituloContinuar\)\.padStart\(2, "0"\)\}/);
  assert.match(modulo, /const cardComAlturaExtra = progressoLeitura > 0 \|\| tipo === "novo-capitulo";/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState|from "react"/);
  assert.match(componente, /export default function MobileObraLocalCard\(/);
  assert.match(componente, /from "\.\.\/app\/lib\/home-local-work-card-view-utils";/);
  assert.match(componente, /\} = criarDadosObraLocalCardHome\(obra, tipo\);/);
  assert.match(pagina, /import MobileObraLocalCard from "\.\.\/components\/HomeLocalWorkCard";/);
  assert.doesNotMatch(pagina, /function MobileObraLocalCard\(/);
  assert.doesNotMatch(pagina, /const capituloParaContinuar = encontrarCapituloParaContinuar\(obra\);/);
});
