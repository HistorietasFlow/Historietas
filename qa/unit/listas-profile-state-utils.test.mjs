import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const source = readFileSync(
  new URL("../../app/listas/lib/listas-profile-state-utils.ts", import.meta.url),
  "utf8",
);
const profileItemsSource = readFileSync(
  new URL("../../app/listas/lib/listas-profile-items-utils.ts", import.meta.url),
  "utf8",
);
const recordsLoader = readFileSync(
  new URL("../../app/listas/lib/listas-profile-records-loader.ts", import.meta.url),
  "utf8",
);
const worksLoader = readFileSync(
  new URL("../../app/listas/lib/listas-published-works-loader.ts", import.meta.url),
  "utf8",
);
const profileLoader = readFileSync(
  new URL("../../app/listas/lib/listas-profile-loader.ts", import.meta.url),
  "utf8",
);

async function importarModulo(codigo) {
  const javascript = typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const timestampData = (valor) => Date.parse(valor) || 0;
const pegarTexto = (valor, fallback = "") =>
  typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
const pegarNumero = (valor, fallback = 0) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
};
const dataRegistro = (registro) =>
  pegarTexto(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at,
  );
const obterIdentificadoresObraListas = (obra) =>
  [obra.id, obra.slug, obra.titulo].filter(Boolean);
const itens = await importarModulo(
  profileItemsSource
    .replace('import { dataRegistro } from "./listas-diary-annotation-utils";', `const dataRegistro = ${dataRegistro.toString()};`)
    .replace('import { timestampData } from "./listas-format-utils";', `const timestampData = ${timestampData.toString()};`)
    .replace('import { obterIdentificadoresObraListas } from "./listas-local-work-utils";', `const obterIdentificadoresObraListas = ${obterIdentificadoresObraListas.toString()};`),
);
const montarMapaAnotacoesPorObraListas = (registros) => {
  const mapa = new Map();
  for (const registro of registros) {
    const obraId = pegarTexto(registro.obra_id);
    if (!obraId || !pegarTexto(registro.texto)) continue;
    const existente = mapa.get(obraId.toLowerCase());
    if (!existente || timestampData(existente.atualizadoEm) < timestampData(dataRegistro(registro))) {
      mapa.set(obraId.toLowerCase(), {
        id: pegarTexto(registro.id),
        texto: pegarTexto(registro.texto),
        tipo: pegarTexto(registro.tipo),
        visibilidade: pegarTexto(registro.visibilidade, "publico"),
        quemPodeComentar: pegarTexto(registro.quem_pode_comentar, "herdar"),
        visibilidadeComentarios: pegarTexto(registro.visibilidade_comentarios, "herdar"),
        permitirCurtidas: registro.permitir_curtidas !== false,
        contemSpoiler: registro.contem_spoiler === true,
        atualizadoEm: dataRegistro(registro),
      });
    }
  }
  return mapa;
};
const aplicarAnotacoesAosItensListas = (itensPerfil, anotacoes) =>
  itensPerfil.map((item) => {
    const anotacao = anotacoes.get(item.obra.id.toLowerCase());
    return anotacao ? { ...item, anotacao: anotacao.texto, anotacaoId: anotacao.id } : item;
  });
