"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { ChangeEvent, CSSProperties } from "react";

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

type NotificacaoLocal = {
  id: string;
  obraId: string;
  capituloId: string;
  titulo: string;
  mensagem: string;
  tipo: "novo-capitulo";
  lida: boolean;
  criadaEm: string;
};

type FiltroPainel =
  | "todas"
  | "publicadas"
  | "rascunhos"
  | "sem-capitulos";

type OrdenacaoPainel =
  | "pontuacao"
  | "recentes"
  | "titulo"
  | "capitulos";

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const BIO_MAX_LENGTH = 160;

type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizarPerfisAutores(valor: unknown): PerfisAutoresSalvos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  const perfisValidos: PerfisAutoresSalvos = {};

  Object.entries(valor as Record<string, Partial<PerfilAutorSalvo>>).forEach(
    ([autor, perfil]) => {
      if (!autor.trim() || !perfil || typeof perfil !== "object") {
        return;
      }

      perfisValidos[normalizarNomeAutor(autor)] = {
        avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
        avatarNome:
          typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
        bio:
          typeof perfil.bio === "string"
            ? perfil.bio.slice(0, BIO_MAX_LENGTH)
            : "",
      };
    }
  );

  return perfisValidos;
}

function carregarPerfisAutores(): PerfisAutoresSalvos {
  try {
    const perfisTexto = localStorage.getItem(AUTHOR_PROFILE_STORAGE_KEY);
    const perfisJson: unknown = perfisTexto ? JSON.parse(perfisTexto) : {};
    const perfisNormalizados = normalizarPerfisAutores(perfisJson);

    localStorage.setItem(
      AUTHOR_PROFILE_STORAGE_KEY,
      JSON.stringify(perfisNormalizados)
    );

    return perfisNormalizados;
  } catch {
    localStorage.setItem(AUTHOR_PROFILE_STORAGE_KEY, JSON.stringify({}));
    return {};
  }
}

