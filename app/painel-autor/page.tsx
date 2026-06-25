"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import type { CSSProperties } from "react";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

type ObraLocal = {
  id: string;
  autorId?: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
  totalCurtidasPainel?: number;
  totalComentariosPainel?: number;
  totalSalvosPainel?: number;
  totalLidosPainel?: number;
};


type SupabaseObraRow = {
  id: string;
  user_id?: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id?: string | null;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type ProfilePainelAutorRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  sobre_bio?: string | null;
};

type RegistroSupabaseGenerico = Record<string, unknown>;

type ObraComMetricas = ObraLocal & {
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalLidos: number;
  progressoLeitura: number;
  ultimoCapituloLido: CapituloLocal | null;
  pontuacao: number;
};


type FiltroPainel =
  | "todas"
  | "publicadas"
  | "rascunhos"
  | "sem-capitulos"
  | "favoritas"
  | "concluidas"
  | "em-leitura";

type OrdenacaoPainel =
  | "pontuacao"
  | "recentes"
  | "titulo"
  | "capitulos"
  | "progresso";

const FILTROS_PAINEL: { valor: FiltroPainel; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas as obras" },
  { valor: "publicadas", rotulo: "Publicadas" },
  { valor: "rascunhos", rotulo: "Rascunhos" },
  { valor: "sem-capitulos", rotulo: "Sem capítulos" },
  { valor: "favoritas", rotulo: "Na lista" },
  { valor: "concluidas", rotulo: "Concluídas" },
  { valor: "em-leitura", rotulo: "Em leitura" },
];

const ORDENACOES_PAINEL: { valor: OrdenacaoPainel; rotulo: string }[] = [
  { valor: "pontuacao", rotulo: "Melhor desempenho" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "titulo", rotulo: "Título" },
  { valor: "capitulos", rotulo: "Mais capítulos" },
  { valor: "progresso", rotulo: "Maior progresso" },
];

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

function criarLoginHrefPainelAutor() {
  const params = new URLSearchParams({
    redirectTo: "/painel-autor",
  });

  return `/login?${params.toString()}`;
}

function criarHrefLeituraCapituloPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: Pick<CapituloLocal, "id">,
  numeroCapitulo: number
) {
  const slugSeguro = obra.slug?.trim() || criarSlugBase(obra.titulo);

  if (
    obra.publicado &&
    idObraSupabaseValido(obra.id) &&
    slugSeguro &&
    Number.isInteger(numeroCapitulo) &&
    numeroCapitulo > 0
  ) {
    return `/obra/${encodeURIComponent(slugSeguro)}/capitulo/${numeroCapitulo}`;
  }

  return `/ler-capitulo?obraId=${encodeURIComponent(
    obra.id
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function formatarGeneroPainelAutor(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTexto(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") {
    return "Ficção";
  }

  return generoLimpo || "Não informado";
}

function obterTimestamp(dataIso: string) {
  const timestamp = new Date(dataIso).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function calcularCurtidas(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function calcularComentarios(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function calcularSalvos(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.salvo).length;
}

function calcularLidos(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.lido).length;
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : null;

  if (capituloRegistrado) {
    return capituloRegistrado;
  }

  const capitulosAtivos = obra.capitulos.filter((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });

  return capitulosAtivos[capitulosAtivos.length - 1] || null;
}

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada"
  );
}

function criarPainelCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return {
      ...coverStyle,
      background: "#04000A",
      backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...coverStyle,
    background: "#04000A",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarPainelCoverDesktopStyle(capa: string): CSSProperties {
  return {
    ...criarPainelCoverStyle(capa),
    minHeight: "152px",
    height: "100%",
  };
}

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  let categoria: ArquivoObraLocal["categoria"] = "outro";

  if (
    arquivo.categoria === "texto" ||
    arquivo.categoria === "documento" ||
    arquivo.categoria === "imagem" ||
    arquivo.categoria === "outro"
  ) {
    categoria = arquivo.categoria;
  }

  return {
    nome: arquivo.nome,
    tipo: typeof arquivo.tipo === "string" ? arquivo.tipo : "",
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria,
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  try {
    const backupTexto = lerStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([obraId, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (obraId.trim() && arquivoNormalizado) {
        backupNormalizado[obraId] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupNormalizado
    );

    return backupNormalizado;
  } catch {
    salvarJsonStorageUsuarioPainel(FILE_BACKUP_STORAGE_KEY, userId, {});
    return {};
  }
}

function sincronizarBackupArquivosObras(obras: ObraLocal[], userId = "") {
  try {
    const backupAtual = carregarBackupArquivosObras(userId);

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        backupAtual[obra.id] = arquivoNormalizado;
      }
    });

    salvarJsonStorageUsuarioPainel(
      FILE_BACKUP_STORAGE_KEY,
      userId,
      backupAtual
    );
  } catch {
    // Se o backup falhar, o painel continua funcionando normalmente.
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = normalizarArquivoObra(backup[obra.id]);

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}

function normalizarCapitulo(
  capitulo: CapituloSalvo,
  capituloIndex: number,
  obraIndex: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : `Capítulo ${capituloIndex + 1}`,
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarObra(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex, obraIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${obraIndex + 1}`,
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
        ? obra.user_id.trim()
        : typeof obra.userId === "string" && obra.userId.trim()
        ? obra.userId.trim()
        : "",
    titulo:
      typeof obra.titulo === "string" && obra.titulo.trim()
        ? obra.titulo
        : "Obra sem título",
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${obraIndex + 1}`
          ),
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${
            typeof obra.slug === "string" && obra.slug.trim()
              ? obra.slug
              : criarSlugBase(
                  typeof obra.titulo === "string" && obra.titulo.trim()
                    ? obra.titulo
                    : `obra-${obraIndex + 1}`
                )
          }`,
  };
}

function normalizarListaIds(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    : [];
}

function criarStorageKeyUsuarioPainel(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : chave;
}

function lerStorageUsuarioPainel(chave: string, userId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(criarStorageKeyUsuarioPainel(chave, userId));
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioPainel(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPainel(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; o painel continua com estado em memória.
  }
}

function carregarListaIdsPainel(chave: string, userId: string) {
  try {
    const listaUsuarioTexto = lerStorageUsuarioPainel(chave, userId);
    const listaUsuarioJson: unknown = listaUsuarioTexto
      ? JSON.parse(listaUsuarioTexto)
      : [];

    return normalizarListaIds(listaUsuarioJson);
  } catch {
    return [] as string[];
  }
}

function salvarListaIdsUsuarioPainel(
  chave: string,
  userId: string,
  listaUsuario: string[]
) {
  const listaUsuarioNormalizada = normalizarListaIds(listaUsuario);

  salvarJsonStorageUsuarioPainel(chave, userId, listaUsuarioNormalizada);
}

function obterIdentificadoresObraPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((valor) => valor.trim())
        .filter(Boolean)
    )
  );
}