const obterProgressoObraLocalListas = (registro) => ({
  progresso: pegarNumero(registro.progresso),
  data: pegarTexto(registro.ultimaLeituraEm),
  capituloId: pegarTexto(registro.ultimoCapituloLidoId),
});
const utils = await importarModulo(
  source
    .replace('import { criarSlugBase } from "../../../lib/utils";', 'const criarSlugBase = (valor) => String(valor).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");')
    .replace(/import \{[\s\S]*?\} from "\.\/listas-diary-annotation-utils";/, `const aplicarAnotacoesAosItensListas = ${aplicarAnotacoesAosItensListas.toString()}; const dataRegistro = ${dataRegistro.toString()}; const montarMapaAnotacoesPorObraListas = ${montarMapaAnotacoesPorObraListas.toString()};`)
    .replace('import { timestampData } from "./listas-format-utils";', `const timestampData = ${timestampData.toString()};`)
    .replace(/import \{[\s\S]*?\} from "\.\/listas-local-work-utils";/, `const obterProgressoObraLocalListas = ${obterProgressoObraLocalListas.toString()};`)
    .replace(/import \{[\s\S]*?\} from "\.\/listas-profile-items-utils";/, `const normalizarIdentificadorColecaoListas = ${itens.normalizarIdentificadorColecaoListas.toString()}; const obterIdentificadoresObraListas = ${obterIdentificadoresObraListas.toString()}; const criarItemPerfil = ${itens.criarItemPerfil.toString()}; const criarMapaObrasPorIdentificadorListas = ${itens.criarMapaObrasPorIdentificadorListas.toString()}; const encontrarObraColecaoLocalListas = ${itens.encontrarObraColecaoLocalListas.toString()}; const mesclarItensLocaisCategoriaPerfil = ${itens.mesclarItensLocaisCategoriaPerfil.toString()}; const mesclarTudoPerfil = ${itens.mesclarTudoPerfil.toString()}; const ordenarPorData = ${itens.ordenarPorData.toString()};`)
    .replace('import { pegarNumero, pegarTexto } from "./listas-value-utils";', `const pegarNumero = ${pegarNumero.toString()}; const pegarTexto = ${pegarTexto.toString()};`),
);

function criarObra(id, capitulos = []) {
  return {
    id,
    autorId: "autor-outro",
    titulo: `Obra ${id}`,
    autor: "Autora",
    genero: "Fantasia",
    formato: "Romance",
    classificacaoIndicativa: "L",
    capa: "",
    slug: id,
    link: `/obra/${id}`,
    publicadaEm: "2024-01-01",
    visualizacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    capitulos,
    notaMedia: 0,
    totalAvaliacoes: 0,
  };
}

function montar(args = {}) {
  return utils.montarListasPerfilEstado({
    userId: "leitor",
    proprioPerfil: true,
    seguindo: [],
    favoritas: [],
    concluidas: [],
    avaliacoes: [],
    progressoCompleto: [],
    anotacoesVisiveis: [],
    seguindoLocais: [],
    favoritasLocais: [],
    concluidasLocais: [],
    obrasLocais: [],
    obras: [],
    ...args,
  });
}