function criarBioPadraoAutor(nomeAutor: string, obrasAutor: ObraLocal[]) {
  const generos = Array.from(
    new Set(
      obrasAutor
        .map((obra) => obra.genero)
        .filter((genero) => genero && genero !== "Não informado")
    )
  );

  const generosTexto =
    generos.length > 0 ? generos.slice(0, 3).join(", ") : "histórias variadas";

  return `${nomeAutor} publica histórias na Historietas, com foco em ${generosTexto}.`;
}

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function obterTimestamp(dataIso: string) {
  const timestamp = new Date(dataIso).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function obraTemAtividade(obra: ObraComMetricas) {
  return (
    obra.progressoLeitura > 0 ||
    obra.totalLidos > 0 ||
    obra.totalCurtidas > 0 ||
    obra.totalComentarios > 0 ||
    obra.totalSalvos > 0 ||
    Boolean(obra.ultimoCapituloLido)
  );
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
    return coverStyle;
  }

  return {
    ...coverStyle,
    background: "#18181B",
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarPainelCoverDesktopStyle(capa: string): CSSProperties {
  return {
    ...criarPainelCoverStyle(capa),
    minHeight: "188px",
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

function carregarBackupArquivosObras(): ArquivosObrasBackup {
  try {
    const backupTexto = localStorage.getItem(FILE_BACKUP_STORAGE_KEY);
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

    localStorage.setItem(
      FILE_BACKUP_STORAGE_KEY,
      JSON.stringify(backupNormalizado)
    );

    return backupNormalizado;
  } catch {
    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify({}));
    return {};
  }
}

function sincronizarBackupArquivosObras(obras: ObraLocal[]) {
  try {
    const backupAtual = carregarBackupArquivosObras();

    obras.forEach((obra) => {
      const arquivoNormalizado = normalizarArquivoObra(obra.arquivoObra);

      if (arquivoNormalizado) {
        backupAtual[obra.id] = arquivoNormalizado;
      }
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
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

function contarNotificacoesNaoLidas(valor: unknown) {
  if (!Array.isArray(valor)) {
    return 0;
  }

  return valor.filter((notificacao: Partial<NotificacaoLocal>) => {
    return !Boolean(notificacao.lida);
  }).length;
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

async function carregarRegistrosObraSupabase(
  tabela: string,
  obraIds: string[],
  userId?: string
) {
  if (obraIds.length === 0) {
    return [] as RegistroSupabaseGenerico[];
  }

  try {
    let query = supabase.from(tabela).select("*").in("obra_id", obraIds);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`Não consegui carregar ${tabela} no Painel do Autor:`, error.message);
      return [] as RegistroSupabaseGenerico[];
    }

    return Array.isArray(data) ? (data as RegistroSupabaseGenerico[]) : [];
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Painel do Autor:`, error);
    return [] as RegistroSupabaseGenerico[];
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
      .map((registro) => {
        const obraId = obterIdObraRegistro(registro);
        const capituloId = obterIdCapituloRegistro(registro);

        return obraId && capituloId ? criarChaveInteracao(obraId, capituloId) : "";
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

    if (comentario && !mapa.has(chave)) {
      mapa.set(chave, comentario);
    }
  });

  contagem.forEach((total, chave) => {
    if (!mapa.has(chave) && total > 0) {
      mapa.set(chave, total === 1 ? "1 comentário" : `${total} comentários`);
    }
  });

  return mapa;
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
    const comentarioSupabase = comentariosCapitulos.get(chaveInteracao) || "";
    const lidoSupabase = capitulosLidos.has(chaveInteracao);

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
      curtiu: Boolean(capituloLocal?.curtiu) || capitulosCurtidos.has(chaveInteracao),
      salvo: Boolean(capituloLocal?.salvo) || capitulosSalvos.has(chaveInteracao),
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
        obras: obrasLocais,
        favoritas: obrasFavoritasLocais,
        concluidas: obrasConcluidasLocais,
      };
    }

    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("user_id", userId)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn("Não consegui carregar obras no Painel do Autor:", erroObras.message);
      return {
        obras: obrasLocais,
        favoritas: obrasFavoritasLocais,
        concluidas: obrasConcluidasLocais,
      };
    }

    const obrasSupabaseBanco = Array.isArray(obrasBanco)
      ? (obrasBanco as SupabaseObraRow[])
      : [];
    const obraIds = obrasSupabaseBanco
      .map((obra) => obra.id)
      .filter((obraId) => Boolean(obraId));

    if (obraIds.length === 0) {
      return {
        obras: obrasLocais,
        favoritas: obrasFavoritasLocais,
        concluidas: obrasConcluidasLocais,
      };
    }

    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .in("obra_id", obraIds)
      .order("ordem", { ascending: true });

    if (erroCapitulos) {
      console.warn("Não consegui carregar capítulos no Painel do Autor:", erroCapitulos.message);
    }

    const capitulosSupabaseBanco = erroCapitulos
      ? []
      : Array.isArray(capitulosBanco)
      ? (capitulosBanco as SupabaseCapituloRow[])
      : [];

    const [
      favoritosBanco,
      concluidasBanco,
      salvosBanco,
      curtidasBanco,
      comentariosBanco,
      progressoBanco,
    ] = await Promise.all([
      carregarRegistrosObraSupabase("favoritos", obraIds, userId),
      carregarRegistrosObraSupabase("concluidas", obraIds, userId),
      carregarRegistrosObraSupabase("salvos_capitulos", obraIds),
      carregarRegistrosObraSupabase("curtidas_capitulos", obraIds),
      carregarRegistrosObraSupabase("comentarios_capitulos", obraIds),
      carregarRegistrosObraSupabase("progresso_leitura", obraIds),
    ]);

    const favoritosSupabase = criarSetObrasPorRegistro(favoritosBanco);
    const concluidasSupabase = criarSetObrasPorRegistro(concluidasBanco);
    const capitulosSalvos = criarSetCapitulosPorRegistro(salvosBanco);
    const capitulosCurtidos = criarSetCapitulosPorRegistro(curtidasBanco);
    const capitulosLidos = criarSetCapitulosPorRegistro(progressoBanco);
    const comentariosCapitulos = criarMapaComentariosPorRegistro(comentariosBanco);

    const obrasSupabase = obrasSupabaseBanco.map((obraBanco, index) => {
      const obraLocal = obrasLocais.find((obraAtual) => {
        const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);
        const slugBanco = obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

        return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      const capitulosDaObra = capitulosSupabaseBanco.filter(
        (capitulo) => capitulo.obra_id === obraBanco.id
      );

      return converterObraSupabaseParaLocalPainel({
        obraBanco,
        capitulosBanco: capitulosDaObra,
        obraLocal,
        capitulosSalvos,
        capitulosCurtidos,
        capitulosLidos,
        comentariosCapitulos,
        index,
      });
    });

    return {
      obras: mesclarObrasPainelAutor(obrasLocais, obrasSupabase),
      favoritas: Array.from(
        new Set([...obrasFavoritasLocais, ...Array.from(favoritosSupabase)])
      ),
      concluidas: Array.from(
        new Set([...obrasConcluidasLocais, ...Array.from(concluidasSupabase)])
      ),
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Painel do Autor:", error);

    return {
      obras: obrasLocais,
      favoritas: obrasFavoritasLocais,
      concluidas: obrasConcluidasLocais,
    };
  }
}

async function sincronizarColecaoPainelSupabase(
  tabela: "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return;
    }

    await supabase.from(tabela).delete().eq("user_id", userId).eq("obra_id", obraId);

    if (ativo) {
      await supabase.from(tabela).insert({
        user_id: userId,
        obra_id: obraId,
      });
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no Painel do Autor:`, error);
  }
}

export default function PainelAutorPage() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [perfisAutoresSalvos, setPerfisAutoresSalvos] =
    useState<PerfisAutoresSalvos>({});
  const [editarPerfilAberto, setEditarPerfilAberto] = useState(false);
  const [avatarErro, setAvatarErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroPainel>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPainel>("pontuacao");
  const [isDesktop, setIsDesktop] = useState(false);
  const [emailUsuarioLogado, setEmailUsuarioLogado] = useState("");
  const [nomeUsuarioLogado, setNomeUsuarioLogado] = useState("");
  const [verificandoUsuario, setVerificandoUsuario] = useState(true);
  const [saindoDaConta, setSaindoDaConta] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

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

        if (!usuario) {
          setEmailUsuarioLogado("");
          setNomeUsuarioLogado("");
          setVerificandoUsuario(false);
          return;
        }

        const nomeMetadata =
          typeof usuario.user_metadata?.nome === "string"
            ? usuario.user_metadata.nome.trim()
            : "";

        setEmailUsuarioLogado(usuario.email || "");
        setNomeUsuarioLogado(nomeMetadata);
        setVerificandoUsuario(false);

        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", usuario.id)
          .maybeSingle();

        if (!componenteAtivo) {
          return;
        }

        if (profile && typeof profile.nome === "string" && profile.nome.trim()) {
          setNomeUsuarioLogado(profile.nome.trim());
        }
      } catch {
        if (componenteAtivo) {
          setEmailUsuarioLogado("");
          setNomeUsuarioLogado("");
          setVerificandoUsuario(false);
        }
      }
    }

    void carregarUsuarioAtual();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        const usuario = sessao?.user;

        if (!componenteAtivo) {
          return;
        }

        if (!usuario) {
          setEmailUsuarioLogado("");
          setNomeUsuarioLogado("");
          setVerificandoUsuario(false);
          return;
        }

        const nomeMetadata =
          typeof usuario.user_metadata?.nome === "string"
            ? usuario.user_metadata.nome.trim()
            : "";

        setEmailUsuarioLogado(usuario.email || "");
        setNomeUsuarioLogado(nomeMetadata);
        setVerificandoUsuario(false);
      }
    );

    return () => {
      componenteAtivo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDadosPainelAutor() {
      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson: unknown = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const backupArquivosObras = carregarBackupArquivosObras();

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? (obrasSalvasJson as ObraSalva[]).map((obra, obraIndex) =>
              restaurarArquivoObraComBackup(
                normalizarObra(obra, obraIndex),
                backupArquivosObras
              )
            )
          : [];

        const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const obrasFavoritasJson: unknown = obrasFavoritasTexto
          ? JSON.parse(obrasFavoritasTexto)
          : [];
        const obrasFavoritasNormalizadas = normalizarListaIds(
          obrasFavoritasJson
        );

        const obrasConcluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
        const obrasConcluidasJson: unknown = obrasConcluidasTexto
          ? JSON.parse(obrasConcluidasTexto)
          : [];
        const obrasConcluidasNormalizadas = normalizarListaIds(
          obrasConcluidasJson
        );

        const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        const notificacoesJson: unknown = notificacoesTexto
          ? JSON.parse(notificacoesTexto)
          : [];
        const totalNotificacoesNaoLidas = contarNotificacoesNaoLidas(
          notificacoesJson
        );

        if (!componenteAtivo) {
          return;
        }

        setObras(obrasNormalizadas);
        setObrasFavoritas(obrasFavoritasNormalizadas);
        setObrasConcluidas(obrasConcluidasNormalizadas);
        setNotificacoesNaoLidas(totalNotificacoesNaoLidas);
        setPerfisAutoresSalvos(carregarPerfisAutores());

        const dadosSupabase = await carregarPainelAutorSupabase(
          obrasNormalizadas,
          obrasFavoritasNormalizadas,
          obrasConcluidasNormalizadas
        );

        if (!componenteAtivo) {
          return;
        }

        const obrasFinais = dadosSupabase.obras.map((obra, index) =>
          normalizarObra(obra as ObraSalva, index)
        );

        sincronizarBackupArquivosObras(obrasFinais);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasFinais));
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(dadosSupabase.favoritas)
        );
        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(dadosSupabase.concluidas)
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
        setNotificacoesNaoLidas(0);
        setPerfisAutoresSalvos({});
      }
    }

    void carregarDadosPainelAutor();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const obrasComMetricas = useMemo<ObraComMetricas[]>(() => {
    return obras
      .map((obra) => {
        const totalCurtidas = calcularCurtidas(obra);
        const totalComentarios = calcularComentarios(obra);
        const totalSalvos = calcularSalvos(obra);
        const totalLidos = calcularLidos(obra);
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
            : obra.capitulos.length === 0;

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

  const totalArquivos = obrasComMetricas.filter((obra) =>
    Boolean(obra.arquivoObra)
  ).length;

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

  const melhorObra = obrasComMetricas[0] || null;
  const autorPrincipal =
    melhorObra?.autor || obrasComMetricas[0]?.autor || obras[0]?.autor || "";
  const autorPrincipalNormalizado = autorPrincipal
    ? normalizarNomeAutor(autorPrincipal)
    : "";
  const obrasDoAutorPrincipal = autorPrincipalNormalizado
    ? obras.filter(
        (obra) => normalizarNomeAutor(obra.autor) === autorPrincipalNormalizado
      )
    : [];
  const perfilAutorSalvo = autorPrincipalNormalizado
    ? perfisAutoresSalvos[autorPrincipalNormalizado] || {
        avatar: "",
        avatarNome: "",
        bio: "",
      }
    : {
        avatar: "",
        avatarNome: "",
        bio: "",
      };
  const bioPadraoAutor = autorPrincipal
    ? criarBioPadraoAutor(autorPrincipal, obrasDoAutorPrincipal)
    : "Crie uma obra primeiro. Depois você poderá editar a bio do seu perfil.";
  const bioPerfilAutor = perfilAutorSalvo.bio.trim() || bioPadraoAutor;
  const caracteresRestantesBio = BIO_MAX_LENGTH - perfilAutorSalvo.bio.length;

  const filtrosAtivos =
    Boolean(busca.trim()) || filtro !== "todas" || ordenacao !== "pontuacao";
  const textoResultadoFiltro =
    obrasFiltradas.length === 1
      ? "1 obra encontrada"
      : `${obrasFiltradas.length} obras encontradas`;

  function salvarPerfilAutor(novoPerfil: PerfilAutorSalvo) {
    if (!autorPrincipalNormalizado) {
      return;
    }

    const novosPerfis = {
      ...perfisAutoresSalvos,
      [autorPrincipalNormalizado]: {
        avatar: novoPerfil.avatar,
        avatarNome: novoPerfil.avatarNome,
        bio: novoPerfil.bio.slice(0, BIO_MAX_LENGTH),
      },
    };

    localStorage.setItem(AUTHOR_PROFILE_STORAGE_KEY, JSON.stringify(novosPerfis));
    setPerfisAutoresSalvos(novosPerfis);
  }

  function atualizarBioAutor(novaBio: string) {
    salvarPerfilAutor({
      avatar: perfilAutorSalvo.avatar,
      avatarNome: perfilAutorSalvo.avatarNome,
      bio: novaBio.slice(0, BIO_MAX_LENGTH),
    });
  }

  function selecionarAvatarAutor(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setAvatarErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setAvatarErro("Escolha uma imagem válida.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > AVATAR_MAX_SIZE) {
      setAvatarErro("A imagem precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setAvatarErro("Não consegui carregar essa imagem.");
        return;
      }

      salvarPerfilAutor({
        avatar: resultado,
        avatarNome: arquivo.name,
        bio: perfilAutorSalvo.bio,
      });
    };

    leitor.onerror = () => {
      setAvatarErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerAvatarAutor() {
    salvarPerfilAutor({
      avatar: "",
      avatarNome: "",
      bio: perfilAutorSalvo.bio,
    });

    setAvatarErro("");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("pontuacao");
  }

  function alternarFavoritoObra(obraId: string) {
    const vaiFavoritar = !obrasFavoritas.includes(obraId);
    const novasObrasFavoritas = vaiFavoritar
      ? [...obrasFavoritas, obraId]
      : obrasFavoritas.filter((id) => id !== obraId);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas)
    );

    setObrasFavoritas(novasObrasFavoritas);
    void sincronizarColecaoPainelSupabase("favoritos", obraId, vaiFavoritar);
  }

  function alternarConcluidoObra(obraId: string) {
    const vaiConcluir = !obrasConcluidas.includes(obraId);
    const novasObrasConcluidas = vaiConcluir
      ? [...obrasConcluidas, obraId]
      : obrasConcluidas.filter((id) => id !== obraId);

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas)
    );

    setObrasConcluidas(novasObrasConcluidas);
    void sincronizarColecaoPainelSupabase("concluidas", obraId, vaiConcluir);
  }

  const usuarioLogado = Boolean(emailUsuarioLogado);
  const nomeConta =
    nomeUsuarioLogado.trim() ||
    emailUsuarioLogado.split("@")[0] ||
    "Conta Historietas";
  const inicialConta = (nomeConta.trim().charAt(0) || "H").toUpperCase();

  async function sairDaConta() {
    setSaindoDaConta(true);

    try {
      await supabase.auth.signOut();
      setEmailUsuarioLogado("");
      setNomeUsuarioLogado("");
      window.location.href = "/login";
    } catch {
      setSaindoDaConta(false);
    }
  }

  const textoNotificacoes =
    notificacoesNaoLidas > 0
      ? `Notificações (${notificacoesNaoLidas})`
      : "Notificações";

  return (
    <main style={pageStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <div style={topActionsStyle}>
            {usuarioLogado ? (
              <button
                type="button"
                onClick={sairDaConta}
                style={signOutButtonStyle}
                disabled={saindoDaConta}
              >
                {saindoDaConta ? "Saindo..." : "Sair"}
              </button>
            ) : (
              <Link href="/login" style={topButtonStyle}>
                {verificandoUsuario ? "Verificando..." : "Entrar"}
              </Link>
            )}
          </div>
        </header>

        <section style={heroStyle}>
          <div style={heroGlowStyle} />

          <div style={isDesktop ? desktopHeroContentStyle : heroContentStyle}>
            <h1 style={titleStyle}>Painel do Autor</h1>

            <p style={descriptionStyle}>
              Gerencie suas obras, capítulos e desempenho sem excesso de painel.
            </p>

            {usuarioLogado && (
              <div style={accountNoticeStyle}>
                <span style={accountNoticeLabelStyle}>CONTA CONECTADA</span>

                <strong style={accountNoticeNameStyle}>{nomeConta}</strong>

                {isDesktop && (
                  <span style={accountNoticeEmailStyle}>
                    {emailUsuarioLogado}
                  </span>
                )}
              </div>
            )}

            <div style={isDesktop ? desktopHeroActionsStyle : heroActionsStyle}>
              <Link href="/publicar" style={heroPrimaryButtonStyle}>
                + Publicar nova obra
              </Link>

              <Link href="/minhas-obras" style={heroSecondaryButtonStyle}>
                Editar obras
              </Link>

              <button
                type="button"
                onClick={() => setEditarPerfilAberto((aberto) => !aberto)}
                style={heroProfileButtonStyle}
              >
                {editarPerfilAberto ? "Fechar perfil" : "Editar perfil"}
              </button>
            </div>
          </div>
        </section>

        {editarPerfilAberto && (
          <section style={isDesktop ? desktopProfileEditorBoxStyle : profileEditorBoxStyle}>
            <div style={isDesktop ? desktopProfileEditorHeaderStyle : profileEditorHeaderStyle}>
              <div style={profileAvatarPreviewStyle}>
                {perfilAutorSalvo.avatar ? (
                  <img
                    src={perfilAutorSalvo.avatar}
                    alt={`Imagem de ${autorPrincipal || "autor"}`}
                    style={profileAvatarImageStyle}
                  />
                ) : (
                  <span>{autorPrincipal ? autorPrincipal.charAt(0) : "H"}</span>
                )}
              </div>

              <div style={profileEditorTextBlockStyle}>
                <span style={miniTitleStyle}>EDITAR PERFIL</span>

                <h2 style={profileEditorTitleStyle}>
                  {autorPrincipal || "Perfil do autor"}
                </h2>

                <p style={profileEditorTextStyle}>
                  Altere apenas sua foto e sua bio. Isso aparece no perfil
                  público do autor.
                </p>
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={selecionarAvatarAutor}
              style={hiddenInputStyle}
            />

            <div style={isDesktop ? desktopProfileActionsStyle : profileActionsStyle}>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                style={profilePhotoButtonStyle}
                disabled={!autorPrincipalNormalizado}
              >
                {perfilAutorSalvo.avatar ? "Trocar foto" : "Colocar foto"}
              </button>

              {perfilAutorSalvo.avatar && (
                <button
                  type="button"
                  onClick={removerAvatarAutor}
                  style={profileRemoveButtonStyle}
                >
                  Remover foto
                </button>
              )}
            </div>

            {avatarErro && <span style={profileErrorStyle}>{avatarErro}</span>}

            <textarea
              value={perfilAutorSalvo.bio}
              onChange={(event) => atualizarBioAutor(event.target.value)}
              placeholder={bioPadraoAutor}
              maxLength={BIO_MAX_LENGTH}
              style={profileTextareaStyle}
              disabled={!autorPrincipalNormalizado}
            />

            <div style={profileFooterStyle}>
              <span style={profilePreviewTextStyle}>{bioPerfilAutor}</span>

              <span style={profileCounterStyle}>
                {caracteresRestantesBio} caracteres
              </span>
            </div>
          </section>
        )}

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
            <strong style={statNumberStyle}>{totalArquivos}</strong>
            <span style={statLabelStyle}>
              {totalArquivos === 1 ? "arquivo" : "arquivos"}
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
        </section>

        <section style={isDesktop ? desktopFilterBoxStyle : filterBoxStyle}>
          <div style={isDesktop ? desktopFilterHeaderStyle : filterHeaderStyle}>
            <div style={isDesktop ? desktopFilterHeaderTextStyle : filterHeaderTextStyle}>
              <span style={miniTitleStyle}>CONTROLE DO PAINEL</span>

              <h2 style={filterTitleStyle}>Buscar e organizar obras</h2>

              <p style={filterTextStyle}>
                {textoResultadoFiltro} de {obrasComMetricas.length} no painel.
              </p>
            </div>

            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                style={isDesktop ? desktopClearFilterButtonStyle : clearFilterButtonStyle}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div style={isDesktop ? desktopFilterControlsGridStyle : filterGridStyle}>
            <div style={isDesktop ? desktopSearchFieldBoxStyle : fieldBoxStyle}>
              <label style={filterLabelStyle}>Buscar obra</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Título, autor, gênero, formato, tag ou capítulo..."
                style={searchInputStyle}
                type="text"
              />
            </div>

            <div style={fieldBoxStyle}>
              <label style={filterLabelStyle}>Filtrar</label>

              <select
                value={filtro}
                onChange={(event) => setFiltro(event.target.value as FiltroPainel)}
                style={selectStyle}
              >
                <option value="todas">Todas as obras</option>
                <option value="publicadas">Publicadas</option>
                <option value="rascunhos">Rascunhos</option>
                <option value="sem-capitulos">Sem capítulos</option>
              </select>
            </div>

            <div style={fieldBoxStyle}>
              <label style={filterLabelStyle}>Ordenar</label>

              <select
                value={ordenacao}
                onChange={(event) =>
                  setOrdenacao(event.target.value as OrdenacaoPainel)
                }
                style={selectStyle}
              >
                <option value="pontuacao">Melhor desempenho</option>
                <option value="recentes">Mais recentes</option>
                <option value="titulo">Título</option>
                <option value="capitulos">Mais capítulos</option>
              </select>
            </div>
          </div>
        </section>

        {melhorObra && (
          <section style={isDesktop ? desktopHighlightBoxStyle : highlightBoxStyle}>
            <div style={{ minWidth: 0 }}>
              <span style={miniTitleStyle}>MELHOR DESEMPENHO</span>

              <h2 style={highlightTitleStyle}>{melhorObra.titulo}</h2>

              <p style={highlightTextStyle}>
                {melhorObra.pontuacao} pontos • {melhorObra.totalCurtidas} curtidas • {" "}
                {melhorObra.totalComentarios} comentários • {melhorObra.totalSalvos} salvos.
              </p>
            </div>

            <div style={isDesktop ? desktopHighlightActionsStyle : highlightActionsStyle}>
              <Link
                href={`/minha-obra?obraId=${melhorObra.id}`}
                style={highlightButtonStyle}
              >
                Ver obra
              </Link>

              <Link
                href={`/editar-obra?obraId=${melhorObra.id}`}
                style={highlightSecondaryButtonStyle}
              >
                Editar
              </Link>
            </div>
          </section>
        )}

        {obrasComMetricas.length === 0 ? (
          <section style={emptyBoxStyle}>
            <h2 style={emptyTitleStyle}>Nenhuma obra criada ainda</h2>

            <p style={emptyTextStyle}>
              Publique sua primeira história para começar a acompanhar seu
              painel de autor.
            </p>

            <Link href="/publicar" style={emptyButtonStyle}>
              Criar primeira obra
            </Link>
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
            titulo="Suas obras"
            descricao="Lista principal das suas obras no painel."
            obras={obrasFiltradas}
            obrasFavoritas={obrasFavoritas}
            obrasConcluidas={obrasConcluidas}
            isDesktop={isDesktop}
            onAlternarFavorito={alternarFavoritoObra}
            onAlternarConcluido={alternarConcluidoObra}
          />
        )}
      </section>
    </main>
  );
}

function PainelSecao({
  titulo,
  descricao,
  obras,
  obrasFavoritas,
  obrasConcluidas,
  isDesktop,
  onAlternarFavorito,
  onAlternarConcluido,
}: {
  titulo: string;
  descricao: string;
  obras: ObraComMetricas[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  isDesktop: boolean;
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
}) {
  if (obras.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
        <div style={{ minWidth: 0 }}>
          <span style={miniTitleStyle}>MINHAS OBRAS</span>

          <h2 style={sectionTitleStyle}>{titulo}</h2>

          <p style={sectionTextStyle}>{descricao}</p>
        </div>
      </div>

      <div style={isDesktop ? desktopWorksGridStyle : worksGridStyle}>
        {obras.map((obra) => (
          <ObraPainelCard
            key={obra.id}
            obra={obra}
            favoritada={obrasFavoritas.includes(obra.id)}
            concluida={obrasConcluidas.includes(obra.id)}
            isDesktop={isDesktop}
            onAlternarFavorito={onAlternarFavorito}
            onAlternarConcluido={onAlternarConcluido}
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
  onAlternarFavorito,
  onAlternarConcluido,
}: {
  obra: ObraComMetricas;
  favoritada: boolean;
  concluida: boolean;
  isDesktop: boolean;
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
}) {
  const obraHref = `/minha-obra?obraId=${obra.id}`;
  const editarHref = `/editar-obra?obraId=${obra.id}`;
  const capituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
  const ultimoCapitulo = obra.capitulos[obra.capitulos.length - 1] || null;
  const temAtividade = obraTemAtividade(obra);
  const progressoVisual = Math.min(100, Math.max(0, obra.progressoLeitura));

  return (
    <article style={isDesktop ? desktopWorkCardStyle : workCardStyle}>
      <Link href={obraHref} style={coverLinkStyle}>
        <div style={isDesktop ? criarPainelCoverDesktopStyle(obra.capa) : criarPainelCoverStyle(obra.capa)}>
          <div style={coverGlowStyle} />

          <span style={genreBadgeStyle}>{obra.genero}</span>

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
            {obra.publicado ? "Publicado" : "Rascunho"}
          </span>

          <span style={formatBadgeStyle}>{obra.formato}</span>

          {mostrarClassificacao(obra) && (
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
          )}

          {obra.arquivoObra && (
            <span style={fileAttachedBadgeStyle}>Arquivo anexado</span>
          )}

          {favoritada && <span style={favoriteBadgeStyle}>Favorita</span>}

          {concluida && <span style={completedBadgeStyle}>Concluída</span>}

          {temAtividade && <span style={activityBadgeStyle}>Com atividade</span>}
        </div>

        <h3 style={workTitleStyle}>{obra.titulo}</h3>

        <p style={authorStyle}>por {obra.autor}</p>

        <div style={isDesktop ? desktopMetricGridStyle : metricGridStyle}>
          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.capitulos.length}</strong>
            <span style={metricLabelStyle}>capítulos</span>
          </div>

          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.totalCurtidas}</strong>
            <span style={metricLabelStyle}>curtidas</span>
          </div>

          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.totalComentarios}</strong>
            <span style={metricLabelStyle}>comentários</span>
          </div>

          <div style={metricItemStyle}>
            <strong style={metricNumberStyle}>{obra.totalSalvos}</strong>
            <span style={metricLabelStyle}>salvos</span>
          </div>
        </div>

        <div style={progressBoxStyle}>
          <div style={progressHeaderStyle}>
            <span style={progressLabelStyle}>Progresso dos leitores</span>
            <strong style={progressValueStyle}>{progressoVisual}%</strong>
          </div>

          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${progressoVisual}%`,
              }}
            />
          </div>
        </div>

        {ultimoCapitulo && (
          <div style={lastBoxStyle}>
            <span style={lastBadgeStyle}>ÚLTIMO CAPÍTULO</span>

            <p style={lastTextStyle}>{ultimoCapitulo.titulo}</p>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionsGridStyle : actionsGridStyle}>
          <Link href={obraHref} style={openButtonStyle}>
            Ver obra
          </Link>

          <Link href={editarHref} style={editButtonStyle}>
            Editar
          </Link>

          <Link href={capituloHref} style={chapterButtonStyle}>
            + Capítulo
          </Link>

          <button
            type="button"
            onClick={() => onAlternarFavorito(obra.id)}
            style={favoritada ? quickActionActiveButtonStyle : quickActionButtonStyle}
          >
            {favoritada ? "Favoritada" : "Favoritar"}
          </button>

          <button
            type="button"
            onClick={() => onAlternarConcluido(obra.id)}
            style={concluida ? quickActionActiveButtonStyle : quickActionButtonStyle}
          >
            {concluida ? "Concluída" : "Concluir"}
          </button>
        </div>
      </div>
    </article>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const themeAccent = "var(--historietas-accent, #F97316)";
const themeSecondary = "var(--historietas-secondary, #7C3AED)";
const themeTextAccent = "var(--historietas-text-accent, #FDBA74)";
const themeGradient = `linear-gradient(135deg, ${themeAccent} 0%, ${themeSecondary} 100%)`;
const themeGradientReverse = `linear-gradient(135deg, ${themeSecondary} 0%, ${themeAccent} 100%)`;
const themeAccentSoft = "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)";
const themeSecondarySoft = "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)";
const themeAccentBorder = "color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)";
const themeSecondaryBorder = "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, transparent)";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 30%), radial-gradient(circle at 88% 14%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 58px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 78px))",
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
  background: themeGradient,
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  boxShadow: `0 10px 24px ${themeAccentSoft}`,
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: `linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, ${themeSecondary} 46%, #FFFFFF) 42%, ${themeTextAccent} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  flex: "0 0 auto",
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flexWrap: "nowrap",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const userChipStyle: CSSProperties = {
  minHeight: "40px",
  maxWidth: "310px",
  padding: "5px 10px 5px 5px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.085) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  boxSizing: "border-box",
  overflow: "hidden",
};

const userMiniAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  background: themeGradient,
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxShadow: `0 8px 18px ${themeAccentSoft}`,
};

const userChipTextBlockStyle: CSSProperties = {
  display: "grid",
  gap: "1px",
  minWidth: 0,
};

const userChipNameStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1.1,
  fontWeight: 950,
  maxWidth: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const userChipEmailStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "9px",
  lineHeight: 1.1,
  fontWeight: 800,
  maxWidth: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const signOutButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#FCA5A5",
  fontSize: "13px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  flex: "0 0 auto",
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const accountNoticeStyle: CSSProperties = {
  width: "min(100%, 520px)",
  margin: "0 auto",
  padding: "9px 12px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, rgba(255,255,255,0.045)) 0%, rgba(255,255,255,0.045) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  display: "grid",
  gap: "3px",
  justifyItems: "center",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
};

const accountNoticeLabelStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "9px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const accountNoticeNameStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  maxWidth: "100%",
  ...safeTextStyle,
};

const accountNoticeEmailStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 800,
  maxWidth: "100%",
  ...safeTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "26px",
  border: `1px solid ${themeAccentBorder}`,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, rgba(12,7,23,0.98)) 0%, rgba(12,7,23,0.99) 100%)",
  boxShadow: "0 18px 48px rgba(0,0,0,0.30), 0 0 34px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 11%, transparent)",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent), transparent 32%), radial-gradient(circle at 80% 24%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 58%, transparent), transparent 36%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "20px 15px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 9vw, 52px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.072em",
  maxWidth: "100%",
  paddingBottom: "3px",
  background: `linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 42%, ${themeTextAccent} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "#D4D4D8",
  fontSize: "13px",
  lineHeight: 1.48,
  fontWeight: 700,
  maxWidth: "560px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const heroPrimaryButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  background: themeAccent,
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const heroSecondaryButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  background: themeSecondarySoft,
  border: `1px solid ${themeSecondaryBorder}`,
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const heroProfileButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const profileEditorBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "21px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(18,12,30,0.90))",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const profileEditorHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(48px, 54px) minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const profileAvatarPreviewStyle: CSSProperties = {
  width: "100%",
  maxWidth: "54px",
  height: "54px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: themeGradient,
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 950,
  overflow: "hidden",
  boxShadow: `0 10px 22px ${themeSecondarySoft}`,
  boxSizing: "border-box",
};

const profileAvatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const profileEditorTextBlockStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
};

const profileEditorTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  paddingBottom: "1px",
  ...safeTextStyle,
};

const profileEditorTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#A1A1AA",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 750,
  ...safeTextStyle,
};

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const profileActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const profilePhotoButtonStyle: CSSProperties = {
  flex: "1 1 132px",
  minHeight: "34px",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: `1px solid ${themeSecondaryBorder}`,
  background: themeSecondarySoft,
  color: "#DDD6FE",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const profileRemoveButtonStyle: CSSProperties = {
  ...profilePhotoButtonStyle,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.12)",
  color: "#FCA5A5",
};

const profileErrorStyle: CSSProperties = {
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 800,
  ...safeTextStyle,
};

const profileTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "72px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#18181B",
  color: "#FFFFFF",
  padding: "10px 11px",
  outline: "none",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 700,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const profileFooterStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const profilePreviewTextStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 700,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const profileCounterStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "right",
  ...safeTextStyle,
};

const statsBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
  gap: "8px",
  marginTop: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  borderRadius: "16px",
  background: "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, rgba(31,22,48,0.62)) 0%, rgba(18,12,30,0.78) 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  padding: "10px 9px",
  display: "grid",
  gap: "2px",
  justifyItems: "center",
  textAlign: "center",
  minHeight: "62px",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "10px",
  lineHeight: 1.18,
  fontWeight: 850,
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 13%, rgba(18,12,30,0.86)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 6%, rgba(11,6,20,0.92)) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

const filterHeaderTextStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
};

const filterTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#FFFFFF",
  fontSize: "clamp(22px, 5.4vw, 28px)",
  lineHeight: 1.18,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  paddingBottom: "2px",
  ...safeTextStyle,
};

const filterTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#A1A1AA",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 800,
  maxWidth: "100%",
  ...safeTextStyle,
};

const clearFilterButtonStyle: CSSProperties = {
  flex: "1 1 138px",
  minHeight: "40px",
  maxWidth: "100%",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(7,5,12,0.78)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const filterLabelStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(7,5,12,0.78)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 800,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const highlightBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "21px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%)",
  border: `1px solid ${themeAccentBorder}`,
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const highlightTitleStyle: CSSProperties = {
  margin: "3px 0 0",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  paddingBottom: "1px",
  ...safeTextStyle,
};

const highlightTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 750,
  maxWidth: "100%",
  ...safeTextStyle,
};

const highlightActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const highlightButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: themeGradientReverse,
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const highlightSecondaryButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: themeSecondarySoft,
  border: `1px solid ${themeSecondaryBorder}`,
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  marginBottom: "10px",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: themeTextAccent,
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  marginBottom: "6px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  paddingBottom: "1px",
  ...safeTextStyle,
};

const sectionTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#A1A1AA",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 750,
  maxWidth: "100%",
  ...safeTextStyle,
};

const worksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const workCardStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "8px",
  borderRadius: "19px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(33,24,50,0.92)) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 9px 22px rgba(0,0,0,0.18), 0 0 16px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 5%, transparent)",
  color: "#FFFFFF",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const coverLinkStyle: CSSProperties = {
  textDecoration: "none",
  color: "#FFFFFF",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  minHeight: "92px",
  borderRadius: "15px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 44%, transparent), transparent 38%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.76) 100%)",
};

const genreBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 88%, transparent)",
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "9px",
  right: "9px",
  bottom: "9px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 0.9,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};

const coverLabelStyle: CSSProperties = {
  color: "#E4E4E7",
  fontSize: "8px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  textAlign: "right",
  ...safeTextStyle,
};

const workContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  minWidth: 0,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const draftStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: themeAccentSoft,
  border: `1px solid ${themeAccentBorder}`,
  color: themeTextAccent,
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E4E4E7",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: themeSecondarySoft,
  border: `1px solid ${themeSecondaryBorder}`,
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const fileAttachedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.28)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(249, 115, 22, 0.14)",
  border: `1px solid ${themeAccentBorder}`,
  color: themeTextAccent,
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.14)",
  border: "1px solid rgba(96, 165, 250, 0.32)",
  color: "#BFDBFE",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const activityBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 13%, transparent)",
  border: `1px solid ${themeSecondaryBorder}`,
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const workTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  paddingBottom: "2px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: themeTextAccent,
  fontSize: "11px",
  fontWeight: 850,
  maxWidth: "100%",
  ...safeTextStyle,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(64px, 1fr))",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const metricItemStyle: CSSProperties = {
  padding: "6px 4px",
  borderRadius: "11px",
  background: "rgba(15,15,15,0.22)",
  border: "1px solid rgba(255,255,255,0.05)",
  display: "grid",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const metricNumberStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const metricLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "8px",
  lineHeight: 1.08,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const progressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "7px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const progressHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const progressLabelStyle: CSSProperties = {
  color: "#A1A1AA",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};

const progressValueStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "10px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.08)",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  minWidth: "6px",
  borderRadius: "999px",
  background: themeGradient,
  boxShadow: `0 0 18px ${themeAccentSoft}`,
};

const lastBoxStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  padding: "6px",
  borderRadius: "11px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, transparent)",
  border: `1px solid ${themeSecondaryBorder}`,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const lastBadgeStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.07em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const lastTextStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const openButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  background: themeAccent,
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const editButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  background: themeSecondary,
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const chapterButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const quickActionButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 6px",
  lineHeight: 1.15,
  cursor: "pointer",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const quickActionActiveButtonStyle: CSSProperties = {
  ...quickActionButtonStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, rgba(255,255,255,0.07))",
  border: `1px solid ${themeAccentBorder}`,
  color: themeTextAccent,
};


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 56px))",
  padding: "24px 0 72px",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "28px 34px",
  gap: "14px",
  textAlign: "center",
  justifyItems: "center",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 176px))",
  justifyContent: "center",
  justifySelf: "center",
  gap: "10px",
  width: "min(100%, 560px)",
  maxWidth: "560px",
};

const desktopProfileEditorBoxStyle: CSSProperties = {
  ...profileEditorBoxStyle,
  padding: "18px",
  borderRadius: "24px",
};

const desktopProfileEditorHeaderStyle: CSSProperties = {
  ...profileEditorHeaderStyle,
  gridTemplateColumns: "72px minmax(0, 1fr)",
  gap: "14px",
};

const desktopProfileActionsStyle: CSSProperties = {
  ...profileActionsStyle,
  maxWidth: "420px",
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  width: "100%",
  margin: "14px 0 0",
  padding: "18px",
  borderRadius: "24px",
  gap: "16px",
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  alignItems: "center",
  flexWrap: "nowrap",
};

const desktopFilterHeaderTextStyle: CSSProperties = {
  ...filterHeaderTextStyle,
  flex: "1 1 auto",
};

const desktopClearFilterButtonStyle: CSSProperties = {
  ...clearFilterButtonStyle,
  flex: "0 0 auto",
  width: "160px",
  minHeight: "40px",
};

const desktopFilterControlsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1.6fr) minmax(190px, 0.7fr) minmax(190px, 0.7fr)",
  gap: "12px",
  alignItems: "end",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSearchFieldBoxStyle: CSSProperties = {
  ...fieldBoxStyle,
  minWidth: 0,
};

const desktopFilterGridStyle: CSSProperties = {
  ...filterGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const desktopHighlightBoxStyle: CSSProperties = {
  ...highlightBoxStyle,
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  alignItems: "center",
  padding: "16px",
};

const desktopHighlightActionsStyle: CSSProperties = {
  ...highlightActionsStyle,
  gridTemplateColumns: "1fr 1fr",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "18px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  marginBottom: "12px",
};

const desktopWorksGridStyle: CSSProperties = {
  ...worksGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const desktopWorkCardStyle: CSSProperties = {
  ...workCardStyle,
  gridTemplateColumns: "158px minmax(0, 1fr)",
  gap: "12px",
  padding: "10px",
  borderRadius: "22px",
  alignItems: "stretch",
};

const desktopWorkContentStyle: CSSProperties = {
  ...workContentStyle,
  gap: "8px",
  alignContent: "start",
};

const desktopMetricGridStyle: CSSProperties = {
  ...metricGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
};

const desktopCardActionsGridStyle: CSSProperties = {
  ...actionsGridStyle,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "7px",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "26px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(31,31,35,0.96))",
  border: "1px solid #2D2D32",
  padding: "22px",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const emptyMiniBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "20px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(31,31,35,0.96))",
  border: "1px solid #2D2D32",
  color: "#A1A1AA",
  fontSize: "14px",
  fontWeight: 800,
  lineHeight: 1.6,
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  ...safeTextStyle,
};

const emptyMiniTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const emptyMiniTextStyle: CSSProperties = {
  color: "#A1A1AA",
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
  fontSize: "28px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  paddingBottom: "2px",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  borderRadius: "999px",
  background: themeSecondary,
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};
