"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

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

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
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




type ObraSupabaseRow = {
  id: string;
  user_id: string;
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

type CapituloSupabaseRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type OrdemCapitulos = "crescente" | "decrescente";

type MetricasMinhaObraSupabase = {
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
};

const METRICAS_MINHA_OBRA_ZERADAS: MetricasMinhaObraSupabase = {
  totalCurtidas: 0,
  totalComentarios: 0,
  totalSalvos: 0,
};

const STORAGE_KEY = "historietas-obras";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";

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

function criarLoginHrefMinhaObra(obraId?: string) {
  const obraIdLimpo = obraId?.trim() || "";
  const redirectTo = obraIdLimpo
    ? `/minha-obra?obraId=${encodeURIComponent(obraIdLimpo)}`
    : "/minha-obra";
  const params = new URLSearchParams({
    redirectTo,
  });

  return `/login?${params.toString()}`;
}

function criarPerfilAutorHref(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", autorLimpo || "Autor não informado");

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

function obterNomeFallbackPerfilMinhaObra(email = "", nomeAtual = "") {
  const nomeLimpo = nomeAtual.trim();

  if (nomeLimpo && nomeLimpo !== "Autor não informado") {
    return nomeLimpo;
  }

  const nomeEmail = email.trim().split("@")[0];

  return nomeEmail || nomeLimpo || "Autor não informado";
}

async function carregarNomeProfileMinhaObra({
  userId,
  email = "",
  nomeAtual = "",
}: {
  userId: string;
  email?: string;
  nomeAtual?: string;
}) {
  const userIdLimpo = userId.trim();
  const fallback = obterNomeFallbackPerfilMinhaObra(email, nomeAtual);

  if (!userIdLimpo) {
    return fallback;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    const nomeProfile =
      typeof data?.nome === "string" && data.nome.trim() ? data.nome.trim() : "";

    if (nomeProfile) {
      return nomeProfile;
    }
  } catch {
    // Tenta o formato antigo, onde profiles.id era o id do usuário.
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", userIdLimpo)
      .maybeSingle();

    const nomeProfile =
      typeof data?.nome === "string" && data.nome.trim() ? data.nome.trim() : "";

    if (nomeProfile) {
      return nomeProfile;
    }
  } catch {
    // O nome salvo na obra continua como fallback.
  }

  return fallback;
}

function aplicarNomeProfileNasObrasMinhaObra(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
  nomeProfile: string
) {
  const nomeLimpo = nomeProfile.trim();

  if (!userId.trim() || !nomeLimpo) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra, index) => {
    const obraNormalizada = normalizarObra(obra, index);

    if (!obraPertenceAoUsuarioLogado(obraNormalizada, userId)) {
      return obraNormalizada;
    }

    return {
      ...obraNormalizada,
      autor: nomeLimpo,
      autorId: obterAutorIdObra(obraNormalizada) || userId,
    };
  });
}

function formatarGeneroMinhaObra(genero: string) {
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

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo: capitulo.titulo || `Capítulo ${index + 1}`,
    texto: capitulo.texto || "Nenhum texto foi escrito ainda.",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

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

function formatarTamanhoArquivo(tamanho: number) {
  if (!Number.isFinite(tamanho) || tamanho <= 0) {
    return "0 KB";
  }

  if (tamanho >= 1024 * 1024) {
    return `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
}

function obterTipoArquivoTexto(arquivo: ArquivoObraLocal) {
  if (arquivo.categoria === "imagem") {
    return "Imagem";
  }

  if (arquivo.categoria === "documento") {
    return "PDF";
  }

  if (arquivo.categoria === "texto") {
    return "Texto";
  }

  return "Arquivo";
}

function normalizarObra(obra: Partial<ObraLocal>, index: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
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
        : `obra-${index + 1}`,
    titulo: obra.titulo || "Obra sem título",
    autor: obra.autor || "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof (obra as Record<string, unknown>).user_id === "string" &&
          ((obra as Record<string, unknown>).user_id as string).trim()
        ? ((obra as Record<string, unknown>).user_id as string).trim()
        : typeof (obra as Record<string, unknown>).userId === "string" &&
          ((obra as Record<string, unknown>).userId as string).trim()
        ? ((obra as Record<string, unknown>).userId as string).trim()
        : "",
    genero: obra.genero || "Não informado",
    formato: obra.formato || "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse: obra.sinopse || "Nenhuma sinopse informada.",
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
              : `obra-${index + 1}`
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
                    : `obra-${index + 1}`
                )
          }`,
  };
}

function removerNotificacoesDoCapituloExcluido(
  obraId: string,
  capituloId: string
) {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    const novasNotificacoes = Array.isArray(notificacoesJson)
      ? notificacoesJson.filter((notificacao) => {
          if (!notificacao || typeof notificacao !== "object") {
            return false;
          }

          const notificacaoComCapitulo = notificacao as {
            obraId?: unknown;
            capituloId?: unknown;
          };

          return !(
            notificacaoComCapitulo.obraId === obraId &&
            notificacaoComCapitulo.capituloId === capituloId
          );
        })
      : [];

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(novasNotificacoes)
    );
  } catch {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
  }
}

function criarCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverStyle;
  }

  return {
    ...coverStyle,
    background: "var(--historietas-input-bg, #04000A)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return desktopCoverStyle;
  }

  return {
    ...desktopCoverStyle,
    background: "var(--historietas-input-bg, #04000A)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function formatarData(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR");
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function contarPalavrasTexto(texto: string) {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);

  return palavras.length;
}

function calcularTempoLeituraMinutos(totalPalavras: number) {
  if (totalPalavras <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(totalPalavras / 220));
}

