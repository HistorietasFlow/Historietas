"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ObraLocal = {
  id: string;
  titulo: string;
  autorId: string;
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
  visualizacoes: number;
  slug: string;
  link: string;
};

type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

type AutorPerfil = {
  autorId: string;
  nome: string;
  obras: ObraLocal[];
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalPublicadas: number;
};

type PerfilUsuarioRemoto = {
  userId: string;
  nome: string;
  avatar: string;
  bio: string;
  sobreBio: string;
  criadoEm: string;
};

type FiltroObrasAutor = "todas" | "publicadas" | "rascunhos" | "sem-capitulos";
type OrdenacaoObrasAutor = "recentes" | "titulo" | "capitulos" | "curtidas";
type AbaPerfilAutor = "obras" | "diario" | "comunidade" | "sobre";

const STORAGE_KEY = "historietas-obras";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
const AUTHOR_RATINGS_STORAGE_KEY = "historietas-autores-avaliacoes";
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const AVATAR_STORAGE_BUCKET = "avatars";
const BIO_MAX_LENGTH = 90;
const SOBRE_BIO_MAX_LENGTH = 600;
const NOTAS_AVALIACAO_AUTOR = [1, 2, 3, 4, 5] as const;

type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
  sobreBio: string;
  mostrarDestaques: boolean;
};

type AvaliacaoAutorPublica = {
  media: number;
  total: number;
  minhaNota: number;
  carregado: boolean;
  salvando: boolean;
};
type DiarioPerfilItem = {
  chave: string;
  tipo:
    | "lendo"
    | "quero_ler"
    | "favorita"
    | "concluida"
    | "avaliacao"
    | "review"
    | "atividade";
  titulo: string;
  descricao: string;
  data: string;
  obra: ObraLocal | null;
  href?: string;
  nota?: number;
  progresso?: number;
};

type DiarioPerfilEstado = {
  carregando: boolean;
  lendoAgora: DiarioPerfilItem[];
  queroLer: DiarioPerfilItem[];
  favoritas: DiarioPerfilItem[];
  concluidas: DiarioPerfilItem[];
  avaliacoes: DiarioPerfilItem[];
  reviews: DiarioPerfilItem[];
  atividades: DiarioPerfilItem[];
};

type VisibilidadeDiarioPerfil = "publico" | "parcial" | "privado";

const diarioPerfilVazio: DiarioPerfilEstado = {
  carregando: false,
  lendoAgora: [],
  queroLer: [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  reviews: [],
  atividades: [],
};


const avaliacaoAutorVazia: AvaliacaoAutorPublica = {
  media: 0,
  total: 0,
  minhaNota: 0,
  carregado: false,
  salvando: false,
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function criarChaveAutorPerfil(autorId: string, nomeAutor: string) {
  return autorId.trim().toLowerCase() || normalizarNomeAutor(nomeAutor);
}

function criarLoginHrefPerfilAutor() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/perfil-autor";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/perfil-autor";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarHrefListaSeguimentoPerfilAutor(
  aba: "seguidores" | "seguindo",
  perfil: Pick<AutorPerfil, "autorId" | "nome"> | null,
) {
  const params = new URLSearchParams();

  params.set("aba", aba);

  if (perfil?.autorId?.trim()) {
    params.set("userId", perfil.autorId.trim());
    params.set("autorId", perfil.autorId.trim());
  }

  if (perfil?.nome?.trim()) {
    params.set("autor", perfil.nome.trim());
  }

  return `/seguindo?${params.toString()}`;
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

function criarHandlePerfilAutor(nomeAutor: string, autorId: string) {
  const base = normalizarTexto(nomeAutor)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
  const sufixo = autorId
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toLowerCase();

  if (base) {
    return `@${base}`;
  }

  return sufixo ? `@autor.${sufixo}` : "@autor.historietas";
}

function idObraSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function criarHrefLeituraCapituloPerfilAutor(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado">,
  capitulo: Pick<CapituloLocal, "id">,
  numeroCapitulo: number,
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
    obra.id,
  )}&capituloId=${encodeURIComponent(capitulo.id)}`;
}

function formatarGeneroPerfilAutor(genero: string) {
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

function obterTimestampData(dataIso: string) {
  const data = new Date(dataIso).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function normalizarNumeroPerfilAutor(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

function formatarNumeroCompactoPerfilAutor(valor: number) {
  const numero = Math.max(0, Math.round(valor));

  if (numero >= 1000000) {
    return `${(numero / 1000000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mi`;
  }

  if (numero >= 1000) {
    return `${(numero / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }

  return String(numero);
}

function idAutorSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function formatarMediaAvaliacaoAutor(media: number) {
  if (!Number.isFinite(media) || media <= 0) {
    return "0.0";
  }

  return media.toFixed(1);
}

function formatarTotalAvaliacoesAutor(total: number) {
  if (total <= 0) {
    return "avaliações";
  }

  return total === 1 ? "1 avaliação" : `${total} avaliações`;
}

function obterProximaNotaAvaliacaoAutor(estrela: number, notaAtual: number) {
  const meiaNota = estrela - 0.5;
  const notaNormalizada = Math.round(notaAtual * 2) / 2;

  if (notaNormalizada === meiaNota) {
    return estrela;
  }

  if (notaNormalizada === estrela) {
    return 0;
  }

  return meiaNota;
}

function obterPreenchimentoEstrelaAutor(estrela: number, notaAtual: number) {
  const notaNormalizada = Math.max(0, Math.min(5, Math.round(notaAtual * 2) / 2));

  if (notaNormalizada >= estrela) {
    return "100%";
  }

  if (notaNormalizada >= estrela - 0.5) {
    return "50%";
  }

  return "0%";
}

function calcularProximaAvaliacaoAutor(
  avaliacaoAtual: AvaliacaoAutorPublica,
  novaNota: number,
): AvaliacaoAutorPublica {
  const notaAnterior = avaliacaoAtual.minhaNota;
  const totalAtual = avaliacaoAtual.total;
  const somaAtual = avaliacaoAtual.media * totalAtual;

  if (novaNota <= 0) {
    const totalNovo = notaAnterior > 0 ? Math.max(0, totalAtual - 1) : totalAtual;
    const somaNova = notaAnterior > 0 ? somaAtual - notaAnterior : somaAtual;

    return {
      ...avaliacaoAtual,
      media: totalNovo > 0 ? somaNova / totalNovo : 0,
      total: totalNovo,
      minhaNota: 0,
      carregado: true,
      salvando: false,
    };
  }

  const totalNovo = notaAnterior > 0 ? totalAtual : totalAtual + 1;
  const somaNova =
    notaAnterior > 0 ? somaAtual - notaAnterior + novaNota : somaAtual + novaNota;

  return {
    ...avaliacaoAtual,
    media: totalNovo > 0 ? somaNova / totalNovo : 0,
    total: totalNovo,
    minhaNota: novaNota,
    carregado: true,
    salvando: false,
  };
}

function obterChaveAvaliacaoAutor(perfil: Pick<AutorPerfil, "autorId" | "nome">) {
  return criarChaveAutorPerfil(perfil.autorId, perfil.nome);
}

function carregarAvaliacoesAutoresLocais() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const avaliacoesTexto = localStorage.getItem(AUTHOR_RATINGS_STORAGE_KEY);
    const avaliacoesJson: unknown = avaliacoesTexto
      ? JSON.parse(avaliacoesTexto)
      : {};

    if (
      !avaliacoesJson ||
      typeof avaliacoesJson !== "object" ||
      Array.isArray(avaliacoesJson)
    ) {
      return {};
    }

    return avaliacoesJson as Record<string, unknown>;
  } catch {
    return {};
  }
}

function obterAvaliacaoAutorLocal(perfil: Pick<AutorPerfil, "autorId" | "nome">) {
  const chaveAvaliacao = obterChaveAvaliacaoAutor(perfil);
  const avaliacoesLocais = carregarAvaliacoesAutoresLocais();
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5
    ? Math.round(nota * 2) / 2
    : 0;
}

function salvarAvaliacaoAutorLocal(
  perfil: Pick<AutorPerfil, "autorId" | "nome">,
  nota: number,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const chaveAvaliacao = obterChaveAvaliacaoAutor(perfil);

    if (!chaveAvaliacao) {
      return;
    }

    const avaliacoesLocais = carregarAvaliacoesAutoresLocais();

    if (nota <= 0) {
      delete avaliacoesLocais[chaveAvaliacao];
    } else {
      avaliacoesLocais[chaveAvaliacao] = nota;
    }

    localStorage.setItem(
      AUTHOR_RATINGS_STORAGE_KEY,
      JSON.stringify(avaliacoesLocais),
    );
  } catch {
    // Avaliação local é fallback e não deve travar o perfil.
  }
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  capituloIndex: number,
  obraIndex: number,
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
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
    nome: arquivo.nome.trim(),
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

function normalizarObra(obra: ObraSalva, obraIndex: number): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex, obraIndex),
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter(
          (tag): tag is string =>
            typeof tag === "string" && Boolean(tag.trim()),
        )
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
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.autor_id === "string" && obra.autor_id.trim()
            ? obra.autor_id.trim()
            : "",
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
    visualizacoes: normalizarNumeroPerfilAutor(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes,
    ),
    slug:
      typeof obra.slug === "string" && obra.slug.trim()
        ? obra.slug
        : criarSlugBase(
            typeof obra.titulo === "string" && obra.titulo.trim()
              ? obra.titulo
              : `obra-${obraIndex + 1}`,
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
                    : `obra-${obraIndex + 1}`,
                )
          }`,
  };
}

function mostrarClassificacao(obra: ObraLocal) {
  return (
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada" &&
    obra.classificacaoIndicativa !== "Não informado"
  );
}

function normalizarUsuarioIdPerfilAutor(valor: string) {
  return valor.trim().toLowerCase();
}

function obraPertenceAoUsuarioPerfilAutor(obra: ObraLocal, userId: string) {
  const userIdNormalizado = normalizarUsuarioIdPerfilAutor(userId);
  const autorIdNormalizado = normalizarUsuarioIdPerfilAutor(obra.autorId || "");

  return Boolean(userIdNormalizado && autorIdNormalizado === userIdNormalizado);
}

function filtrarObrasLocaisDoUsuarioPerfilAutor(
  obrasLocais: ObraLocal[],
  userId: string,
) {
  const userIdNormalizado = normalizarUsuarioIdPerfilAutor(userId);

  if (!userIdNormalizado) {
    return [] as ObraLocal[];
  }

  return obrasLocais.filter((obra) =>
    obraPertenceAoUsuarioPerfilAutor(obra, userIdNormalizado),
  );
}

function mesclarObrasLocalStoragePerfilAutor(
  obrasLocaisOriginais: ObraLocal[],
  obrasAtualizadasDoUsuario: ObraLocal[],
  userId: string,
) {
  const userIdNormalizado = normalizarUsuarioIdPerfilAutor(userId);

  if (!userIdNormalizado) {
    return obrasLocaisOriginais;
  }

  const obrasDeOutrasContas = obrasLocaisOriginais.filter(
    (obra) => !obraPertenceAoUsuarioPerfilAutor(obra, userIdNormalizado),
  );

  return [...obrasAtualizadasDoUsuario, ...obrasDeOutrasContas];
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
        sobreBio:
          typeof perfil.sobreBio === "string"
            ? perfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH)
            : "",
        mostrarDestaques: perfil.mostrarDestaques === true,
      };
    },
  );

  return perfisValidos;
}

function carregarPerfisAutores(): PerfisAutoresSalvos {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const dados = localStorage.getItem(AUTHOR_PROFILE_STORAGE_KEY);
    const perfis = dados ? JSON.parse(dados) : {};
    const perfisNormalizados = normalizarPerfisAutores(perfis);

    localStorage.setItem(
      AUTHOR_PROFILE_STORAGE_KEY,
      JSON.stringify(perfisNormalizados),
    );

    return perfisNormalizados;
  } catch {
    localStorage.setItem(AUTHOR_PROFILE_STORAGE_KEY, JSON.stringify({}));
    return {};
  }
}

function criarBioAutor(perfil: AutorPerfil) {
  if (perfil.obras.length === 0) {
    return `${perfil.nome} participa da Historietas como leitor, com Diário, comunidade e atividades de leitura.`;
  }

  const generos = Array.from(
    new Set(
      perfil.obras
        .map((obra) => formatarGeneroPerfilAutor(obra.genero))
        .filter((genero) => genero && genero !== "Não informado"),
    ),
  );

  const generosTexto =
    generos.length > 0 ? generos.slice(0, 3).join(", ") : "histórias variadas";

  return `${perfil.nome} publica histórias na Historietas, com foco em ${generosTexto}.`;
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId,
      )
    : null;

  if (capituloRegistrado) {
    return capituloRegistrado;
  }

  return obra.capitulos.find((capitulo) => !capitulo.lido) || obra.capitulos[0];
}

function criarCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverStyle;
  }

  return {
    ...coverStyle,
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.24) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarCoverStyleDesktop(capa: string): CSSProperties {
  return {
    ...criarCoverStyle(capa),
    minHeight: "180px",
    borderRadius: "20px",
  };
}

function criarCapaGridPerfilAutor(
  capa: string,
  desktop: boolean,
): CSSProperties {
  const estiloBase = desktop
    ? desktopProfileWorkCoverStyle
    : profileWorkCoverStyle;

  if (!capa) {
    return estiloBase;
  }

  return {
    ...estiloBase,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarCapaDestaquePerfilAutor(capa: string): CSSProperties {
  if (!capa) {
    return authorHighlightCoverStyle;
  }

  return {
    ...authorHighlightCoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

type SupabaseObraRow = Record<string, unknown>;
type SupabaseCapituloRow = Record<string, unknown>;

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function normalizarPerfilUsuarioSupabase(
  row: Record<string, unknown> | null,
  userIdFallback: string,
  nomeFallback: string,
): PerfilUsuarioRemoto {
  const userId =
    pegarTexto(row?.user_id) ||
    pegarTexto(row?.id) ||
    userIdFallback.trim();

  const nome =
    pegarTexto(row?.nome) ||
    pegarTexto(row?.nome_usuario) ||
    pegarTexto(row?.username) ||
    pegarTexto(row?.display_name) ||
    pegarTexto(row?.apelido) ||
    nomeFallback.trim() ||
    "Usuário";

  const avatar =
    pegarTexto(row?.avatar_url) ||
    pegarTexto(row?.avatar) ||
    pegarTexto(row?.foto_url) ||
    pegarTexto(row?.imagem_url) ||
    pegarTexto(row?.photo_url);

  const bio =
    pegarTexto(row?.bio) ||
    pegarTexto(row?.sobre) ||
    pegarTexto(row?.descricao) ||
    "Perfil de leitor no Historietas.";

  const sobreBio =
    pegarTexto(row?.sobre_bio) ||
    pegarTexto(row?.sobreBio) ||
    pegarTexto(row?.sobre) ||
    pegarTexto(row?.descricao) ||
    bio;

  return {
    userId,
    nome: nome.slice(0, 80),
    avatar,
    bio: bio.slice(0, BIO_MAX_LENGTH),
    sobreBio: sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
    criadoEm: pegarTexto(row?.created_at ?? row?.criado_em),
  };
}

async function carregarPerfilUsuarioSupabase(
  userId: string,
  nomeFallback: string,
): Promise<PerfilUsuarioRemoto | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      return normalizarPerfilUsuarioSupabase(
        data as Record<string, unknown>,
        userIdLimpo,
        nomeFallback,
      );
    }
  } catch {
    // Se a coluna user_id não existir, tenta buscar pelo id abaixo.
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userIdLimpo)
      .maybeSingle();

    if (!error && data && typeof data === "object" && !Array.isArray(data)) {
      return normalizarPerfilUsuarioSupabase(
        data as Record<string, unknown>,
        userIdLimpo,
        nomeFallback,
      );
    }
  } catch {
    // Profiles é complementar; o perfil ainda pode abrir com os dados da URL.
  }

  return normalizarPerfilUsuarioSupabase(null, userIdLimpo, nomeFallback);
}

async function salvarPerfilUsuarioSupabase({
  userId,
  nome,
  perfil,
}: {
  userId: string;
  nome: string;
  perfil: PerfilAutorSalvo;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "ID de usuário inválido para salvar perfil." };
  }

  const payloadCompleto = {
    user_id: userIdLimpo,
    nome: nome.trim() || "Usuário",
    avatar_url: perfil.avatar,
    bio: perfil.bio.slice(0, BIO_MAX_LENGTH),
    sobre_bio: perfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
    atualizado_em: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("profiles").upsert(payloadCompleto, {
      onConflict: "user_id",
    });

    if (!error) {
      return { ok: true, erro: "" };
    }

    const { error: erroUpdate } = await supabase
      .from("profiles")
      .update({
        nome: payloadCompleto.nome,
        avatar_url: payloadCompleto.avatar_url,
        bio: payloadCompleto.bio,
        sobre_bio: payloadCompleto.sobre_bio,
        atualizado_em: payloadCompleto.atualizado_em,
      })
      .eq("user_id", userIdLimpo);

    if (!erroUpdate) {
      return { ok: true, erro: "" };
    }

    const { error: erroUpdatePorId } = await supabase
      .from("profiles")
      .update({
        nome: payloadCompleto.nome,
        avatar_url: payloadCompleto.avatar_url,
        bio: payloadCompleto.bio,
        sobre_bio: payloadCompleto.sobre_bio,
        atualizado_em: payloadCompleto.atualizado_em,
      })
      .eq("id", userIdLimpo);

    if (!erroUpdatePorId) {
      return { ok: true, erro: "" };
    }

    return {
      ok: false,
      erro:
        erroUpdatePorId.message ||
        erroUpdate.message ||
        error.message ||
        "Não foi possível salvar o perfil no Supabase.",
    };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado ao salvar perfil.",
    };
  }
}

async function sincronizarNomeAutorObrasSupabase(userId: string, nome: string) {
  const userIdLimpo = userId.trim();
  const nomeLimpo = nome.trim();

  if (!userIdLimpo || !nomeLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "Dados insuficientes para sincronizar obras." };
  }

  try {
    const { error } = await supabase
      .from("obras")
      .update({
        autor: nomeLimpo,
        atualizado_em: new Date().toISOString(),
      })
      .eq("user_id", userIdLimpo);

    if (error) {
      return { ok: false, erro: error.message };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado ao sincronizar obras.",
    };
  }
}

function limparNomeArquivoAvatarPerfil(nome: string) {
  const extensao = nome.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const base = nome
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return `${base || "avatar"}.${extensao}`;
}

async function enviarAvatarPerfilUsuarioSupabase({
  userId,
  arquivo,
}: {
  userId: string;
  arquivo: File;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return { ok: false, url: "", erro: "ID de usuário inválido para enviar avatar." };
  }

  try {
    const nomeSeguro = limparNomeArquivoAvatarPerfil(arquivo.name);
    const caminho = `${userIdLimpo}/${Date.now()}-${nomeSeguro}`;

    const { error } = await supabase.storage
      .from(AVATAR_STORAGE_BUCKET)
      .upload(caminho, arquivo, {
        cacheControl: "3600",
        contentType: arquivo.type || "image/png",
        upsert: true,
      });

    if (error) {
      return { ok: false, url: "", erro: error.message };
    }

    const { data } = supabase.storage
      .from(AVATAR_STORAGE_BUCKET)
      .getPublicUrl(caminho);

    const publicUrl = data.publicUrl || "";

    if (!publicUrl) {
      return { ok: false, url: "", erro: "Storage não retornou URL pública do avatar." };
    }

    return { ok: true, url: publicUrl, erro: "" };
  } catch (error) {
    return {
      ok: false,
      url: "",
      erro: error instanceof Error ? error.message : "Erro inesperado ao enviar avatar.",
    };
  }
}

function criarPerfilUsuarioRemotoComoAutor(
  perfilUsuario: PerfilUsuarioRemoto,
): AutorPerfil {
  return {
    autorId: perfilUsuario.userId,
    nome: perfilUsuario.nome,
    obras: [],
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: 0,
  };
}

function pegarNumero(valor: unknown, fallback = 0) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

function pegarBooleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

function pegarTagsSupabase(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    const tags = valor
      .filter(
        (tag): tag is string => typeof tag === "string" && Boolean(tag.trim()),
      )
      .map((tag) => tag.trim());

    return tags.length > 0 ? tags : ["sem tags"];
  }

  if (typeof valor === "string" && valor.trim()) {
    const tags = valor
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return tags.length > 0 ? tags : ["sem tags"];
  }

  return ["sem tags"];
}

function normalizarCategoriaArquivo(
  tipo: string,
): ArquivoObraLocal["categoria"] {
  const tipoNormalizado = tipo.toLowerCase();

  if (tipoNormalizado.startsWith("image/")) {
    return "imagem";
  }

  if (tipoNormalizado.includes("pdf") || tipoNormalizado.includes("document")) {
    return "documento";
  }

  if (
    tipoNormalizado.startsWith("text/") ||
    tipoNormalizado.includes("markdown")
  ) {
    return "texto";
  }

  return "outro";
}

function criarArquivoObraSupabase(
  row: SupabaseObraRow,
): ArquivoObraLocal | null {
  const conteudo = pegarTexto(
    row.arquivo_url ??
      row.arquivoUrl ??
      row.arquivo_conteudo ??
      row.arquivoObra,
  );

  if (!conteudo) {
    return null;
  }

  const tipo = pegarTexto(row.arquivo_tipo ?? row.arquivoTipo, "outro");

  return {
    nome: pegarTexto(row.arquivo_nome ?? row.arquivoNome, "arquivo-da-obra"),
    tipo,
    tamanho: pegarNumero(row.arquivo_tamanho ?? row.arquivoTamanho, 0),
    conteudo,
    categoria: normalizarCategoriaArquivo(tipo),
    criadoEm: pegarTexto(
      row.arquivo_criado_em ?? row.arquivoCriadoEm ?? row.created_at,
    ),
  };
}

function normalizarObraSupabase(
  row: SupabaseObraRow,
  index: number,
): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autorId: pegarTexto(row.user_id ?? row.autor_id ?? row.autorId, ""),
    autor: pegarTexto(
      row.autor ?? row.nome_autor ?? row.autor_nome,
      "Autor não informado",
    ),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada",
    ),
    sinopse: pegarTexto(row.sinopse, "Nenhuma sinopse informada."),
    tags: pegarTagsSupabase(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    arquivoObra: criarArquivoObraSupabase(row),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    visualizacoes: normalizarNumeroPerfilAutor(
      row.visualizacoes ??
        row.views ??
        row.visualizacoes_total ??
        row.total_visualizacoes ??
        row.totalVisualizacoes,
    ),
    slug,
    link: `/obra/${slug}`,
  };
}

function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  capituloIndex: number,
  obraIndex: number,
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(
      row.id,
      `capitulo-supabase-${obraIndex + 1}-${capituloIndex + 1}`,
    ),
    titulo: pegarTexto(row.titulo, `Capítulo ${capituloIndex + 1}`),
    texto: pegarTexto(row.texto ?? row.conteudo, ""),
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

function mesclarObrasPorIdSlug(
  obrasBase: ObraLocal[],
  obrasNovas: ObraLocal[],
) {
  const mapa = new Map<string, ObraLocal>();

  [...obrasBase, ...obrasNovas].forEach((obra) => {
    const chave = obra.id || obra.slug || criarSlugBase(obra.titulo);
    const existente = mapa.get(chave);

    if (!existente) {
      mapa.set(chave, obra);
      return;
    }

    mapa.set(chave, {
      ...existente,
      ...obra,
      capitulos:
        obra.capitulos.length > 0 ? obra.capitulos : existente.capitulos,
      arquivoObra: obra.arquivoObra || existente.arquivoObra,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      visualizacoes: Math.max(existente.visualizacoes, obra.visualizacoes),
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      ultimoCapituloLidoId:
        obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
    });
  });

  return Array.from(mapa.values());
}

function aplicarInteracoesNasObras(
  obrasParaAtualizar: ObraLocal[],
  idsCapitulosCurtidos: Set<string>,
  idsCapitulosSalvos: Set<string>,
  comentariosPorCapitulo: Map<string, string>,
  progressoPorCapitulo: Map<string, string>,
) {
  return obrasParaAtualizar.map((obra) => {
    let ultimoCapituloLidoId = obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const lidoEm = progressoPorCapitulo.get(capitulo.id) || capitulo.lidoEm;
      const lido = Boolean(lidoEm) || capitulo.lido;

      if (lido && lidoEm) {
        const tempoAtual = obterTimestampData(lidoEm);
        const tempoAnterior = obterTimestampData(ultimaLeituraEm);

        if (tempoAtual >= tempoAnterior) {
          ultimoCapituloLidoId = capitulo.id;
          ultimaLeituraEm = lidoEm;
        }
      }

      return {
        ...capitulo,
        curtiu: capitulo.curtiu || idsCapitulosCurtidos.has(capitulo.id),
        salvo: capitulo.salvo || idsCapitulosSalvos.has(capitulo.id),
        comentario:
          comentariosPorCapitulo.get(capitulo.id) || capitulo.comentario,
        lido,
        lidoEm,
      };
    });

    return {
      ...obra,
      capitulos,
      ultimoCapituloLidoId,
      ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });
}

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as SupabaseObraRow, index),
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", idsObras)
        .order("ordem", { ascending: true });

      if (Array.isArray(capitulosData)) {
        const capitulosPorObra = new Map<string, CapituloLocal[]>();

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as SupabaseCapituloRow,
            index,
            index,
          );

          if (!capituloNormalizado.obraId) {
            return;
          }

          const capitulosAtuais =
            capitulosPorObra.get(capituloNormalizado.obraId) || [];
          const { obraId: _obraId, ...capituloSemObraId } = capituloNormalizado;
          void _obraId;

          capitulosPorObra.set(capituloNormalizado.obraId, [
            ...capitulosAtuais,
            capituloSemObraId,
          ]);
        });

        return obrasSupabase.map((obra) => {
          const capitulos = capitulosPorObra.get(obra.id) || [];

          return {
            ...obra,
            capitulos,
            progressoLeitura: calcularProgressoLeitura(capitulos),
          };
        });
      }
    } catch {
      // Se capítulos falhar, a página continua mostrando as obras.
    }

    return obrasSupabase;
  } catch {
    return [];
  }
}

async function carregarIdsTabelaUsuario(
  tabela: string,
  colunaId: string,
  userId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(colunaId)
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const id = pegarTexto(registro[colunaId]);

      if (id) {
        ids.push(id);
      }
    });

    return ids;
  } catch {
    return [];
  }
}

async function carregarAutoresSeguidosSupabase(
  userId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("seguindo_autores")
      .select("autor")
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const autores: string[] = [];

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const autor = normalizarNomeAutor(pegarTexto(registro.autor));

      if (autor) {
        autores.push(autor);
      }
    });

    return autores;
  } catch {
    return [];
  }
}

async function carregarInteracoesCapitulosSupabase(userId: string) {
  const curtidas = new Set(
    await carregarIdsTabelaUsuario("curtidas_capitulos", "capitulo_id", userId),
  );
  const salvos = new Set(
    await carregarIdsTabelaUsuario("salvos_capitulos", "capitulo_id", userId),
  );
  const comentarios = new Map<string, string>();
  const progresso = new Map<string, string>();

  try {
    const { data } = await supabase
      .from("comentarios_capitulos")
      .select("capitulo_id, comentario, texto")
      .eq("user_id", userId);

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const registro = item as Record<string, unknown>;
        const capituloId = pegarTexto(registro.capitulo_id);
        const texto = pegarTexto(registro.comentario ?? registro.texto);

        if (capituloId && texto) {
          comentarios.set(capituloId, texto);
        }
      });
    }
  } catch {
    // Comentários continuam apenas localmente se houver erro.
  }

  try {
    const { data } = await supabase
      .from("progresso_leitura")
      .select("*")
      .eq("user_id", userId);

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const registro = item as Record<string, unknown>;
        const capituloId = pegarTexto(registro.capitulo_id);
        const lidoEm = pegarTexto(
          registro.lido_em ?? registro.updated_at ?? registro.created_at,
        );

        if (capituloId && lidoEm) {
          progresso.set(capituloId, lidoEm);
        }
      });
    }
  } catch {
    // Progresso continua apenas localmente se houver erro.
  }

  return { curtidas, salvos, comentarios, progresso };
}

async function carregarEstadoUsuarioSupabase() {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [favoritas, concluidas, autoresSeguidos, interacoes] =
      await Promise.all([
        carregarIdsTabelaUsuario("favoritos", "obra_id", userId),
        carregarIdsTabelaUsuario("concluidas", "obra_id", userId),
        carregarAutoresSeguidosSupabase(userId),
        carregarInteracoesCapitulosSupabase(userId),
      ]);

    return {
      userId,
      favoritas,
      concluidas,
      autoresSeguidos,
      interacoes,
    };
  } catch {
    return null;
  }
}

function obterDataRegistroDiario(registro: Record<string, unknown>) {
  return pegarTexto(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at,
  );
}

function obterVisibilidadeRegistroDiario(
  registro: Record<string, unknown>,
  fallback: VisibilidadeDiarioPerfil,
) {
  const visibilidade = pegarTexto(registro.visibilidade, fallback);

  if (
    visibilidade === "publico" ||
    visibilidade === "parcial" ||
    visibilidade === "privado"
  ) {
    return visibilidade;
  }

  return fallback;
}

function registroDiarioPodeAparecer(
  registro: Record<string, unknown>,
  incluirPrivados: boolean,
  fallback: VisibilidadeDiarioPerfil,
) {
  if (incluirPrivados) {
    return true;
  }

  const visibilidade = obterVisibilidadeRegistroDiario(registro, fallback);

  return visibilidade === "publico" || visibilidade === "parcial";
}

function criarEstadoDiarioPerfilVazio(): Omit<DiarioPerfilEstado, "carregando"> {
  return {
    lendoAgora: [],
    queroLer: [],
    favoritas: [],
    concluidas: [],
    avaliacoes: [],
    reviews: [],
    atividades: [],
  };
}

function obterDescricaoPrivacidadeDiario(podeVerPrivados: boolean) {
  return podeVerPrivados
    ? "Você vê itens públicos, parciais e privados. Visitantes veem somente o que estiver público ou parcial."
    : "Este Diário mostra somente atividades públicas ou parciais. Leituras privadas e progresso reservado ficam ocultos.";
}

function obterTextoResumoPrivacidadeDiario(podeVerPrivados: boolean) {
  return podeVerPrivados
    ? "Privado só para você • Parcial aparece no perfil • Público aparece no perfil e nas áreas sociais"
    : "Privados ocultos • Parciais visíveis no perfil • Públicos visíveis nas áreas sociais";
}

function formatarDataDiarioPerfil(dataIso: string) {
  if (!dataIso) {
    return "Data não informada";
  }

  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function criarItemDiarioPerfil(
  tipo: DiarioPerfilItem["tipo"],
  obra: ObraLocal,
  data: string,
  descricao: string,
  complemento: Partial<Pick<DiarioPerfilItem, "nota" | "progresso">> = {},
): DiarioPerfilItem {
  return {
    chave: `${tipo}-${obra.id}-${data || obra.id}`,
    tipo,
    titulo: obra.titulo,
    descricao,
    data,
    obra,
    href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
    ...complemento,
  };
}

function obterMetadataDiarioPerfil(registro: Record<string, unknown>) {
  const metadata = registro.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {} as Record<string, unknown>;
  }

  return metadata as Record<string, unknown>;
}

function obterHrefItemDiarioPerfil(item: DiarioPerfilItem) {
  if (item.href?.trim()) {
    return item.href;
  }

  if (item.obra) {
    return item.obra.link || `/obra/${item.obra.slug || criarSlugBase(item.obra.titulo)}`;
  }

  return "/comunidade";
}

function obterRotuloItemDiarioPerfil(tipo: DiarioPerfilItem["tipo"]) {
  if (tipo === "lendo") {
    return "Lendo";
  }

  if (tipo === "quero_ler") {
    return "Quero ler";
  }

  if (tipo === "favorita") {
    return "Favorita";
  }

  if (tipo === "concluida") {
    return "Concluída";
  }

  if (tipo === "avaliacao") {
    return "Avaliação";
  }

  if (tipo === "review") {
    return "Review";
  }

  return "Atividade";
}

function criarItemAtividadeDiarioPerfil(
  registro: Record<string, unknown>,
  obrasPorId: Map<string, ObraLocal>,
  obrasPorCapituloId: Map<string, ObraLocal>,
): DiarioPerfilItem | null {
  const tipoAtividade = pegarTexto(registro.tipo);
  const data = obterDataRegistroDiario(registro);
  const metadata = obterMetadataDiarioPerfil(registro);
  const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);
  const obraRelacionada = pegarTexto(
    registro.obra_relacionada ?? metadata.obra_relacionada,
  );
  const postId = pegarTexto(metadata.post_id);
  const texto = pegarTexto(registro.texto);
  const nota = Number(registro.nota);

  const tituloBase =
    obra?.titulo ||
    obraRelacionada ||
    (tipoAtividade === "publicou_review" ? "Review publicada" : "Atividade do Diário");

  let tipoItem: DiarioPerfilItem["tipo"] = "atividade";
  let descricao = "Atualizou o Diário.";
  let href = obra
    ? obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`
    : postId
      ? `/comunidade?post=${encodeURIComponent(postId)}`
      : "/comunidade";

  if (tipoAtividade === "leu_capitulo") {
    tipoItem = "lendo";
    descricao = "Leu um capítulo.";
  } else if (tipoAtividade === "comecou_ler") {
    tipoItem = "lendo";
    descricao = "Começou a ler esta obra.";
  } else if (tipoAtividade === "concluiu_obra") {
    tipoItem = "concluida";
    descricao = "Concluiu esta obra.";
  } else if (tipoAtividade === "avaliou_obra") {
    tipoItem = "avaliacao";
    descricao = Number.isFinite(nota) && nota > 0
      ? `Avaliou com ${nota.toFixed(1).replace(".", ",")} estrelas.`
      : "Avaliou esta obra.";
  } else if (tipoAtividade === "favoritou_obra") {
    tipoItem = "favorita";
    descricao = "Favoritou esta obra.";
  } else if (tipoAtividade === "salvou_obra") {
    tipoItem = "quero_ler";
    descricao = "Salvou para acompanhar depois.";
  } else if (tipoAtividade === "publicou_review") {
    tipoItem = "review";
    descricao = texto
      ? `Publicou review: ${texto.slice(0, 90)}${texto.length > 90 ? "..." : ""}`
      : "Publicou uma review.";
  } else if (tipoAtividade === "criou_lista") {
    descricao = "Criou uma lista de leitura.";
  }

  return {
    chave: `atividade-${pegarTexto(registro.id) || tipoAtividade}-${data || tituloBase}`,
    tipo: tipoItem,
    titulo: tituloBase,
    descricao,
    data,
    obra,
    href,
    nota: Number.isFinite(nota) && nota > 0 ? nota : undefined,
  };
}