function colecaoTemObraPainel(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const itens = new Set(
    colecao
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return obterIdentificadoresObraPainel(obra).some((identificador) =>
    itens.has(identificador)
  );
}


function removerObraDaColecaoPainel(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const identificadoresObra = new Set(obterIdentificadoresObraPainel(obra));

  return colecao.filter((id) => !identificadoresObra.has(id.trim()));
}

function lerListaIdsStoragePainel(chave: string, userId = "") {
  try {
    const listaTexto = lerStorageUsuarioPainel(chave, userId);
    const listaJson: unknown = listaTexto ? JSON.parse(listaTexto) : [];

    return normalizarListaIds(listaJson);
  } catch {
    return [] as string[];
  }
}

function salvarColecaoAposExcluirPainel(
  chave: string,
  userId: string,
  listaUsuario: string[]
) {
  salvarJsonStorageUsuarioPainel(
    chave,
    userId,
    normalizarListaIds(listaUsuario)
  );
}

function limparReferenciasLocaisObraExcluidaPainel(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
  userId: string
) {
  [FOLLOW_STORAGE_KEY, FAVORITES_STORAGE_KEY, COMPLETED_STORAGE_KEY].forEach(
    (chave) => {
      try {
        const listaUsuario = removerObraDaColecaoPainel(
          lerListaIdsStoragePainel(chave, userId),
          obra
        );

        salvarJsonStorageUsuarioPainel(chave, userId, listaUsuario);
      } catch {
        // A limpeza local não pode impedir a exclusão da obra.
      }
    }
  );
}

async function removerReferenciasSupabaseObraExcluidaPainel(
  userId: string,
  obraId: string,
  capituloIds: string[]
) {
  const usuarioId = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capitulosValidos = capituloIds.map((id) => id.trim()).filter(Boolean);

  if (!usuarioId || !obraIdLimpo) {
    return;
  }

  try {
    await Promise.allSettled([
      supabase.from("favoritos").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("concluidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("seguindo_obras").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_curtidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_avaliacoes").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("progresso_leitura").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("diario_atividades").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
    ]);

    if (capitulosValidos.length > 0) {
      await Promise.allSettled([
        supabase.from("curtidas_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("salvos_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("comentarios_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
      ]);
    }
  } catch {
    // A exclusão principal da obra continua mesmo se a limpeza social falhar.
  }
}

function normalizarIdUsuarioPainel(valor: string) {
  return valor.trim().toLowerCase();
}

function obraPertenceAoUsuarioPainel(obra: Pick<ObraLocal, "autorId">, userId: string) {
  const autorIdObra = normalizarIdUsuarioPainel(obra.autorId || "");
  const usuarioId = normalizarIdUsuarioPainel(userId);

  return Boolean(usuarioId && autorIdObra && autorIdObra === usuarioId);
}

function filtrarObrasDoUsuarioPainel(obras: ObraLocal[], userId: string) {
  if (!userId.trim()) {
    return [] as ObraLocal[];
  }

  return obras.filter((obra) => obraPertenceAoUsuarioPainel(obra, userId));
}

function filtrarListaPorObrasDoUsuario(listaIds: string[], obrasUsuario: ObraLocal[]) {
  return listaIds.filter((id) => {
    const idLimpo = id.trim();

    return obrasUsuario.some((obra) =>
      obterIdentificadoresObraPainel(obra).includes(idLimpo)
    );
  });
}


function normalizarCategoriaArquivoSupabase(
  categoria: string | null,
  tipo: string | null
): ArquivoObraLocal["categoria"] {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  const tipoNormalizado = (tipo || "").toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (
    tipoNormalizado.includes("pdf") ||
    tipoNormalizado.includes("document") ||
    tipoNormalizado.includes("word")
  ) {
    return "documento";
  }

  if (tipoNormalizado.startsWith("text/") || tipoNormalizado.includes("markdown")) {
    return "texto";
  }

  return "outro";
}

function criarChaveInteracao(obraId: string, capituloId: string) {
  return `${obraId}::${capituloId}`;
}

function obterIdObraRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [
    registro.obra_id,
    registro.obraId,
    registro.id_obra,
    registro.obra,
  ];

  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string" ? valorEncontrado : "";
}

function obterIdCapituloRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [
    registro.capitulo_id,
    registro.capituloId,
    registro.id_capitulo,
    registro.capitulo,
  ];

  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string" ? valorEncontrado : "";
}

function obterTextoComentarioRegistro(registro: RegistroSupabaseGenerico) {
  const possiveisCampos = [registro.comentario, registro.texto, registro.conteudo];
  const valorEncontrado = possiveisCampos.find(
    (valor) => typeof valor === "string" && Boolean(valor.trim())
  );

  return typeof valorEncontrado === "string" ? valorEncontrado : "";
}

const CAMPOS_REGISTROS_PAINEL_AUTOR: Record<string, string> = {
  favoritos: "user_id,obra_id",
  concluidas: "user_id,obra_id",
  salvos_capitulos: "user_id,capitulo_id",
  curtidas_capitulos: "user_id,capitulo_id",
  comentarios_capitulos: "user_id,capitulo_id,comentario,texto",
  progresso_leitura: "user_id,obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
  obra_curtidas: "user_id,obra_id",
  seguindo_obras: "user_id,obra_id",
};

function obterCamposRegistrosPainelAutor(tabela: string) {
  return CAMPOS_REGISTROS_PAINEL_AUTOR[tabela] || "id";
}

async function carregarRegistrosObraSupabase(
  tabela: string,
  obraIds: string[],
  userId?: string,
  capituloIds: string[] = []
) {
  if (obraIds.length === 0 && capituloIds.length === 0) {
    return [] as RegistroSupabaseGenerico[];
  }

  async function tentarPorObraId() {
    if (obraIds.length === 0) {
      return null as RegistroSupabaseGenerico[] | null;
    }

    let query = supabase.from(tabela).select(obterCamposRegistrosPainelAutor(tabela)).in("obra_id", obraIds);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      return null;
    }

    return Array.isArray(data) ? (data as unknown as RegistroSupabaseGenerico[]) : [];
  }

  async function tentarPorCapituloId() {
    if (capituloIds.length === 0) {
      return null as RegistroSupabaseGenerico[] | null;
    }

    let query = supabase.from(tabela).select(obterCamposRegistrosPainelAutor(tabela)).in("capitulo_id", capituloIds);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      return null;
    }

    return Array.isArray(data) ? (data as unknown as RegistroSupabaseGenerico[]) : [];
  }

  try {
    const porObraId = await tentarPorObraId();

    if (porObraId) {
      return porObraId;
    }

    const porCapituloId = await tentarPorCapituloId();

    if (porCapituloId) {
      return porCapituloId;
    }

    console.warn(
      `Não consegui carregar ${tabela} no Painel do Autor por obra_id nem capitulo_id.`
    );

    return [];
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Painel do Autor:`, error);

    return [];
  }
}

function criarSetObrasPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .map((registro) => obterIdObraRegistro(registro))
      .filter((obraId) => Boolean(obraId))
  );
}

function criarSetCapitulosPorRegistro(registros: RegistroSupabaseGenerico[]) {
  return new Set(
    registros
      .flatMap((registro) => {
        const obraId = obterIdObraRegistro(registro);
        const capituloId = obterIdCapituloRegistro(registro);

        if (!capituloId) {
          return [] as string[];
        }

        return obraId
          ? [criarChaveInteracao(obraId, capituloId), capituloId]
          : [capituloId];
      })
      .filter((chave) => Boolean(chave))
  );
}

function criarMapaComentariosPorRegistro(registros: RegistroSupabaseGenerico[]) {
  const mapa = new Map<string, string>();
  const contagem = new Map<string, number>();

  registros.forEach((registro) => {
    const obraId = obterIdObraRegistro(registro);
    const capituloId = obterIdCapituloRegistro(registro);

    if (!obraId || !capituloId) {
      return;
    }

    const chave = criarChaveInteracao(obraId, capituloId);
    const comentario = obterTextoComentarioRegistro(registro);

    contagem.set(chave, (contagem.get(chave) || 0) + 1);
    contagem.set(capituloId, (contagem.get(capituloId) || 0) + 1);

    if (comentario && !mapa.has(chave)) {
      mapa.set(chave, comentario);
    }

    if (comentario && !mapa.has(capituloId)) {
      mapa.set(capituloId, comentario);
    }
  });

  contagem.forEach((total, chave) => {
    if (!mapa.has(chave) && total > 0) {
      mapa.set(chave, total === 1 ? "1 comentário" : `${total} comentários`);
    }
  });

  return mapa;
}

function contarRegistrosRelacionadosObraPainel(
  registros: RegistroSupabaseGenerico[],
  obraId: string,
  capitulos: SupabaseCapituloRow[]
) {
  const obraIdLimpo = obraId.trim();
  const capituloIds = new Set(
    capitulos
      .map((capitulo) => capitulo.id.trim())
      .filter(Boolean)
  );

  return registros.filter((registro) => {
    const obraRegistro = obterIdObraRegistro(registro);
    const capituloRegistro = obterIdCapituloRegistro(registro);

    return (
      Boolean(obraIdLimpo && obraRegistro === obraIdLimpo) ||
      Boolean(capituloRegistro && capituloIds.has(capituloRegistro))
    );
  }).length;
}

function converterObraSupabaseParaLocalPainel({
  obraBanco,
  capitulosBanco,
  obraLocal,
  capitulosSalvos,
  capitulosCurtidos,
  capitulosLidos,
  comentariosCapitulos,
  index,
}: {
  obraBanco: SupabaseObraRow;
  capitulosBanco: SupabaseCapituloRow[];
  obraLocal?: ObraLocal;
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  capitulosLidos: Set<string>;
  comentariosCapitulos: Map<string, string>;
  index: number;
}): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos = capitulosBanco.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const chaveInteracao = criarChaveInteracao(obraBanco.id, capitulo.id);
    const comentarioSupabase =
      comentariosCapitulos.get(chaveInteracao) ||
      comentariosCapitulos.get(capitulo.id) ||
      "";
    const lidoSupabase =
      capitulosLidos.has(chaveInteracao) || capitulosLidos.has(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto:
        typeof capitulo.texto === "string"
          ? capitulo.texto
          : capituloLocal?.texto || "",
      curtiu:
        Boolean(capituloLocal?.curtiu) ||
        capitulosCurtidos.has(chaveInteracao) ||
        capitulosCurtidos.has(capitulo.id),
      salvo:
        Boolean(capituloLocal?.salvo) ||
        capitulosSalvos.has(chaveInteracao) ||
        capitulosSalvos.has(capitulo.id),
      comentario: comentarioSupabase || capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido) || lidoSupabase,
      lidoEm:
        capituloLocal?.lidoEm ||
        (lidoSupabase ? capitulo.atualizado_em || capitulo.criado_em || "" : ""),
    } satisfies CapituloLocal;
  });

  const idsRemotos = new Set(capitulosRemotos.map((capitulo) => capitulo.id));
  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !idsRemotos.has(capitulo.id)
  );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];

  const tituloObra =
    obraBanco.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obraBanco.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obraBanco.arquivo_url?.trim() || "";

  return {
    id: obraBanco.id || obraLocal?.id || `obra-${index + 1}`,
    autorId: obraBanco.user_id?.trim() || obraLocal?.autorId || "",
    titulo: tituloObra,
    autor: obraBanco.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obraBanco.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraBanco.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraBanco.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraBanco.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraBanco.tags) && obraBanco.tags.length > 0
        ? obraBanco.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obraBanco.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraBanco.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obraBanco.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: obraBanco.arquivo_tipo?.trim() || obraLocal?.arquivoObra?.tipo || "",
          tamanho:
            typeof obraBanco.arquivo_tamanho === "number" &&
            Number.isFinite(obraBanco.arquivo_tamanho)
              ? obraBanco.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: normalizarCategoriaArquivoSupabase(
            obraBanco.arquivo_categoria,
            obraBanco.arquivo_tipo
          ),
          criadoEm: obraBanco.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obraBanco.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraBanco.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug: slugObra,
    link: obraBanco.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

function mesclarObrasPainelAutor(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [...obrasLocais];

  obrasSupabase.forEach((obraSupabase) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase = obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

      return obraLocal.id === obraSupabase.id || slugLocal === slugSupabase;
    });

    if (indiceExistente >= 0) {
      obrasMescladas[indiceExistente] = {
        ...obrasMescladas[indiceExistente],
        ...obraSupabase,
      };
      return;
    }

    obrasMescladas.unshift(obraSupabase);
  });

  return obrasMescladas;
}

function obterNomeProfilePainelAutor(profile: ProfilePainelAutorRow | null | undefined) {
  return typeof profile?.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

async function carregarProfilePainelAutor(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return null as ProfilePainelAutorRow | null;
  }

  try {
    const camposProfile = "id, user_id, nome, avatar_url, bio, sobre_bio";
    const { data: profilePorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select(camposProfile)
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (!erroUserId && profilePorUserId) {
      return profilePorUserId as ProfilePainelAutorRow;
    }

    const { data: profilePorId, error: erroId } = await supabase
      .from("profiles")
      .select(camposProfile)
      .eq("id", userIdLimpo)
      .maybeSingle();

    if (!erroId && profilePorId) {
      return profilePorId as ProfilePainelAutorRow;
    }
  } catch {
    // O perfil público é uma camada social. O painel continua com os dados da obra.
  }

  return null;
}

function aplicarNomeProfileNasObrasPainel(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
  nomeProfile: string
) {
  const nomeLimpo = nomeProfile.trim();

  if (!nomeLimpo) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    if (!obraPertenceAoUsuarioPainel(obra, userId)) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeLimpo,
      autorId: obra.autorId || userId,
    };
  });
}

async function carregarPainelAutorSupabase(
  obrasLocais: ObraLocal[],
  obrasFavoritasLocais: string[],
  obrasConcluidasLocais: string[]
) {
  try {
    const { data: usuarioData } = await supabase.auth.getUser();
    const userId = usuarioData.user?.id || "";

    if (!userId) {
      return {
        obras: [],
        favoritas: [],
        concluidas: [],
      };
    }

    const profileAutor = await carregarProfilePainelAutor(userId);
    const nomeProfileAutor = obterNomeProfilePainelAutor(profileAutor);
    const obrasLocaisUsuario = aplicarNomeProfileNasObrasPainel(
      filtrarObrasDoUsuarioPainel(obrasLocais, userId),
      userId,
      nomeProfileAutor
    );
    const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
      obrasFavoritasLocais,
      obrasLocaisUsuario
    );
    const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
      obrasConcluidasLocais,
      obrasLocaisUsuario
    );

    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("user_id", userId)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn("Não consegui carregar obras no Painel do Autor:", erroObras.message);
      return {
        obras: obrasLocaisUsuario,
        favoritas: obrasFavoritasUsuario,
        concluidas: obrasConcluidasUsuario,
      };
    }

    const obrasSupabaseBanco = Array.isArray(obrasBanco)
      ? (obrasBanco as unknown as SupabaseObraRow[])
      : [];
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocaisUsuario,
        favoritas: obrasFavoritasUsuario,
        concluidas: obrasConcluidasUsuario,
      };
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
      .in("obra_id", obraIds)
      .eq("user_id", userId)
      .order("ordem", { ascending: true })
      .limit(600);

    if (erroCapitulos) {
      console.warn("Não consegui carregar capítulos no Painel do Autor:", erroCapitulos.message);
    }

    const capitulosSupabaseBanco = erroCapitulos
      ? []
      : Array.isArray(capitulosBanco)
      ? (capitulosBanco as unknown as SupabaseCapituloRow[])
      : [];

    const capituloIds = capitulosSupabaseBanco
      .map((capitulo) => capitulo.id)
      .filter(Boolean);

    const [
      favoritosBanco,
      concluidasBanco,
      salvosBanco,
      curtidasBanco,
      comentariosBanco,
      progressoBanco,
      curtidasObraBanco,
      seguidoresObraBanco,
    ] = await Promise.all([
      carregarRegistrosObraSupabase("favoritos", obraIds, userId),
      carregarRegistrosObraSupabase("concluidas", obraIds, userId),
      carregarRegistrosObraSupabase("salvos_capitulos", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("curtidas_capitulos", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("comentarios_capitulos", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("progresso_leitura", obraIds, undefined, capituloIds),
      carregarRegistrosObraSupabase("obra_curtidas", obraIds),
      carregarRegistrosObraSupabase("seguindo_obras", obraIds),
    ]);

    const favoritosSupabase = criarSetObrasPorRegistro(favoritosBanco);
    const concluidasSupabase = criarSetObrasPorRegistro(concluidasBanco);
    const capitulosSalvos = criarSetCapitulosPorRegistro(salvosBanco);
    const capitulosCurtidos = criarSetCapitulosPorRegistro(curtidasBanco);
    const capitulosLidos = criarSetCapitulosPorRegistro(progressoBanco);
    const comentariosCapitulos = criarMapaComentariosPorRegistro(comentariosBanco);

    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocaisUsuario.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      const obraNormalizada = converterObraSupabaseParaLocalPainel({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        capitulosLidos,
        comentariosCapitulos,
        index,
      });

      const totalCurtidasCapitulos = contarRegistrosRelacionadosObraPainel(
        curtidasBanco,
        obraBanco.id,
        capitulosDaObra
      );
      const totalSalvosCapitulos = contarRegistrosRelacionadosObraPainel(
        salvosBanco,
        obraBanco.id,
        capitulosDaObra
      );
      const totalComentariosCapitulos = contarRegistrosRelacionadosObraPainel(
        comentariosBanco,
        obraBanco.id,
        capitulosDaObra
      );
      const totalLeiturasCapitulos = contarRegistrosRelacionadosObraPainel(
        progressoBanco,
        obraBanco.id,
        capitulosDaObra
      );
      const totalCurtidasObra = contarRegistrosRelacionadosObraPainel(
        curtidasObraBanco,
        obraBanco.id,
        capitulosDaObra
      );
      const totalSeguidoresObra = contarRegistrosRelacionadosObraPainel(
        seguidoresObraBanco,
        obraBanco.id,
        capitulosDaObra
      );

      return {
        ...obraNormalizada,
        totalCurtidasPainel: Math.max(
          calcularCurtidas(obraNormalizada),
          totalCurtidasCapitulos + totalCurtidasObra
        ),
        totalComentariosPainel: Math.max(
          calcularComentarios(obraNormalizada),
          totalComentariosCapitulos
        ),
        totalSalvosPainel: Math.max(
          calcularSalvos(obraNormalizada),
          totalSalvosCapitulos + totalSeguidoresObra
        ),
        totalLidosPainel: Math.max(
          calcularLidos(obraNormalizada),
          totalLeiturasCapitulos
        ),
      };
    });

    const obrasMescladasUsuario = aplicarNomeProfileNasObrasPainel(
      mesclarObrasPainelAutor(obrasLocaisUsuario, obrasSupabase).filter((obra) =>
        obraPertenceAoUsuarioPainel(obra, userId)
      ),
      userId,
      nomeProfileAutor
    );
    const idsObrasUsuario = new Set(obrasMescladasUsuario.map((obra) => obra.id));

    return {
      obras: obrasMescladasUsuario,
      favoritas: Array.from(
        new Set([...obrasFavoritasUsuario, ...Array.from(favoritosSupabase)])
      ).filter((id) => idsObrasUsuario.has(id)),
      concluidas: Array.from(
        new Set([...obrasConcluidasUsuario, ...Array.from(concluidasSupabase)])
      ).filter((id) => idsObrasUsuario.has(id)),
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Painel do Autor:", error);

    return {
      obras: [],
      favoritas: [],
      concluidas: [],
    };
  }
}

export default function PainelAutorPage() {
  const router = useRouter();

  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [obraComLinkCopiado, setObraComLinkCopiado] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaPainelAberta, setBuscaPainelAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPainel>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPainel>("pontuacao");
  const [isDesktop, setIsDesktop] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [verificandoUsuario, setVerificandoUsuario] = useState(true);
  const [mostrarFiltrosPainel, setMostrarFiltrosPainel] = useState(false);

  const { pageThemeStyle } = useHistorietasTheme(pageStyle);


  useEffect(() => {
    function atualizarLayoutDesktop() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    atualizarLayoutDesktop();
    window.addEventListener("resize", atualizarLayoutDesktop);

    return () => {
      window.removeEventListener("resize", atualizarLayoutDesktop);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarUsuarioAtual() {
      try {
        const { data } = await supabase.auth.getUser();
        const usuario = data.user;

        if (!componenteAtivo) {
          return;
        }

        setUsuarioIdLogado(usuario?.id || "");
        setVerificandoUsuario(false);
      } catch {
        if (componenteAtivo) {
          setUsuarioIdLogado("");
          setVerificandoUsuario(false);
        }
      }
    }

    void carregarUsuarioAtual();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        if (!componenteAtivo) {
          return;
        }

        setUsuarioIdLogado(sessao?.user?.id || "");
        setVerificandoUsuario(false);
      }
    );

    return () => {
      componenteAtivo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!verificandoUsuario && !usuarioIdLogado) {
      router.replace(criarLoginHrefPainelAutor());
    }
  }, [router, usuarioIdLogado, verificandoUsuario]);

  useEffect(() => {
    if (!mostrarFiltrosPainel) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    return () => {
      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [mostrarFiltrosPainel]);


  useEffect(() => {
    if (verificandoUsuario || !usuarioIdLogado) {
      return;
    }

    let componenteAtivo = true;

    async function carregarDadosPainelAutor() {
      try {
        const obrasSalvasTexto = lerStorageUsuarioPainel(
          STORAGE_KEY,
          usuarioIdLogado
        );
        const obrasSalvasJson: unknown = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? (obrasSalvasJson as ObraSalva[]).map((obra, obraIndex) =>
              restaurarArquivoObraComBackup(
                normalizarObra(obra, obraIndex),
                backupArquivosObras
              )
            )
          : [];
        const profileAutorPainel = await carregarProfilePainelAutor(usuarioIdLogado);
        const nomeProfileAutorPainel = obterNomeProfilePainelAutor(profileAutorPainel);
        const obrasUsuarioLogado = aplicarNomeProfileNasObrasPainel(
          filtrarObrasDoUsuarioPainel(obrasNormalizadas, usuarioIdLogado),
          usuarioIdLogado,
          nomeProfileAutorPainel
        );

        const obrasFavoritasNormalizadas = carregarListaIdsPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasConcluidasNormalizadas = carregarListaIdsPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado
        );

        const obrasFavoritasUsuario = filtrarListaPorObrasDoUsuario(
          obrasFavoritasNormalizadas,
          obrasUsuarioLogado
        );
        const obrasConcluidasUsuario = filtrarListaPorObrasDoUsuario(
          obrasConcluidasNormalizadas,
          obrasUsuarioLogado
        );

        if (!componenteAtivo) {
          return;
        }

        setObras(obrasUsuarioLogado);
        setObrasFavoritas(obrasFavoritasUsuario);
        setObrasConcluidas(obrasConcluidasUsuario);

        const dadosSupabase = await carregarPainelAutorSupabase(
          obrasUsuarioLogado,
          obrasFavoritasUsuario,
          obrasConcluidasUsuario
        );

        if (!componenteAtivo) {
          return;
        }

        const obrasFinais = dadosSupabase.obras.map((obra, index) =>
          normalizarObra(obra as ObraSalva, index)
        );

        sincronizarBackupArquivosObras(obrasFinais, usuarioIdLogado);
        salvarJsonStorageUsuarioPainel(STORAGE_KEY, usuarioIdLogado, obrasFinais);
        salvarListaIdsUsuarioPainel(
          FAVORITES_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.favoritas
        );
        salvarListaIdsUsuarioPainel(
          COMPLETED_STORAGE_KEY,
          usuarioIdLogado,
          dadosSupabase.concluidas
        );

        setObras(obrasFinais);
        setObrasFavoritas(dadosSupabase.favoritas);
        setObrasConcluidas(dadosSupabase.concluidas);
      } catch {
        if (!componenteAtivo) {
          return;
        }

        setObras([]);
        setObrasFavoritas([]);
        setObrasConcluidas([]);
      }
    }

    void carregarDadosPainelAutor();

    return () => {
      componenteAtivo = false;
    };
  }, [usuarioIdLogado, verificandoUsuario]);

  const obrasComMetricas = useMemo<ObraComMetricas[]>(() => {
    return obras
      .map((obra) => {
        const totalCurtidas = Math.max(
          calcularCurtidas(obra),
          obra.totalCurtidasPainel || 0
        );
        const totalComentarios = Math.max(
          calcularComentarios(obra),
          obra.totalComentariosPainel || 0
        );
        const totalSalvos = Math.max(
          calcularSalvos(obra),
          obra.totalSalvosPainel || 0
        );
        const totalLidos = Math.max(
          calcularLidos(obra),
          obra.totalLidosPainel || 0
        );
        const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
        const ultimoCapituloLido = encontrarCapituloParaContinuar(obra);

        return {
          ...obra,
          totalCurtidas,
          totalComentarios,
          totalSalvos,
          totalLidos,
          progressoLeitura,
          ultimoCapituloLido,
          pontuacao:
            obra.capitulos.length * 2 +
            totalCurtidas * 5 +
            totalComentarios * 8 +
            totalSalvos * 4 +
            totalLidos * 3,
        };
      })
      .sort((obraA, obraB) => obraB.pontuacao - obraA.pontuacao);
  }, [obras]);

  const obrasFiltradas = useMemo<ObraComMetricas[]>(() => {
    const termoBusca = normalizarTexto(busca);

    return obrasComMetricas
      .filter((obra) => {
        const passaBusca = termoBusca
          ? normalizarTexto(
              [
                obra.titulo,
                obra.autor,
                obra.genero,
                formatarGeneroPainelAutor(obra.genero),
                obra.formato,
                obra.classificacaoIndicativa,
                obra.sinopse,
                obra.tags.join(" "),
                obra.capaNome,
                obra.arquivoObra?.nome || "",
                obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
              ].join(" ")
            ).includes(termoBusca)
          : true;

        const passaFiltro =
          filtro === "todas"
            ? true
            : filtro === "publicadas"
            ? obra.publicado
            : filtro === "rascunhos"
            ? !obra.publicado
            : filtro === "sem-capitulos"
            ? obra.capitulos.length === 0
            : filtro === "favoritas"
            ? colecaoTemObraPainel(obrasFavoritas, obra)
            : filtro === "concluidas"
            ? colecaoTemObraPainel(obrasConcluidas, obra)
            : obra.progressoLeitura > 0 && obra.progressoLeitura < 100;

        return passaBusca && passaFiltro;
      })
      .sort((obraA, obraB) => {
        if (ordenacao === "recentes") {
          return obterTimestamp(obraB.criadaEm) - obterTimestamp(obraA.criadaEm);
        }

        if (ordenacao === "titulo") {
          return obraA.titulo.localeCompare(obraB.titulo);
        }

        if (ordenacao === "capitulos") {
          return obraB.capitulos.length - obraA.capitulos.length;
        }

        if (ordenacao === "progresso") {
          return obraB.progressoLeitura - obraA.progressoLeitura;
        }

        return obraB.pontuacao - obraA.pontuacao;
      });
  }, [
    obrasComMetricas,
    busca,
    filtro,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasPublicadas = obrasComMetricas.filter((obra) => obra.publicado);
  const obrasRascunhos = obrasComMetricas.filter((obra) => !obra.publicado);

  const totalCapitulos = obrasComMetricas.reduce(
    (total, obra) => total + obra.capitulos.length,
    0
  );

  const totalCurtidas = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalCurtidas,
    0
  );

  const totalComentarios = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalComentarios,
    0
  );

  const totalSalvos = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalSalvos,
    0
  );

  const totalArquivos = obrasComMetricas.filter((obra) => obra.arquivoObra).length;

  const filtrosAtivos =
    Boolean(busca.trim()) || filtro !== "todas" || ordenacao !== "pontuacao";
  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("pontuacao");
  }

  const usuarioLogado = Boolean(usuarioIdLogado);
  function copiarTextoComFallback(texto: string) {
    const campoTemporario = document.createElement("textarea");
    campoTemporario.value = texto;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.left = "-9999px";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();
    document.execCommand("copy");
    document.body.removeChild(campoTemporario);
  }

  async function copiarLinkObra(obra: ObraLocal) {
    const href = obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
    const linkAbsoluto =
      typeof window !== "undefined" ? new URL(href, window.location.origin).toString() : href;

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(linkAbsoluto);
        } catch {
          copiarTextoComFallback(linkAbsoluto);
        }
      } else {
        copiarTextoComFallback(linkAbsoluto);
      }

      setObraComLinkCopiado(obra.id);

      window.setTimeout(() => {
        setObraComLinkCopiado((obraIdAtual) =>
          obraIdAtual === obra.id ? "" : obraIdAtual
        );
      }, 1800);
    } catch {
      setObraComLinkCopiado("");
    }
  }

  async function excluirObra(obraId: string, tituloObra: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos e registros dessa obra serão removidos. Essa ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || usuarioIdLogado;

      if (!userId) {
        router.replace(criarLoginHrefPainelAutor());
        return;
      }

      const obraExcluida = obras.find((obra) => obra.id === obraId) || {
        id: obraId,
        slug: criarSlugBase(tituloObra),
        titulo: tituloObra,
        capitulos: [] as CapituloLocal[],
      };
      const novasObras = obras.filter((obra) => obra.id !== obraId);
      const novasObrasFavoritas = removerObraDaColecaoPainel(
        obrasFavoritas,
        obraExcluida
      );
      const novasObrasConcluidas = removerObraDaColecaoPainel(
        obrasConcluidas,
        obraExcluida
      );
      limparReferenciasLocaisObraExcluidaPainel(obraExcluida, userId);
      salvarJsonStorageUsuarioPainel(STORAGE_KEY, userId, novasObras);
      salvarColecaoAposExcluirPainel(
        FAVORITES_STORAGE_KEY,
        userId,
        novasObrasFavoritas
      );
      salvarColecaoAposExcluirPainel(
        COMPLETED_STORAGE_KEY,
        userId,
        novasObrasConcluidas
      );

      setObras(novasObras);
      setObrasFavoritas(novasObrasFavoritas);
      setObrasConcluidas(novasObrasConcluidas);

      await removerReferenciasSupabaseObraExcluidaPainel(
        userId,
        obraId,
        obraExcluida.capitulos.map((capitulo) => capitulo.id)
      );

      await supabase
        .from("capitulos")
        .delete()
        .eq("obra_id", obraId)
        .eq("user_id", userId);

      const { error } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraId)
        .eq("user_id", userId);

      if (error) {
        console.warn("Não consegui concluir a exclusão remota no Estúdio:", error.message);
      }
    } catch (error) {
      console.warn("Não consegui excluir a obra no Estúdio:", error);
    }
  }

  if (verificandoUsuario || !usuarioLogado) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <section style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>
              {verificandoUsuario ? "Verificando acesso..." : "Redirecionando para login..."}
            </h2>

            <p style={emptyTextStyle}>
              {verificandoUsuario
                ? "Conferindo sua sessão antes de abrir o Estúdio do Autor."
                : "Entre com sua conta para gerenciar suas obras."}
            </p>
          </section>
        </section>
      </main>
    );
  }


  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-painel-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <button
            type="button"
            aria-label={buscaPainelAberta ? "Fechar busca" : "Abrir busca"}
            aria-expanded={buscaPainelAberta || Boolean(busca.trim())}
            onClick={() => setBuscaPainelAberta((aberta) => !aberta)}
            style={topSearchButtonStyle}
          >
            ⌕
          </button>
        </header>

        <section style={isDesktop ? desktopStudioControlsStyle : studioControlsStyle}>
          {(buscaPainelAberta || busca.trim()) && (
            <label style={studioSearchShellStyle}>
              <span style={studioSearchIconStyle}>⌕</span>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar obra..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={90}
                style={studioSearchInputStyle}
                type="text"
              />
            </label>
          )}

          <div style={studioFilterRowStyle}>
            <button
              type="button"
              onClick={() => setMostrarFiltrosPainel(true)}
              style={studioFilterButtonStyle}
            >
              <span>Filtrar e ordenar{filtrosAtivos ? " (1)" : ""}</span>
              <span style={studioFilterIconStyle}>⇅</span>
            </button>
          </div>

          <section style={isDesktop ? desktopStatsBoxStyle : statsBoxStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasComMetricas.length}</strong>
            <span style={statLabelStyle}>
              {obrasComMetricas.length === 1 ? "obra" : "obras"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasPublicadas.length}</strong>
            <span style={statLabelStyle}>
              {obrasPublicadas.length === 1 ? "publicada" : "publicadas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obrasRascunhos.length}</strong>
            <span style={statLabelStyle}>
              {obrasRascunhos.length === 1 ? "rascunho" : "rascunhos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCapitulos}</strong>
            <span style={statLabelStyle}>
              {totalCapitulos === 1 ? "capítulo" : "capítulos"}
            </span>
          </div>


          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalCurtidas}</strong>
            <span style={statLabelStyle}>
              {totalCurtidas === 1 ? "curtida" : "curtidas"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalComentarios}</strong>
            <span style={statLabelStyle}>
              {totalComentarios === 1 ? "comentário" : "comentários"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalSalvos}</strong>
            <span style={statLabelStyle}>
              {totalSalvos === 1 ? "salvo" : "salvos"}
            </span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totalArquivos}</strong>
            <span style={statLabelStyle}>
              {totalArquivos === 1 ? "arquivo" : "arquivos"}
            </span>
          </div>
        </section>


          {filtrosAtivos && (
            <button type="button" onClick={limparFiltros} style={studioClearButtonStyle}>
              Limpar filtros
            </button>
          )}
        </section>

        {mostrarFiltrosPainel && (
          <div
            style={filterSheetOverlayStyle}
            onClick={() => setMostrarFiltrosPainel(false)}
          >
            <section
              style={isDesktop ? desktopFilterSheetStyle : filterSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label="Filtrar e ordenar"
            >
              <span style={filterSheetHandleStyle} aria-hidden="true" />

              <h2 style={filterSheetTitleStyle}>Filtrar e ordenar</h2>

              <div style={filterSheetContentStyle}>
                <p style={filterSheetSectionLabelStyle}>MOSTRAR</p>

                {FILTROS_PAINEL.map((opcao) => {
                  const ativo = filtro === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setFiltro(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}

                <p style={filterSheetSectionLabelStyle}>ORDENAR</p>

                {ORDENACOES_PAINEL.map((opcao) => {
                  const ativo = ordenacao === opcao.valor;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        setOrdenacao(opcao.valor);
                        setMostrarFiltrosPainel(false);
                      }}
                      style={criarFilterSheetOptionStyle(ativo)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span
                        style={criarFilterSheetRadioStyle(ativo)}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}

                {filtrosAtivos && (
                  <>
                    <span style={filterSheetClearDividerStyle} aria-hidden="true" />

                    <button type="button" onClick={limparFiltros} style={filterSheetClearStyle}>
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {obrasComMetricas.length === 0 ? (
          <section style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>Nenhuma obra criada ainda</h2>

            <p style={emptyTextStyle}>
              Publique sua primeira história para começar a acompanhar seu
              estúdio de autor.
            </p>

          </section>
        ) : obrasFiltradas.length === 0 ? (
          <section style={emptyMiniBoxStyle}>
            <strong style={emptyMiniTitleStyle}>Nenhuma obra encontrada</strong>
            <span style={emptyMiniTextStyle}>
              Ajuste a busca ou limpe os filtros para voltar a ver suas obras.
            </span>
            <button type="button" onClick={limparFiltros} style={emptyMiniButtonStyle}>
              Limpar filtros
            </button>
          </section>
        ) : (
          <PainelSecao
            obras={obrasFiltradas}
            obrasFavoritas={obrasFavoritas}
            obrasConcluidas={obrasConcluidas}
            isDesktop={isDesktop}
            obraComLinkCopiado={obraComLinkCopiado}
            onCopiarLink={copiarLinkObra}
            onExcluirObra={excluirObra}
          />
        )}
      </section>
    </main>
  );
}

function criarPerfilAutorHref(autor: string, autorId?: string, userId?: string) {
  const autorLimpo = autor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";
  const userIdLimpo = userId?.trim() || autorIdLimpo;
  const params = new URLSearchParams();

  params.set("autor", autorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function PainelSecao({
  obras,
  obrasFavoritas,
  obrasConcluidas,
  isDesktop,
  obraComLinkCopiado,
  onCopiarLink,
  onExcluirObra,
}: {
  obras: ObraComMetricas[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  isDesktop: boolean;
  obraComLinkCopiado: string;
  onCopiarLink: (obra: ObraLocal) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
}) {
  if (obras.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
        <h2 style={sectionTitleStyle}>OBRAS</h2>
      </div>

      <div style={isDesktop ? desktopWorksGridStyle : worksGridStyle}>
        {obras.map((obra) => (
          <ObraPainelCard
            key={obra.id}
            obra={obra}
            favoritada={colecaoTemObraPainel(obrasFavoritas, obra)}
            concluida={colecaoTemObraPainel(obrasConcluidas, obra)}
            isDesktop={isDesktop}
            linkCopiado={obraComLinkCopiado === obra.id}
            onCopiarLink={onCopiarLink}
            onExcluirObra={onExcluirObra}
          />
        ))}
      </div>
    </section>
  );
}

function ObraPainelCard({
  obra,
  favoritada,
  concluida,
  isDesktop,
  linkCopiado,
  onCopiarLink,
  onExcluirObra,
}: {
  obra: ObraComMetricas;
  favoritada: boolean;
  concluida: boolean;
  isDesktop: boolean;
  linkCopiado: boolean;
  onCopiarLink: (obra: ObraLocal) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
}) {
  const obraHref = `/editar-obra?obraId=${obra.id}`;
  const editarHref = `/editar-obra?obraId=${obra.id}`;
  const capituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
  const paginaPublicaHref = obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const verArquivoHref = `/ver-arquivo?obraId=${obra.id}`;
  const capituloParaLer = obra.ultimoCapituloLido || obra.capitulos[0] || null;
  const indiceCapituloParaLer = capituloParaLer
    ? obra.capitulos.findIndex((capitulo) => capitulo.id === capituloParaLer.id)
    : -1;
  const numeroCapituloParaLer = indiceCapituloParaLer >= 0 ? indiceCapituloParaLer + 1 : 1;
  const leituraCapituloHref = capituloParaLer
    ? criarHrefLeituraCapituloPainel(obra, capituloParaLer, numeroCapituloParaLer)
    : "";
  const perfilAutorHref = criarPerfilAutorHref(obra.autor, obra.autorId, obra.autorId);
  const progressoVisual = Math.min(100, Math.max(0, obra.progressoLeitura));
  const statusTexto = obra.publicado ? "Publicado" : "Rascunho";
  const classificacaoTexto = mostrarClassificacao(obra)
    ? obra.classificacaoIndicativa
    : "";
  const indicadoresTexto = [
    obra.arquivoObra ? "Arquivo" : "",
    favoritada ? "Na lista" : "",
    concluida ? "Concluída" : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <article style={isDesktop ? desktopWorkCardStyle : workCardStyle}>
      <Link href={obraHref} style={coverLinkStyle}>
        <div style={isDesktop ? criarPainelCoverDesktopStyle(obra.capa) : criarPainelCoverStyle(obra.capa)}>
          <div style={coverGlowStyle} />

          <div style={coverBottomStyle}>
            <strong style={coverNumberStyle}>{obra.capitulos.length}</strong>

            <span style={coverLabelStyle}>
              {obra.capitulos.length === 1 ? "capítulo" : "capítulos"}
            </span>
          </div>
        </div>
      </Link>

      <div style={isDesktop ? desktopWorkContentStyle : workContentStyle}>
        <div style={statusRowStyle}>
          <span style={obra.publicado ? publishedStatusStyle : draftStatusStyle}>
            {statusTexto}
          </span>

          {classificacaoTexto && (
            <span style={classificationBadgeStyle}>{classificacaoTexto}</span>
          )}

          {indicadoresTexto && (
            <span style={panelTinyInfoStyle}>{indicadoresTexto}</span>
          )}
        </div>

        <h3 style={workTitleStyle}>{obra.titulo}</h3>

        <Link href={perfilAutorHref} style={authorStyle}>
          Por {obra.autor}
        </Link>

        <span style={workMetaLineStyle}>
          {obra.formato} • {formatarGeneroPainelAutor(obra.genero)}
          {obra.tags[0] ? ` • ${obra.tags[0]}` : ""}
        </span>

        <div style={isDesktop ? desktopMetricGridStyle : metricGridStyle}>
          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.capitulos.length}</strong>
            <span style={metricLabelStyle}>caps.</span>
          </div>

          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.totalCurtidas}</strong>
            <span style={metricLabelStyle}>curt.</span>
          </div>

          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.totalComentarios}</strong>
            <span style={metricLabelStyle}>coment.</span>
          </div>

          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.totalSalvos}</strong>
            <span style={metricLabelStyle}>salvos</span>
          </div>
        </div>

        <div style={progressInlineStyle}>
          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${progressoVisual}%`,
              }}
            />
          </div>

          <strong style={progressValueStyle}>{progressoVisual}%</strong>
        </div>

        <div style={isDesktop ? desktopCardActionsGridStyle : actionsGridStyle}>
          <Link href={obraHref} style={openButtonStyle}>
            Gerenciar
          </Link>

          {capituloParaLer && (
            <Link href={leituraCapituloHref} style={readButtonStyle}>
              {obra.ultimoCapituloLido
                ? isDesktop
                  ? "Continuar leitura"
                  : "Continuar"
                : isDesktop
                ? "Ler capítulo"
                : "Ler"}
            </Link>
          )}

          <Link href={editarHref} style={editButtonStyle}>
            {isDesktop ? "Editar obra" : "Editar"}
          </Link>

          <Link href={capituloHref} style={chapterButtonStyle}>
            {isDesktop ? "Adicionar capítulo" : "+ cap."}
          </Link>

          {obra.publicado && (
            <Link href={paginaPublicaHref} style={publicPageButtonStyle}>
              {isDesktop ? "Página pública" : "Página"}
            </Link>
          )}

          {obra.arquivoObra && (
            <Link href={verArquivoHref} style={fileButtonStyle}>
              {isDesktop ? "Ver arquivo" : "Arquivo"}
            </Link>
          )}

          <button
            type="button"
            onClick={() => void onCopiarLink(obra)}
            style={linkCopiado ? copiedButtonStyle : copyButtonStyle}
          >
            {linkCopiado ? "Copiado!" : isDesktop ? "Copiar link" : "Copiar"}
          </button>

          <button
            type="button"
            onClick={() => void onExcluirObra(obra.id, obra.titulo)}
            style={deleteButtonStyle}
          >
            Excluir
          </button>

        </div>
      </div>
    </article>
  );
}

const painelAutorPageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] nav a[href="/painel"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] nav a[href="/painel"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] button:disabled {
    opacity: 0.62 !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const themeGradient = "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)";

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  isolation: "isolate",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "10px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "22px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
  fontWeight: 950,
  letterSpacing: "-0.055em",
};


const topSearchButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
};

const statsBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  marginTop: "0",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  flex: "1 1 calc(25% - 5px)",
  borderRadius: "12px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  padding: "6px 4px",
  display: "grid",
  gap: "2px",
  alignContent: "center",
  justifyItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "43px",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "#DDD6FE",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7px",
  lineHeight: 1.15,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const studioControlsStyle: CSSProperties = {
  marginTop: "8px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const studioSearchShellStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(39, 39, 42, 0.86)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 16px",
  boxSizing: "border-box",
  boxShadow: "none",
};

const studioSearchIconStyle: CSSProperties = {
  color: "rgba(244,244,245,0.68)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const studioSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "50px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 850,
  letterSpacing: "-0.035em",
  boxSizing: "border-box",
};

const studioFilterRowStyle: CSSProperties = {
  minHeight: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const studioFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  ...safeTextStyle,
};

const studioFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

const studioClearButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.055)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const filterSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  background: "rgba(0,0,0,0.62)",
  display: "block",
  padding: "0 10px",
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "contain",
};