function obterChavesObra(obra: Pick<ObraLocal, "id" | "slug" | "titulo">) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo), normalizarTexto(obra.titulo)]
        .filter((chave): chave is string =>
          typeof chave === "string" && Boolean(chave.trim())
        )
        .map((chave) => chave.trim())
    )
  );
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function criarHrefLeituraCapituloMinhaObra(
  obra: Pick<ObraLocal, "id" | "publicado" | "slug" | "titulo">,
  capituloId: string,
  numeroCapitulo: number
) {
  if (obra.publicado && idObraSupabaseValido(obra.id)) {
    const slugObra = obra.slug || criarSlugBase(obra.titulo);

    return `/obra/${encodeURIComponent(slugObra)}/capitulo/${numeroCapitulo}`;
  }

  const params = new URLSearchParams({
    obraId: obra.id,
    capituloId,
  });

  return `/ler-capitulo?${params.toString()}`;
}

function carregarBackupArquivosObras() {
  if (typeof window === "undefined") {
    return {} as Record<string, ArquivoObraLocal>;
  }

  try {
    const backupTexto = localStorage.getItem(FILE_BACKUP_STORAGE_KEY);
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: Record<string, ArquivoObraLocal> = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(([chave, arquivo]) => {
      const arquivoNormalizado = normalizarArquivoObra(arquivo);

      if (chave.trim() && arquivoNormalizado) {
        backupNormalizado[chave] = arquivoNormalizado;
      }
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupNormalizado));

    return backupNormalizado;
  } catch {
    return {};
  }
}

function restaurarArquivoObraComBackup(
  obra: ObraLocal,
  backup: Record<string, ArquivoObraLocal>
) {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesObra(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  return arquivoBackup ? { ...obra, arquivoObra: arquivoBackup } : obra;
}

function sincronizarBackupArquivosObras(obrasParaBackup: ObraLocal[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const backupAtual = carregarBackupArquivosObras();

    obrasParaBackup.forEach((obra) => {
      if (!obra.arquivoObra) {
        return;
      }

      obterChavesObra(obra).forEach((chave) => {
        backupAtual[chave] = obra.arquivoObra as ArquivoObraLocal;
      });
    });

    localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(backupAtual));
  } catch {
    // O backup é apenas proteção extra. Não deve travar a página.
  }
}

function obterAutorIdObra(obra: ObraLocal) {
  return typeof obra.autorId === "string" ? obra.autorId.trim() : "";
}

function obraPertenceAoUsuarioLogado(obra: ObraLocal, userId: string) {
  const autorId = obterAutorIdObra(obra);

  return Boolean(userId.trim()) && autorId === userId;
}

function carregarTodasObrasLocaisNormalizadas() {
  const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
  const obrasSalvasJson: unknown = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const backupArquivosObras = carregarBackupArquivosObras();

  const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson
        .map((obra, index) => normalizarObra(obra, index))
        .map((obra) =>
          restaurarArquivoObraComBackup(obra, backupArquivosObras)
        )
    : [];

  sincronizarBackupArquivosObras(obrasNormalizadas);

  return obrasNormalizadas;
}

function salvarObrasDoUsuarioPreservandoOutrasContas(
  obrasDoUsuario: ObraLocal[],
  userId: string
) {
  const obrasUsuarioNormalizadas = obrasDoUsuario.map((obra, index) =>
    normalizarObra(
      {
        ...obra,
        autorId: obterAutorIdObra(obra) || userId,
      },
      index
    )
  );

  const idsObrasUsuario = new Set(
    obrasUsuarioNormalizadas.map((obra) => obra.id).filter(Boolean)
  );

  let todasObrasAtuais: ObraLocal[] = [];

  try {
    todasObrasAtuais = carregarTodasObrasLocaisNormalizadas();
  } catch {
    todasObrasAtuais = [];
  }

  const obrasDeOutrasContas = todasObrasAtuais.filter((obra) => {
    if (idsObrasUsuario.has(obra.id)) {
      return false;
    }

    return obterAutorIdObra(obra) !== userId;
  });

  const obrasParaSalvar = [...obrasUsuarioNormalizadas, ...obrasDeOutrasContas];

  sincronizarBackupArquivosObras(obrasParaSalvar);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasParaSalvar));

  return obrasUsuarioNormalizadas;
}

function obterCategoriaArquivoSupabase(
  categoria: string | null
): ArquivoObraLocal["categoria"] {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}

function criarArquivoObraDeSupabase(
  obra: ObraSupabaseRow,
  arquivoLocal?: ArquivoObraLocal | null
): ArquivoObraLocal | null {
  const conteudo = obra.arquivo_url?.trim() || arquivoLocal?.conteudo || "";
  const nome = obra.arquivo_nome?.trim() || arquivoLocal?.nome || "";

  if (!conteudo || !nome) {
    return arquivoLocal || null;
  }

  return {
    nome,
    tipo: obra.arquivo_tipo || arquivoLocal?.tipo || "",
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : arquivoLocal?.tamanho || 0,
    conteudo,
    categoria: obterCategoriaArquivoSupabase(
      obra.arquivo_categoria || arquivoLocal?.categoria || "outro"
    ),
    criadoEm: obra.criada_em || arquivoLocal?.criadoEm || "",
  };
}

function mesclarCapituloSupabaseComLocal(
  capitulo: CapituloSupabaseRow,
  index: number,
  capituloLocal?: CapituloLocal
): CapituloLocal {
  return {
    id: capitulo.id,
    titulo:
      capitulo.titulo?.trim() || capituloLocal?.titulo || `Capítulo ${index + 1}`,
    texto:
      typeof capitulo.texto === "string" && capitulo.texto.trim()
        ? capitulo.texto
        : capituloLocal?.texto || "Nenhum texto foi escrito ainda.",
    curtiu: Boolean(capituloLocal?.curtiu),
    salvo: Boolean(capituloLocal?.salvo),
    comentario: capituloLocal?.comentario || "",
    criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
    lido: Boolean(capituloLocal?.lido),
    lidoEm: capituloLocal?.lidoEm || "",
  };
}

