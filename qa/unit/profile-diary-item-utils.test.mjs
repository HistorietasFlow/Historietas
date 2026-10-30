import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-item-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const contentViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-content-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const diaryItemRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-diary-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const aboutRecentActivitySource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-recent-activity.tsx",
    import.meta.url,
  ),
  "utf8",
);
const diaryLoaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const diaryPanelSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-diary-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(
  utilsSource
    .replace(
      'import { criarSlugBase } from "../../../lib/utils";',
      'const criarSlugBase = (texto) => texto.trim().toLowerCase().replace(/\\s+/g, "-");',
    )
    .replace(
      'import { pegarTexto } from "./data-normalizers";',
      'const pegarTexto = (valor, fallback = "") => typeof valor === "string" && valor.trim() ? valor.trim() : fallback;',
    )
    .replace(
      'import { formatarMediaAvaliacaoAutor } from "./profile-formatters";',
      'const formatarMediaAvaliacaoAutor = (nota) => String(nota);',
    )
    .replace(
      `import {
  obterDataRegistroDiario,
  obterVisibilidadeRegistroDiario,
} from "./profile-diary-record-utils";`,
      `const obterDataRegistroDiario = (registro) => registro.data || "";
const obterVisibilidadeRegistroDiario = (registro, fallback) =>
  ["publico", "parcial", "privado"].includes(registro.visibilidade)
    ? registro.visibilidade
    : fallback;`,
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  criarHrefListaDiarioPerfilAutor,
  diarioSemItensPerfilAutor,
  criarItemAtividadeDiarioPerfil,
  criarItemDiarioPerfil,
  montarMapaObrasDiario,
  obterHrefItemDiarioPerfil,
  obterMetadataDiarioPerfil,
  obterObraRegistroDiario,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const criarObra = (sobrescrever = {}) => ({
  id: "obra-1",
  titulo: "Minha Obra",
  slug: "minha-obra",
  link: "/obra/minha-obra",
  capitulos: [],
  ...sobrescrever,
});

test("estado vazio do Diário depende apenas da ausência de itens", () => {
  assert.equal(diarioSemItensPerfilAutor([]), true);
  assert.equal(diarioSemItensPerfilAutor([{ chave: "a" }]), false);
});


test("Perfil de Autor delega o estado vazio do Diário ao helper", () => {
  assert.match(
    pagina,
    /diarioSemItensPerfilAutor,[\s\S]*?from "\.\/lib\/profile-diary-item-utils";/,
  );
  assert.equal(
    (pagina.match(/diarioSemItensPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /getIsEmpty=\{\(\) => diarioSemItensPerfilAutor\(itensDiarioTudo\)\}/,
  );
  assert.doesNotMatch(
    pagina,
    /getIsEmpty=\{\(\) => itensDiarioTudo\.length === 0\}/,
  );
});


test("Perfil de Autor deriva o carregamento do Diário uma única vez", () => {
  assert.match(
    contentViewStateSource,
    /const diarioPerfilCarregando = diarioPerfil\.carregando;/,
  );
  assert.equal(
    (contentViewStateSource.match(/diarioPerfil\.carregando/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /<ProfileLibraryPanel[\s\S]*?loading=\{diarioPerfilCarregando\}/,
  );
  assert.match(
    pagina,
    /getIsLoading=\{\(\) => diarioPerfilCarregando\}/,
  );
  assert.match(
    pagina,
    /loading=\{diarioPerfilCarregando\}/,
  );
});


test("criarItemDiarioPerfil preserva chave, referências e fallbacks de URL", () => {
  const obra = criarObra();
  const item = criarItemDiarioPerfil(
    "lendo",
    obra,
    "2026-10-10",
    "Lendo agora.",
    { progresso: 50, visibilidade: "parcial" },
  );

  assert.deepEqual(item, {
    chave: "lendo-obra-1-2026-10-10",
    tipo: "lendo",
    titulo: "Minha Obra",
    descricao: "Lendo agora.",
    data: "2026-10-10",
    obra,
    href: "/obra/minha-obra",
    progresso: 50,
    visibilidade: "parcial",
  });
  assert.equal(item.obra, obra);

  const semLink = criarItemDiarioPerfil(
    "favorita",
    criarObra({ id: "obra-2", slug: "", link: "", titulo: "Outra Obra" }),
    "",
    "Favorita.",
  );

  assert.equal(semLink.chave, "favorita-obra-2-obra-2");
  assert.equal(semLink.href, "/obra/outra-obra");
});

test("metadata e href preservam registros incompletos e prioridades", () => {
  assert.deepEqual(obterMetadataDiarioPerfil({}), {});
  assert.deepEqual(obterMetadataDiarioPerfil({ metadata: [] }), {});

  const metadata = { post_id: "post-1" };
  assert.equal(obterMetadataDiarioPerfil({ metadata }), metadata);

  assert.equal(
    obterHrefItemDiarioPerfil({ href: " /direto ", obra: null }),
    " /direto ",
  );
  assert.equal(
    obterHrefItemDiarioPerfil({ href: "", obra: criarObra({ link: "", slug: "" }) }),
    "/obra/minha-obra",
  );
  assert.equal(obterHrefItemDiarioPerfil({ href: "", obra: null }), "/comunidade");
});

test("mapas e resolução priorizam obra antes de capítulo e preservam referências", () => {
  const obraPorId = criarObra({
    id: "obra-1",
    capitulos: [{ id: "capitulo-1" }],
  });
  const obraPorCapitulo = criarObra({
    id: "obra-2",
    capitulos: [{ id: "capitulo-2" }],
  });
  const { obrasPorId, obrasPorCapituloId } = montarMapaObrasDiario([
    obraPorId,
    obraPorCapitulo,
  ]);

  assert.equal(obrasPorId.get("obra-1"), obraPorId);
  assert.equal(obrasPorCapituloId.get("capitulo-2"), obraPorCapitulo);
  assert.equal(
    obterObraRegistroDiario(
      { obra_id: "obra-1", capitulo_id: "capitulo-2" },
      obrasPorId,
      obrasPorCapituloId,
    ),
    obraPorId,
  );
  assert.equal(
    obterObraRegistroDiario(
      { capituloId: "capitulo-2" },
      obrasPorId,
      obrasPorCapituloId,
    ),
    obraPorCapitulo,
  );
  assert.equal(
    obterObraRegistroDiario({ obra_id: "ausente" }, obrasPorId, obrasPorCapituloId),
    null,
  );
});

test("atividades preservam tipos, avaliações, reviews, URLs e visibilidade", () => {
  const obra = criarObra();
  const obrasPorId = new Map([[obra.id, obra]]);
  const obrasPorCapituloId = new Map();
  const avaliacao = criarItemAtividadeDiarioPerfil(
    {
      id: "atividade-1",
      tipo: "avaliou_obra",
      obra_id: obra.id,
      data: "2026-10-10",
      nota: 4.5,
      visibilidade: "publico",
    },
    obrasPorId,
    obrasPorCapituloId,
  );

  assert.deepEqual(avaliacao, {
    chave: "atividade-atividade-1-2026-10-10",
    tipo: "avaliacao",
    titulo: "Minha Obra",
    descricao: "Avaliou com 4,5 estrelas.",
    data: "2026-10-10",
    obra,
    href: "/obra/minha-obra",
    nota: 4.5,
    visibilidade: "publico",
  });

  const review = criarItemAtividadeDiarioPerfil(
    {
      id: "review-1",
      tipo: "publicou_review",
      data: "2026-10-11",
      metadata: { post_id: "post com espaço" },
      texto: "r".repeat(91),
      visibilidade: "invalida",
    },
    obrasPorId,
    obrasPorCapituloId,
  );

  assert.equal(review.tipo, "review");
  assert.equal(review.titulo, "Review publicada");
  assert.equal(review.descricao, `Publicou review: ${"r".repeat(90)}...`);
  assert.equal(review.href, "/comunidade?post=post%20com%20espa%C3%A7o");
  assert.equal(review.nota, undefined);
  assert.equal(review.visibilidade, "publico");

  const lista = criarItemAtividadeDiarioPerfil(
    { id: "lista-1", tipo: "criou_lista", data: "2026-10-12" },
    obrasPorId,
    obrasPorCapituloId,
  );
  assert.equal(lista.tipo, "atividade");
  assert.equal(lista.descricao, "Criou uma lista de leitura.");
  assert.equal(lista.visibilidade, "privado");
});

test("Perfil de Autor delega construção e resolução de itens ao carregador do Diário", () => {
  assert.match(
    utilsSource,
    /import type \{ DiarioPerfilItem, ObraLocal \} from "\.\.\/types";/,
  );
  assert.match(utilsSource, /import \{ criarSlugBase \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/);
  assert.match(utilsSource, /import \{ pegarTexto \} from "\.\/data-normalizers";/);
  assert.match(utilsSource, /import \{ formatarMediaAvaliacaoAutor \} from "\.\/profile-formatters";/);
  assert.match(utilsSource, /obterDataRegistroDiario,[\s\S]*?obterVisibilidadeRegistroDiario/);
  assert.match(
    aboutRecentActivitySource,
    /import \{ obterHrefItemDiarioPerfil \} from "\.\.\/lib\/profile-diary-item-utils";/,
  );
  assert.match(
    diaryLoaderSource,
    /import \{[\s\S]*?criarItemAtividadeDiarioPerfil,[\s\S]*?criarItemDiarioPerfil,[\s\S]*?montarMapaObrasDiario,[\s\S]*?obterObraRegistroDiario,[\s\S]*?\} from "\.\/profile-diary-item-utils";/,
  );

  for (const helper of [
    "criarItemDiarioPerfil",
    "obterMetadataDiarioPerfil",
    "obterHrefItemDiarioPerfil",
    "montarMapaObrasDiario",
    "obterObraRegistroDiario",
    "criarItemAtividadeDiarioPerfil",
  ]) {
    assert.match(utilsSource, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(diaryLoaderSource, /criarItemDiarioPerfil\(\s*"lendo",/);
  assert.match(aboutRecentActivitySource, /obterHrefItemDiarioPerfil\(item\)/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect|localStorage/);
});


test("hrefs da página Listas preservam perfil, obra e encoding", () => {
  assert.equal(
    criarHrefListaDiarioPerfilAutor(" usuario 1 "),
    "/listas?modo=perfil&origem=diario&categoria=tudo&usuario=usuario%201",
  );
  assert.equal(
    criarHrefListaDiarioPerfilAutor("usuario-2", "obra com espaço"),
    "/listas?modo=perfil&origem=diario&categoria=tudo&obra=obra+com+espa%C3%A7o&usuario=usuario-2",
  );
  assert.equal(
    criarHrefListaDiarioPerfilAutor("", "obra-3"),
    "/listas?modo=perfil&origem=diario&categoria=tudo&obra=obra-3",
  );
});

test("Perfil de Autor reutiliza hrefs centralizados do Diário", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefListaDiarioPerfilAutor,[\s\S]*?diarioSemItensPerfilAutor,[\s\S]*?\} from "\.\/lib\/profile-diary-item-utils";/,
  );
  assert.equal(
    (pagina.match(/criarHrefListaDiarioPerfilAutor\(/g) || []).length,
    1,
  );
  assert.equal(
    (diaryItemRendererSource.match(/criarHrefListaDiarioPerfilAutor\(/g) || [])
      .length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /const parametrosLista = new URLSearchParams/,
  );
});

test("Perfil de Autor delega o map do Diario ao painel e prepara cada item", () => {
  assert.match(
    diaryPanelSource,
    /type ProfileDiaryPanelProps<T> = \{[\s\S]*?items: T\[];[\s\S]*?renderItem: \(item: T\) => ReactNode;/,
  );
  assert.match(diaryPanelSource, /items\.map\(renderItem\)/);
  assert.match(
    diaryItemRendererSource,
    /const renderizarItemDiarioPerfil = \(item: DiarioPerfilResumoItem\) => \{[\s\S]*?const obra = item\.obra;[\s\S]*?if \(!obra\) \{[\s\S]*?return null;[\s\S]*?<DiarySummaryCard[\s\S]*?key=\{obra\.id \|\| item\.chave\}[\s\S]*?href=\{hrefLista\}[\s\S]*?obra=\{obra\}/,
  );
  assert.match(
    diaryItemRendererSource,
    /criarHrefListaDiarioPerfilAutor\([\s\S]*?perfilAutorId,[\s\S]*?obra\.id,/,
  );
  assert.match(
    pagina,
    /import \{ usePerfilAutorDiaryItemRenderer \} from "\.\/hooks\/use-perfil-autor-diary-item-renderer";/,
  );
  assert.match(
    pagina,
    /const \{ renderizarItemDiarioPerfil \} =[\s\S]*?usePerfilAutorDiaryItemRenderer\(perfilAutorId\);/,
  );
  assert.match(
    pagina,
    /<ProfileDiaryPanel[\s\S]*?items=\{itensDiarioTudo\}[\s\S]*?renderItem=\{renderizarItemDiarioPerfil\}/,
  );
  assert.doesNotMatch(pagina, /itensDiarioTudo\.map\(/);
});