function ordenarItensDiarioPerfil(itens: DiarioPerfilItem[]) {
  return [...itens].sort(
    (itemA, itemB) =>
      obterTimestampData(itemB.data) - obterTimestampData(itemA.data),
  );
}

function montarMapaObrasDiario(obrasDisponiveis: ObraLocal[]) {
  const obrasPorId = new Map<string, ObraLocal>();
  const obrasPorCapituloId = new Map<string, ObraLocal>();

  obrasDisponiveis.forEach((obra) => {
    if (obra.id) {
      obrasPorId.set(obra.id, obra);
    }

    obra.capitulos.forEach((capitulo) => {
      if (capitulo.id) {
        obrasPorCapituloId.set(capitulo.id, obra);
      }
    });
  });

  return { obrasPorId, obrasPorCapituloId };
}

function obterObraRegistroDiario(
  registro: Record<string, unknown>,
  obrasPorId: Map<string, ObraLocal>,
  obrasPorCapituloId: Map<string, ObraLocal>,
) {
  const obraId = pegarTexto(registro.obra_id ?? registro.obraId);

  if (obraId && obrasPorId.has(obraId)) {
    return obrasPorId.get(obraId) || null;
  }

  const capituloId = pegarTexto(registro.capitulo_id ?? registro.capituloId);

  if (capituloId && obrasPorCapituloId.has(capituloId)) {
    return obrasPorCapituloId.get(capituloId) || null;
  }

  return null;
}

async function carregarRegistrosDiarioPerfil(tabela: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [] as Record<string, unknown>[];
    }

    return data.filter(
      (registro): registro is Record<string, unknown> =>
        Boolean(registro) && typeof registro === "object" && !Array.isArray(registro),
    );
  } catch {
    return [] as Record<string, unknown>[];
  }
}

function montarDiarioPerfilLocal(
  perfil: AutorPerfil,
  obrasFavoritasIds: string[],
  obrasConcluidasIds: string[],
): Omit<DiarioPerfilEstado, "carregando"> {
  const lendoAgora = ordenarItensDiarioPerfil(
    perfil.obras
      .filter((obra) => obra.progressoLeitura > 0 && obra.progressoLeitura < 100)
      .map((obra) =>
        criarItemDiarioPerfil(
          "lendo",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          `Leitura em andamento • ${obra.progressoLeitura}% concluída`,
          { progresso: obra.progressoLeitura },
        ),
      ),
  );

  const favoritas = ordenarItensDiarioPerfil(
    perfil.obras
      .filter((obra) => obrasFavoritasIds.includes(obra.id))
      .map((obra) =>
        criarItemDiarioPerfil(
          "favorita",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Obra favoritada no perfil",
        ),
      ),
  );

  const concluidas = ordenarItensDiarioPerfil(
    perfil.obras
      .filter((obra) => obrasConcluidasIds.includes(obra.id))
      .map((obra) =>
        criarItemDiarioPerfil(
          "concluida",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Obra marcada como concluída",
        ),
      ),
  );

  const queroLer = ordenarItensDiarioPerfil(
    perfil.obras
      .filter(
        (obra) =>
          !obrasConcluidasIds.includes(obra.id) &&
          !favoritas.some((item) => item.obra?.id === obra.id),
      )
      .slice(0, 6)
      .map((obra) =>
        criarItemDiarioPerfil(
          "quero_ler",
          obra,
          obra.criadaEm,
          "Obra disponível para leitura",
        ),
      ),
  );

  const atividades = ordenarItensDiarioPerfil([
    ...lendoAgora,
    ...favoritas,
    ...concluidas,
    ...queroLer,
  ]).slice(0, 8);

  return {
    lendoAgora,
    queroLer,
    favoritas,
    concluidas,
    avaliacoes: [],
    reviews: [],
    atividades,
  };
}