function mesclarObraSupabaseComLocal(
  obraSupabase: ObraSupabaseRow,
  capitulosSupabase: CapituloSupabaseRow[],
  obraLocal?: ObraLocal | null
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosMesclados =
    capitulosSupabase.length > 0
      ? capitulosSupabase.map((capitulo, index) =>
          mesclarCapituloSupabaseComLocal(
            capitulo,
            index,
            capitulosLocaisPorId.get(capitulo.id)
          )
        )
      : obraLocal?.capitulos || [];

  const tagsSupabase = Array.isArray(obraSupabase.tags)
    ? obraSupabase.tags.filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim())
      )
    : [];

  const obraMesclada: ObraLocal = {
    id: obraSupabase.id,
    titulo: obraSupabase.titulo?.trim() || obraLocal?.titulo || "Obra sem título",
    autor: obraSupabase.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obraSupabase.user_id?.trim() || obraLocal?.autorId || "",
    genero: obraSupabase.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraSupabase.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraSupabase.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraSupabase.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      tagsSupabase.length > 0
        ? tagsSupabase
        : obraLocal?.tags && obraLocal.tags.length > 0
        ? obraLocal.tags
        : ["sem tags"],
    capa: obraSupabase.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraSupabase.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: criarArquivoObraDeSupabase(
      obraSupabase,
      obraLocal?.arquivoObra || null
    ),
    publicado: Boolean(obraSupabase.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraSupabase.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug:
      obraSupabase.slug?.trim() ||
      obraLocal?.slug ||
      criarSlugBase(obraSupabase.titulo || obraLocal?.titulo || "obra"),
    link:
      obraSupabase.link?.trim() ||
      obraLocal?.link ||
      `/obra/${
        obraSupabase.slug?.trim() ||
        obraLocal?.slug ||
        criarSlugBase(obraSupabase.titulo || obraLocal?.titulo || "obra")
      }`,
  };

  return normalizarObra(obraMesclada, 0);
}

async function carregarObraSupabase(
  obraId: string,
  userId: string,
  obraLocal?: ObraLocal | null
) {
  const { data: obraSupabase, error: erroObra } = await supabase
    .from("obras")
    .select("*")
    .eq("id", obraId)
    .eq("user_id", userId)
    .maybeSingle();

  if (erroObra || !obraSupabase) {
    return null;
  }

  const obraBanco = obraSupabase as ObraSupabaseRow;
  const nomeProfile = await carregarNomeProfileMinhaObra({
    userId,
    nomeAtual: obraBanco.autor || obraLocal?.autor || "",
  });

  const { data: capitulosSupabase, error: erroCapitulos } = await supabase
    .from("capitulos")
    .select("*")
    .eq("obra_id", obraId)
    .eq("user_id", userId)
    .order("ordem", { ascending: true });

  const obraMesclada = erroCapitulos
    ? mesclarObraSupabaseComLocal(obraBanco, [], obraLocal)
    : mesclarObraSupabaseComLocal(
        obraBanco,
        (capitulosSupabase || []) as CapituloSupabaseRow[],
        obraLocal
      );

  return {
    ...obraMesclada,
    autor: nomeProfile || obraMesclada.autor,
    autorId: obraMesclada.autorId || userId,
  };
}

function normalizarIdsCapitulosMinhaObra(capituloIds: string[]) {
  return Array.from(
    new Set(
      capituloIds
        .map((capituloId) => capituloId.trim())
        .filter((capituloId) => Boolean(capituloId))
    )
  );
}

async function contarRegistrosPorObraMinhaObra(tabela: string, obraId: string) {
  const obraIdLimpo = obraId.trim();

  if (!obraIdLimpo) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from(tabela)
      .select("id", { count: "exact", head: true })
      .eq("obra_id", obraIdLimpo);

    if (error) {
      console.warn(`Não consegui contar ${tabela} por obra:`, error.message);
      return 0;
    }

    return typeof count === "number" ? count : 0;
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} por obra:`, error);
    return 0;
  }
}

async function contarRegistrosPorCapitulosMinhaObra(
  tabela: string,
  capituloIds: string[]
) {
  const ids = normalizarIdsCapitulosMinhaObra(capituloIds);

  if (ids.length === 0) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from(tabela)
      .select("id", { count: "exact", head: true })
      .in("capitulo_id", ids);

    if (error) {
      console.warn(`Não consegui contar ${tabela} por capítulo:`, error.message);
      return 0;
    }

    return typeof count === "number" ? count : 0;
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} por capítulo:`, error);
    return 0;
  }
}

async function carregarMetricasMinhaObraSupabase(
  obraId: string,
  capituloIds: string[]
): Promise<MetricasMinhaObraSupabase> {
  const obraIdLimpo = obraId.trim();

  if (!obraIdLimpo) {
    return METRICAS_MINHA_OBRA_ZERADAS;
  }

  const [curtidasObra, curtidasCapitulos, comentariosCapitulos, salvosCapitulos] =
    await Promise.all([
      contarRegistrosPorObraMinhaObra("obra_curtidas", obraIdLimpo),
      contarRegistrosPorCapitulosMinhaObra("curtidas_capitulos", capituloIds),
      contarRegistrosPorCapitulosMinhaObra("comentarios_capitulos", capituloIds),
      contarRegistrosPorCapitulosMinhaObra("salvos_capitulos", capituloIds),
    ]);

  return {
    totalCurtidas: curtidasObra + curtidasCapitulos,
    totalComentarios: comentariosCapitulos,
    totalSalvos: salvosCapitulos,
  };
}