test("Listas delega modelos e montagem pura do estado do perfil", () => {
  for (const helper of [
    "registroPermitido",
    "montarListasPerfilEstado",
  ]) {
    assert.doesNotMatch(page, new RegExp(`function ${helper}\\(`));
    assert.match(source, new RegExp(`export function ${helper}\\b`));
  }
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
  assert.match(
    recordsLoader,
    /import \{ criarPerfilLista \} from "\.\/listas-profile-state-utils";/,
  );
  assert.match(
    worksLoader,
    /import \{ criarObraLista \} from "\.\/listas-profile-state-utils";/,
  );
  assert.match(
    profileLoader,
    /import \{[\s\S]*?montarListasPerfilEstado,[\s\S]*?registroPermitido,[\s\S]*?\} from "\.\/listas-profile-state-utils";/,
  );
  assert.match(profileLoader, /carregarRegistrosUsuario\(/);
  assert.match(profileLoader, /carregarObrasPublicadas\(/);
});

test("modelos preservam fallbacks e visibilidade", () => {
  assert.deepEqual(utils.criarObraLista({}, 0), {
    id: "obra-1",
    autorId: "",
    titulo: "Obra 1",
    autor: "Autor não informado",
    genero: "Não informado",
    formato: "Não informado",
    classificacaoIndicativa: "",
    capa: "",
    slug: "obra-1",
    link: "/obra/obra-1",
    publicadaEm: "",
    visualizacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    capitulos: [],
    notaMedia: 0,
    totalAvaliacoes: 0,
  });
  assert.equal(utils.criarPerfilLista(null, "u-1", "  Nome  ").nome, "Nome");
  assert.equal(utils.registroPermitido({ visibilidade: "privado" }, false), false);
  assert.equal(utils.registroPermitido({ visibilidade: "privado" }, true), true);
});

test("builder preserva remoto, local, concluídas, progresso, histórico, notas e anotações", () => {
  const obraA = criarObra("obra-a", [
    { id: "a-1", titulo: "Capítulo 1", ordem: 1 },
    { id: "a-2", titulo: "Capítulo 2", ordem: 2 },
  ]);
  const obraB = criarObra("obra-b", [{ id: "b-1", titulo: "Capítulo B", ordem: 1 }]);
  const obraC = criarObra("obra-c");
  const estado = montar({
    obras: [obraA, obraB, obraC],
    seguindo: [
      { obra_id: "obra-a", criado_em: "2024-01-01" },
      { obra_id: "obra-b", criado_em: "2024-01-02" },
    ],
    favoritas: [{ obra_id: "obra-a", criado_em: "2024-01-03" }],
    concluidas: [{ obra_id: "obra-b", criado_em: "2024-01-04" }],
    avaliacoes: [{ obra_id: "obra-a", nota: 3.3, criado_em: "2024-01-05" }],
    progressoCompleto: [
      { obra_id: "obra-a", capitulo_id: "a-1", lido: true, progresso: 100, atualizado_em: "2024-02-01" },
      { obra_id: "obra-b", capitulo_id: "b-1", lido: true, progresso: 100, atualizado_em: "2024-02-02" },
    ],
    seguindoLocais: ["obra-c"],
    obrasLocais: [{ id: "obra-c", progresso: 100, ultimaLeituraEm: "2024-03-01" }],
    anotacoesVisiveis: [{ id: "anotacao-a", obra_id: "obra-a", tipo: "review", texto: "Anotação", atualizado_em: "2024-04-01" }],
  });

  assert.deepEqual(estado["quero-ler"].map((item) => item.obra.id), ["obra-a", "obra-c"]);
  assert.deepEqual(estado.concluidas.map((item) => item.obra.id), ["obra-b"]);
  assert.equal(estado.lendo.find((item) => item.obra.id === "obra-a")?.progresso, 50);
  assert.equal(estado.lendo.find((item) => item.obra.id === "obra-a")?.capituloAtual, "Capítulo 1");
  assert.equal(estado.lendo.find((item) => item.obra.id === "obra-c")?.progresso, 99);
  assert.equal(estado.lendo.some((item) => item.obra.id === "obra-b"), false);
  assert.equal(estado.historico.some((item) => item.obra.id === "obra-b"), true);
  assert.equal(estado.avaliacoes[0].nota, 3.5);
  assert.equal(estado.tudo.find((item) => item.obra.id === "obra-a")?.anotacao, "Anotação");
  assert.deepEqual(
    estado.tudo.find((item) => item.obra.id === "obra-a")?.categorias.sort(),
    ["avaliacoes", "favoritas", "lendo", "quero-ler", "historico"].sort(),
  );
});

test("builder mantém registros privados fora do perfil visitante", () => {
  const obra = criarObra("obra-privada");
  const estado = montar({
    proprioPerfil: false,
    obras: [obra],
    seguindo: [{ obra_id: obra.id, visibilidade: "privado", criado_em: "2024-01-01" }],
    favoritas: [{ obra_id: obra.id, visibilidade: "publico", criado_em: "2024-01-02" }],
    avaliacoes: [{ obra_id: obra.id, visibilidade: "privado", nota: 4, criado_em: "2024-01-03" }],
  });

  assert.deepEqual(estado["quero-ler"], []);
  assert.deepEqual(estado.avaliacoes, []);
  assert.deepEqual(estado.favoritas.map((item) => item.obra.id), [obra.id]);
});