async function carregarDiarioPerfilSupabase(
  userId: string,
  obrasDisponiveis: ObraLocal[],
  incluirPrivados: boolean,
): Promise<Omit<DiarioPerfilEstado, "carregando">> {
  const { obrasPorId, obrasPorCapituloId } = montarMapaObrasDiario(obrasDisponiveis);

  const [
    seguindoObras,
    favoritos,
    concluidas,
    avaliacoes,
    progresso,
    diarioAtividades,
  ] = await Promise.all([
    carregarRegistrosDiarioPerfil("seguindo_obras", userId),
    carregarRegistrosDiarioPerfil("favoritos", userId),
    carregarRegistrosDiarioPerfil("concluidas", userId),
    carregarRegistrosDiarioPerfil("obra_avaliacoes", userId),
    carregarRegistrosDiarioPerfil("progresso_leitura", userId),
    carregarRegistrosDiarioPerfil("diario_atividades", userId),
  ]);

  const concluidasIds = new Set(
    concluidas
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "parcial"),
      )
      .map((registro) => pegarTexto(registro.obra_id ?? registro.obraId))
      .filter(Boolean),
  );

  const lendoPorObra = new Map<string, DiarioPerfilItem>();

  progresso.forEach((registro) => {
    if (!registroDiarioPodeAparecer(registro, incluirPrivados, "privado")) {
      return;
    }

    const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

    if (!obra || concluidasIds.has(obra.id)) {
      return;
    }

    const data = obterDataRegistroDiario(registro) || obra.ultimaLeituraEm || obra.criadaEm;
    const progressoObra = obra.progressoLeitura > 0 ? obra.progressoLeitura : 1;
    const itemAtual = lendoPorObra.get(obra.id);

    if (itemAtual && obterTimestampData(itemAtual.data) >= obterTimestampData(data)) {
      return;
    }

    lendoPorObra.set(
      obra.id,
      criarItemDiarioPerfil(
        "lendo",
        obra,
        data,
        `Leitura em andamento • ${progressoObra}% concluída`,
        { progresso: progressoObra },
      ),
    );
  });

  const lendoAgora = ordenarItensDiarioPerfil(Array.from(lendoPorObra.values()));

  const queroLer = ordenarItensDiarioPerfil(
    seguindoObras
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "privado"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

        if (!obra) {
          return null;
        }

        return criarItemDiarioPerfil(
          "quero_ler",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          "Adicionada para acompanhar depois",
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const favoritas = ordenarItensDiarioPerfil(
    favoritos
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "parcial"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

        if (!obra) {
          return null;
        }

        return criarItemDiarioPerfil(
          "favorita",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          "Obra favoritada no Diário",
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const concluidasItens = ordenarItensDiarioPerfil(
    concluidas
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "parcial"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

        if (!obra) {
          return null;
        }

        return criarItemDiarioPerfil(
          "concluida",
          obra,
          obterDataRegistroDiario(registro) || obra.ultimaLeituraEm || obra.criadaEm,
          "Obra marcada como concluída",
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const avaliacoesItens = ordenarItensDiarioPerfil(
    avaliacoes
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "publico"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);
        const nota = Number(registro.nota ?? registro.rating ?? registro.avaliacao);

        if (!obra || !Number.isFinite(nota) || nota <= 0) {
          return null;
        }

        return criarItemDiarioPerfil(
          "avaliacao",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          `Avaliou com ${nota.toFixed(1).replace(".", ",")} estrelas`,
          { nota },
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const atividadesReais = ordenarItensDiarioPerfil(
    diarioAtividades
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "privado"),
      )
      .map((registro) =>
        criarItemAtividadeDiarioPerfil(registro, obrasPorId, obrasPorCapituloId),
      )
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const reviews = atividadesReais.filter((item) => item.tipo === "review");

  const atividades = ordenarItensDiarioPerfil([
    ...atividadesReais,
    ...lendoAgora,
    ...queroLer,
    ...favoritas,
    ...concluidasItens,
    ...avaliacoesItens,
  ]).slice(0, 12);

  return {
    lendoAgora,
    queroLer,
    favoritas,
    concluidas: concluidasItens,
    avaliacoes: avaliacoesItens,
    reviews,
    atividades,
  };
}

async function sincronizarTabelaUsuario(
  tabela: string,
  colunaId: string,
  idValor: string,
  ativo: boolean,
  visibilidade: VisibilidadeDiarioPerfil = "parcial",
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !idValor) {
      return;
    }

    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq(colunaId, idValor);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      [colunaId]: idValor,
    };

    const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade,
    });

    if (!erroComVisibilidade) {
      return;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from(tabela)
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no perfil:`, error);
    // A ação local permanece funcionando se o Supabase falhar.
  }
}

async function sincronizarAutorSeguidoSupabase(autor: string, ativo: boolean) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId || !autor) {
      return;
    }

    if (ativo) {
      await supabase.from("seguindo_autores").upsert(
        {
          user_id: userId,
          autor,
        },
        { onConflict: "user_id,autor" },
      );
      return;
    }

    await supabase
      .from("seguindo_autores")
      .delete()
      .eq("user_id", userId)
      .eq("autor", autor);
  } catch {
    // A ação local permanece funcionando se o Supabase falhar.
  }
}

async function contarSeguimentoUsuarioPerfil(
  coluna: "seguidor_id" | "seguido_id",
  userId: string,
) {
  if (!userId || !idAutorSupabaseValido(userId)) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("seguindo_usuarios")
      .select("*", { count: "exact", head: true })
      .eq(coluna, userId);

    if (error) {
      console.warn("Não consegui contar seguidores do perfil:", error.message);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.warn("Não consegui acessar seguidores do perfil:", error);
    return 0;
  }
}

async function carregarEstadoSeguimentoUsuarioPerfil(
  seguidorId: string,
  seguidoId: string,
) {
  if (!seguidoId || !idAutorSupabaseValido(seguidoId)) {
    return {
      seguindo: false,
      seguidoresTotal: 0,
      seguindoTotal: 0,
    };
  }

  const [seguidoresTotal, seguindoTotal] = await Promise.all([
    contarSeguimentoUsuarioPerfil("seguido_id", seguidoId),
    contarSeguimentoUsuarioPerfil("seguidor_id", seguidoId),
  ]);

  if (!seguidorId || !idAutorSupabaseValido(seguidorId) || seguidorId === seguidoId) {
    return {
      seguindo: false,
      seguidoresTotal,
      seguindoTotal,
    };
  }

  try {
    const { data, error } = await supabase
      .from("seguindo_usuarios")
      .select("seguidor_id")
      .eq("seguidor_id", seguidorId)
      .eq("seguido_id", seguidoId)
      .maybeSingle();

    if (error) {
      console.warn("Não consegui conferir se você segue este perfil:", error.message);
    }

    return {
      seguindo: !error && Boolean(data),
      seguidoresTotal,
      seguindoTotal,
    };
  } catch (error) {
    console.warn("Não consegui acessar o estado de seguimento do perfil:", error);

    return {
      seguindo: false,
      seguidoresTotal,
      seguindoTotal,
    };
  }
}

async function sincronizarUsuarioSeguidoSupabase(
  seguidorId: string,
  seguidoId: string,
  ativo: boolean,
): Promise<{ ok: boolean; erro: string }> {
  if (!seguidorId || !seguidoId) {
    return { ok: false, erro: "IDs de usuário ausentes." };
  }

  if (!idAutorSupabaseValido(seguidorId) || !idAutorSupabaseValido(seguidoId)) {
    return { ok: false, erro: "ID de usuário inválido para seguir perfil." };
  }

  if (seguidorId === seguidoId) {
    return { ok: false, erro: "Você não pode seguir o próprio perfil." };
  }

  try {
    const { error: erroDelete } = await supabase
      .from("seguindo_usuarios")
      .delete()
      .eq("seguidor_id", seguidorId)
      .eq("seguido_id", seguidoId);

    if (erroDelete) {
      const mensagem = erroDelete.message || "Erro ao limpar seguimento antigo.";
      console.warn("Não consegui limpar seguimento antigo do perfil:", mensagem, erroDelete);

      return { ok: false, erro: mensagem };
    }

    if (!ativo) {
      return { ok: true, erro: "" };
    }

    const { error: erroInsert } = await supabase.from("seguindo_usuarios").insert({
      seguidor_id: seguidorId,
      seguido_id: seguidoId,
    });

    if (erroInsert) {
      const mensagem = erroInsert.message || "Erro ao salvar seguimento.";
      console.warn("Não consegui seguir o perfil:", mensagem, erroInsert);

      return { ok: false, erro: mensagem };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro inesperado ao seguir perfil.";
    console.warn("Não consegui sincronizar seguimento do perfil:", error);

    return { ok: false, erro: mensagem };
  }
}

export default function PerfilAutorPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [autorSelecionado, setAutorSelecionado] = useState("");
  const [autorIdSelecionado, setAutorIdSelecionado] = useState("");
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [perfisAutoresSalvos, setPerfisAutoresSalvos] =
    useState<PerfisAutoresSalvos>({});
  const [avatarErro, setAvatarErro] = useState("");
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [perfilUsuarioRemoto, setPerfilUsuarioRemoto] =
    useState<PerfilUsuarioRemoto | null>(null);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [podeEditarPerfil, setPodeEditarPerfil] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [buscaObras, setBuscaObras] = useState("");
  const [filtroObras, setFiltroObras] = useState<FiltroObrasAutor>("todas");
  const [ordenacaoObras, setOrdenacaoObras] =
    useState<OrdenacaoObrasAutor>("recentes");
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [editorPerfilAberto, setEditorPerfilAberto] = useState(false);
  const [nomePerfilEditor, setNomePerfilEditor] = useState("");
  const [editorSobreAberto, setEditorSobreAberto] = useState(false);
  const [abaPerfil, setAbaPerfil] = useState<AbaPerfilAutor>("obras");
  const [filtrosObrasAbertos, setFiltrosObrasAbertos] = useState(false);
  const [obraMenuAbertoId, setObraMenuAbertoId] = useState("");
  const [avaliacaoAutor, setAvaliacaoAutor] =
    useState<AvaliacaoAutorPublica>(avaliacaoAutorVazia);
  const [diarioPerfil, setDiarioPerfil] =
    useState<DiarioPerfilEstado>(diarioPerfilVazio);
  const [seguindoUsuarioPerfil, setSeguindoUsuarioPerfil] = useState(false);
  const [seguidoresUsuarioPerfilTotal, setSeguidoresUsuarioPerfilTotal] =
    useState(0);
  const [seguindoUsuarioPerfilTotal, setSeguindoUsuarioPerfilTotal] =
    useState(0);
  const [seguirUsuarioSalvando, setSeguirUsuarioSalvando] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    function atualizarTelaDesktop() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    atualizarTelaDesktop();
    window.addEventListener("resize", atualizarTelaDesktop);

    return () => {
      window.removeEventListener("resize", atualizarTelaDesktop);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPerfilAutor() {
      const params = new URLSearchParams(window.location.search);
      const autorParam = params.get("autor") || "";
      const autorIdParam =
        params.get("autorId") || params.get("id") || params.get("userId") || "";
      setAutorSelecionado(autorParam.trim());
      setAutorIdSelecionado(autorIdParam.trim());
      setPodeEditarPerfil(false);

      let obrasNormalizadas: ObraLocal[] = [];
      let autoresSeguidosNormalizados: string[] = [];
      let obrasFavoritasNormalizadas: string[] = [];
      let obrasConcluidasNormalizadas: string[] = [];
      let perfilUsuarioRemotoCarregado: PerfilUsuarioRemoto | null = null;

      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        obrasNormalizadas = Array.isArray(obrasSalvasJson)
          ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
              normalizarObra(obra, index),
            )
          : [];

        const autoresSeguidosTexto = localStorage.getItem(
          AUTHOR_FOLLOW_STORAGE_KEY,
        );
        const autoresSeguidosJson = autoresSeguidosTexto
          ? JSON.parse(autoresSeguidosTexto)
          : [];

        autoresSeguidosNormalizados = Array.isArray(autoresSeguidosJson)
          ? autoresSeguidosJson
              .filter(
                (autor): autor is string =>
                  typeof autor === "string" && Boolean(autor.trim()),
              )
              .map((autor) => normalizarNomeAutor(autor))
          : [];

        const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const obrasFavoritasJson = obrasFavoritasTexto
          ? JSON.parse(obrasFavoritasTexto)
          : [];

        obrasFavoritasNormalizadas = Array.isArray(obrasFavoritasJson)
          ? obrasFavoritasJson.filter(
              (id): id is string =>
                typeof id === "string" && Boolean(id.trim()),
            )
          : [];

        const obrasConcluidasTexto = localStorage.getItem(
          COMPLETED_STORAGE_KEY,
        );
        const obrasConcluidasJson = obrasConcluidasTexto
          ? JSON.parse(obrasConcluidasTexto)
          : [];

        obrasConcluidasNormalizadas = Array.isArray(obrasConcluidasJson)
          ? obrasConcluidasJson.filter(
              (id): id is string =>
                typeof id === "string" && Boolean(id.trim()),
            )
          : [];
      } catch {
        obrasNormalizadas = [];
        autoresSeguidosNormalizados = [];
        obrasFavoritasNormalizadas = [];
        obrasConcluidasNormalizadas = [];
      }

      const obrasSupabase = await carregarObrasPublicadasSupabase();
      const estadoUsuarioSupabase = await carregarEstadoUsuarioSupabase();
      const usuarioIdAtual = estadoUsuarioSupabase?.userId || "";
      const perfilUsuarioIdParaBuscar =
        autorIdParam.trim() || usuarioIdAtual;

      perfilUsuarioRemotoCarregado = await carregarPerfilUsuarioSupabase(
        perfilUsuarioIdParaBuscar,
        autorParam.trim(),
      );

      const obrasLocaisDoUsuario = filtrarObrasLocaisDoUsuarioPerfilAutor(
        obrasNormalizadas,
        usuarioIdAtual,
      );

      let obrasMescladas = mesclarObrasPorIdSlug(
        obrasLocaisDoUsuario,
        obrasSupabase,
      );

      if (estadoUsuarioSupabase) {
        obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...obrasFavoritasNormalizadas,
            ...estadoUsuarioSupabase.favoritas,
          ]),
        );
        obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...obrasConcluidasNormalizadas,
            ...estadoUsuarioSupabase.concluidas,
          ]),
        );
        autoresSeguidosNormalizados = Array.from(
          new Set([
            ...autoresSeguidosNormalizados,
            ...estadoUsuarioSupabase.autoresSeguidos,
          ]),
        );

        obrasMescladas = aplicarInteracoesNasObras(
          obrasMescladas,
          estadoUsuarioSupabase.interacoes.curtidas,
          estadoUsuarioSupabase.interacoes.salvos,
          estadoUsuarioSupabase.interacoes.comentarios,
          estadoUsuarioSupabase.interacoes.progresso,
        );
      }

      try {
        if (usuarioIdAtual) {
          const obrasDoUsuarioParaPersistir = obrasMescladas.filter((obra) =>
            obraPertenceAoUsuarioPerfilAutor(obra, usuarioIdAtual),
          );
          const obrasParaPersistir = mesclarObrasLocalStoragePerfilAutor(
            obrasNormalizadas,
            obrasDoUsuarioParaPersistir,
            usuarioIdAtual,
          );

          localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasParaPersistir));
        }

        localStorage.setItem(
          AUTHOR_FOLLOW_STORAGE_KEY,
          JSON.stringify(autoresSeguidosNormalizados),
        );
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(obrasFavoritasNormalizadas),
        );
        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(obrasConcluidasNormalizadas),
        );
      } catch {
        // Se o navegador bloquear localStorage, a página ainda usa o estado em memória.
      }

      if (!componenteAtivo) {
        return;
      }

      setUsuarioIdLogado(estadoUsuarioSupabase?.userId || "");
      setPerfilUsuarioRemoto(perfilUsuarioRemotoCarregado);
      setObras(obrasMescladas);
      setAutoresSeguidos(autoresSeguidosNormalizados);
      setObrasFavoritas(obrasFavoritasNormalizadas);
      setObrasConcluidas(obrasConcluidasNormalizadas);
      setPerfisAutoresSalvos(carregarPerfisAutores());
      setCarregando(false);
    }

    void carregarPerfilAutor();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const perfisAutores = useMemo<AutorPerfil[]>(() => {
    const mapa = new Map<
      string,
      { autorId: string; nome: string; obras: ObraLocal[] }
    >();

    obras.forEach((obra) => {
      const nomeAutor = obra.autor.trim() || "Autor não informado";
      const autorId = obra.autorId.trim();
      const chaveAutor = criarChaveAutorPerfil(autorId, nomeAutor);
      const autorExistente = mapa.get(chaveAutor);

      if (autorExistente) {
        mapa.set(chaveAutor, {
          ...autorExistente,
          autorId: autorExistente.autorId || autorId,
          obras: [...autorExistente.obras, obra],
        });
        return;
      }

      mapa.set(chaveAutor, {
        autorId,
        nome: nomeAutor,
        obras: [obra],
      });
    });

    return Array.from(mapa.values())
      .map((grupoAutor) => {
        const obrasDoAutor = grupoAutor.obras;

        const totalCapitulos = obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0,
        );

        const totalCurtidas = obrasDoAutor.reduce((total, obra) => {
          return (
            total + obra.capitulos.filter((capitulo) => capitulo.curtiu).length
          );
        }, 0);

        const totalComentarios = obrasDoAutor.reduce((total, obra) => {
          return (
            total +
            obra.capitulos.filter((capitulo) => capitulo.comentario.trim())
              .length
          );
        }, 0);

        return {
          autorId: grupoAutor.autorId,
          nome: grupoAutor.nome,
          obras: obrasDoAutor,
          totalCapitulos,
          totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
          totalCurtidas,
          totalComentarios,
        };
      })
      .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
  }, [obras]);

  const perfilUsuarioRemotoComoAutor = useMemo(() => {
    if (!perfilUsuarioRemoto?.userId) {
      return null;
    }

    return criarPerfilUsuarioRemotoComoAutor(perfilUsuarioRemoto);
  }, [perfilUsuarioRemoto]);

  const perfilAtual = useMemo(() => {
    if (!autorSelecionado && !autorIdSelecionado) {
      return null;
    }

    const autorIdNormalizado = autorIdSelecionado.trim().toLowerCase();

    if (autorIdNormalizado) {
      const perfilPorId = perfisAutores.find(
        (perfil) => perfil.autorId.trim().toLowerCase() === autorIdNormalizado,
      );

      if (perfilPorId) {
        return perfilPorId;
      }

      if (
        perfilUsuarioRemotoComoAutor &&
        perfilUsuarioRemotoComoAutor.autorId.trim().toLowerCase() ===
          autorIdNormalizado
      ) {
        return perfilUsuarioRemotoComoAutor;
      }
    }

    const autorNormalizado = normalizarNomeAutor(autorSelecionado);

    return (
      perfisAutores.find(
        (perfil) => normalizarNomeAutor(perfil.nome) === autorNormalizado,
      ) || null
    );
  }, [
    perfisAutores,
    autorSelecionado,
    autorIdSelecionado,
    perfilUsuarioRemotoComoAutor,
  ]);

  const autorNaoEncontrado = Boolean(
    (autorSelecionado || autorIdSelecionado) && !perfilAtual,
  );

  const perfilDoUsuarioLogado = useMemo(() => {
    const usuarioIdNormalizado = usuarioIdLogado.trim().toLowerCase();

    if (!usuarioIdNormalizado) {
      return null;
    }

    return (
      perfisAutores.find(
        (perfil) =>
          perfil.autorId.trim().toLowerCase() === usuarioIdNormalizado,
      ) ||
      (perfilUsuarioRemotoComoAutor?.autorId.trim().toLowerCase() ===
      usuarioIdNormalizado
        ? perfilUsuarioRemotoComoAutor
        : null)
    );
  }, [perfisAutores, usuarioIdLogado, perfilUsuarioRemotoComoAutor]);

  const perfilParaMostrar =
    autorSelecionado || autorIdSelecionado
      ? perfilAtual
      : perfilDoUsuarioLogado || perfilUsuarioRemotoComoAutor || perfisAutores[0] || null;

  useEffect(() => {
    const usuarioIdNormalizado = usuarioIdLogado.trim().toLowerCase();
    const autorIdPerfilNormalizado =
      perfilParaMostrar?.autorId.trim().toLowerCase() || "";
    const autorIdUrlNormalizado = autorIdSelecionado.trim().toLowerCase();

    const perfilPertenceAoUsuario = Boolean(
      usuarioIdNormalizado &&
        (autorIdPerfilNormalizado === usuarioIdNormalizado ||
          autorIdUrlNormalizado === usuarioIdNormalizado),
    );

    setPodeEditarPerfil(perfilPertenceAoUsuario);
  }, [perfilParaMostrar, autorIdSelecionado, usuarioIdLogado]);

  useEffect(() => {
    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";

    if (!perfilUserId || !idAutorSupabaseValido(perfilUserId)) {
      setSeguindoUsuarioPerfil(false);
      setSeguidoresUsuarioPerfilTotal(0);
      setSeguindoUsuarioPerfilTotal(0);
      return;
    }

    let cancelado = false;

    async function carregarSeguimentoUsuario() {
      const estadoSeguimento = await carregarEstadoSeguimentoUsuarioPerfil(
        usuarioIdLogado,
        perfilUserId,
      );

      if (cancelado) {
        return;
      }

      setSeguindoUsuarioPerfil(estadoSeguimento.seguindo);
      setSeguidoresUsuarioPerfilTotal(estadoSeguimento.seguidoresTotal);
      setSeguindoUsuarioPerfilTotal(estadoSeguimento.seguindoTotal);
    }

    void carregarSeguimentoUsuario();

    return () => {
      cancelado = true;
    };
  }, [perfilParaMostrar, usuarioIdLogado]);

  const autorChavePerfil = perfilParaMostrar
    ? criarChaveAutorPerfil(perfilParaMostrar.autorId, perfilParaMostrar.nome)
    : "";
  const autorNormalizadoParaSeguir = perfilParaMostrar
    ? normalizarNomeAutor(perfilParaMostrar.nome)
    : "";

  const seguindoAutor = Boolean(
    autorChavePerfil &&
    (autoresSeguidos.includes(autorChavePerfil) ||
      autoresSeguidos.includes(autorNormalizadoParaSeguir)),
  );
  const perfilUserIdParaSeguir = perfilParaMostrar?.autorId.trim() || "";
  const podeUsarSeguimentoUsuario = Boolean(
    perfilUserIdParaSeguir && idAutorSupabaseValido(perfilUserIdParaSeguir),
  );
  const seguindoPerfilAtual = podeUsarSeguimentoUsuario
    ? seguindoUsuarioPerfil
    : seguindoAutor;
  const seguidoresTotal = podeUsarSeguimentoUsuario
    ? seguidoresUsuarioPerfilTotal
    : seguindoAutor
      ? 1
      : 0;
  const seguindoTotalPerfil = podeUsarSeguimentoUsuario
    ? seguindoUsuarioPerfilTotal
    : 0;
  const seguidoresPerfilHref = criarHrefListaSeguimentoPerfilAutor(
    "seguidores",
    perfilParaMostrar,
  );
  const seguindoPerfilHref = criarHrefListaSeguimentoPerfilAutor(
    "seguindo",
    perfilParaMostrar,
  );
  const obrasFavoritasPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.filter((obra) => obrasFavoritas.includes(obra.id))
        .length
    : 0;
  const obrasConcluidasPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.filter((obra) =>
        obrasConcluidas.includes(obra.id),
      ).length
    : 0;
  const perfilSalvoAutor = autorChavePerfil
    ? perfisAutoresSalvos[autorChavePerfil] ||
      perfisAutoresSalvos[autorNormalizadoParaSeguir] || {
        avatar: "",
        avatarNome: "",
        bio: "",
        sobreBio: "",
        mostrarDestaques: false,
      }
    : {
        avatar: "",
        avatarNome: "",
        bio: "",
        sobreBio: "",
        mostrarDestaques: false,
      };
  const perfilUsuarioRemotoAtivo =
    perfilUsuarioRemoto &&
    perfilParaMostrar &&
    perfilUsuarioRemoto.userId.trim().toLowerCase() ===
      perfilParaMostrar.autorId.trim().toLowerCase()
      ? perfilUsuarioRemoto
      : null;
  const bioPadraoAutor = perfilParaMostrar
    ? criarBioAutor(perfilParaMostrar)
    : "";
  const bioAutorPersonalizada =
    perfilSalvoAutor.bio.trim() || perfilUsuarioRemotoAtivo?.bio.trim() || "";
  const bioAutor = bioAutorPersonalizada || bioPadraoAutor;
  const bioSobrePersonalizada =
    perfilSalvoAutor.sobreBio.trim() ||
    perfilUsuarioRemotoAtivo?.sobreBio.trim() ||
    "";
  const bioSobreAutor = bioSobrePersonalizada || bioAutor;
  const autorHandlePerfil = perfilParaMostrar
    ? criarHandlePerfilAutor(perfilParaMostrar.nome, perfilParaMostrar.autorId)
    : "@autor.historietas";
  const avatarAutor = perfilSalvoAutor.avatar || perfilUsuarioRemotoAtivo?.avatar || "";

  useEffect(() => {
    if (!editorPerfilAberto || !podeEditarPerfil || !perfilParaMostrar) {
      return;
    }

    setNomePerfilEditor(
      (perfilUsuarioRemotoAtivo?.nome || perfilParaMostrar.nome || "").trim(),
    );
  }, [
    editorPerfilAberto,
    podeEditarPerfil,
    perfilParaMostrar?.autorId,
    perfilParaMostrar?.nome,
    perfilUsuarioRemotoAtivo?.nome,
  ]);

  const caracteresRestantesBio = BIO_MAX_LENGTH - bioAutorPersonalizada.length;
  const caracteresRestantesBioSobre =
    SOBRE_BIO_MAX_LENGTH - bioSobrePersonalizada.length;
  const termoBuscaObras = normalizarTexto(buscaObras);

  const autorPodeReceberAvaliacao = Boolean(
    perfilParaMostrar && perfilParaMostrar.obras.length > 0,
  );

  const obrasDoPerfilFiltradas = useMemo(() => {
    if (!perfilParaMostrar) {
      return [];
    }

    const filtradas = perfilParaMostrar.obras.filter((obra) => {
      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          formatarGeneroPerfilAutor(obra.genero),
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          obra.tags.join(" "),
          obra.capaNome,
          obra.arquivoObra?.nome || "",
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
        ].join(" "),
      );

      const passaBusca = termoBuscaObras
        ? textoBusca.includes(termoBuscaObras)
        : true;

      const passaFiltro =
        filtroObras === "todas"
          ? true
          : filtroObras === "publicadas"
            ? obra.publicado
            : filtroObras === "rascunhos"
              ? !obra.publicado
              : obra.capitulos.length === 0;

      return passaBusca && passaFiltro;
    });

    return filtradas.sort((obraA, obraB) => {
      if (ordenacaoObras === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacaoObras === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      if (ordenacaoObras === "curtidas") {
        return (
          obraB.capitulos.filter((capitulo) => capitulo.curtiu).length -
          obraA.capitulos.filter((capitulo) => capitulo.curtiu).length
        );
      }

      return (
        obterTimestampData(obraB.criadaEm) - obterTimestampData(obraA.criadaEm)
      );
    });
  }, [perfilParaMostrar, termoBuscaObras, filtroObras, ordenacaoObras]);

  const obrasEmDestaque = useMemo(() => {
    if (!perfilParaMostrar) {
      return [];
    }

    return [...perfilParaMostrar.obras]
      .sort((obraA, obraB) => {
        if (obraA.publicado !== obraB.publicado) {
          return Number(obraB.publicado) - Number(obraA.publicado);
        }

        const curtidasA = obraA.capitulos.filter(
          (capitulo) => capitulo.curtiu,
        ).length;
        const curtidasB = obraB.capitulos.filter(
          (capitulo) => capitulo.curtiu,
        ).length;

        if (curtidasA !== curtidasB) {
          return curtidasB - curtidasA;
        }

        if (obraA.visualizacoes !== obraB.visualizacoes) {
          return obraB.visualizacoes - obraA.visualizacoes;
        }

        return obterTimestampData(obraB.criadaEm) - obterTimestampData(obraA.criadaEm);
      })
      .slice(0, 4);
  }, [perfilParaMostrar]);

  useEffect(() => {
    const perfilAtual = perfilParaMostrar;

    if (!perfilAtual) {
      setDiarioPerfil(diarioPerfilVazio);
      return;
    }

    const perfilDiario = perfilAtual;
    let cancelado = false;

    async function carregarDiarioPerfil() {
      const userIdPerfil = perfilDiario.autorId.trim();

      setDiarioPerfil({
        ...diarioPerfilVazio,
        carregando: true,
      });

      if (!userIdPerfil || !idAutorSupabaseValido(userIdPerfil)) {
        const diarioLocal = podeEditarPerfil
          ? montarDiarioPerfilLocal(
              perfilDiario,
              obrasFavoritas,
              obrasConcluidas,
            )
          : criarEstadoDiarioPerfilVazio();

        if (!cancelado) {
          setDiarioPerfil({
            carregando: false,
            ...diarioLocal,
          });
        }

        return;
      }

      const diarioSupabase = await carregarDiarioPerfilSupabase(
        userIdPerfil,
        obras,
        podeEditarPerfil,
      );

      if (!cancelado) {
        setDiarioPerfil({
          carregando: false,
          ...diarioSupabase,
        });
      }
    }

    void carregarDiarioPerfil();

    return () => {
      cancelado = true;
    };
  }, [perfilParaMostrar, obras, obrasFavoritas, obrasConcluidas, podeEditarPerfil]);

  const totalLeiturasDiario =
    diarioPerfil.lendoAgora.length + diarioPerfil.concluidas.length;
  const totalFavoritasDiario = diarioPerfil.favoritas.length;
  const totalAvaliacoesDiario = diarioPerfil.avaliacoes.length;
  const totalReviewsDiario = diarioPerfil.reviews.length;
  const descricaoPrivacidadeDiario = obterDescricaoPrivacidadeDiario(podeEditarPerfil);
  const resumoPrivacidadeDiario = obterTextoResumoPrivacidadeDiario(podeEditarPerfil);

  useEffect(() => {
    if (!perfilParaMostrar || !autorPodeReceberAvaliacao) {
      setAvaliacaoAutor(avaliacaoAutorVazia);
      return;
    }

    const perfilAtualAutor = perfilParaMostrar;
    const notaLocal = obterAvaliacaoAutorLocal(perfilAtualAutor);

    setAvaliacaoAutor({
      media: notaLocal > 0 ? notaLocal : 0,
      total: notaLocal > 0 ? 1 : 0,
      minhaNota: notaLocal,
      carregado: true,
      salvando: false,
    });

    const autorId = perfilAtualAutor.autorId.trim();

    if (!autorId || !idAutorSupabaseValido(autorId)) {
      return;
    }

    let cancelado = false;

    async function carregarAvaliacaoRealAutor() {
      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const { data: avaliacoesData, error: erroAvaliacoes } = await supabase
          .from("autor_avaliacoes")
          .select("nota")
          .eq("autor_id", autorId);

        if (erroAvaliacoes || !Array.isArray(avaliacoesData)) {
          return;
        }

        const notas = avaliacoesData
          .map((avaliacao) => Number((avaliacao as { nota?: unknown }).nota))
          .filter((nota) => Number.isFinite(nota) && nota >= 0.5 && nota <= 5);
        const total = notas.length;
        const media =
          total > 0
            ? notas.reduce((soma, nota) => soma + nota, 0) / total
            : 0;
        let minhaNota = notaLocal;

        if (userId) {
          const { data: minhaAvaliacao } = await supabase
            .from("autor_avaliacoes")
            .select("nota")
            .eq("autor_id", autorId)
            .eq("user_id", userId)
            .maybeSingle();

          const notaUsuario = Number(
            (minhaAvaliacao as { nota?: unknown } | null)?.nota,
          );

          if (Number.isFinite(notaUsuario) && notaUsuario >= 0.5 && notaUsuario <= 5) {
            minhaNota = Math.round(notaUsuario * 2) / 2;
          }
        }

        if (cancelado) {
          return;
        }

        setAvaliacaoAutor((avaliacaoAtual) => {
          if (
            avaliacaoAtual.salvando ||
            avaliacaoAtual.minhaNota !== notaLocal
          ) {
            return {
              ...avaliacaoAtual,
              carregado: true,
            };
          }

          return {
            media,
            total,
            minhaNota,
            carregado: true,
            salvando: false,
          };
        });
      } catch {
        if (!cancelado) {
          setAvaliacaoAutor((avaliacaoAtual) => ({
            ...avaliacaoAtual,
            carregado: true,
            salvando: false,
          }));
        }
      }
    }

    void carregarAvaliacaoRealAutor();

    return () => {
      cancelado = true;
    };
  }, [perfilParaMostrar, autorPodeReceberAvaliacao]);

  const generosPrincipaisPerfil = useMemo(() => {
    if (!perfilParaMostrar) {
      return [] as string[];
    }

    const contagemGeneros = new Map<string, number>();

    perfilParaMostrar.obras.forEach((obra) => {
      const genero = formatarGeneroPerfilAutor(obra.genero);

      if (!genero || genero === "Não informado") {
        return;
      }

      contagemGeneros.set(genero, (contagemGeneros.get(genero) || 0) + 1);
    });

    return Array.from(contagemGeneros.entries())
      .sort((generoA, generoB) => {
        if (generoA[1] !== generoB[1]) {
          return generoB[1] - generoA[1];
        }

        return generoA[0].localeCompare(generoB[0]);
      })
      .slice(0, 5)
      .map(([genero]) => genero);
  }, [perfilParaMostrar]);

  const totalVisualizacoesPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.reduce(
        (total, obra) => total + normalizarNumeroPerfilAutor(obra.visualizacoes),
        0,
      )
    : 0;
  const totalRascunhosPerfil = perfilParaMostrar
    ? Math.max(0, perfilParaMostrar.obras.length - perfilParaMostrar.totalPublicadas)
    : 0;
  const totalObrasSemCapitulosPerfil = perfilParaMostrar
    ? perfilParaMostrar.obras.filter((obra) => obra.capitulos.length === 0).length
    : 0;

  const filtrosObrasAtivos = Boolean(
    buscaObras.trim() ||
    filtroObras !== "todas" ||
    ordenacaoObras !== "recentes",
  );

  const obraMenuAberta = useMemo(() => {
    if (!obraMenuAbertoId) {
      return null;
    }

    return (
      obrasDoPerfilFiltradas.find((obra) => obra.id === obraMenuAbertoId) ||
      null
    );
  }, [obraMenuAbertoId, obrasDoPerfilFiltradas]);

  const containerAtualStyle = isDesktop
    ? desktopContainerStyle
    : containerStyle;
  const heroAtualStyle = isDesktop ? desktopHeroBoxStyle : heroBoxStyle;
  const authorTopRowAtualStyle = isDesktop
    ? desktopAuthorTopRowStyle
    : authorTopRowStyle;
  const avatarButtonAtualStyle = isDesktop
    ? desktopAvatarButtonStyle
    : avatarButtonStyle;
  const avatarDisplayAtualStyle = isDesktop
    ? desktopAvatarDisplayStyle
    : avatarDisplayStyle;
  const titleAtualStyle = isDesktop ? desktopTitleStyle : titleStyle;
  const descriptionAtualStyle = isDesktop
    ? desktopDescriptionStyle
    : descriptionStyle;
  const sectionHeaderAtualStyle = isDesktop
    ? desktopSectionHeaderStyle
    : sectionHeaderStyle;
  const filterBoxAtualStyle = isDesktop
    ? desktopFilterBoxStyle
    : filterBoxStyle;
  const filterGridAtualStyle = isDesktop
    ? desktopFilterGridStyle
    : filterGridStyle;
  const clearFilterButtonAtualStyle = isDesktop
    ? desktopClearFilterButtonStyle
    : clearFilterButtonStyle;
  const worksGridAtualStyle = isDesktop
    ? desktopWorksGridStyle
    : worksGridStyle;
  const workCardAtualStyle = isDesktop ? desktopWorkCardStyle : workCardStyle;
  const workContentAtualStyle = isDesktop
    ? desktopWorkContentStyle
    : workContentStyle;
  const workTitleAtualStyle = isDesktop
    ? desktopWorkTitleStyle
    : workTitleStyle;
  const workTextAtualStyle = isDesktop ? desktopWorkTextStyle : workTextStyle;
  const workActionsGridAtualStyle = isDesktop
    ? desktopWorkActionsGridStyle
    : workActionsGridStyle;
  const avatarActionsAtualStyle = isDesktop
    ? desktopAvatarActionsStyle
    : avatarActionsStyle;
  const avatarSmallButtonAtualStyle = isDesktop
    ? desktopAvatarSmallButtonStyle
    : avatarSmallButtonStyle;
  const avatarRemoveButtonAtualStyle = isDesktop
    ? desktopAvatarRemoveButtonStyle
    : avatarRemoveButtonStyle;
  const bioTextareaAtualStyle = isDesktop
    ? desktopBioTextareaStyle
    : bioTextareaStyle;
  const profileStatsAtualStyle = isDesktop
    ? desktopProfileStatsStyle
    : profileStatsStyle;
  const profileActionsAtualStyle = isDesktop
    ? desktopProfileActionsStyle
    : profileActionsStyle;
  const menuSheetAtualStyle = isDesktop
    ? desktopMenuSheetStyle
    : menuSheetStyle;
  const comunidadeAutorBusca = encodeURIComponent(
    perfilParaMostrar?.nome || "",
  );
  const comunidadeAutorHref = comunidadeAutorBusca
    ? `/comunidade?busca=${comunidadeAutorBusca}`
    : "/comunidade";
  const comunidadeAutorTeoriasHref = comunidadeAutorBusca
    ? `${comunidadeAutorHref}&tipo=Teoria`
    : "/comunidade?tipo=Teoria";
  const comunidadeAutorReviewsHref = comunidadeAutorBusca
    ? `${comunidadeAutorHref}&tipo=Review`
    : "/comunidade?tipo=Review";

  async function usuarioEstaLogado() {
    try {
      const { data } = await supabase.auth.getUser();

      return Boolean(data.user);
    } catch {
      return false;
    }
  }

  function avisarLoginNecessario(mensagem: string) {
    setMensagemAcao(mensagem);
    router.push(criarLoginHrefPerfilAutor());
  }

  function limparFiltrosObras() {
    setBuscaObras("");
    setFiltroObras("todas");
    setOrdenacaoObras("recentes");
  }

  function salvarPerfilAutor(novoPerfil: PerfilAutorSalvo) {
    if (!autorChavePerfil) {
      return;
    }

    const perfilNormalizado = {
      avatar: novoPerfil.avatar,
      avatarNome: novoPerfil.avatarNome,
      bio: novoPerfil.bio.slice(0, BIO_MAX_LENGTH),
      sobreBio: novoPerfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
      mostrarDestaques: novoPerfil.mostrarDestaques === true,
    };

    const novosPerfis = {
      ...perfisAutoresSalvos,
      [autorChavePerfil]: perfilNormalizado,
    };

    localStorage.setItem(
      AUTHOR_PROFILE_STORAGE_KEY,
      JSON.stringify(novosPerfis),
    );
    setPerfisAutoresSalvos(novosPerfis);

    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";

    if (
      podeEditarPerfil &&
      perfilUserId &&
      usuarioIdLogado &&
      perfilUserId.toLowerCase() === usuarioIdLogado.trim().toLowerCase()
    ) {
      const nomePerfil = perfilParaMostrar?.nome || perfilUsuarioRemotoAtivo?.nome || "Usuário";

      setPerfilUsuarioRemoto({
        userId: perfilUserId,
        nome: nomePerfil,
        avatar: perfilNormalizado.avatar,
        bio: perfilNormalizado.bio,
        sobreBio: perfilNormalizado.sobreBio,
        criadoEm: perfilUsuarioRemotoAtivo?.criadoEm || "",
      });

      void salvarPerfilUsuarioSupabase({
        userId: perfilUserId,
        nome: nomePerfil,
        perfil: perfilNormalizado,
      }).then((resultado) => {
        if (!resultado.ok && resultado.erro) {
          setMensagemAcao(`Perfil salvo neste aparelho. Supabase: ${resultado.erro}`);
        }
      });
    }
  }

  async function salvarNomePerfilAutor(nomeAtualizado: string) {
    const nomeFinal = nomeAtualizado.trim().replace(/\s+/g, " ").slice(0, 80);
    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";
    const usuarioIdAtual = usuarioIdLogado.trim();

    if (!podeEditarPerfil || !perfilParaMostrar || !perfilUserId || !usuarioIdAtual) {
      return;
    }

    if (perfilUserId.toLowerCase() !== usuarioIdAtual.toLowerCase()) {
      return;
    }

    if (nomeFinal.length < 3) {
      setMensagemAcao("O nome do perfil precisa ter pelo menos 3 caracteres.");
      setNomePerfilEditor(perfilParaMostrar.nome);
      return;
    }

    if (nomeFinal === perfilParaMostrar.nome && nomeFinal === perfilUsuarioRemotoAtivo?.nome) {
      return;
    }

    setNomePerfilEditor(nomeFinal);
    setMensagemAcao("Salvando nome do perfil...");

    const perfilNormalizado: PerfilAutorSalvo = {
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    };

    setPerfilUsuarioRemoto({
      userId: perfilUserId,
      nome: nomeFinal,
      avatar: avatarAutor,
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      criadoEm: perfilUsuarioRemotoAtivo?.criadoEm || "",
    });

    setObras((obrasAtuais) =>
      obrasAtuais.map((obra) =>
        obraPertenceAoUsuarioPerfilAutor(obra, perfilUserId)
          ? { ...obra, autor: nomeFinal }
          : obra,
      ),
    );

    try {
      const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
      const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
      const obrasSalvasNormalizadas = Array.isArray(obrasSalvasJson)
        ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
            normalizarObra(obra, index),
          )
        : [];
      const obrasLocaisAtualizadas = obrasSalvasNormalizadas.map((obra) =>
        obraPertenceAoUsuarioPerfilAutor(obra, perfilUserId)
          ? { ...obra, autor: nomeFinal }
          : obra,
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasLocaisAtualizadas));
    } catch {
      // Se o localStorage falhar, a alteração em profiles ainda continua.
    }

    const [resultadoPerfil, resultadoObras] = await Promise.all([
      salvarPerfilUsuarioSupabase({
        userId: perfilUserId,
        nome: nomeFinal,
        perfil: perfilNormalizado,
      }),
      sincronizarNomeAutorObrasSupabase(perfilUserId, nomeFinal),
    ]);

    if (!resultadoPerfil.ok) {
      setMensagemAcao(
        `Nome salvo neste aparelho. Supabase: ${resultadoPerfil.erro}`,
      );
      return;
    }

    if (!resultadoObras.ok) {
      setMensagemAcao(
        `Nome do perfil atualizado. Obras locais atualizadas; Supabase obras: ${resultadoObras.erro}`,
      );
      return;
    }

    setMensagemAcao("Nome do perfil atualizado.");
  }

  function atualizarBioAutor(novaBio: string) {
    salvarPerfilAutor({
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: novaBio.slice(0, BIO_MAX_LENGTH),
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    });
  }

  function atualizarBioSobreAutor(novaBioSobre: string) {
    salvarPerfilAutor({
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: bioAutorPersonalizada,
      sobreBio: novaBioSobre.slice(0, SOBRE_BIO_MAX_LENGTH),
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    });
  }

  function alternarDestaquesPerfil() {
    salvarPerfilAutor({
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: !perfilSalvoAutor.mostrarDestaques,
    });
  }

  async function avaliarAutor(nota: number) {
    if (!perfilParaMostrar || !autorPodeReceberAvaliacao || nota < 0 || nota > 5) {
      return;
    }

    if (podeEditarPerfil) {
      setMensagemAcao("Você não pode avaliar seu próprio perfil.");
      return;
    }

    let userId = "";

    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id || "";
    } catch {
      userId = "";
    }

    if (!userId) {
      avisarLoginNecessario("Entre na sua conta para avaliar este autor.");
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;
    const proximaAvaliacao = calcularProximaAvaliacaoAutor(
      avaliacaoAutor,
      notaNormalizada,
    );

    setAvaliacaoAutor(proximaAvaliacao);
    setMensagemAcao("");
    salvarAvaliacaoAutorLocal(perfilParaMostrar, notaNormalizada);

    const autorId = perfilParaMostrar.autorId.trim();

    if (!autorId || !idAutorSupabaseValido(autorId)) {
      setAvaliacaoAutor((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      return;
    }

    try {
      const resposta =
        notaNormalizada > 0
          ? await supabase.from("autor_avaliacoes").upsert(
              {
                autor_id: autorId,
                user_id: userId,
                nota: notaNormalizada,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: "autor_id,user_id" },
            )
          : await supabase
              .from("autor_avaliacoes")
              .delete()
              .eq("autor_id", autorId)
              .eq("user_id", userId);

      if (resposta.error) {
        throw resposta.error;
      }

      setAvaliacaoAutor((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");
    } catch {
      setAvaliacaoAutor((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        carregado: true,
        salvando: false,
      }));
      setMensagemAcao("");
    }
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

      const perfilComAvatarLocal: PerfilAutorSalvo = {
        avatar: resultado,
        avatarNome: arquivo.name,
        bio: bioAutorPersonalizada,
        sobreBio: bioSobrePersonalizada,
        mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
      };

      salvarPerfilAutor(perfilComAvatarLocal);
      setMensagemAcao("Avatar atualizado. Salvando imagem pública...");

      const perfilUserId = perfilParaMostrar?.autorId.trim() || "";

      if (
        !podeEditarPerfil ||
        !perfilUserId ||
        !usuarioIdLogado ||
        perfilUserId.toLowerCase() !== usuarioIdLogado.trim().toLowerCase()
      ) {
        setMensagemAcao("Avatar atualizado neste aparelho.");
        return;
      }

      void enviarAvatarPerfilUsuarioSupabase({
        userId: perfilUserId,
        arquivo,
      }).then((resultadoUpload) => {
        if (!resultadoUpload.ok || !resultadoUpload.url) {
          setMensagemAcao(
            "Avatar salvo neste aparelho. Para aparecer em outros lugares, confirme o bucket avatars no Supabase."
          );
          return;
        }

        const perfilComAvatarPublico: PerfilAutorSalvo = {
          ...perfilComAvatarLocal,
          avatar: resultadoUpload.url,
        };

        salvarPerfilAutor(perfilComAvatarPublico);
        setMensagemAcao("Avatar salvo no perfil público.");

        if (avatarInputRef.current) {
          avatarInputRef.current.value = "";
        }
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
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    });

    setAvatarErro("");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  async function copiarLinkPerfil() {
    setMenuPerfilAberto(false);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setMensagemAcao("Link do perfil copiado.");
    } catch {
      setMensagemAcao("Não consegui copiar o link do perfil neste navegador.");
    }
  }

  async function compartilharObraPerfilAutor(obra: ObraLocal) {
    setObraMenuAbertoId("");

    const obraHref =
      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
    const obraUrl = obraHref.startsWith("http")
      ? obraHref
      : `${window.location.origin}${obraHref.startsWith("/") ? obraHref : `/${obraHref}`}`;

    try {
      await navigator.clipboard.writeText(obraUrl);
      setMensagemAcao("Link da obra copiado.");
    } catch {
      setMensagemAcao("Não consegui copiar o link da obra neste navegador.");
    }
  }

  async function sairDaConta() {
    setMenuPerfilAberto(false);

    try {
      await supabase.auth.signOut();
    } catch {
      // Mesmo se o Supabase falhar, leva o usuário para a tela de login.
    }

    router.push("/login");
  }

  async function alternarSeguirAutor() {
    if (!perfilParaMostrar) {
      return;
    }

    setMensagemAcao("");

    let userIdAtual = usuarioIdLogado;

    try {
      const { data } = await supabase.auth.getUser();
      userIdAtual = data.user?.id || "";

      if (userIdAtual && userIdAtual !== usuarioIdLogado) {
        setUsuarioIdLogado(userIdAtual);
      }
    } catch {
      userIdAtual = usuarioIdLogado;
    }

    if (!userIdAtual) {
      avisarLoginNecessario("Entre na sua conta para seguir perfis.");
      return;
    }

    const userIdPerfil = perfilParaMostrar.autorId.trim();

    if (
      userIdPerfil &&
      idAutorSupabaseValido(userIdPerfil) &&
      idAutorSupabaseValido(userIdAtual)
    ) {
      if (userIdPerfil === userIdAtual) {
        setMensagemAcao("Este é o seu perfil.");
        return;
      }

      const proximoEstadoSeguindo = !seguindoUsuarioPerfil;

      setSeguirUsuarioSalvando(true);
      setSeguindoUsuarioPerfil(proximoEstadoSeguindo);
      setSeguidoresUsuarioPerfilTotal((totalAtual) =>
        proximoEstadoSeguindo
          ? totalAtual + 1
          : Math.max(0, totalAtual - 1),
      );

      const resultadoSeguimento = await sincronizarUsuarioSeguidoSupabase(
        userIdAtual,
        userIdPerfil,
        proximoEstadoSeguindo,
      );

      setSeguirUsuarioSalvando(false);

      if (!resultadoSeguimento.ok) {
        setSeguindoUsuarioPerfil(!proximoEstadoSeguindo);
        setSeguidoresUsuarioPerfilTotal((totalAtual) =>
          proximoEstadoSeguindo
            ? Math.max(0, totalAtual - 1)
            : totalAtual + 1,
        );
        setMensagemAcao("Não consegui atualizar este seguimento agora.");
        return;
      }

      setMensagemAcao(
        proximoEstadoSeguindo
          ? "Perfil adicionado aos seus seguindo."
          : "Perfil removido dos seus seguindo.",
      );
      return;
    }

    const autorNormalizado = normalizarNomeAutor(perfilParaMostrar.nome);
    const autorChaveSeguir = criarChaveAutorPerfil(
      perfilParaMostrar.autorId,
      perfilParaMostrar.nome,
    );
    const proximoEstadoSeguindo = !seguindoAutor;
    const autoresSeguidosSemAutorAtual = autoresSeguidos.filter((autor) => {
      return autor !== autorChaveSeguir && autor !== autorNormalizado;
    });

    const novosAutoresSeguidos = proximoEstadoSeguindo
      ? Array.from(new Set([...autoresSeguidosSemAutorAtual, autorChaveSeguir]))
      : autoresSeguidosSemAutorAtual;

    localStorage.setItem(
      AUTHOR_FOLLOW_STORAGE_KEY,
      JSON.stringify(novosAutoresSeguidos),
    );

    setAutoresSeguidos(novosAutoresSeguidos);
    void sincronizarAutorSeguidoSupabase(
      autorNormalizado,
      proximoEstadoSeguindo,
    );
  }

  async function alternarFavoritoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para adicionar obras à lista.");
      return;
    }

    const proximoEstadoFavorito = !obrasFavoritas.includes(obraId);

    const novasObrasFavoritas = proximoEstadoFavorito
      ? Array.from(new Set([...obrasFavoritas, obraId]))
      : obrasFavoritas.filter((id) => id !== obraId);

    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(novasObrasFavoritas),
    );

    setObrasFavoritas(novasObrasFavoritas);
    void sincronizarTabelaUsuario(
      "favoritos",
      "obra_id",
      obraId,
      proximoEstadoFavorito,
      "parcial",
    );
  }

  async function alternarConcluidoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para concluir obras.");
      return;
    }

    const proximoEstadoConcluido = !obrasConcluidas.includes(obraId);

    const novasObrasConcluidas = proximoEstadoConcluido
      ? Array.from(new Set([...obrasConcluidas, obraId]))
      : obrasConcluidas.filter((id) => id !== obraId);

    localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify(novasObrasConcluidas),
    );

    setObrasConcluidas(novasObrasConcluidas);
    void sincronizarTabelaUsuario(
      "concluidas",
      "obra_id",
      obraId,
      proximoEstadoConcluido,
      "parcial",
    );
  }

  function renderizarItemDiarioPerfil(item: DiarioPerfilItem) {
    const itemHref = obterHrefItemDiarioPerfil(item);

    return (
      <Link key={item.chave} href={itemHref} style={diaryItemStyle}>
        <div style={criarCapaDestaquePerfilAutor(item.obra?.capa || "")}>
          <span style={diaryItemBadgeStyle}>
            {obterRotuloItemDiarioPerfil(item.tipo)}
          </span>
        </div>

        <div style={diaryItemTextBlockStyle}>
          <strong style={diaryItemTitleStyle}>{item.titulo}</strong>
          <span style={diaryItemDescriptionStyle}>{item.descricao}</span>
          <span style={diaryItemDateStyle}>{formatarDataDiarioPerfil(item.data)}</span>
        </div>
      </Link>
    );
  }

  function renderizarSecaoDiarioPerfil(
    titulo: string,
    descricao: string,
    itens: DiarioPerfilItem[],
    vazio: string,
  ) {
    return (
      <section style={diarySectionStyle}>
        <div style={diarySectionHeaderStyle}>
          <strong style={diarySectionTitleStyle}>{titulo}</strong>
          <span style={diarySectionDescriptionStyle}>{descricao}</span>
        </div>

        {itens.length === 0 ? (
          <div style={diaryEmptyStateStyle}>{vazio}</div>
        ) : (
          <div style={isDesktop ? desktopDiaryItemsGridStyle : diaryItemsGridStyle}>
            {itens.slice(0, 6).map((item) => renderizarItemDiarioPerfil(item))}
          </div>
        )}
      </section>
    );
  }

  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{historietasThemeCss}</style>

        {isDesktop && (
          <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
        )}
        {!isDesktop && (
          <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
        )}
        <section style={isDesktop ? desktopContainerStyle : containerStyle} />
      </main>
    );
  }

  if (autorNaoEncontrado) {
    return (
      <main style={pageThemeStyle}>
        <style>{historietasThemeCss}</style>

        {isDesktop && (
          <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
        )}
        {!isDesktop && (
          <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
        )}
        <section style={containerStyle}>
          <header style={topStyle}>
            <Link href="/" style={logoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
              <span
                className="historietas-home-logo-text"
                style={logoTextStyle}
              >
                istorietas
              </span>
            </Link>
          </header>

          <section style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Perfil não encontrado</h1>

            <p style={emptyTextStyle}>
              Não encontrei nenhum perfil para{" "}
              <strong style={safeTextStyle}>
                {autorSelecionado || autorIdSelecionado}
              </strong>
              .
            </p>

            <Link href="/explorar" style={emptyButtonStyle}>
              Ir para Explorar
            </Link>
          </section>
        </section>
      </main>
    );
  }

  if (!perfilParaMostrar) {
    return (
      <main style={pageThemeStyle}>
        <style>{historietasThemeCss}</style>

        {isDesktop && (
          <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
        )}
        {!isDesktop && (
          <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
        )}
        <section style={containerStyle}>
          <header style={topStyle}>
            <Link href="/" style={logoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
              <span
                className="historietas-home-logo-text"
                style={logoTextStyle}
              >
                istorietas
              </span>
            </Link>
          </header>

          <section style={emptyBoxStyle}>
            <h1 style={emptyTitleStyle}>Nenhum autor encontrado</h1>

            <p style={emptyTextStyle}>
              Publique uma obra primeiro. Depois o perfil do autor aparecerá
              aqui.
            </p>

            <Link href="/publicar" style={emptyButtonStyle}>
              Criar obra
            </Link>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{historietasThemeCss}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={containerAtualStyle}>
        <header style={profileHeaderStyle}>
          <Link href="/" style={profileHeaderLogoStyle} aria-label="Historietas">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-home-logo-text" style={logoTextStyle}>
              istorietas
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuPerfilAberto(true)}
            style={profileMenuButtonStyle}
            aria-label="Abrir menu do perfil"
            aria-expanded={menuPerfilAberto}
          >
            <span style={profileMenuIconStyle} aria-hidden="true">
              <span style={profileMenuIconLineStyle} />
              <span style={profileMenuIconLineStyle} />
              <span style={profileMenuIconLineStyle} />
            </span>
          </button>
        </header>

        {menuPerfilAberto && (
          <div
            style={menuOverlayStyle}
            role="presentation"
            onClick={() => setMenuPerfilAberto(false)}
          >
            <section
              style={menuSheetAtualStyle}
              role="dialog"
              aria-label="Menu do perfil"
              onClick={(event) => event.stopPropagation()}
            >
              <div style={menuHeaderStyle}>
                <div style={menuTitleBlockStyle}>
                  <strong style={menuTitleStyle}>
                    {perfilParaMostrar.nome}
                  </strong>
                  <span style={menuSubtitleStyle}>
                    {podeEditarPerfil
                      ? "Configurações e atividade"
                      : "Ações do perfil"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuPerfilAberto(false)}
                  style={menuCloseButtonStyle}
                  aria-label="Fechar menu"
                >
                  ×
                </button>
              </div>

              <div style={menuListStyle}>
                {podeEditarPerfil ? (
                  <>
                    <span style={menuSectionTitleStyle}>Recursos do autor</span>

                    <Link
                      href="/painel-autor"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>📊</span>
                      <strong style={menuItemTextStyle}>Painel do Autor</strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <Link
                      href="/publicar"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>✍</span>
                      <strong style={menuItemTextStyle}>
                        Publicar nova obra
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <div style={menuDividerStyle} />
                    <span style={menuSectionTitleStyle}>
                      Ferramentas pessoais
                    </span>

                    <Link
                      href="/minhas-obras"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>📚</span>
                      <strong style={menuItemTextStyle}>Minhas obras</strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <Link
                      href={comunidadeAutorHref}
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>💬</span>
                      <strong style={menuItemTextStyle}>
                        Comunidade do autor
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <Link
                      href="/notificacoes"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>🔔</span>
                      <strong style={menuItemTextStyle}>Notificações</strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <div style={menuDividerStyle} />
                    <span style={menuSectionTitleStyle}>Conta e sistema</span>

                    <Link
                      href="/configuracoes"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>⚙</span>
                      <strong style={menuItemTextStyle}>Configurações</strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => void copiarLinkPerfil()}
                      style={menuItemStyle}
                    >
                      <span style={menuItemIconStyle}>🔗</span>
                      <strong style={menuItemTextStyle}>
                        Copiar link do perfil
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void sairDaConta()}
                      style={menuDangerItemStyle}
                    >
                      <span style={menuItemIconStyle}>🚪</span>
                      <strong style={menuItemTextStyle}>Sair da conta</strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span style={menuSectionTitleStyle}>Perfil</span>

                    <button
                      type="button"
                      onClick={() => void copiarLinkPerfil()}
                      style={menuItemStyle}
                    >
                      <span style={menuItemIconStyle}>🔗</span>
                      <strong style={menuItemTextStyle}>
                        Copiar link do perfil
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <Link
                      href={comunidadeAutorHref}
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>💬</span>
                      <strong style={menuItemTextStyle}>
                        Comunidade do autor
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <div style={menuDividerStyle} />
                    <span style={menuSectionTitleStyle}>Descoberta</span>

                    <Link
                      href="/explorar"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>🔎</span>
                      <strong style={menuItemTextStyle}>
                        Explorar outras obras
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {mensagemAcao && <span style={actionMessageStyle}>{mensagemAcao}</span>}

        <section style={heroAtualStyle}>
          <div style={authorTopRowAtualStyle}>
            {podeEditarPerfil ? (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                style={avatarButtonAtualStyle}
                aria-label="Trocar imagem do autor"
              >
                {avatarAutor ? (
                  <img
                    src={avatarAutor}
                    alt={`Imagem de ${perfilParaMostrar.nome}`}
                    style={avatarImageStyle}
                  />
                ) : (
                  <span>{perfilParaMostrar.nome.charAt(0)}</span>
                )}
              </button>
            ) : (
              <div style={avatarDisplayAtualStyle}>
                {avatarAutor ? (
                  <img
                    src={avatarAutor}
                    alt={`Imagem de ${perfilParaMostrar.nome}`}
                    style={avatarImageStyle}
                  />
                ) : (
                  <span>{perfilParaMostrar.nome.charAt(0)}</span>
                )}
              </div>
            )}

            <div style={authorHeaderInfoStyle}>
              <div style={profileNameRowStyle}>
                <h1 className="historietas-theme-title" style={titleAtualStyle}>
                  {perfilParaMostrar.nome}
                </h1>
              </div>

              <div
                style={
                  autorPodeReceberAvaliacao
                    ? {
                        ...profileStatsAtualStyle,
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      }
                    : profileStatsAtualStyle
                }
              >
                <div style={profileStatItemStyle}>
                  <strong style={profileStatNumberStyle}>
                    {perfilParaMostrar.obras.length}
                  </strong>
                  <span style={profileStatLabelStyle}>obras</span>
                </div>

                <Link
                  href={seguidoresPerfilHref}
                  style={profileStatLinkStyle}
                  aria-label={`Abrir lista de seguidores de ${perfilParaMostrar.nome}`}
                >
                  <strong style={profileStatNumberStyle}>
                    {seguidoresTotal}
                  </strong>
                  <span style={profileStatLabelStyle}>seguidores</span>
                </Link>

                <Link
                  href={seguindoPerfilHref}
                  style={profileStatLinkStyle}
                  aria-label={`Abrir lista de perfis que ${perfilParaMostrar.nome} segue`}
                >
                  <strong style={profileStatNumberStyle}>
                    {seguindoTotalPerfil}
                  </strong>
                  <span style={profileStatLabelStyle}>seguindo</span>
                </Link>

                {autorPodeReceberAvaliacao && (
                  <div style={profileRatingStatItemStyle}>
                    <strong style={profileRatingNumberStyle}>
                      {formatarMediaAvaliacaoAutor(avaliacaoAutor.media)}
                    </strong>

                    <span
                      style={profileRatingMiniStarsStyle}
                      aria-label={`Média ${formatarMediaAvaliacaoAutor(
                        avaliacaoAutor.media,
                      )} de 5`}
                    >
                      {NOTAS_AVALIACAO_AUTOR.map((estrela) => (
                        <span
                          key={`media-autor-topo-${estrela}`}
                          style={profileRatingMiniStarVisualStyle}
                          aria-hidden="true"
                        >
                          <span style={profileRatingMiniStarBaseStyle}>★</span>
                          <span
                            style={{
                              ...profileRatingMiniStarFillStyle,
                              width: obterPreenchimentoEstrelaAutor(
                                estrela,
                                avaliacaoAutor.media,
                              ),
                            }}
                          >
                            ★
                          </span>
                        </span>
                      ))}
                    </span>

                    <span style={profileRatingTotalStyle}>
                      {formatarTotalAvaliacoesAutor(avaliacaoAutor.total)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={authorTextBlockStyle}>
            <span style={profileHandleStyle}>
              {autorHandlePerfil}
            </span>

            {bioAutorPersonalizada ? (
              <p style={descriptionAtualStyle}>{bioAutorPersonalizada}</p>
            ) : podeEditarPerfil ? (
              <button
                type="button"
                onClick={() => setEditorPerfilAberto(true)}
                style={profileAddBioButtonStyle}
              >
                + Adicionar biografia
              </button>
            ) : (
              <p style={descriptionAtualStyle}>{bioAutor}</p>
            )}
          </div>

          <div style={profileActionsAtualStyle}>
            {podeEditarPerfil ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditorPerfilAberto((aberto) => !aberto)}
                  style={profilePrimaryButtonStyle}
                >
                  {editorPerfilAberto ? "Fechar edição" : "Editar perfil"}
                </button>

                <button
                  type="button"
                  onClick={() => void copiarLinkPerfil()}
                  style={profileSecondaryButtonStyle}
                >
                  Compartilhar
                </button>

                <button
                  type="button"
                  onClick={alternarDestaquesPerfil}
                  style={
                    perfilSalvoAutor.mostrarDestaques
                      ? profileActiveButtonStyle
                      : profileSecondaryButtonStyle
                  }
                >
                  {perfilSalvoAutor.mostrarDestaques
                    ? "Ocultar destaques"
                    : "Mostrar destaques"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void alternarSeguirAutor()}
                  disabled={seguirUsuarioSalvando}
                  style={{
                    ...(seguindoPerfilAtual
                      ? profileActiveButtonStyle
                      : profilePrimaryButtonStyle),
                    opacity: seguirUsuarioSalvando ? 0.58 : 1,
                    cursor: seguirUsuarioSalvando ? "not-allowed" : "pointer",
                  }}
                >
                  {seguirUsuarioSalvando
                    ? "..."
                    : seguindoPerfilAtual
                      ? "Seguindo"
                      : "Seguir"}
                </button>

                <Link
                  href={comunidadeAutorHref}
                  style={profileSecondaryButtonStyle}
                >
                  Comunidade
                </Link>

                <button
                  type="button"
                  onClick={() => void copiarLinkPerfil()}
                  style={profileSecondaryButtonStyle}
                >
                  Compartilhar
                </button>
              </>
            )}
          </div>

          {podeEditarPerfil && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={selecionarAvatarAutor}
              style={hiddenInputStyle}
            />
          )}

          {podeEditarPerfil && editorPerfilAberto && (
            <>
              <label style={profileEditorFieldStyle}>
                <span style={profileEditorLabelStyle}>Nome de exibição</span>

                <input
                  value={nomePerfilEditor}
                  onChange={(event) => setNomePerfilEditor(event.target.value)}
                  onBlur={() => void salvarNomePerfilAutor(nomePerfilEditor)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="Seu nome no Historietas"
                  maxLength={80}
                  style={profileNameInputStyle}
                  type="text"
                />
              </label>

              <div style={avatarActionsAtualStyle}>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={avatarSmallButtonAtualStyle}
                >
                  {avatarAutor ? "Trocar imagem" : "Colocar imagem"}
                </button>

                {avatarAutor && (
                  <button
                    type="button"
                    onClick={removerAvatarAutor}
                    style={avatarRemoveButtonAtualStyle}
                  >
                    Remover
                  </button>
                )}
              </div>

              {avatarErro && <span style={avatarErrorStyle}>{avatarErro}</span>}

              <textarea
                value={perfilSalvoAutor.bio}
                onChange={(event) => atualizarBioAutor(event.target.value)}
                placeholder={bioPadraoAutor}
                maxLength={BIO_MAX_LENGTH}
                style={bioTextareaAtualStyle}
              />

              <span style={bioCounterStyle}>
                {caracteresRestantesBio} caracteres
              </span>
            </>
          )}
        </section>

        {autorPodeReceberAvaliacao && !podeEditarPerfil && (
          <section
            style={isDesktop ? desktopAuthorRatingBoxStyle : authorRatingBoxStyle}
            aria-label="Avaliação do autor"
          >
            <div style={authorRatingHeaderStyle}>
              <span style={authorRatingTitleStyle}>AVALIE ESTE AUTOR</span>
            </div>

            <div style={authorRatingStarsRowStyle}>
              {NOTAS_AVALIACAO_AUTOR.map((estrela) => {
                const preenchimentoEstrela = obterPreenchimentoEstrelaAutor(
                  estrela,
                  avaliacaoAutor.minhaNota,
                );
                const proximaNota = obterProximaNotaAvaliacaoAutor(
                  estrela,
                  avaliacaoAutor.minhaNota,
                );

                return (
                  <button
                    key={`avaliacao-autor-${estrela}`}
                    type="button"
                    onClick={() => void avaliarAutor(proximaNota)}
                    style={
                      preenchimentoEstrela === "0%"
                        ? authorRatingStarButtonStyle
                        : authorRatingStarActiveStyle
                    }
                    aria-label={`Avaliar autor com ${proximaNota
                      .toString()
                      .replace(".", ",")} estrela${proximaNota === 1 ? "" : "s"}`}
                  >
                    <span style={authorRatingStarVisualStyle} aria-hidden="true">
                      <span style={authorRatingStarBaseStyle}>★</span>
                      <span
                        style={{
                          ...authorRatingStarFillStyle,
                          width: preenchimentoEstrela,
                        }}
                      >
                        ★
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {perfilSalvoAutor.mostrarDestaques && obrasEmDestaque.length > 0 && (
          <section
            style={isDesktop ? desktopAuthorHighlightsStyle : authorHighlightsStyle}
            aria-label="Obras em destaque"
          >
            <div style={authorHighlightsHeaderStyle}>
              <strong style={authorHighlightsTitleStyle}>Obras em destaque</strong>
              <span style={authorHighlightsSubtitleStyle}>
                {obrasEmDestaque.length === 1
                  ? "1 obra selecionada"
                  : `${obrasEmDestaque.length} obras selecionadas`}
              </span>
            </div>

            <div style={isDesktop ? desktopAuthorHighlightsListStyle : authorHighlightsListStyle}>
              {obrasEmDestaque.map((obra) => {
                const obraHref =
                  obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                const totalCurtidasObra = obra.capitulos.filter(
                  (capitulo) => capitulo.curtiu,
                ).length;

                return (
                  <Link
                    key={`destaque-${obra.id}`}
                    href={obraHref}
                    style={authorHighlightItemStyle}
                  >
                    <div style={criarCapaDestaquePerfilAutor(obra.capa)}>
                      <span
                        style={
                          obra.publicado
                            ? authorHighlightStatusPublishedStyle
                            : authorHighlightStatusDraftStyle
                        }
                      >
                        {obra.publicado ? "Publicado" : "Rascunho"}
                      </span>
                    </div>

                    <strong style={authorHighlightNameStyle}>{obra.titulo}</strong>

                    <span style={authorHighlightMetaStyle}>
                      {formatarGeneroPerfilAutor(obra.genero)} • {obra.capitulos.length}{" "}
                      {obra.capitulos.length === 1 ? "cap." : "caps."} • ♥ {totalCurtidasObra}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div
          role="tablist"
          style={profileTabsStyle}
          aria-label="Seções do perfil"
        >
          <button
            type="button"
            onClick={() => setAbaPerfil("obras")}
            style={
              abaPerfil === "obras" ? profileTabActiveStyle : profileTabStyle
            }
          >
            Obras {perfilParaMostrar.obras.length}
          </button>

          <button
            type="button"
            onClick={() => setAbaPerfil("diario")}
            style={
              abaPerfil === "diario" ? profileTabActiveStyle : profileTabStyle
            }
          >
            Diário
          </button>

          <button
            type="button"
            onClick={() => setAbaPerfil("comunidade")}
            style={
              abaPerfil === "comunidade"
                ? profileTabActiveStyle
                : profileTabStyle
            }
          >
            Comunidade 0
          </button>

          <button
            type="button"
            onClick={() => setAbaPerfil("sobre")}
            style={
              abaPerfil === "sobre" ? profileTabActiveStyle : profileTabStyle
            }
          >
            Sobre
          </button>
        </div>

        {abaPerfil === "diario" && (
          <section style={isDesktop ? desktopDiaryBoxStyle : diaryBoxStyle}>
            <div style={authorCommunityIntroStyle}>
              <span style={authorCommunityEyebrowStyle}>Diário de leitura</span>

              <h2 style={authorCommunityTitleStyle}>
                {podeEditarPerfil ? "Meu Diário" : `Diário de ${perfilParaMostrar.nome}`}
              </h2>

              <p style={authorCommunityDescriptionStyle}>
                {descricaoPrivacidadeDiario}
              </p>

              <div style={diaryPrivacyNoticeStyle}>
                {resumoPrivacidadeDiario}
              </div>
            </div>

            <div style={isDesktop ? desktopDiaryStatsGridStyle : diaryStatsGridStyle}>
              <div style={diaryStatCardStyle}>
                <strong style={diaryStatNumberStyle}>{totalLeiturasDiario}</strong>
                <span style={diaryStatLabelStyle}>leituras</span>
              </div>

              <div style={diaryStatCardStyle}>
                <strong style={diaryStatNumberStyle}>{totalFavoritasDiario}</strong>
                <span style={diaryStatLabelStyle}>favoritas</span>
              </div>

              <div style={diaryStatCardStyle}>
                <strong style={diaryStatNumberStyle}>{totalAvaliacoesDiario + totalReviewsDiario}</strong>
                <span style={diaryStatLabelStyle}>avaliações/reviews</span>
              </div>
            </div>

            {diarioPerfil.carregando ? (
              <div style={diaryEmptyStateStyle}>Carregando Diário...</div>
            ) : (
              <>
                {renderizarSecaoDiarioPerfil(
                  "Lendo agora",
                  "Obras com progresso recente.",
                  diarioPerfil.lendoAgora,
                  podeEditarPerfil
                    ? "Suas leituras recentes aparecerão aqui."
                    : "Este perfil ainda não compartilhou leituras recentes.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Favoritas",
                  "Obras que representam o gosto do perfil.",
                  diarioPerfil.favoritas,
                  podeEditarPerfil
                    ? "Favorite obras para montar sua vitrine de leitura."
                    : "Este perfil ainda não compartilhou favoritas.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Concluídas",
                  "Histórias marcadas como finalizadas.",
                  diarioPerfil.concluidas,
                  podeEditarPerfil
                    ? "Obras concluídas aparecerão nesta área."
                    : "Este perfil ainda não compartilhou obras concluídas.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Avaliações recentes",
                  "Notas públicas dadas para obras.",
                  diarioPerfil.avaliacoes,
                  podeEditarPerfil
                    ? "Suas avaliações públicas aparecerão aqui."
                    : "Este perfil ainda não possui avaliações públicas.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Reviews recentes",
                  "Opiniões publicadas na Comunidade.",
                  diarioPerfil.reviews,
                  podeEditarPerfil
                    ? "Suas reviews publicadas na Comunidade aparecerão aqui."
                    : "Este perfil ainda não publicou reviews.",
                )}

                {diarioPerfil.atividades.length > 0 && (
                  <section style={diaryTimelineStyle}>
                    <div style={diarySectionHeaderStyle}>
                      <strong style={diarySectionTitleStyle}>Atividade recente</strong>
                      <span style={diarySectionDescriptionStyle}>
                        Linha do tempo do Diário.
                      </span>
                    </div>

                    <div style={diaryTimelineListStyle}>
                      {diarioPerfil.atividades.slice(0, 8).map((item) => (
                        <Link
                          key={`timeline-${item.chave}`}
                          href={obterHrefItemDiarioPerfil(item)}
                          style={diaryTimelineItemStyle}
                        >
                          <span style={diaryTimelineDotStyle} aria-hidden="true" />
                          <span style={diaryTimelineTextStyle}>
                            <strong>{item.titulo}</strong>
                            {" — "}
                            {item.descricao}
                          </span>
                          <span style={diaryTimelineDateStyle}>
                            {formatarDataDiarioPerfil(item.data)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </section>
        )}

        {abaPerfil === "comunidade" && (
          <section
            style={
              isDesktop
                ? desktopAuthorCommunityBoxStyle
                : authorCommunityBoxStyle
            }
          >
            <div style={authorCommunityIntroStyle}>
              <span style={authorCommunityEyebrowStyle}>Comunidade do autor</span>

              <h2 style={authorCommunityTitleStyle}>
                Comunidade de {perfilParaMostrar.nome}
              </h2>

              <p style={authorCommunityDescriptionStyle}>
                Acompanhe posts, teorias, reviews e discussões sobre as obras deste autor.
              </p>
            </div>

            <div
              style={
                isDesktop
                  ? desktopAuthorCommunityGridStyle
                  : authorCommunityGridStyle
              }
            >
              <Link href={comunidadeAutorHref} style={authorCommunityCardStyle}>
                <strong style={authorCommunityCardNumberStyle}>0</strong>
                <span style={authorCommunityCardTitleStyle}>PUBLICAÇÕES</span>
                <span style={authorCommunityCardTextStyle}>posts do perfil</span>
              </Link>

              <Link
                href={comunidadeAutorTeoriasHref}
                style={authorCommunityCardStyle}
              >
                <strong style={authorCommunityCardNumberStyle}>0</strong>
                <span style={authorCommunityCardTitleStyle}>TEORIAS</span>
                <span style={authorCommunityCardTextStyle}>discussões</span>
              </Link>

              <Link
                href={comunidadeAutorReviewsHref}
                style={authorCommunityCardStyle}
              >
                <strong style={authorCommunityCardNumberStyle}>0</strong>
                <span style={authorCommunityCardTitleStyle}>REVIEWS</span>
                <span style={authorCommunityCardTextStyle}>opiniões</span>
              </Link>
            </div>

            <div style={authorCommunityPreviewStyle}>
              <span style={authorCommunityPreviewIconStyle}>💬</span>

              <div style={authorCommunityPreviewTextBlockStyle}>
                <strong style={authorCommunityPreviewTitleStyle}>
                  {podeEditarPerfil
                    ? "Sua comunidade ainda está vazia"
                    : "Nenhuma publicação por aqui ainda"}
                </strong>

                <p style={authorCommunityPreviewTextStyle}>
                  {podeEditarPerfil
                    ? "Publique avisos, bastidores, teorias e chamadas para aproximar leitores das suas obras."
                    : `Quando ${perfilParaMostrar.nome} publicar posts, teorias ou reviews, eles aparecerão nesta área.`}
                </p>
              </div>
            </div>

            <div
              style={
                isDesktop
                  ? desktopAuthorCommunityActionsStyle
                  : authorCommunityActionsStyle
              }
            >
              <Link href={comunidadeAutorHref} style={authorCommunityPrimaryActionStyle}>
                {podeEditarPerfil ? "Publicar na comunidade" : "Entrar na comunidade"}
              </Link>

              <Link
                href={comunidadeAutorTeoriasHref}
                style={authorCommunitySecondaryActionStyle}
              >
                Ver teorias
              </Link>

              <Link
                href={comunidadeAutorReviewsHref}
                style={authorCommunitySecondaryActionStyle}
              >
                Ver reviews
              </Link>
            </div>
          </section>
        )}

        {abaPerfil === "sobre" && (
          <section style={profileAboutBoxStyle}>
            <div style={profileAboutHeroStyle}>
              <h2 style={profileAboutTitleStyle}>
                Sobre {perfilParaMostrar.nome}
              </h2>

              <div style={profileAboutTextRowStyle}>
                <p style={profileAboutTextStyle}>{bioSobreAutor}</p>

                {podeEditarPerfil && (
                  <button
                    type="button"
                    onClick={() => setEditorSobreAberto((aberto) => !aberto)}
                    style={profileAboutEditButtonStyle}
                    aria-label="Editar sinopse do Sobre"
                  >
                    ✎
                  </button>
                )}
              </div>

              {podeEditarPerfil && editorSobreAberto && (
                <div style={profileAboutEditorStyle}>
                  <textarea
                    value={perfilSalvoAutor.sobreBio}
                    onChange={(event) => atualizarBioSobreAutor(event.target.value)}
                    placeholder={bioAutor}
                    maxLength={SOBRE_BIO_MAX_LENGTH}
                    style={profileAboutTextareaStyle}
                  />

                  <span style={profileAboutCounterStyle}>
                    {caracteresRestantesBioSobre} caracteres
                  </span>
                </div>
              )}
            </div>

            <div style={profileAboutContentGridStyle}>
              <section style={profileAboutPanelStyle}>
                <strong style={profileAboutPanelTitleStyle}>Especialidades</strong>

                <div style={profileAboutChipsStyle}>
                  {(generosPrincipaisPerfil.length > 0
                    ? generosPrincipaisPerfil
                    : ["Histórias variadas"]
                  ).map((genero) => (
                    <span key={`sobre-genero-${genero}`} style={profileAboutChipStyle}>
                      {genero}
                    </span>
                  ))}
                </div>
              </section>

              <section style={profileAboutPanelStyle}>
                <strong style={profileAboutPanelTitleStyle}>Números do perfil</strong>

                <div style={profileAboutMetricsGridStyle}>
                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {formatarNumeroCompactoPerfilAutor(perfilParaMostrar.totalPublicadas)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>publicadas</span>
                  </div>

                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {formatarNumeroCompactoPerfilAutor(perfilParaMostrar.totalCapitulos)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>capítulos</span>
                  </div>

                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {formatarNumeroCompactoPerfilAutor(perfilParaMostrar.totalCurtidas)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>curtidas</span>
                  </div>

                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {formatarNumeroCompactoPerfilAutor(totalVisualizacoesPerfil)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>visualizações</span>
                  </div>
                </div>
              </section>

              <section style={profileAboutPanelStyle}>
                <strong style={profileAboutPanelTitleStyle}>Atividade</strong>

                <div style={profileAboutRowsStyle}>
                  <span style={profileAboutRowStyle}>
                    obras no perfil
                    <strong>{perfilParaMostrar.obras.length}</strong>
                  </span>
                  <span style={profileAboutRowStyle}>
                    rascunhos em desenvolvimento
                    <strong>{totalRascunhosPerfil}</strong>
                  </span>
                  <span style={profileAboutRowStyle}>
                    comentários recebidos
                    <strong>{perfilParaMostrar.totalComentarios}</strong>
                  </span>
                  <span style={profileAboutRowStyle}>
                    concluídas por leitores
                    <strong>{obrasConcluidasPerfil}</strong>
                  </span>
                  {totalObrasSemCapitulosPerfil > 0 && (
                    <span style={profileAboutRowStyle}>
                      sem capítulos ainda
                      <strong>{totalObrasSemCapitulosPerfil}</strong>
                    </span>
                  )}
                </div>
              </section>
            </div>
          </section>
        )}

        {abaPerfil === "obras" && (
          <section style={profileWorksSectionStyle}>
            <div style={profileWorksToolbarStyle}>
              <p style={profileWorksSummaryStyle}>
                {obrasDoPerfilFiltradas.length} de{" "}
                {perfilParaMostrar.obras.length}{" "}
                {perfilParaMostrar.obras.length === 1 ? "obra" : "obras"} •{" "}
                {obrasFavoritasPerfil} na lista • {obrasConcluidasPerfil}{" "}
                concluídas
              </p>

              <button
                type="button"
                onClick={() => setFiltrosObrasAbertos((aberto) => !aberto)}
                style={profileWorksFilterButtonStyle}
              >
                {filtrosObrasAtivos ? "Filtros ativos" : "Filtros"}
                <span style={filtersToggleIconStyle}>
                  {filtrosObrasAbertos ? "−" : "+"}
                </span>
              </button>
            </div>

            {filtrosObrasAbertos && (
              <section style={filterBoxAtualStyle}>
                <input
                  value={buscaObras}
                  onChange={(event) => setBuscaObras(event.target.value)}
                  placeholder="Buscar obra..."
                  style={filterInputStyle}
                  type="text"
                />

                <div style={filterGridAtualStyle}>
                  <select
                    value={filtroObras}
                    onChange={(event) =>
                      setFiltroObras(event.target.value as FiltroObrasAutor)
                    }
                    style={filterSelectStyle}
                  >
                    <option value="todas">Todas</option>
                    <option value="publicadas">Publicadas</option>
                    <option value="rascunhos">Rascunhos</option>
                    <option value="sem-capitulos">Sem capítulos</option>
                  </select>

                  <select
                    value={ordenacaoObras}
                    onChange={(event) =>
                      setOrdenacaoObras(
                        event.target.value as OrdenacaoObrasAutor,
                      )
                    }
                    style={filterSelectStyle}
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="titulo">Título</option>
                    <option value="capitulos">Mais capítulos</option>
                    <option value="curtidas">Mais curtidas</option>
                  </select>
                </div>

                {filtrosObrasAtivos && (
                  <button
                    type="button"
                    onClick={limparFiltrosObras}
                    style={clearFilterButtonAtualStyle}
                  >
                    Limpar filtros
                  </button>
                )}
              </section>
            )}

            {obrasDoPerfilFiltradas.length === 0 ? (
              <div style={emptyMiniBoxStyle}>
                {perfilParaMostrar.obras.length === 0
                  ? podeEditarPerfil
                    ? "Você ainda não publicou obras. Seu perfil continua ativo como leitor, com Diário e Comunidade."
                    : "Este perfil ainda não publicou obras. O Diário e a Comunidade continuam disponíveis."
                  : "Nenhuma obra encontrada com esses filtros."}
              </div>
            ) : (
              <div
                style={
                  isDesktop
                    ? desktopProfileWorksGridStyle
                    : profileWorksGridStyle
                }
              >
                {obrasDoPerfilFiltradas.map((obra) => {
                  const obraHref =
                    obra.link ||
                    `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                  const ultimoCapitulo =
                    encontrarCapituloParaContinuar(obra) ||
                    obra.capitulos[obra.capitulos.length - 1] ||
                    null;
                  const numeroUltimoCapitulo = ultimoCapitulo
                    ? obra.capitulos.findIndex(
                        (capitulo) => capitulo.id === ultimoCapitulo.id,
                      ) + 1
                    : 0;
                  const capituloHref = ultimoCapitulo
                    ? criarHrefLeituraCapituloPerfilAutor(
                        obra,
                        ultimoCapitulo,
                        numeroUltimoCapitulo || 1,
                      )
                    : "";
                  const obraFavorita = obrasFavoritas.includes(obra.id);
                  const obraConcluida = obrasConcluidas.includes(obra.id);
                  const totalCurtidas = obra.capitulos.filter(
                    (capitulo) => capitulo.curtiu,
                  ).length;
                  const visualizacoesObra = formatarNumeroCompactoPerfilAutor(
                    obra.visualizacoes,
                  );
                  const menuObraAberto = obraMenuAbertoId === obra.id;

                  return (
                    <article key={obra.id} style={profileWorkCardStyle}>
                      <Link href={obraHref} style={profileWorkCoverLinkStyle}>
                        <div
                          style={criarCapaGridPerfilAutor(obra.capa, isDesktop)}
                        >
                          <div style={profileWorkTopBadgesStyle}>
                            <span
                              style={
                                obra.publicado
                                  ? profileWorkPublishedBadgeStyle
                                  : profileWorkDraftBadgeStyle
                              }
                            >
                              {obra.publicado ? "Publicado" : "Rascunho"}
                            </span>

                            {mostrarClassificacao(obra) && (
                              <span style={profileWorkClassificationBadgeStyle}>
                                {obra.classificacaoIndicativa}
                              </span>
                            )}
                          </div>

                          <div style={profileWorkCoverOverlayStyle}>
                            <strong style={profileWorkCoverTitleStyle}>
                              {obra.titulo}
                            </strong>

                            <span style={profileWorkCoverMetaStyle}>
                              {formatarGeneroPerfilAutor(obra.genero)} •{" "}
                              {obra.capitulos.length}{" "}
                              {obra.capitulos.length === 1 ? "cap." : "caps."} •
                              <span style={profileWorkHeartMetaStyle}>
                                {" "}
                                ♥ {totalCurtidas}
                              </span>
                              <span style={profileWorkViewsMetaStyle}>
                                {" "}
                                👁 {visualizacoesObra}
                              </span>
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div style={profileWorkMenuAnchorStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            setObraMenuAbertoId((idAtual) =>
                              idAtual === obra.id ? "" : obra.id,
                            )
                          }
                          style={profileWorkDotsButtonStyle}
                          aria-label={`Abrir opções de ${obra.titulo}`}
                          aria-expanded={menuObraAberto}
                        >
                          ⋮
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {obraMenuAberta &&
          (() => {
            const obra = obraMenuAberta;
            const ultimoCapitulo =
              encontrarCapituloParaContinuar(obra) ||
              obra.capitulos[obra.capitulos.length - 1] ||
              null;
            const numeroUltimoCapitulo = ultimoCapitulo
              ? obra.capitulos.findIndex(
                  (capitulo) => capitulo.id === ultimoCapitulo.id,
                ) + 1
              : 0;
            const capituloHref = ultimoCapitulo
              ? criarHrefLeituraCapituloPerfilAutor(
                  obra,
                  ultimoCapitulo,
                  numeroUltimoCapitulo || 1,
                )
              : "";
            const obraFavorita = obrasFavoritas.includes(obra.id);
            const obraConcluida = obrasConcluidas.includes(obra.id);
            const totalCurtidas = obra.capitulos.filter(
              (capitulo) => capitulo.curtiu,
            ).length;
            const visualizacoesObra = formatarNumeroCompactoPerfilAutor(
              obra.visualizacoes,
            );

            return (
              <div
                style={workActionSheetOverlayStyle}
                role="presentation"
                onClick={() => setObraMenuAbertoId("")}
              >
                <section
                  style={workActionSheetStyle}
                  role="dialog"
                  aria-label={`Ações da obra ${obra.titulo}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div style={workActionSheetHandleStyle} aria-hidden="true" />

                  <div style={workActionSheetHeaderStyle}>
                    <div style={workActionSheetTextBlockStyle}>
                      <strong style={workActionSheetTitleStyle}>
                        {obra.titulo}
                      </strong>
                      <span style={workActionSheetMetaStyle}>
                        {formatarGeneroPerfilAutor(obra.genero)} •{" "}
                        {obra.capitulos.length}{" "}
                        {obra.capitulos.length === 1 ? "cap." : "caps."} • ♥{" "}
                        {totalCurtidas} 👁 {visualizacoesObra}
                      </span>
                    </div>
                  </div>

                  <div style={workActionSheetActionsStyle}>
                    {ultimoCapitulo && (
                      <Link
                        href={capituloHref}
                        onClick={() => setObraMenuAbertoId("")}
                        style={workActionSheetItemStyle}
                      >
                        Ler
                      </Link>
                    )}

                    {podeEditarPerfil ? (
                      <>
                        <Link
                          href="/minhas-obras"
                          onClick={() => setObraMenuAbertoId("")}
                          style={workActionSheetItemStyle}
                        >
                          Editar obra
                        </Link>

                        <Link
                          href="/publicar"
                          onClick={() => setObraMenuAbertoId("")}
                          style={workActionSheetItemStyle}
                        >
                          Adicionar capítulo
                        </Link>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setObraMenuAbertoId("");
                            void alternarFavoritoObra(obra.id);
                          }}
                          style={
                            obraFavorita
                              ? workActionSheetItemActiveStyle
                              : workActionSheetItemStyle
                          }
                        >
                          {obraFavorita
                            ? "Remover da lista"
                            : "Adicionar à lista"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setObraMenuAbertoId("");
                            void alternarConcluidoObra(obra.id);
                          }}
                          style={
                            obraConcluida
                              ? workActionSheetItemActiveStyle
                              : workActionSheetItemStyle
                          }
                        >
                          {obraConcluida
                            ? "Marcar como não concluída"
                            : "Concluir"}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => void compartilharObraPerfilAutor(obra)}
                      style={workActionSheetItemStyle}
                    >
                      Compartilhar
                    </button>
                  </div>
                </section>
              </div>
            );
          })()}
      </section>
    </main>
  );
}

const workActionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9998,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.62) 100%)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "0 14px calc(96px + env(safe-area-inset-bottom, 0px))",
  boxSizing: "border-box",
};

const workActionSheetStyle: CSSProperties = {
  width: "min(500px, 100%)",
  borderRadius: "24px 24px 22px 22px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  boxShadow: "none",
  padding: "8px 14px 12px",
  display: "grid",
  gap: "9px",
  boxSizing: "border-box",
};

const workActionSheetHandleStyle: CSSProperties = {
  width: "40px",
  height: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.24)",
  justifySelf: "center",
};

const workActionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "start",
  gap: "11px",
  minWidth: 0,
};

const workActionSheetTextBlockStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const workActionSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  fontWeight: 950,
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const workActionSheetMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, rgba(255,255,255,0.68))",
  fontSize: "10.5px",
  fontWeight: 850,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const workActionSheetCloseButtonStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  fontWeight: 950,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

const workActionSheetActionsStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: "17px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  overflow: "hidden",
};

const workActionSheetItemStyle: CSSProperties = {
  appearance: "none",
  width: "100%",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.075)",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  padding: "11px 14px",
  fontSize: "14px",
  fontWeight: 900,
  lineHeight: 1.15,
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

const workActionSheetItemActiveStyle: CSSProperties = {
  ...workActionSheetItemStyle,
  borderBottom: "1px solid rgba(249,115,22,0.16)",
  background: "rgba(249,115,22,0.10)",
  color: "var(--historietas-accent, #F97316)",
};

const workActionSheetCancelButtonStyle: CSSProperties = {
  ...workActionSheetItemStyle,
  textAlign: "center",
  justifyContent: "center",
  background: "transparent",
  color: "var(--historietas-text-muted, rgba(255,255,255,0.58))",
};

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
    "var(--historietas-bg-start, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "16px",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 96px))",
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
  flex: "0 0 auto",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

const profileHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 36px",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
  minWidth: 0,
};

const profileHeaderLogoStyle: CSSProperties = {
  ...logoStyle,
};

const profileHeaderCenterStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "1px",
  minWidth: 0,
  textAlign: "center",
};

const profileHeaderHandleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const profileHeaderModeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.6px",
  lineHeight: 1.1,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const profileMenuButtonStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: 0,
};

const profileMenuIconStyle: CSSProperties = {
  width: "22px",
  display: "grid",
  gap: "4px",
};

const profileMenuIconLineStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "2.5px",
  borderRadius: "999px",
  background: "currentColor",
};

const menuOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(0,0,0,0.58)",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-end",
  padding: 0,
  boxSizing: "border-box",
};

const menuSheetStyle: CSSProperties = {
  width: "min(360px, calc(100vw - 72px))",
  height: "100dvh",
  maxHeight: "100dvh",
  borderRadius: 0,
  border: "0",
  borderLeft:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "#04000A",
  padding: "22px 16px calc(132px + env(safe-area-inset-bottom, 0px))",
  display: "grid",
  alignContent: "start",
  gap: "18px",
  boxSizing: "border-box",
  overflowY: "auto",
  overscrollBehavior: "contain",
};

const desktopMenuSheetStyle: CSSProperties = {
  ...menuSheetStyle,
  width: "360px",
  maxWidth: "calc(100vw - 80px)",
};

const menuHandleStyle: CSSProperties = {
  width: "42px",
  height: "4px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.20))",
  margin: "0 auto 4px",
};

const menuHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "2px 0 4px",
  minWidth: 0,
};

const menuTitleBlockStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const menuTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  lineHeight: 1.2,
  ...safeTextStyle,
};

const menuSubtitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  lineHeight: 1.25,
  ...safeTextStyle,
};

const menuCloseButtonStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "0",
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
};

const menuListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  paddingBottom: "24px",
};

const menuSectionTitleStyle: CSSProperties = {
  marginTop: "8px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.2,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  ...safeTextStyle,
};

const menuDividerStyle: CSSProperties = {
  height: "1px",
  background: "rgba(255,255,255,0.06)",
  margin: "8px 0 4px",
};

const menuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "0",
  border: "0",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 16px",
  alignItems: "center",
  gap: "10px",
  padding: "0",
  boxSizing: "border-box",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
};

const menuDangerItemStyle: CSSProperties = {
  ...menuItemStyle,
  color: "#FCA5A5",
};

const menuItemIconStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "10px",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

const menuItemTextStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 900,
  lineHeight: 1.2,
  ...safeTextStyle,
};

const menuChevronStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 700,
  textAlign: "right",
};

const menuCancelButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
};

const headerFollowButtonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "0 14px",
  borderRadius: "999px",
  border:
    "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "none",
  flex: "0 0 auto",
  ...safeTextStyle,
};

const headerFollowingButtonStyle: CSSProperties = {
  ...headerFollowButtonStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const heroBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "4px 2px 8px",
  borderRadius: "0",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const authorTopRowStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "76px minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "stretch",
  gap: "14px",
  minHeight: "76px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const authorHeaderInfoStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto",
  alignContent: "center",
  gap: "6px",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const authorTextBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  gap: "2px",
  alignContent: "center",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  textAlign: "left",
};

const avatarBaseStyle: CSSProperties = {
  position: "relative",
  left: "auto",
  top: "auto",
  transform: "none",
  width: "76px",
  maxWidth: "76px",
  height: "76px",
  borderRadius: "20px",
  border: "none",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
  overflow: "hidden",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const avatarButtonStyle: CSSProperties = {
  ...avatarBaseStyle,
  cursor: "pointer",
};

const avatarDisplayStyle: CSSProperties = {
  ...avatarBaseStyle,
  cursor: "default",
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const profileEditorFieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const profileEditorLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  ...safeTextStyle,
};

const profileNameInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #04000A)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const avatarActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const avatarSmallButtonStyle: CSSProperties = {
  flex: "1 1 118px",
  minHeight: "28px",
  maxWidth: "100%",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const avatarRemoveButtonStyle: CSSProperties = {
  ...avatarSmallButtonStyle,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.12)",
  color: "#FCA5A5",
};

const avatarErrorStyle: CSSProperties = {
  color: "#FCA5A5",
  fontSize: "10px",
  fontWeight: 800,
  ...safeTextStyle,
};

const actionMessageStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "rgba(249,115,22,0.10)",
  border: "1px solid rgba(249,115,22,0.22)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const bioTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "64px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #04000A)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "10px 11px",
  outline: "none",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const bioCounterStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "right",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(20px, 5.2vw, 27px)",
  lineHeight: 1.18,
  fontWeight: 950,
  letterSpacing: "-0.025em",
  maxWidth: "100%",
  minWidth: 0,
  paddingRight: "6px",
  paddingBottom: 0,
  overflow: "visible",
  textAlign: "left",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  WebkitTextFillColor: "#FFFFFF",
  color: "#FFFFFF",
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.4,
  fontWeight: 650,
  width: "min(520px, 100%)",
  maxWidth: "520px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "left",
  ...safeTextStyle,
};

const profileNameRowStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const profileHandleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.25,
  fontWeight: 850,
  maxWidth: "100%",
  ...safeTextStyle,
};

const profileAddBioButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "28px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "none",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  ...safeTextStyle,
};

const profileStatsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0",
  marginTop: 0,
  minWidth: 0,
  borderTop: "0",
  borderBottom: "0",
};

const desktopProfileStatsStyle: CSSProperties = {
  ...profileStatsStyle,
  width: "100%",
  margin: 0,
};

const profileStatItemStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: 0,
  background: "transparent",
  border: "0",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "3px",
  padding: "4px 2px",
  boxSizing: "border-box",
  minWidth: 0,
};

const profileStatLinkStyle: CSSProperties = {
  ...profileStatItemStyle,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};

const profileStatNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const profileStatLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.8px",
  lineHeight: 1.1,
  fontWeight: 850,
  textTransform: "none",
  letterSpacing: "0",
  textAlign: "center",
  ...safeTextStyle,
};

const profileRatingStatItemStyle: CSSProperties = {
  ...profileStatItemStyle,
  gap: "2px",
};

const profileRatingNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "16px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const profileRatingMiniStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "#FBBF24",
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const profileRatingMiniStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

const profileRatingMiniStarBaseStyle: CSSProperties = {
  color: "rgba(251, 191, 36, 0.34)",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const profileRatingMiniStarFillStyle: CSSProperties = {
  color: "#FBBF24",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const profileRatingTotalStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  lineHeight: 1.05,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const authorRatingBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

const desktopAuthorRatingBoxStyle: CSSProperties = {
  ...authorRatingBoxStyle,
  width: "min(420px, 100%)",
  margin: "12px auto 0",
};

const authorRatingHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "3px",
  minWidth: 0,
  textAlign: "center",
};

const authorRatingTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.075em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const authorRatingMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.8px",
  lineHeight: 1.1,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const authorRatingStarsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(251, 191, 36, 0.34)",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const authorRatingStarActiveStyle: CSSProperties = {
  ...authorRatingStarButtonStyle,
  border: "1px solid rgba(251, 191, 36, 0.38)",
  background: "rgba(251, 191, 36, 0.12)",
  color: "#FBBF24",
};

const authorRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

const authorRatingStarBaseStyle: CSSProperties = {
  color: "rgba(251, 191, 36, 0.34)",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const authorRatingStarFillStyle: CSSProperties = {
  color: "#FBBF24",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const profileActionsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
  marginTop: "1px",
  minWidth: 0,
};

const desktopProfileActionsStyle: CSSProperties = {
  ...profileActionsStyle,
  width: "min(640px, 100%)",
  margin: "4px auto 0",
  gap: "10px",
};

const profilePrimaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxSizing: "border-box",
  minWidth: 0,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const profileSecondaryButtonStyle: CSSProperties = {
  ...profilePrimaryButtonStyle,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const profileActiveButtonStyle: CSSProperties = {
  ...profileSecondaryButtonStyle,
  border:
    "1px solid rgba(255,255,255,0.10)",
  background:
    "rgba(255,255,255,0.06)",
  color: "var(--historietas-accent, #FDBA74)",
};

const authorHighlightsStyle: CSSProperties = {
  width: "100%",
  marginTop: "8px",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopAuthorHighlightsStyle: CSSProperties = {
  ...authorHighlightsStyle,
  marginTop: "10px",
};

const authorHighlightsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const authorHighlightsTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "12px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const authorHighlightsSubtitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.1,
  fontWeight: 850,
  textAlign: "right",
  ...safeTextStyle,
};

const authorHighlightsListStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  paddingBottom: "2px",
  boxSizing: "border-box",
};

const desktopAuthorHighlightsListStyle: CSSProperties = {
  ...authorHighlightsListStyle,
  gap: "14px",
};

const authorHighlightItemStyle: CSSProperties = {
  width: "70px",
  minWidth: "70px",
  maxWidth: "70px",
  flex: "0 0 70px",
  display: "grid",
  justifyItems: "stretch",
  gap: "5px",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
};

const authorHighlightCoverStyle: CSSProperties = {
  width: "70px",
  height: "99px",
  minHeight: "0",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "#08030F",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  boxShadow: "none",
  boxSizing: "border-box",
};

const authorHighlightStatusPublishedStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "7px",
  transform: "translateX(-50%)",
  maxWidth: "calc(100% - 12px)",
  padding: "3px 6px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(8,5,13,0.52)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "6.4px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
  textShadow: "none",
};

const authorHighlightStatusDraftStyle: CSSProperties = {
  ...authorHighlightStatusPublishedStyle,
};

const authorHighlightNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8.4px",
  lineHeight: 1.08,
  fontWeight: 950,
  textAlign: "left",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorHighlightMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7px",
  lineHeight: 1.1,
  fontWeight: 850,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const profileTabsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  alignItems: "end",
  gap: 0,
  margin: "8px 0 0",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  background: "none",
  backgroundColor: "transparent",
  backgroundImage: "none",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  outline: "none",
  overflow: "visible",
};

const profileTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "34px",
  border: "none",
  borderBottom: "2px solid transparent",
  borderRadius: 0,
  background: "none",
  backgroundColor: "transparent",
  backgroundImage: "none",
  boxShadow: "none",
  outline: "none",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  padding: "0 6px",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const profileTabActiveStyle: CSSProperties = {
  ...profileTabStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
  borderBottom: "2px solid currentColor",
};

const profileAboutBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: "8px 2px",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const profileAboutTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

const profileAboutTextStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  textAlign: "center",
  ...safeTextStyle,
};

const profileAboutTextRowStyle: CSSProperties = {
  width: "min(560px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  alignItems: "start",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  position: "relative",
};

const profileAboutEditButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  position: "absolute",
  top: "-2px",
  right: 0,
};

const profileAboutEditorStyle: CSSProperties = {
  width: "min(560px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const profileAboutTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "104px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-input-bg, #04000A)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "10px 11px",
  outline: "none",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const profileAboutCounterStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "right",
  ...safeTextStyle,
};

const profileAboutStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 900,
  ...safeTextStyle,
};


const profileAboutHeroStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  justifyItems: "center",
  minWidth: 0,
};

const profileAboutEyebrowStyle: CSSProperties = {
  color: "var(--historietas-text-accent, #FDBA74)",
  fontSize: "9.5px",
  lineHeight: 1.2,
  fontWeight: 950,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
};

const profileAboutContentGridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

const profileAboutPanelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  boxSizing: "border-box",
};

const profileAboutPanelTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 950,
  textAlign: "left",
  ...safeTextStyle,
};

const profileAboutChipsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const profileAboutChipStyle: CSSProperties = {
  minHeight: "auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "10.5px",
  fontWeight: 900,
  ...safeTextStyle,
};

const profileAboutMetricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const profileAboutMetricCardStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "42px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "3px",
  borderRadius: "12px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.04)",
  padding: "7px 4px",
  boxSizing: "border-box",
};

const profileAboutMetricNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const profileAboutMetricLabelStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1.2,
  fontWeight: 850,
  textTransform: "lowercase",
  ...safeTextStyle,
};

const profileAboutRowsStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const profileAboutRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minHeight: "24px",
  padding: "0 2px",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 800,
  textAlign: "left",
  ...safeTextStyle,
};

const filtersToggleButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  marginBottom: "10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "0 14px",
  boxSizing: "border-box",
  textAlign: "center",
};

const filtersToggleIconStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 950,
};

const statsBoxStyle: CSSProperties = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minHeight: "64px",
  borderRadius: "16px",
  padding: "7px 4px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.075))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: "10px",
  borderRadius: "22px",
  background:
    "#08030F",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const authorCommunityIntroStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
};

const authorCommunityEyebrowStyle: CSSProperties = {
  color: "var(--historietas-text-accent, #FDBA74)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "15px",
  lineHeight: 1.08,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "460px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 750,
  textAlign: "center",
  ...safeTextStyle,
};

const diaryPrivacyNoticeStyle: CSSProperties = {
  width: "min(520px, 100%)",
  minHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9.5px",
  lineHeight: 1.25,
  fontWeight: 850,
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const authorCommunityGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

const authorCommunityStatsGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

const authorCommunityDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  margin: "2px 0",
  background:
    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)",
};

const authorCommunityCardStyle: CSSProperties = {
  minHeight: "48px",
  padding: "6px 4px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const authorCommunityCardNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityCardTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityCardTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1.1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityPreviewStyle: CSSProperties = {
  width: "100%",
  padding: "9px",
  borderRadius: "18px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "left",
};

const authorCommunityPreviewIconStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  lineHeight: 1,
  flexShrink: 0,
};

const authorCommunityPreviewTextBlockStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const authorCommunityPreviewTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.15,
  fontWeight: 950,
  ...safeTextStyle,
};

const authorCommunityPreviewTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9.2px",
  lineHeight: 1.28,
  fontWeight: 750,
  ...safeTextStyle,
};

const authorCommunityActionsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorCommunityPrimaryActionStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "34px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const authorCommunitySecondaryActionStyle: CSSProperties = {
  minHeight: "30px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityStatNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "14.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const authorCommunityStatTextStyle: CSSProperties = {
  ...authorCommunityCardTextStyle,
  fontSize: "9px",
};

const authorsBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "22px",
  background: "var(--historietas-surface, #08030F)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "grid",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const authorsListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const authorButtonStyle: CSSProperties = {
  flex: "1 1 132px",
  minHeight: "34px",
  maxWidth: "100%",
  padding: "0 11px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const activeAuthorButtonStyle: CSSProperties = {
  ...authorButtonStyle,
  background: "#08030F",
  border:
    "1px solid rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const sectionStyle: CSSProperties = {
  marginTop: "16px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  marginBottom: "12px",
  minWidth: 0,
  textAlign: "center",
};

const miniTitleStyle: CSSProperties = {
  display: "inline-flex",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  marginBottom: "4px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "28px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const sectionFilterTextStyle: CSSProperties = {
  margin: "6px auto 0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 800,
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const filterBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "18px",
  background: "var(--historietas-surface, #08030F)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const filterInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-input-bg, #04000A)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const filterSelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-input-bg, #04000A)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 750,
  fontFamily: "inherit",
  textAlign: "center",
  textAlignLast: "center",
  boxSizing: "border-box",
  minWidth: 0,
};

const clearFilterButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const profileWorksSectionStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const profileWorksToolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const profileWorksSummaryStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 850,
  minWidth: 0,
  ...safeTextStyle,
};

const profileWorksFilterButtonStyle: CSSProperties = {
  minHeight: "28px",
  padding: "0",
  borderRadius: 0,
  border: 0,
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  boxSizing: "border-box",
};

const profileWorksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "10px",
  rowGap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopProfileWorksGridStyle: CSSProperties = {
  ...profileWorksGridStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  columnGap: "14px",
  rowGap: "18px",
};

const profileWorkCardStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  position: "relative",
};

const profileWorkCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
};

const profileWorkCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  minHeight: "180px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  background: "#08030F",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  boxSizing: "border-box",
  boxShadow: "none",
};

const desktopProfileWorkCoverStyle: CSSProperties = {
  ...profileWorkCoverStyle,
  minHeight: "240px",
  borderRadius: "20px",
};

const profileWorkTopBadgesStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  right: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  zIndex: 1,
  minWidth: 0,
};

const profileWorkMiniBadgeStyle: CSSProperties = {
  minHeight: "18px",
  padding: "0 6px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(8,5,13,0.52)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "0.01em",
  maxWidth: "100%",
  boxSizing: "border-box",
  textShadow: "none",
  ...safeTextStyle,
};

const profileWorkPublishedBadgeStyle: CSSProperties = {
  ...profileWorkMiniBadgeStyle,
};

const profileWorkDraftBadgeStyle: CSSProperties = {
  ...profileWorkMiniBadgeStyle,
};

const profileWorkClassificationBadgeStyle: CSSProperties = {
  ...profileWorkMiniBadgeStyle,
};

const profileWorkCoverOverlayStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "34px 42px 10px 10px",
  display: "grid",
  gap: "4px",
  background:
    "linear-gradient(180deg, rgba(8,5,13,0) 0%, rgba(8,5,13,0.72) 38%, rgba(8,5,13,0.94) 100%)",
  boxSizing: "border-box",
  zIndex: 1,
  minWidth: 0,
};

const profileWorkCoverTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.06,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textShadow: "none",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const profileWorkCoverMetaStyle: CSSProperties = {
  color: "rgba(244,244,245,0.86)",
  fontSize: "9px",
  lineHeight: 1.18,
  fontWeight: 850,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  letterSpacing: "-0.01em",
  textShadow: "none",
  minWidth: 0,
};

const profileWorkSmallActionHintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  lineHeight: 1.2,
  fontWeight: 850,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
  letterSpacing: "-0.01em",
};

const profileWorkInfoStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  padding: "0 1px",
};

const profileWorkTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12.75px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textDecoration: "none",
  ...safeTextStyle,
};

const profileWorkTitleLinkStyle: CSSProperties = {
  ...profileWorkTitleStyle,
};

const profileWorkMetaRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 22px",
  alignItems: "center",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  position: "relative",
};

const profileWorkMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9.1px",
  lineHeight: 1.2,
  fontWeight: 850,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
  letterSpacing: "-0.01em",
};

const profileWorkHeartMetaStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontWeight: 950,
};

const profileWorkViewsMetaStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontWeight: 950,
};

const profileWorkMenuAnchorStyle: CSSProperties = {
  position: "absolute",
  right: "8px",
  bottom: "8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "24px",
  height: "24px",
  zIndex: 8,
};

const profileWorkDotsButtonStyle: CSSProperties = {
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  flexShrink: 0,
};

const profileWorkOptionsMenuStyle: CSSProperties = {
  position: "absolute",
  right: "calc(100% + 6px)",
  top: "4px",
  zIndex: 20,
  width: "156px",
  minWidth: "156px",
  maxWidth: "156px",
  padding: "6px",
  borderRadius: "14px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-surface-strong, #04000A)",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: "2px",
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  overflow: "hidden",
};

const profileWorkMenuItemStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "32px",
  border: "none",
  borderRadius: "10px",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  overflow: "hidden",
  textOverflow: "ellipsis",
  padding: "0 9px",
  boxSizing: "border-box",
  flexShrink: 0,
};

const profileWorkMenuItemActiveStyle: CSSProperties = {
  ...profileWorkMenuItemStyle,
  color: "var(--historietas-accent, #FDBA74)",
};

const profileWorkActionsCompactStyle: CSSProperties = {
  display: "none",
};

const profileWorkActionButtonStyle: CSSProperties = {
  minHeight: "21px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.05))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "8px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 7px",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const profileWorkActionActiveStyle: CSSProperties = {
  ...profileWorkActionButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  border:
    "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
};

const profileWorkOwnerActionStyle: CSSProperties = {
  ...profileWorkActionButtonStyle,
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const profileWorkActionDisabledStyle: CSSProperties = {
  ...profileWorkActionButtonStyle,
  opacity: 0.58,
  cursor: "default",
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
  gridTemplateColumns: "minmax(86px, 102px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "10px",
  padding: "10px",
  borderRadius: "22px",
  background: "var(--historietas-surface, #08030F)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const coverLinkStyle: CSSProperties = {
  display: "flex",
  alignSelf: "stretch",
  height: "100%",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "132px",
  borderRadius: "17px",
  position: "relative",
  overflow: "hidden",
  background:
    "#08030F",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const genreBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 6px",
  borderRadius: "999px",
  background:
    "rgba(255,255,255,0.06)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8px",
  fontWeight: 950,
  ...safeTextStyle,
};

const coverBottomStyle: CSSProperties = {
  position: "absolute",
  left: "10px",
  right: "10px",
  bottom: "10px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const coverNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "37px",
  lineHeight: 0.85,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  ...safeTextStyle,
};

const coverLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  textAlign: "right",
  ...safeTextStyle,
};

const workContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 6px",
  borderRadius: "999px",
  background:
    "rgba(34,197,94,0.10)",
  border:
    "1px solid rgba(34,197,94,0.22)",
  color:
    "#86EFAC",
  fontSize: "8px",
  fontWeight: 950,
  ...safeTextStyle,
};

const draftStatusStyle: CSSProperties = {
  ...publishedStatusStyle,
  background:
    "rgba(255,255,255,0.06)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-accent, #FDBA74)",
};

const formatBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #E4E4E7)",
};

const classificationBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background:
    "rgba(255,255,255,0.06)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-secondary, #DDD6FE)",
};

const favoriteBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background:
    "rgba(255,255,255,0.06)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-accent, #FDBA74)",
};

const completedBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background:
    "rgba(34,197,94,0.10)",
  border:
    "1px solid rgba(34,197,94,0.22)",
  color:
    "#86EFAC",
};

const workTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const workTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const workStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const workProgressBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const workProgressTrackStyle: CSSProperties = {
  height: "6px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.06)",
};

const workProgressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const workProgressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  ...safeTextStyle,
};

const workActionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(108px, 1fr))",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const openButtonStyle: CSSProperties = {
  minHeight: "32px",
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
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const readButtonStyle: CSSProperties = {
  ...openButtonStyle,
  background: "#08030F",
};

const smallButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const smallButtonActiveStyle: CSSProperties = {
  ...smallButtonStyle,
  border:
    "1px solid rgba(255,255,255,0.10)",
  background:
    "rgba(255,255,255,0.06)",
  color: "var(--historietas-accent, #FDBA74)",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 48px))",
  padding: "24px 0 64px",
};

const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  padding: "15px 20px",
  borderRadius: "24px",
};

const desktopAuthorTopRowStyle: CSSProperties = {
  ...authorTopRowStyle,
  gridTemplateColumns: "132px minmax(0, 1fr)",
  gap: "22px",
  minHeight: "132px",
};

const desktopAvatarBaseStyle: CSSProperties = {
  ...avatarBaseStyle,
  width: "132px",
  maxWidth: "132px",
  height: "132px",
  borderRadius: "32px",
  fontSize: "54px",
};

const desktopAvatarButtonStyle: CSSProperties = {
  ...desktopAvatarBaseStyle,
  cursor: "pointer",
};

const desktopAvatarDisplayStyle: CSSProperties = {
  ...desktopAvatarBaseStyle,
  cursor: "default",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(31px, 3.4vw, 43px)",
  lineHeight: 1.18,
  letterSpacing: "-0.03em",
  paddingRight: "8px",
  paddingBottom: 0,
  overflow: "visible",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "14px",
  lineHeight: 1.58,
  width: "min(520px, 100%)",
  maxWidth: "520px",
  display: "block",
  WebkitLineClamp: "unset",
  overflow: "visible",
};

const desktopAvatarActionsStyle: CSSProperties = {
  ...avatarActionsStyle,
  maxWidth: "420px",
};

const desktopAvatarSmallButtonStyle: CSSProperties = {
  ...avatarSmallButtonStyle,
  flex: "0 0 auto",
  minWidth: "150px",
  minHeight: "34px",
  fontSize: "11px",
};

const desktopAvatarRemoveButtonStyle: CSSProperties = {
  ...desktopAvatarSmallButtonStyle,
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.12)",
  color: "#FCA5A5",
};

const desktopBioTextareaStyle: CSSProperties = {
  ...bioTextareaStyle,
  minHeight: "92px",
  fontSize: "13px",
  lineHeight: 1.55,
};

const desktopStatsBoxStyle: CSSProperties = {
  ...statsBoxStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const desktopStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "82px",
  padding: "12px",
  borderRadius: "18px",
};

const desktopAuthorCommunityBoxStyle: CSSProperties = {
  ...authorCommunityBoxStyle,
  marginTop: "14px",
  gap: "9px",
};

const desktopAuthorCommunityGridStyle: CSSProperties = {
  ...authorCommunityGridStyle,
  gap: "8px",
};

const desktopAuthorCommunityStatsGridStyle: CSSProperties = {
  ...authorCommunityStatsGridStyle,
  gap: "8px",
};

const desktopAuthorCommunityActionsStyle: CSSProperties = {
  ...authorCommunityActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
};

const desktopAuthorsBoxStyle: CSSProperties = {
  ...authorsBoxStyle,
  padding: "16px",
  borderRadius: "24px",
};

const desktopAuthorsListStyle: CSSProperties = {
  ...authorsListStyle,
  alignItems: "center",
};

const desktopAuthorButtonStyle: CSSProperties = {
  ...authorButtonStyle,
  flex: "0 1 auto",
  minWidth: "150px",
  maxWidth: "260px",
};

const desktopActiveAuthorButtonStyle: CSSProperties = {
  ...desktopAuthorButtonStyle,
  background: "#08030F",
  border:
    "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  marginBottom: "14px",
};

const desktopFilterBoxStyle: CSSProperties = {
  ...filterBoxStyle,
  gridTemplateColumns: "minmax(280px, 1fr) minmax(360px, 0.9fr) auto",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
};

const desktopFilterGridStyle: CSSProperties = {
  ...filterGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const desktopClearFilterButtonStyle: CSSProperties = {
  ...clearFilterButtonStyle,
  width: "auto",
  minWidth: "150px",
};

const desktopWorksGridStyle: CSSProperties = {
  ...worksGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  alignItems: "stretch",
};

const desktopWorkCardStyle: CSSProperties = {
  ...workCardStyle,
  gridTemplateColumns: "minmax(126px, 146px) minmax(0, 1fr)",
  gap: "14px",
  padding: "12px",
  borderRadius: "24px",
  background: "var(--historietas-surface, #08030F)",
  boxShadow: "none",
};

const desktopWorkContentStyle: CSSProperties = {
  ...workContentStyle,
  gap: "9px",
};

const desktopWorkTitleStyle: CSSProperties = {
  ...workTitleStyle,
  fontSize: "26px",
  lineHeight: 1.12,
};

const desktopWorkTextStyle: CSSProperties = {
  ...workTextStyle,
  fontSize: "12px",
  lineHeight: 1.5,
  WebkitLineClamp: 2,
};

const desktopWorkActionsGridStyle: CSSProperties = {
  ...workActionsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
};

const diaryBoxStyle: CSSProperties = {
  ...authorCommunityBoxStyle,
  alignItems: "stretch",
  textAlign: "center",
};

const diaryStatsGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const diaryStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "58px",
  borderRadius: "16px",
};

const diaryStatNumberStyle: CSSProperties = {
  ...statNumberStyle,
  fontSize: "21px",
};

const diaryStatLabelStyle: CSSProperties = {
  ...statLabelStyle,
};

const diarySectionStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const diarySectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
};

const diarySectionTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const diarySectionDescriptionStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.35,
  fontWeight: 750,
  textAlign: "center",
  ...safeTextStyle,
};

const diaryItemsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const diaryItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "9px",
  minHeight: "92px",
  padding: "8px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const diaryItemBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "7px",
  bottom: "7px",
  maxWidth: "calc(100% - 14px)",
  borderRadius: "999px",
  padding: "3px 5px",
  background: "rgba(0,0,0,0.62)",
  color: "#FFFFFF",
  fontSize: "7px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const diaryItemTextBlockStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "left",
};

const diaryItemTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.15,
  fontWeight: 950,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  ...safeTextStyle,
};

const diaryItemDescriptionStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.3,
  fontWeight: 750,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  ...safeTextStyle,
};

const diaryItemDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  lineHeight: 1,
  fontWeight: 850,
  ...safeTextStyle,
};

const diaryEmptyStateStyle: CSSProperties = {
  width: "100%",
  borderRadius: "18px",
  padding: "14px",
  background: "rgba(255,255,255,0.035)",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 750,
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const diaryTimelineStyle: CSSProperties = {
  ...diarySectionStyle,
};

const diaryTimelineListStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const diaryTimelineItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "7px",
  padding: "8px 9px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const diaryTimelineDotStyle: CSSProperties = {
  width: "7px",
  height: "7px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
};

const diaryTimelineTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 750,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const diaryTimelineDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 850,
  textAlign: "right",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const desktopDiaryBoxStyle: CSSProperties = {
  ...diaryBoxStyle,
  padding: "12px",
  gap: "10px",
};

const desktopDiaryStatsGridStyle: CSSProperties = {
  ...diaryStatsGridStyle,
  maxWidth: "620px",
  justifySelf: "center",
};

const desktopDiaryItemsGridStyle: CSSProperties = {
  ...diaryItemsGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "9px",
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "20px",
  borderRadius: "24px",
  background: "var(--historietas-surface, #08030F)",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  padding: "22px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "28px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 700,
  ...safeTextStyle,
};

const emptyButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  padding: "0 14px",
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
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const emptyMiniBoxStyle: CSSProperties = {
  borderRadius: "20px",
  padding: "16px",
  background: "var(--historietas-surface, #08030F)",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};