async function excluirReferenciasSupabaseMinhaObra(
  tabela: string,
  filtros: Array<{ campo: string; valor: string }>
) {
  try {
    const consulta = filtros.reduce((query, filtro) => {
      return query.eq(filtro.campo, filtro.valor);
    }, supabase.from(tabela).delete());

    const { error } = await consulta;

    if (error) {
      console.warn(`Não consegui limpar ${tabela}:`, error.message);
    }
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} para limpeza:`, error);
  }
}

async function limparReferenciasCapituloSupabaseMinhaObra({
  obraId,
  capituloId,
}: {
  obraId: string;
  capituloId: string;
}) {
  const obraIdLimpo = obraId.trim();
  const capituloIdLimpo = capituloId.trim();

  if (!capituloIdLimpo) {
    return;
  }

  await Promise.all([
    excluirReferenciasSupabaseMinhaObra("curtidas_capitulos", [
      { campo: "capitulo_id", valor: capituloIdLimpo },
    ]),
    excluirReferenciasSupabaseMinhaObra("salvos_capitulos", [
      { campo: "capitulo_id", valor: capituloIdLimpo },
    ]),
    excluirReferenciasSupabaseMinhaObra("comentarios_capitulos", [
      { campo: "capitulo_id", valor: capituloIdLimpo },
    ]),
    excluirReferenciasSupabaseMinhaObra("diario_atividades", [
      { campo: "capitulo_id", valor: capituloIdLimpo },
    ]),
    excluirReferenciasSupabaseMinhaObra("notificacoes", [
      { campo: "capitulo_id", valor: capituloIdLimpo },
    ]),
  ]);

  if (!obraIdLimpo) {
    return;
  }

  try {
    await supabase
      .from("progresso_leitura")
      .update({
        capitulo_id: null,
        lido: false,
        progresso: 0,
        atualizado_em: new Date().toISOString(),
      })
      .eq("obra_id", obraIdLimpo)
      .eq("capitulo_id", capituloIdLimpo);
  } catch (error) {
    console.warn("Não consegui limpar progresso do capítulo:", error);
  }
}

export default function MinhaObraPage() {
  const router = useRouter();

  const [obraId, setObraId] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [buscaCapitulo, setBuscaCapitulo] = useState("");
  const [ordemCapitulos, setOrdemCapitulos] =
    useState<OrdemCapitulos>("crescente");
  const [carregando, setCarregando] = useState(true);
  const [redirecionandoLogin, setRedirecionandoLogin] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [metricasSupabaseObra, setMetricasSupabaseObra] =
    useState<MetricasMinhaObraSupabase>(METRICAS_MINHA_OBRA_ZERADAS);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarDadosDaObra() {
      const params = new URLSearchParams(window.location.search);
      const obraIdParam = params.get("obraId") || "";

      setObraId(obraIdParam);

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (erroUsuario || !dadosUsuario.user) {
          if (!cancelado) {
            setUsuarioIdLogado("");
            setRedirecionandoLogin(true);
            router.replace(criarLoginHrefMinhaObra(obraIdParam));
          }

          return;
        }

        const userId = dadosUsuario.user.id;
        const nomeProfileUsuario = await carregarNomeProfileMinhaObra({
          userId,
          email: dadosUsuario.user.email || "",
        });

        if (!cancelado) {
          setUsuarioIdLogado(userId);
          setRedirecionandoLogin(false);
        }

        const todasObrasNormalizadas = carregarTodasObrasLocaisNormalizadas();
        let obrasNormalizadas = aplicarNomeProfileNasObrasMinhaObra(
          todasObrasNormalizadas.filter((obra) =>
            obraPertenceAoUsuarioLogado(obra, userId)
          ),
          userId,
          nomeProfileUsuario
        );

        if (obraIdParam) {
          const obraLocal =
            obrasNormalizadas.find((obra) => obra.id === obraIdParam) || null;
          const obraSupabase = await carregarObraSupabase(
            obraIdParam,
            userId,
            obraLocal
          );

          if (obraSupabase) {
            obrasNormalizadas = [
              obraSupabase,
              ...obrasNormalizadas.filter((obra) => obra.id !== obraSupabase.id),
            ];
          }
        }


        obrasNormalizadas = aplicarNomeProfileNasObrasMinhaObra(
          obrasNormalizadas,
          userId,
          nomeProfileUsuario
        );

        const obrasDoUsuarioParaTela = salvarObrasDoUsuarioPreservandoOutrasContas(
          obrasNormalizadas,
          userId
        );

        if (cancelado) {
          return;
        }

        setObras(obrasDoUsuarioParaTela);
      } catch {
        if (cancelado) {
          return;
        }

        setObras([]);
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarDadosDaObra();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capitulosIdsObraAtual = useMemo(() => {
    return obraAtual?.capitulos.map((capitulo) => capitulo.id) || [];
  }, [obraAtual]);

  const capitulosIdsObraAtualChave = capitulosIdsObraAtual.join("|");

  useEffect(() => {
    let cancelado = false;

    async function carregarMetricasReais() {
      if (!obraAtual?.id) {
        setMetricasSupabaseObra(METRICAS_MINHA_OBRA_ZERADAS);
        return;
      }

      const metricas = await carregarMetricasMinhaObraSupabase(
        obraAtual.id,
        capitulosIdsObraAtual
      );

      if (!cancelado) {
        setMetricasSupabaseObra(metricas);
      }
    }

    void carregarMetricasReais();

    return () => {
      cancelado = true;
    };
  }, [obraAtual?.id, capitulosIdsObraAtualChave]);

  const classificacaoIndicativa =
    obraAtual?.classificacaoIndicativa?.trim() || "Não informada";
  const generoObraFormatado = obraAtual
    ? formatarGeneroMinhaObra(obraAtual.genero)
    : "Não informado";
  const arquivoObra = obraAtual?.arquivoObra || null;
  const arquivoObraTipoTexto = arquivoObra
    ? obterTipoArquivoTexto(arquivoObra)
    : "";
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "";


  const totais = useMemo(() => {
    if (!obraAtual) {
      return {
        totalCurtidas: 0,
        totalComentarios: 0,
        totalSalvos: 0,
        totalPalavras: 0,
      };
    }

    const totalPalavras = obraAtual.capitulos.reduce((total, capitulo) => {
      return total + contarPalavrasTexto(capitulo.texto);
    }, 0);

    const totalCurtidasLocais = obraAtual.capitulos.filter(
      (capitulo) => capitulo.curtiu
    ).length;
    const totalComentariosLocais = obraAtual.capitulos.filter((capitulo) =>
      capitulo.comentario.trim()
    ).length;
    const totalSalvosLocais = obraAtual.capitulos.filter(
      (capitulo) => capitulo.salvo
    ).length;

    return {
      totalCurtidas: Math.max(
        totalCurtidasLocais,
        metricasSupabaseObra.totalCurtidas
      ),
      totalComentarios: Math.max(
        totalComentariosLocais,
        metricasSupabaseObra.totalComentarios
      ),
      totalSalvos: Math.max(totalSalvosLocais, metricasSupabaseObra.totalSalvos),
      totalPalavras,
    };
  }, [metricasSupabaseObra, obraAtual]);




  const capitulosFiltrados = useMemo(() => {
    if (!obraAtual) {
      return [];
    }

    const termo = buscaCapitulo.trim().toLowerCase();

    const capitulosComIndice: Array<{
      capitulo: CapituloLocal;
      index: number;
    }> = obraAtual.capitulos.map((capitulo, index) => ({
      capitulo,
      index,
    }));

    const capitulosEncontrados = termo
      ? capitulosComIndice.filter(({ capitulo, index }) => {
          return (
            capitulo.titulo.toLowerCase().includes(termo) ||
            capitulo.texto.toLowerCase().includes(termo) ||
            capitulo.comentario.toLowerCase().includes(termo) ||
            String(index + 1).includes(termo)
          );
        })
      : capitulosComIndice;

    if (ordemCapitulos === "decrescente") {
      return [...capitulosEncontrados].reverse();
    }

    return capitulosEncontrados;
  }, [obraAtual, buscaCapitulo, ordemCapitulos]);

  function salvarObras(novasObras: ObraLocal[]) {
    const userId = usuarioIdLogado.trim();

    const obrasNormalizadas = novasObras.map((obra, index) =>
      normalizarObra(
        {
          ...obra,
          autorId: obterAutorIdObra(obra) || userId,
        },
        index
      )
    );

    if (!userId) {
      setObras(obrasNormalizadas);
      return;
    }

    const obrasDoUsuarioParaTela = salvarObrasDoUsuarioPreservandoOutrasContas(
      obrasNormalizadas,
      userId
    );

    setObras(obrasDoUsuarioParaTela);
  }

  async function copiarLinkPublico() {
    if (!obraAtual) return;

    const linkPublico =
      obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
    const linkAbsoluto = linkPublico.startsWith("http")
      ? linkPublico
      : `${window.location.origin}${
          linkPublico.startsWith("/") ? linkPublico : `/${linkPublico}`
        }`;

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

      setLinkCopiado(true);

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 1800);
    } catch {
      setLinkCopiado(false);
    }
  }

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




  async function excluirCapitulo(capituloId: string, tituloCapitulo: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o capítulo "${tituloCapitulo}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    try {
      const { data: dadosUsuario } = await supabase.auth.getUser();

      if (!dadosUsuario.user) {
        setRedirecionandoLogin(true);
        router.replace(criarLoginHrefMinhaObra(obraId));
        return;
      }

      await limparReferenciasCapituloSupabaseMinhaObra({
        obraId,
        capituloId,
      });

      const { error } = await supabase
        .from("capitulos")
        .delete()
        .eq("id", capituloId)
        .eq("obra_id", obraId)
        .eq("user_id", dadosUsuario.user.id);

      if (error) {
        window.alert(
          "Não consegui excluir o capítulo agora. Tente novamente."
        );
        return;
      }
    } catch {
      window.alert("Não consegui excluir o capítulo agora. Tente novamente.");
      return;
    }

    const novasObras = obras.map((obra, obraIndex) => {
      const obraNormalizada = normalizarObra(obra, obraIndex);

      if (obraNormalizada.id !== obraId) {
        return obraNormalizada;
      }

      const capitulosRestantes = obraNormalizada.capitulos.filter(
        (capitulo) => capitulo.id !== capituloId
      );

      const ultimoCapituloLidoRestante = [...capitulosRestantes]
        .reverse()
        .find((capitulo) => capitulo.lido && capitulo.lidoEm);

      const capituloExcluidoEraUltimaLeitura =
        obraNormalizada.ultimoCapituloLidoId === capituloId;

      return {
        ...obraNormalizada,
        capitulos: capitulosRestantes,
        ultimoCapituloLidoId: capituloExcluidoEraUltimaLeitura
          ? ultimoCapituloLidoRestante?.id || ""
          : obraNormalizada.ultimoCapituloLidoId,
        ultimaLeituraEm: capituloExcluidoEraUltimaLeitura
          ? ultimoCapituloLidoRestante?.lidoEm || ""
          : obraNormalizada.ultimaLeituraEm,
        progressoLeitura: calcularProgressoLeitura(capitulosRestantes),
      };
    });

    removerNotificacoesDoCapituloExcluido(obraId, capituloId);
    salvarObras(novasObras);
  }

  if (carregando || redirecionandoLogin) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${minhaObraPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>
              {redirecionandoLogin ? "Redirecionando..." : "Verificando acesso..."}
            </h1>

            <p style={emptyTextStyle}>
              Conferindo sua conta antes de abrir esta área do autor.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!obraAtual) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${minhaObraPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <header style={isDesktop ? desktopTopStyle : topStyle}>
            <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
              <span style={logoTextStyle}>MINHA OBRA</span>
            </Link>

          </header>

          <div style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Obra não encontrada</h1>

            <p style={emptyTextStyle}>
              Volte para Minhas Obras e clique novamente em Ver obra.
            </p>

            <Link href="/minhas-obras" style={emptyButtonStyle}>
              Ir para Minhas Obras
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const adicionarCapituloHref = `/adicionar-capitulo?obraId=${obraAtual.id}`;
  const editarObraHref = `/editar-obra?obraId=${obraAtual.id}`;
  const paginaPublicaHref =
    obraAtual.link || `/obra/${obraAtual.slug || criarSlugBase(obraAtual.titulo)}`;
  const perfilAutorHref = criarPerfilAutorHref(
    obraAtual.autor,
    obraAtual.autorId
  );

  const verArquivoHref = `/ver-arquivo?obraId=${encodeURIComponent(obraAtual.id)}`;

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${minhaObraPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoTextStyle}>MINHA OBRA</span>
          </Link>

        </header>

        <section style={isDesktop ? desktopHeroStyle : heroStyle}>
          <div style={isDesktop ? criarDesktopCoverStyle(obraAtual.capa) : criarCoverStyle(obraAtual.capa)}>
            <div style={coverGlowStyle} />

            <span style={coverGenreStyle}>{classificacaoIndicativa}</span>

            <div style={coverInfoStyle}>
              <strong style={coverNumberStyle}>
                {obraAtual.capitulos.length}
              </strong>

              <span style={coverTextStyle}>
                {obraAtual.capitulos.length === 1 ? "capítulo" : "capítulos"}
              </span>
            </div>
          </div>

          <div style={isDesktop ? desktopContentStyle : contentStyle}>
            <div style={isDesktop ? desktopTopBadgesStyle : topBadgesStyle}>
              <span style={badgeStyle}>{obraAtual.formato}</span>

              <span style={genreBadgeStyle}>{generoObraFormatado}</span>

              {obraAtual.tags.slice(0, 1).map((tag, index) => (
                <span key={`${obraAtual.id}-top-tag-${tag}-${index}`} style={tagStyle}>
                  {tag}
                </span>
              ))}

              <span
                style={
                  obraAtual.publicado ? publishedBadgeStyle : draftBadgeStyle
                }
              >
                {obraAtual.publicado ? "Publicado" : "Rascunho"}
              </span>
            </div>

            <h1 style={isDesktop ? desktopTitleStyle : titleStyle}>{obraAtual.titulo}</h1>

            <Link href={perfilAutorHref} style={authorLinkStyle}>
              Por {obraAtual.autor}
            </Link>

            <p style={isDesktop ? desktopSinopseStyle : sinopseStyle}>{obraAtual.sinopse}</p>
            <div style={isDesktop ? desktopAuthorActionsStyle : authorActionsStyle}>
              <Link href={editarObraHref} style={secondaryActionStyle}>
                Editar obra
              </Link>

              <Link href={paginaPublicaHref} style={publicPageActionStyle}>
                Ver página pública
              </Link>

              <button
                type="button"
                onClick={copiarLinkPublico}
                style={linkCopiado ? copiedLinkActionStyle : copyLinkActionStyle}
              >
                {linkCopiado ? "Link copiado!" : "Copiar link"}
              </button>

              <Link href={adicionarCapituloHref} style={primaryActionStyle}>
                Adicionar capítulo
              </Link>
            </div>
          </div>
        </section>

        <section style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{obraAtual.capitulos.length}</strong>
            <span style={statLabelStyle}>capítulos</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalCurtidas}</strong>
            <span style={statLabelStyle}>curtidas</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalComentarios}</strong>
            <span style={statLabelStyle}>comentários</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalSalvos}</strong>
            <span style={statLabelStyle}>cap. salvos</span>
          </div>

          <div style={statCardStyle}>
            <strong style={statNumberStyle}>{totais.totalPalavras}</strong>
            <span style={statLabelStyle}>palavras</span>
          </div>
        </section>
        {arquivoObra && (
          <section style={isDesktop ? desktopArquivoObraBoxStyle : arquivoObraBoxStyle}>
            <div style={arquivoObraHeaderStyle}>
              <h2 style={arquivoObraSectionTitleStyle}>ARQUIVO DA OBRA</h2>
            </div>

            <div style={isDesktop ? desktopArquivoObraCardStyle : arquivoObraCardStyle}>
              <div style={isDesktop ? desktopArquivoObraTopLineStyle : arquivoObraTopLineStyle}>
                {arquivoObra.categoria === "imagem" ? (
                  <Link
                    href={verArquivoHref}
                    style={arquivoObraPreviewButtonStyle}
                    aria-label={`Ver arquivo ${arquivoObra.nome}`}
                  >
                    <img
                      src={arquivoObra.conteudo}
                      alt={arquivoObra.nome}
                      style={arquivoObraImageStyle}
                    />
                  </Link>
                ) : (
                  <div style={arquivoObraIconStyle}>
                    {arquivoObra.categoria === "documento"
                      ? "PDF"
                      : arquivoObra.categoria === "texto"
                      ? "TXT"
                      : "ARQ"}
                  </div>
                )}

                <div style={arquivoObraContentStyle}>
                  <strong style={arquivoObraTitleStyle}>
                    {arquivoObra.nome}
                  </strong>

                  <p style={arquivoObraTextStyle}>
                    {arquivoObraTipoTexto} • {arquivoObraTamanhoTexto}
                    {arquivoObra.criadoEm ? ` • enviado em ${formatarData(arquivoObra.criadoEm)}` : ""}
                  </p>
                </div>
              </div>

              <div style={isDesktop ? desktopArquivoObraActionsStyle : arquivoObraActionsStyle}>
                <Link href={verArquivoHref} style={arquivoObraOpenButtonStyle}>
                  Abrir arquivo
                </Link>

                <a
                  href={arquivoObra.conteudo}
                  download={arquivoObra.nome}
                  style={arquivoObraDownloadButtonStyle}
                >
                  Baixar
                </a>
              </div>
            </div>
          </section>
        )}
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Capítulos</h2>
            </div>

          </div>

          {obraAtual.capitulos.length > 0 && (
            <div style={isDesktop ? desktopChapterToolsStyle : chapterToolsStyle}>
              <input
                value={buscaCapitulo}
                onChange={(event) => setBuscaCapitulo(event.target.value)}
                placeholder="Buscar capítulo..."
                style={isDesktop ? desktopChapterSearchInputStyle : chapterSearchInputStyle}
              />

              <div style={isDesktop ? desktopChapterOrderGridStyle : chapterOrderGridStyle}>
                <button
                  type="button"
                  onClick={() => setOrdemCapitulos("crescente")}
                  style={
                    ordemCapitulos === "crescente"
                      ? chapterOrderButtonActiveStyle
                      : chapterOrderButtonStyle
                  }
                >
                  1 → último
                </button>

                <button
                  type="button"
                  onClick={() => setOrdemCapitulos("decrescente")}
                  style={chapterOrderButtonRelerStyle}
                >
                  Último → 1
                </button>
              </div>
            </div>
          )}

          {obraAtual.capitulos.length > 0 ? (
            capitulosFiltrados.length > 0 ? (
              <div style={isDesktop ? desktopChapterListStyle : chapterListStyle}>
                {capitulosFiltrados.map(({ capitulo, index }) => {
                  const numeroCapitulo = index + 1;
                  const lerCapituloHref = criarHrefLeituraCapituloMinhaObra(
                    obraAtual,
                    capitulo.id,
                    numeroCapitulo
                  );
                  const editarCapituloHref = `/editar-capitulo?obraId=${obraAtual.id}&capituloId=${capitulo.id}`;

                  const totalPalavrasCapitulo = contarPalavrasTexto(capitulo.texto);
                  const tempoCapituloMinutos = calcularTempoLeituraMinutos(
                    totalPalavrasCapitulo
                  );

                  return (
                    <article key={capitulo.id} style={chapterCardStyle}>
                      <div style={chapterTopStyle}>
                        <span style={chapterBadgeStyle}>
                          Capítulo {index + 1}
                        </span>
                      </div>

                      <h3 style={chapterTitleStyle}>{capitulo.titulo}</h3>

                      <div style={chapterStatsStyle}>
                        <span>{totalPalavrasCapitulo} palavras</span>
                        <span>{tempoCapituloMinutos} min</span>
                      </div>

                      <p style={chapterTextStyle}>{capitulo.texto}</p>

                      <div style={chapterActionsStyle}>
                        <Link href={lerCapituloHref} style={readButtonStyle}>
                          {capitulo.lido ? "Reler" : "Ler capítulo"}
                        </Link>

                        <Link href={editarCapituloHref} style={editButtonStyle}>
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            excluirCapitulo(capitulo.id, capitulo.titulo)
                          }
                          style={deleteButtonStyle}
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={emptyBoxStyle}>
                <h3 style={emptyTitleStyle}>Nenhum capítulo encontrado</h3>

                <p style={emptyTextStyle}>
                  Tente buscar por outro título, número ou palavra do capítulo.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setBuscaCapitulo("");
                  }}
                  style={clearSearchButtonStyle}
                >
                  Limpar busca
                </button>
              </div>
            )
          ) : (
            <div style={emptyBoxStyle}>
              <h3 style={emptyTitleStyle}>Nenhum capítulo ainda</h3>

              <p style={emptyTextStyle}>
                Clique em Adicionar capítulo para começar essa obra.
              </p>

              <Link href={adicionarCapituloHref} style={emptyButtonStyle}>
                Adicionar primeiro capítulo
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const minhaObraPageCss = `
  html[data-historietas-tema-visual="original"] {
    --historietas-bg-start: #070212;
    --historietas-bg-mid: #070212;
    --historietas-bg-end: #070212;
    --historietas-surface: #04000A;
    --historietas-surface-strong: #020006;
    --historietas-input-bg: #04000A;
    --historietas-border-soft: rgba(255,255,255,0.08);
    --historietas-text-secondary: #D4D4D8;
    --historietas-accent: #F97316;
    --historietas-secondary: #7C3AED;
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }


  html[data-historietas-tema-visual] nav a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/minhas-obras"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/minhas-obras"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: rgba(249,115,22,0.28) !important;
    color: var(--historietas-accent, #F97316) !important;
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
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
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
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const logoTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
};





const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(100px, 0.34fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "9px",
  padding: "8px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, #08030F 0%, #04000A 56%, #020006 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  width: "100%",
  minHeight: "184px",
  height: "184px",
  borderRadius: "15px",
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(145deg, #08030F 0%, #04000A 58%, #020006 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  alignSelf: "start",
  boxSizing: "border-box",
};

const coverGlowStyle: CSSProperties = {
  display: "none",
};

const coverGenreStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  right: "8px",
  width: "fit-content",
  maxWidth: "calc(100% - 16px)",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const coverInfoStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "10px",
  display: "flex",
  alignItems: "baseline",
  justifyContent: "center",
  gap: "6px",
  minWidth: 0,
};

const coverNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "31px",
  lineHeight: 0.85,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  flex: "0 0 auto",
  ...safeTextStyle,
};

const coverTextStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.052em",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  flex: "0 1 auto",
  minWidth: 0,
};

const contentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "start",
  justifyItems: "stretch",
  textAlign: "left",
  gap: "6px",
  width: "100%",
};

const topBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.22)",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "8.8px",
  lineHeight: 1.1,
  fontWeight: 950,
  ...safeTextStyle,
};

const publishedBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.26)",
  color: "#86EFAC",
};

const draftBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};


const genreBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
};




const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(27px, 7.4vw, 40px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.068em",
  maxWidth: "100%",
  textAlign: "left",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13.5px",
  lineHeight: 1.1,
  fontWeight: 950,
  textDecoration: "none",
  textAlign: "left",
  borderBottom: "none",
  ...safeTextStyle,
};

const sinopseStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 650,
  maxWidth: "100%",
  textAlign: "left",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};


const tagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "5px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "9px",
  lineHeight: 1.1,
  fontWeight: 900,
  ...safeTextStyle,
};




const authorActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  marginTop: "2px",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "10px",
  minWidth: 0,
};

const statCardStyle: CSSProperties = {
  borderRadius: "13px",
  background: "#08030F",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.055))",
  padding: "6px 3px",
  minHeight: "48px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "2px",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

const statNumberStyle: CSSProperties = {
  color: "#DDD6FE",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "7.6px",
  lineHeight: 1.05,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.025em",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
};





const sectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "9px",
  minWidth: 0,
  textAlign: "center",
};


const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "24px",
  lineHeight: 1.1,
  paddingBottom: "0.06em",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};




























const chapterToolsStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  marginBottom: "9px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
};

const chapterSearchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  padding: "0 12px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 800,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "none",
};

const chapterOrderGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};


const chapterOrderButtonStyle: CSSProperties = {
  minHeight: "29px",
  padding: "0 8px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const chapterOrderButtonActiveStyle: CSSProperties = {
  ...chapterOrderButtonStyle,
  background: "#04000A",
  border: "1px solid rgba(249,115,22,0.30)",
  color: "var(--historietas-accent, #FDBA74)",
  boxShadow: "none",
};

const chapterOrderButtonRelerStyle: CSSProperties = {
  ...chapterOrderButtonStyle,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  boxShadow: "none",
};



const chapterListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const chapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "10px",
  borderRadius: "18px",
  background:
    "#08030F",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const chapterTopStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  minWidth: 0,
};

const chapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  ...safeTextStyle,
};



const chapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

const chapterStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "5px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 800,
  textAlign: "center",
  ...safeTextStyle,
};

const chapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.52,
  fontWeight: 650,
  textAlign: "center",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};


const chapterActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  alignItems: "stretch",
};

const readButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  fontFamily: "inherit",
  cursor: "pointer",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const editButtonStyle: CSSProperties = {
  ...readButtonStyle,
};

const deleteButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  border: "1px solid rgba(239,68,68,0.16)",
  background: "rgba(239,68,68,0.06)",
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  fontFamily: "inherit",
  cursor: "pointer",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

const orangeActionStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};







const primaryActionStyle: CSSProperties = {
  minHeight: "35px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  lineHeight: 1.05,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 7px",
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryActionStyle: CSSProperties = {
  ...primaryActionStyle,
};

const publicPageActionStyle: CSSProperties = {
  ...primaryActionStyle,
};

const copyLinkActionStyle: CSSProperties = {
  ...primaryActionStyle,
};

const copiedLinkActionStyle: CSSProperties = {
  ...primaryActionStyle,
};


const arquivoObraBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
};

const arquivoObraHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "2px",
  minWidth: 0,
  textAlign: "center",
};

const arquivoObraSectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "24px",
  lineHeight: 1.1,
  paddingBottom: "0.06em",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const arquivoObraCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "9px",
  padding: "9px",
  borderRadius: "17px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const arquivoObraTopLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr)",
  gap: "10px",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const arquivoObraIconStyle: CSSProperties = {
  width: "72px",
  height: "72px",
  minHeight: "72px",
  borderRadius: "15px",
  background:
    "linear-gradient(145deg, #08030F 0%, #04000A 58%, #020006 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxSizing: "border-box",
  overflow: "hidden",
  ...safeTextStyle,
};

