"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
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
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%), url(${capa})`,
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

  const usuarioLogado = Boolean(emailUsuarioLogado);
  const nomeConta =
    nomeUsuarioLogado.trim() ||
    emailUsuarioLogado.split("@")[0] ||
    "Conta Historietas";

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


  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${painelAutorPageCss}`}</style>

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-painel-logo-text" style={logoTextStyle}>istorietas</span>
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
            <h1 className="historietas-painel-hero-title" style={titleStyle}>Painel do Autor</h1>

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
              <Link href="/minhas-obras" style={heroSecondaryButtonStyle}>
                Editar obras
              </Link>

              <Link href="/publicar" style={heroPrimaryButtonStyle}>
                Publicar nova obra
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
              <h2 style={filterTitleStyle}>CONTROLE DO PAINEL</h2>

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
            obras={obrasFiltradas}
            obrasFavoritas={obrasFavoritas}
            obrasConcluidas={obrasConcluidas}
            isDesktop={isDesktop}
          />
        )}
      </section>
    </main>
  );
}

function PainelSecao({
  obras,
  obrasFavoritas,
  obrasConcluidas,
  isDesktop,
}: {
  obras: ObraComMetricas[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  isDesktop: boolean;
}) {
  if (obras.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
        <h2 style={sectionTitleStyle}>Minhas Obras</h2>
      </div>

      <div style={isDesktop ? desktopWorksGridStyle : worksGridStyle}>
        {obras.map((obra) => (
          <ObraPainelCard
            key={obra.id}
            obra={obra}
            favoritada={obrasFavoritas.includes(obra.id)}
            concluida={obrasConcluidas.includes(obra.id)}
            isDesktop={isDesktop}
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
}: {
  obra: ObraComMetricas;
  favoritada: boolean;
  concluida: boolean;
  isDesktop: boolean;
}) {
  const obraHref = `/minha-obra?obraId=${obra.id}`;
  const editarHref = `/editar-obra?obraId=${obra.id}`;
  const capituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
  const progressoVisual = Math.min(100, Math.max(0, obra.progressoLeitura));

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
            {obra.publicado ? "Publicado" : "Rascunho"}
          </span>

          <span style={formatBadgeStyle}>{obra.formato}</span>

          <span style={genreBadgeStyle}>{obra.genero}</span>

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

        </div>

        <h3 style={workTitleStyle}>{obra.titulo}</h3>

        <p style={authorStyle}>Por {obra.autor}</p>

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
            Ver obra
          </Link>

          <Link href={editarHref} style={editButtonStyle}>
            Editar
          </Link>

          <Link href={capituloHref} style={chapterButtonStyle}>
            + Capítulo
          </Link>

        </div>
      </div>
    </article>
  );
}

const painelAutorPageCss = `
  html[data-historietas-tema-visual] nav a[href="/painel"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-tema-visual="branco"] .historietas-painel-logo-text,
  html[data-historietas-tema-visual="branco"] .historietas-painel-hero-title {
    background: none !important;
    color: #1A73E8 !important;
    -webkit-text-fill-color: #1A73E8 !important;
    text-shadow: none !important;
  }

  html[data-historietas-tema-visual="branco"] input::placeholder,
  html[data-historietas-tema-visual="branco"] textarea::placeholder {
    color: #80868B !important;
  }

  html[data-historietas-tema-visual="branco"] button:disabled {
    opacity: 1 !important;
    background: #F1F3F4 !important;
    border-color: #DADCE0 !important;
    color: #5F6368 !important;
    cursor: not-allowed !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const themeAccent = "var(--historietas-accent, #F97316)";
const themeSecondary = "var(--historietas-secondary, #7C3AED)";
const themeTextAccent = "var(--historietas-text-accent, #FDBA74)";
const themeGradient = `linear-gradient(135deg, ${themeAccent} 0%, ${themeSecondary} 100%)`;

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
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 calc(100px + env(safe-area-inset-bottom))",
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
  color: "var(--historietas-text-primary, #FFFFFF)",
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
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent))",
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
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






const signOutButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border: "1px solid color-mix(in srgb, var(--historietas-danger-button-text, #FCA5A5) 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
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
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, var(--historietas-surface, rgba(255,255,255,0.045))) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.045)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
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
  color: "var(--historietas-text-secondary, #A1A1AA)",
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
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, rgba(12,7,23,0.98))) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  display: "none",
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
  background: "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
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
  fontSize: "10.5px",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "10.5px",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
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
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, var(--historietas-surface, rgba(18,12,30,0.90)))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: themeGradient,
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 950,
  overflow: "hidden",
  boxShadow: "none",
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
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1.14,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  paddingBottom: "1px",
  ...safeTextStyle,
};

const profileEditorTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
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
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
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
  border: "1px solid color-mix(in srgb, var(--historietas-danger-button-text, #FCA5A5) 28%, var(--historietas-border-soft, transparent))",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
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
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
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
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "7px",
  marginTop: "12px",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  borderRadius: "15px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, var(--historietas-surface, rgba(31,22,48,0.62))) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.78)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  boxShadow: "var(--historietas-card-shadow, none)",
  padding: "8px 6px",
  display: "grid",
  gap: "3px",
  alignContent: "center",
  justifyItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "56px",
  minWidth: 0,
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.15,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  padding: "10px 11px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, var(--historietas-surface, rgba(18,12,30,0.86))) 0%, var(--historietas-surface-strong, rgba(11,6,20,0.92)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const filterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  textAlign: "center",
};

const filterHeaderTextStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  justifyItems: "center",
  gap: "3px",
  textAlign: "center",
};

const filterTitleStyle: CSSProperties = {
  margin: 0,
  color: themeTextAccent,
  fontSize: "clamp(18px, 4.8vw, 24px)",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "center",
  maxWidth: "100%",
  paddingBottom: 0,
  ...safeTextStyle,
};

const filterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 800,
  maxWidth: "100%",
  textAlign: "center",
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
  minHeight: "38px",
  borderRadius: "15px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, rgba(7,5,12,0.78))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  textAlign: "center",
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  textAlign: "center",
};

const filterLabelStyle: CSSProperties = {
  color: themeTextAccent,
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const selectStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "15px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, rgba(7,5,12,0.78))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 800,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
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
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
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
  color: themeTextAccent,
  fontSize: "clamp(26px, 7vw, 34px)",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  maxWidth: "100%",
  paddingBottom: "1px",
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
  gridTemplateColumns: "132px minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "9px",
  padding: "9px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, var(--historietas-surface, rgba(33,24,50,0.92))) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
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
  minHeight: "214px",
  borderRadius: "17px",
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.20) 100%)",
};

const genreBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, var(--historietas-surface, transparent))",
  border: `1px solid ${themeSecondaryBorder}`,
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "9px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "10px",
  right: "10px",
  bottom: "10px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverNumberStyle: CSSProperties = {
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  color: "#FFFFFF",
  fontSize: "34px",
  lineHeight: 0.9,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};

const coverLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "9px",
  lineHeight: 1.02,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  textAlign: "left",
  ...safeTextStyle,
};

const workContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  alignContent: "start",
  minWidth: 0,
  maxWidth: "100%",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  alignItems: "center",
  minWidth: 0,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
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
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};

const fileAttachedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
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
  background: "color-mix(in srgb, #3B82F6 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #3B82F6 30%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #1D4ED8 72%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "9px",
  fontWeight: 950,
  ...safeTextStyle,
};


const workTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.08,
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
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const metricItemStyle: CSSProperties = {
  padding: "5px 4px",
  borderRadius: "10px",
  background: "var(--historietas-secondary-surface, rgba(15,15,15,0.22))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.05))",
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
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1.08,
  fontWeight: 850,
  textAlign: "center",
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
  color: themeTextAccent,
  fontSize: "11px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.08)",
  minWidth: 0,
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  minWidth: "6px",
  borderRadius: "999px",
  background: themeGradient,
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const openButtonStyle: CSSProperties = {
  minHeight: "29px",
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
  minHeight: "29px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
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


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 56px))",
  padding: "24px 0 96px",
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
  padding: "14px",
  borderRadius: "22px",
  gap: "12px",
};

const desktopFilterHeaderStyle: CSSProperties = {
  ...filterHeaderStyle,
  alignItems: "center",
  flexWrap: "nowrap",
};

const desktopFilterHeaderTextStyle: CSSProperties = {
  ...filterHeaderTextStyle,
  flex: "1 1 auto",
  justifyItems: "center",
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
  gap: "10px",
  alignItems: "end",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopSearchFieldBoxStyle: CSSProperties = {
  ...fieldBoxStyle,
  minWidth: 0,
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
  gridTemplateColumns: "154px minmax(0, 1fr)",
  gap: "10px",
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "26px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 6%, var(--historietas-surface, rgba(31,31,35,0.96)))",
  border: "1px solid var(--historietas-border-soft, #2D2D32)",
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
  color: "var(--historietas-text-secondary, #A1A1AA)",
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
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