const filterSheetStyle: CSSProperties = {
  position: "fixed",
  left: "10px",
  right: "10px",
  bottom: 0,
  width: "auto",
  maxWidth: "720px",
  maxHeight: "min(620px, calc(100dvh - 112px))",
  margin: "0 auto",
  overflowY: "auto",
  overflowX: "hidden",
  background: "#151A1B",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "0",
  borderRadius: "28px 28px 0 0",
  boxShadow: "none",
  padding: "12px 0 112px",
  boxSizing: "border-box",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  color: "#FFFFFF",
};

const desktopFilterSheetStyle: CSSProperties = {
  ...filterSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "28px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  margin: 0,
  paddingBottom: "18px",
};

const filterSheetHandleStyle: CSSProperties = {
  display: "block",
  width: "74px",
  height: "6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.58)",
  margin: "0 auto 14px",
};

const filterSheetTitleStyle: CSSProperties = {
  margin: "0 24px 16px",
  color: "#FFFFFF",
  fontSize: "23px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const filterSheetContentStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const filterSheetSectionLabelStyle: CSSProperties = {
  margin: 0,
  padding: "12px 28px 8px",
  borderTop: "1px solid rgba(255,255,255,0.055)",
  color: "rgba(255,255,255,0.58)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

function criarFilterSheetOptionStyle(ativo: boolean): CSSProperties {
  return {
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
    minHeight: "56px",
    border: 0,
    borderTop: "1px solid rgba(255,255,255,0.055)",
    background: ativo ? "rgba(255,255,255,0.035)" : "transparent",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "0 28px",
    boxSizing: "border-box",
    fontSize: "20px",
    fontWeight: 950,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
    ...safeTextStyle,
  };
}

function criarFilterSheetRadioStyle(ativo: boolean): CSSProperties {
  return {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    border: ativo
      ? "9px solid #FFFFFF"
      : "5px solid rgba(255,255,255,0.40)",
    boxSizing: "border-box",
    flex: "0 0 auto",
  };
}

const filterSheetClearDividerStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "1px",
  background: "rgba(255,255,255,0.07)",
};