const arquivoObraPreviewButtonStyle: CSSProperties = {
  width: "72px",
  height: "72px",
  minHeight: "72px",
  borderRadius: "15px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #04000A)",
  padding: 0,
  overflow: "hidden",
  cursor: "pointer",
  display: "block",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

const arquivoObraImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
};

const arquivoObraContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

const arquivoObraTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const arquivoObraTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.35,
  fontWeight: 750,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const arquivoObraActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const arquivoObraOpenButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const arquivoObraDownloadButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const clearSearchButtonStyle: CSSProperties = {
  ...orangeActionStyle,
  width: "100%",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "14px",
  borderRadius: "22px",
  background: "#08030F",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  padding: "18px",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "10px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "26px",
  lineHeight: 1.12,
  paddingBottom: "0.04em",
  fontWeight: 950,
  letterSpacing: "-0.05em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.6,
  fontWeight: 650,
  maxWidth: "100%",
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  ...orangeActionStyle,
  textDecoration: "none",
};


const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "26px 0 30px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};



const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  gridTemplateColumns: "minmax(214px, 0.34fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "16px",
  padding: "12px",
  borderRadius: "26px",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "268px",
  height: "268px",
  borderRadius: "20px",
};

const desktopContentStyle: CSSProperties = {
  ...contentStyle,
  gap: "9px",
  alignContent: "start",
  justifyItems: "stretch",
  width: "100%",
  padding: "2px 2px 2px 0",
  textAlign: "left",
};

const desktopTopBadgesStyle: CSSProperties = {
  ...topBadgesStyle,
  justifyContent: "flex-start",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(42px, 4.6vw, 62px)",
  maxWidth: "100%",
  textAlign: "left",
};

const desktopSinopseStyle: CSSProperties = {
  ...sinopseStyle,
  maxWidth: "760px",
  fontSize: "14px",
  lineHeight: 1.52,
  WebkitLineClamp: 3,
  textAlign: "left",
};


const desktopAuthorActionsStyle: CSSProperties = {
  ...authorActionsStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
  width: "100%",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "12px",
};

const desktopArquivoObraBoxStyle: CSSProperties = {
  ...arquivoObraBoxStyle,
  marginTop: "14px",
  padding: 0,
  borderRadius: 0,
};

const desktopArquivoObraCardStyle: CSSProperties = {
  ...arquivoObraCardStyle,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  gap: "14px",
  alignItems: "center",
};

const desktopArquivoObraTopLineStyle: CSSProperties = {
  ...arquivoObraTopLineStyle,
  alignItems: "center",
};

const desktopArquivoObraActionsStyle: CSSProperties = {
  ...arquivoObraActionsStyle,
  gridTemplateColumns: "1fr 1fr",
  alignSelf: "center",
};









const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "16px",
};

const desktopChapterToolsStyle: CSSProperties = {
  ...chapterToolsStyle,
  gridTemplateColumns: "minmax(260px, 1fr) 230px",
  gap: "10px",
  alignItems: "start",
};

const desktopChapterSearchInputStyle: CSSProperties = {
  ...chapterSearchInputStyle,
  minHeight: "42px",
};

const desktopChapterOrderGridStyle: CSSProperties = {
  ...chapterOrderGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};


const desktopChapterListStyle: CSSProperties = {
  ...chapterListStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};