const filterSheetClearStyle: CSSProperties = {
  appearance: "none",
  minHeight: "52px",
  margin: "12px 28px 10px",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: "5px",
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};


const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "28px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};


const worksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const workCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "96px minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "8px",
  padding: "8px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const coverLinkStyle: CSSProperties = {
  display: "block",
  height: "100%",
  textDecoration: "none",
  color: "#FFFFFF",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  height: "100%",
  minHeight: "128px",
  borderRadius: "14px",
  position: "relative",
  overflow: "hidden",
  background: "#04000A",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const coverGlowStyle: CSSProperties = {
  display: "none",
};

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "7px",
  right: "7px",
  bottom: "7px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverNumberStyle: CSSProperties = {
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 0.9,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};

const coverLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "7px",
  lineHeight: 1.02,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  textAlign: "left",
  ...safeTextStyle,
};

const workContentStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  alignContent: "start",
  minWidth: 0,
  maxWidth: "100%",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  alignItems: "center",
  minWidth: 0,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.045em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const draftStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.045em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.045em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const panelTinyInfoStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  color: "var(--historietas-text-muted, rgba(255,255,255,0.54))",
  fontSize: "8px",
  fontWeight: 850,
  lineHeight: 1.05,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const workTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  lineHeight: 1.06,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  paddingBottom: 0,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  display: "inline-flex",
  textDecoration: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const workMetaLineStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.15,
  fontWeight: 850,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  maxWidth: "100%",
  ...safeTextStyle,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const metricItemStyle: CSSProperties = {
  padding: "2px 1px",
  borderRadius: "7px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const metricNumberStyle: CSSProperties = {
  color: "#DDD6FE",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const metricLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "6.5px",
  lineHeight: 1,
  fontWeight: 850,
  textAlign: "center",
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

const progressInlineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const progressValueStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "11px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  minWidth: "6px",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};


const openButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "8px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 4px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const readButtonStyle: CSSProperties = {
  ...openButtonStyle,
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "#FFFFFF",
};

const publicPageButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
  fontSize: "8px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 4px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const editButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
  fontSize: "8px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 4px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const chapterButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  textDecoration: "none",
  fontSize: "8px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 4px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  ...safeTextStyle,
};

const fileButtonStyle: CSSProperties = {
  ...publicPageButtonStyle,
};

const copyButtonStyle: CSSProperties = {
  ...publicPageButtonStyle,
  cursor: "pointer",
  fontFamily: "inherit",
};

const copiedButtonStyle: CSSProperties = {
  ...copyButtonStyle,
  background: "rgba(249,115,22,0.18)",
  border: "1px solid rgba(249,115,22,0.34)",
  color: "#FED7AA",
};

const deleteButtonStyle: CSSProperties = {
  ...copyButtonStyle,
  background: "rgba(127,29,29,0.20)",
  border: "1px solid rgba(248,113,113,0.26)",
  color: "#FCA5A5",
};


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "24px 0 36px",
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "0",
};

const desktopStudioControlsStyle: CSSProperties = {
  ...studioControlsStyle,
  width: "min(860px, 100%)",
  margin: "10px auto 0",
  gap: "8px",
};


const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "12px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  marginBottom: "8px",
};

const desktopWorksGridStyle: CSSProperties = {
  ...worksGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const desktopWorkCardStyle: CSSProperties = {
  ...workCardStyle,
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "12px",
  padding: "12px",
  borderRadius: "22px",
};

const desktopWorkContentStyle: CSSProperties = {
  ...workContentStyle,
  gap: "6px",
  alignContent: "start",
};

const desktopMetricGridStyle: CSSProperties = {
  ...metricGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
};

const desktopCardActionsGridStyle: CSSProperties = {
  ...actionsGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
};


const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "24px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "22px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const emptyMiniBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  fontWeight: 800,
  lineHeight: 1.6,
  display: "grid",
  gap: "10px",
  minWidth: 0,
  boxShadow: "none",
};

const emptyMiniTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const emptyMiniTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 750,
  ...safeTextStyle,
};

const emptyMiniButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "34px",
  padding: "0 14px",
  borderRadius: "999px",
  background: themeGradient,
  border: "0",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "28px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.7,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};
