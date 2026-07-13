"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, idObraSupabaseValido, normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, ReactNode } from "react";

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
  username: string;
  avatar: string;
  bio: string;
  sobreBio: string;
  criadoEm: string;
};

type AbaPerfilAutor = "obras" | "diario" | "comunidade" | "sobre" | "biblioteca";
type AbaBibliotecaPerfil =
  | "tudo"
  | "quero-ler"
  | "lendo-agora"
  | "favoritas"
  | "concluidas"
  | "salvos"
  | "historico";

const STORAGE_KEY = "historietas-obras";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
const LIBRARY_FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
const AUTHOR_RATINGS_STORAGE_KEY = "historietas-autores-avaliacoes";
const TOP_FIVE_STORAGE_KEY = "historietas-top-5-obras";
const TOP_FIVE_LIKES_STORAGE_KEY = "historietas-top-5-curtidas";
const TOP_FIVE_MAXIMO = 5;
const AVATAR_MAX_SIZE = 1 * 1024 * 1024;
const AVATAR_STORAGE_BUCKET = "avatars";
const BIO_MAX_LENGTH = 90;
const SOBRE_BIO_MAX_LENGTH = 600;
const NOTAS_AVALIACAO_AUTOR = [1, 2, 3, 4, 5] as const;
const DIARIO_ANOTACAO_MAX_LENGTH = 700;
const DIARIO_COMENTARIO_MAX_LENGTH = 700;
const DENUNCIA_PERFIL_DESCRICAO_MAX_LENGTH = 500;
const DENUNCIA_PERFIL_MOTIVOS = [
  { valor: "spam", rotulo: "Spam" },
  { valor: "ofensivo", rotulo: "Conteúdo ofensivo" },
  { valor: "perfil_falso", rotulo: "Perfil falso" },
  { valor: "assedio", rotulo: "Assédio" },
  { valor: "improprio", rotulo: "Conteúdo impróprio" },
  { valor: "outro", rotulo: "Outro" },
] as const;

function normalizarAbaPerfilAutor(valor: string | null): AbaPerfilAutor {
  if (
    valor === "obras" ||
    valor === "diario" ||
    valor === "comunidade" ||
    valor === "sobre" ||
    valor === "biblioteca"
  ) {
    return valor;
  }

  return "obras";
}

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
  visibilidade?: VisibilidadeDiarioPerfil;
  anotacao?: string;
  anotacaoId?: string;
  anotacaoVisibilidade?: VisibilidadeDiarioPerfil;
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

type ItemBibliotecaPerfil = {
  chave: string;
  obra: ObraLocal;
  capitulo: CapituloLocal | null;
  numeroCapitulo: number;
  tempoAtividade: number;
  tipoDiario: DiarioPerfilItem["tipo"];
  descricao: string;
};

type VisibilidadeDiarioPerfil = "publico" | "parcial" | "privado";
type MotivoDenunciaPerfil = (typeof DENUNCIA_PERFIL_MOTIVOS)[number]["valor"];

type AnotacaoDiarioPerfil = {
  id: string;
  obraId: string;
  tipo: DiarioPerfilItem["tipo"];
  texto: string;
  visibilidade: VisibilidadeDiarioPerfil;
  atualizadoEm: string;
};

type EditorAnotacaoDiarioEstado = {
  aberto: boolean;
  itemChave: string;
  obraId: string;
  tipo: DiarioPerfilItem["tipo"];
  texto: string;
  visibilidade: VisibilidadeDiarioPerfil;
  salvando: boolean;
  erro: string;
};

type ComentarioAnotacaoDiarioPerfil = {
  id: string;
  anotacaoId: string;
  userId: string;
  autorNome: string;
  texto: string;
  criadoEm: string;
};

type InteracaoAnotacaoDiarioEstado = {
  carregando: boolean;
  totalCurtidas: number;
  curtiu: boolean;
  comentarios: ComentarioAnotacaoDiarioPerfil[];
  novoComentario: string;
  salvandoCurtida: boolean;
  enviandoComentario: boolean;
  erro: string;
};

type InteracoesAnotacoesDiarioEstado = Record<
  string,
  InteracaoAnotacaoDiarioEstado
>;

function criarInteracaoAnotacaoDiarioVazia(
  carregando = false,
): InteracaoAnotacaoDiarioEstado {
  return {
    carregando,
    totalCurtidas: 0,
    curtiu: false,
    comentarios: [],
    novoComentario: "",
    salvandoCurtida: false,
    enviandoComentario: false,
    erro: "",
  };
}

const editorAnotacaoDiarioVazio: EditorAnotacaoDiarioEstado = {
  aberto: false,
  itemChave: "",
  obraId: "",
  tipo: "atividade",
  texto: "",
  visibilidade: "privado",
  salvando: false,
  erro: "",
};

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


type TotaisInteracoesObrasPerfilAutor = {
  curtidasPorObra: Record<string, number>;
  comentariosPorObra: Record<string, number>;
  curtidasPorCapitulo: Record<string, number>;
  comentariosPorCapitulo: Record<string, number>;
  salvosPorObra: Record<string, number>;
  salvosPorCapitulo: Record<string, number>;
  concluidasPorObra: Record<string, number>;
};

const totaisInteracoesObrasPerfilVazio: TotaisInteracoesObrasPerfilAutor = {
  curtidasPorObra: {},
  comentariosPorObra: {},
  curtidasPorCapitulo: {},
  comentariosPorCapitulo: {},
  salvosPorObra: {},
  salvosPorCapitulo: {},
  concluidasPorObra: {},
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

function normalizarNomeAutor(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizarUsernamePerfilAutor(valor: string) {
  return valor
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);
}

function criarUsernameSugeridoPerfilAutor(nomeAutor: string, autorId: string) {
  const base = normalizarUsernamePerfilAutor(nomeAutor);
  const sufixo = autorId
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toLowerCase();

  if (base) {
    return base;
  }

  return sufixo ? `autor.${sufixo}` : "autor.historietas";
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

function criarPerfilAutorHref(autor: string, autorId?: string) {
  const params = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  if (autorLimpo) {
    params.set("autor", autorLimpo);
  }

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
    params.set("userId", autorIdLimpo);
  }

  const query = params.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
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

function criarHandlePerfilAutor(
  nomeAutor: string,
  autorId: string,
  username = "",
) {
  const usernameLimpo = normalizarUsernamePerfilAutor(username);

  if (usernameLimpo) {
    return `@${usernameLimpo}`;
  }

  return `@${criarUsernameSugeridoPerfilAutor(nomeAutor, autorId)}`;
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

function formatarFormatoPerfilAutor(formato: string) {
  const formatoLimpo = formato.trim();

  if (
    !formatoLimpo ||
    normalizarTexto(formatoLimpo) === "nao informado" ||
    normalizarTexto(formatoLimpo) === "nao informada"
  ) {
    return "";
  }

  return formatoLimpo;
}

function obterTagPrincipalPerfilAutor(
  obra: Pick<ObraLocal, "tags" | "genero" | "formato">,
) {
  const generoNormalizado = normalizarTexto(obra.genero);
  const formatoNormalizado = normalizarTexto(obra.formato);

  return (obra.tags || [])
    .map((tag) => tag.trim())
    .find((tag) => {
      const tagNormalizada = normalizarTexto(tag);

      return (
        tag &&
        tagNormalizada !== "sem tags" &&
        tagNormalizada !== generoNormalizado &&
        tagNormalizada !== formatoNormalizado
      );
    }) || "";
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

function compactarNumeroPerfilAutor(valor: number) {
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

function carregarAvaliacoesAutoresLocais(userId = "") {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const avaliacoesJson: unknown =
      carregarJsonUsuarioPerfilAutor(AUTHOR_RATINGS_STORAGE_KEY, userId) || {};

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

function obterAvaliacaoAutorLocal(
  perfil: Pick<AutorPerfil, "autorId" | "nome">,
  userId = "",
) {
  const chaveAvaliacao = obterChaveAvaliacaoAutor(perfil);
  const avaliacoesLocais = carregarAvaliacoesAutoresLocais(userId);
  const nota = Number(avaliacoesLocais[chaveAvaliacao]);

  return Number.isFinite(nota) && nota >= 0.5 && nota <= 5
    ? Math.round(nota * 2) / 2
    : 0;
}

function salvarAvaliacaoAutorLocal(
  perfil: Pick<AutorPerfil, "autorId" | "nome">,
  nota: number,
  userId = "",
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const chaveAvaliacao = obterChaveAvaliacaoAutor(perfil);

    if (!chaveAvaliacao) {
      return;
    }

    const avaliacoesLocais = carregarAvaliacoesAutoresLocais(userId);

    if (nota <= 0) {
      delete avaliacoesLocais[chaveAvaliacao];
    } else {
      avaliacoesLocais[chaveAvaliacao] = nota;
    }

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_RATINGS_STORAGE_KEY,
      userId,
      avaliacoesLocais,
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

function carregarPerfisAutores(userId = ""): PerfisAutoresSalvos {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return {};
  }

  try {
    const perfis =
      carregarJsonUsuarioPerfilAutor(AUTHOR_PROFILE_STORAGE_KEY, userIdLimpo) ||
      {};
    const perfisNormalizados = normalizarPerfisAutores(perfis);

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_PROFILE_STORAGE_KEY,
      userIdLimpo,
      perfisNormalizados,
    );

    return perfisNormalizados;
  } catch {
    salvarJsonUsuarioPerfilAutor(AUTHOR_PROFILE_STORAGE_KEY, userIdLimpo, {});
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
  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? obra.capitulos.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId,
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = obra.capitulos
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    obra.capitulos.find((capitulo) => !capitulo.lido) ||
    obra.capitulos[obra.capitulos.length - 1] ||
    null
  );
}


function criarStorageKeyUsuarioPerfilBiblioteca(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function normalizarListaIdsPerfilBiblioteca(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    : [];
}

function carregarListaIdsPerfilBiblioteca(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [] as string[];
  }

  try {
    const chaveParaLer = criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo);
    const listaTexto = localStorage.getItem(chaveParaLer);
    const lista = normalizarListaIdsPerfilBiblioteca(
      listaTexto ? JSON.parse(listaTexto) : [],
    );

    return Array.from(new Set(lista));
  } catch {
    return [] as string[];
  }
}

function salvarListaIdsPerfilBiblioteca(
  chave: string,
  userId: string,
  lista: string[],
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  const listaNormalizada = normalizarListaIdsPerfilBiblioteca(lista);

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
      JSON.stringify(listaNormalizada),
    );
  } catch {
    // A Biblioteca continua funcionando em memória se o armazenamento local falhar.
  }
}

function carregarJsonUsuarioPerfilAutor(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
    );

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonUsuarioPerfilAutor(chave: string, userId: string, valor: unknown) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
      JSON.stringify(valor),
    );
  } catch {
    // localStorage é apoio; a tela segue com o estado em memória.
  }
}

function obterIdentificadoresObraPerfilBiblioteca(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((valor): valor is string => typeof valor === "string" && Boolean(valor.trim())),
    ),
  );
}

function colecaoTemObraPerfilBiblioteca(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  const idsColecao = new Set(colecao.filter((id) => typeof id === "string"));

  return obterIdentificadoresObraPerfilBiblioteca(obra).some((identificador) =>
    idsColecao.has(identificador),
  );
}

function removerObraDaColecaoPerfilBiblioteca(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  const identificadores = new Set(obterIdentificadoresObraPerfilBiblioteca(obra));

  return colecao.filter((id) => !identificadores.has(id));
}

function carregarTopFivePerfilAutor(userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return [] as string[];
  }

  try {
    const topFiveSalvo = carregarJsonUsuarioPerfilAutor(
      TOP_FIVE_STORAGE_KEY,
      userId,
    );

    return Array.isArray(topFiveSalvo)
      ? Array.from(
          new Set(
            topFiveSalvo.filter(
              (id): id is string =>
                typeof id === "string" && Boolean(id.trim()),
            ),
          ),
        ).slice(0, TOP_FIVE_MAXIMO)
      : [];
  } catch {
    return [] as string[];
  }
}

function encontrarObraPorIdentificadorTopFivePerfil(
  obrasDisponiveis: ObraLocal[],
  identificador: string,
) {
  const identificadorLimpo = identificador.trim();

  if (!identificadorLimpo) {
    return null;
  }

  return (
    obrasDisponiveis.find((obra) =>
      obterIdentificadoresObraPerfilBiblioteca(obra).includes(
        identificadorLimpo,
      ),
    ) || null
  );
}

function criarChaveCurtidaTopFivePerfil(perfilUserId: string) {
  return perfilUserId.trim().toLowerCase();
}

function normalizarCurtidasTopFiveLocais(valor: unknown) {
  const curtidasNormalizadas: Record<string, string[]> = {};

  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return curtidasNormalizadas;
  }

  Object.entries(valor as Record<string, unknown>).forEach(([perfilId, curtidas]) => {
    if (!perfilId.trim() || !Array.isArray(curtidas)) {
      return;
    }

    curtidasNormalizadas[criarChaveCurtidaTopFivePerfil(perfilId)] = Array.from(
      new Set(
        curtidas
          .filter((usuarioId): usuarioId is string =>
            typeof usuarioId === "string" && Boolean(usuarioId.trim()),
          )
          .map((usuarioId) => usuarioId.trim().toLowerCase()),
      ),
    );
  });

  return curtidasNormalizadas;
}

function carregarCurtidasTopFiveLocais(
  perfilUserId: string,
  usuarioId = "",
) {
  const chavePerfil = criarChaveCurtidaTopFivePerfil(perfilUserId);
  const usuarioIdNormalizado = usuarioId.trim().toLowerCase();

  if (!chavePerfil || !usuarioIdNormalizado) {
    return { total: 0, curtiu: false };
  }

  try {
    const curtidasJson = carregarJsonUsuarioPerfilAutor(
      TOP_FIVE_LIKES_STORAGE_KEY,
      usuarioIdNormalizado,
    );
    const curtidasPorPerfil = normalizarCurtidasTopFiveLocais(curtidasJson);
    const curtidasPerfil = curtidasPorPerfil[chavePerfil] || [];

    return {
      total: curtidasPerfil.length,
      curtiu: Boolean(
        usuarioIdNormalizado && curtidasPerfil.includes(usuarioIdNormalizado),
      ),
    };
  } catch {
    return { total: 0, curtiu: false };
  }
}

function salvarCurtidaTopFiveLocal(
  perfilUserId: string,
  usuarioId: string,
  curtir: boolean,
) {
  const chavePerfil = criarChaveCurtidaTopFivePerfil(perfilUserId);
  const usuarioIdNormalizado = usuarioId.trim().toLowerCase();

  if (!chavePerfil || !usuarioIdNormalizado) {
    return;
  }

  try {
    const curtidasJson = carregarJsonUsuarioPerfilAutor(
      TOP_FIVE_LIKES_STORAGE_KEY,
      usuarioIdNormalizado,
    );
    const curtidasPorPerfil = normalizarCurtidasTopFiveLocais(curtidasJson);
    const curtidasAtuais = curtidasPorPerfil[chavePerfil] || [];
    const curtidasSemUsuario = curtidasAtuais.filter(
      (curtidaUsuarioId) => curtidaUsuarioId !== usuarioIdNormalizado,
    );

    curtidasPorPerfil[chavePerfil] = curtir
      ? [...curtidasSemUsuario, usuarioIdNormalizado]
      : curtidasSemUsuario;

    salvarJsonUsuarioPerfilAutor(
      TOP_FIVE_LIKES_STORAGE_KEY,
      usuarioIdNormalizado,
      curtidasPorPerfil,
    );
  } catch {
    // Curtida local é fallback e não deve travar o perfil.
  }
}

async function carregarCurtidasTopFivePerfil(
  perfilUserId: string,
  usuarioId = "",
) {
  const estadoLocal = carregarCurtidasTopFiveLocais(perfilUserId, usuarioId);
  const perfilUserIdLimpo = perfilUserId.trim();
  const usuarioIdLimpo = usuarioId.trim();

  if (!idAutorSupabaseValido(perfilUserIdLimpo)) {
    return estadoLocal;
  }

  try {
    const { count, error } = await supabase
      .from("top5_curtidas")
      .select("perfil_user_id", { count: "exact", head: true })
      .eq("perfil_user_id", perfilUserIdLimpo);

    if (error) {
      return estadoLocal;
    }

    let curtiu = estadoLocal.curtiu;

    if (usuarioIdLimpo && idAutorSupabaseValido(usuarioIdLimpo)) {
      const { data: minhaCurtida, error: erroMinhaCurtida } = await supabase
        .from("top5_curtidas")
        .select("perfil_user_id")
        .eq("perfil_user_id", perfilUserIdLimpo)
        .eq("usuario_id", usuarioIdLimpo)
        .limit(1)
        .maybeSingle();

      if (!erroMinhaCurtida) {
        curtiu = estadoLocal.curtiu || Boolean(minhaCurtida);
      }
    }

    return {
      total: Math.max(count ?? 0, estadoLocal.total),
      curtiu,
    };
  } catch {
    return estadoLocal;
  }
}

async function salvarCurtidaTopFiveSupabase(
  perfilUserId: string,
  usuarioId: string,
  curtir: boolean,
) {
  const perfilUserIdLimpo = perfilUserId.trim();
  const usuarioIdLimpo = usuarioId.trim();

  if (
    !idAutorSupabaseValido(perfilUserIdLimpo) ||
    !idAutorSupabaseValido(usuarioIdLimpo)
  ) {
    return false;
  }

  try {
    const { error: erroDelete } = await supabase
      .from("top5_curtidas")
      .delete()
      .eq("perfil_user_id", perfilUserIdLimpo)
      .eq("usuario_id", usuarioIdLimpo);

    if (erroDelete) {
      return false;
    }

    if (!curtir) {
      return true;
    }

    const { error: erroInsert } = await supabase
      .from("top5_curtidas")
      .insert({
        perfil_user_id: perfilUserIdLimpo,
        usuario_id: usuarioIdLimpo,
      });

    return !erroInsert;
  } catch {
    return false;
  }
}

function obterTempoAtividadeBibliotecaPerfil(obra: ObraLocal) {
  const tempos = [
    obterTimestampData(obra.ultimaLeituraEm),
    obterTimestampData(obra.criadaEm),
    ...obra.capitulos.map((capitulo) =>
      Math.max(
        obterTimestampData(capitulo.lidoEm),
        obterTimestampData(capitulo.criadoEm),
      ),
    ),
  ];

  return Math.max(0, ...tempos);
}

function obterCapituloBibliotecaPerfil(obra: ObraLocal) {
  return (
    obra.capitulos.find((capitulo) => capitulo.salvo) ||
    encontrarCapituloParaContinuar(obra) ||
    obra.capitulos.find((capitulo) => capitulo.lido) ||
    obra.capitulos[0] ||
    null
  );
}


function converterItensDiarioParaBiblioteca(
  itens: DiarioPerfilItem[],
  prefixo: string,
): ItemBibliotecaPerfil[] {
  const itensPorObra = new Map<string, ItemBibliotecaPerfil>();

  [...itens]
    .sort(
      (itemA, itemB) =>
        obterTimestampData(itemB.data) - obterTimestampData(itemA.data),
    )
    .forEach((item) => {
      const obra = item.obra;

      if (!obra) {
        return;
      }

      const chaveObra =
        obra.id.trim() ||
        obra.slug.trim() ||
        normalizarTexto(obra.titulo);

      if (!chaveObra || itensPorObra.has(chaveObra)) {
        return;
      }

      const capitulo =
        item.tipo === "lendo"
          ? encontrarCapituloParaContinuar(obra)
          : obterCapituloBibliotecaPerfil(obra);
      const numeroCapitulo = capitulo
        ? obra.capitulos.findIndex(
            (capituloObra) => capituloObra.id === capitulo.id,
          ) + 1
        : 0;

      itensPorObra.set(chaveObra, {
        chave: `${prefixo}-${item.chave}`,
        obra,
        capitulo,
        numeroCapitulo: Math.max(0, numeroCapitulo),
        tempoAtividade:
          obterTimestampData(item.data) ||
          obterTempoAtividadeBibliotecaPerfil(obra),
        tipoDiario: item.tipo,
        descricao: item.descricao,
      });
    });

  return Array.from(itensPorObra.values()).sort(
    (itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade,
  );
}

function converterCapitulosSalvosParaBiblioteca(
  obrasDisponiveis: ObraLocal[],
): ItemBibliotecaPerfil[] {
  const itens: ItemBibliotecaPerfil[] = [];

  obrasDisponiveis.forEach((obra) => {
    obra.capitulos.forEach((capitulo, capituloIndex) => {
      if (!capitulo.salvo) {
        return;
      }

      itens.push({
        chave: `salvo-${obra.id || obra.slug}-${capitulo.id}`,
        obra,
        capitulo,
        numeroCapitulo: capituloIndex + 1,
        tempoAtividade:
          obterTimestampData(capitulo.lidoEm) ||
          obterTimestampData(capitulo.criadoEm) ||
          obterTempoAtividadeBibliotecaPerfil(obra),
        tipoDiario: "quero_ler",
        descricao: "Capítulo salvo na Biblioteca",
      });
    });
  });

  return itens.sort(
    (itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade,
  );
}

function mesclarItensBibliotecaPerfil(
  ...listas: ItemBibliotecaPerfil[][]
): ItemBibliotecaPerfil[] {
  const itensPorChave = new Map<string, ItemBibliotecaPerfil>();

  listas.flat().forEach((item) => {
    const chave =
      item.capitulo?.id.trim()
        ? `${item.obra.id || item.obra.slug}::${item.capitulo.id}`
        : item.obra.id || item.obra.slug || normalizarTexto(item.obra.titulo);

    if (!chave || itensPorChave.has(chave)) {
      return;
    }

    itensPorChave.set(chave, item);
  });

  return Array.from(itensPorChave.values()).sort(
    (itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade,
  );
}


function criarCapaBibliotecaPerfilStyle(capa: string, desktop: boolean): CSSProperties {
  const baseStyle = desktop
    ? profileLibraryCoverDesktopStyle
    : profileLibraryCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: "var(--historietas-perfil-bg-deep, #04000A)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
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

function criarCapaItemDiarioPerfilStyle(
  capa: string,
  desktop: boolean,
): CSSProperties {
  const baseStyle = desktop
    ? desktopDiaryItemCoverStyle
    : diaryItemCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarCapaCardDiarioPerfilStyle(
  capa: string,
  desktop: boolean,
): CSSProperties {
  const baseStyle = desktop
    ? desktopDiaryVisualCoverStyle
    : diaryVisualCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.58) 100%), url(${capa})`,
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

  const username = normalizarUsernamePerfilAutor(pegarTexto(row?.username));

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
    username,
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
      .select("id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar,foto_url,imagem_url,photo_url,bio,sobre_bio,sobreBio,sobre,descricao,created_at,criado_em")
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
      .select("id,user_id,nome,nome_usuario,username,display_name,apelido,avatar_url,avatar,foto_url,imagem_url,photo_url,bio,sobre_bio,sobreBio,sobre,descricao,created_at,criado_em")
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
  username,
}: {
  userId: string;
  nome: string;
  perfil: PerfilAutorSalvo;
  username?: string | null;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "ID de usuário inválido para salvar perfil." };
  }

  const atualizadoEm = new Date().toISOString();
  const payloadPerfilUpdate: Record<string, unknown> = {
    nome: nome.trim() || "Usuário",
    avatar_url: perfil.avatar,
    bio: perfil.bio.slice(0, BIO_MAX_LENGTH),
    sobre_bio: perfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
    atualizado_em: atualizadoEm,
  };

  if (username !== undefined) {
    payloadPerfilUpdate.username =
      username === null ? null : normalizarUsernamePerfilAutor(username);
  }

  const payloadPerfilCriacao: Record<string, unknown> = {
    id: userIdLimpo,
    user_id: userIdLimpo,
    ...payloadPerfilUpdate,
  };

  try {
    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    let perfilId =
      !erroUserId && perfilPorUserId && typeof perfilPorUserId === "object"
        ? pegarTexto((perfilPorUserId as Record<string, unknown>).id)
        : "";

    if (!perfilId) {
      const { data: perfilPorId, error: erroId } = await supabase
        .from("profiles")
        .select("id,user_id")
        .eq("id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      perfilId =
        !erroId && perfilPorId && typeof perfilPorId === "object"
          ? pegarTexto((perfilPorId as Record<string, unknown>).id)
          : "";
    }

    if (perfilId) {
      const { error } = await supabase
        .from("profiles")
        .update(payloadPerfilUpdate)
        .eq("id", perfilId);

      return {
        ok: !error,
        erro: error?.message || "",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .insert(payloadPerfilCriacao);

    return {
      ok: !error,
      erro: error?.message || "",
    };
  } catch (error) {
    return {
      ok: false,
      erro:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar perfil.",
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
    texto: "",
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
  progressoCarregado: boolean,
) {
  return obrasParaAtualizar.map((obra) => {
    let ultimoCapituloLidoId = progressoCarregado
      ? ""
      : obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = progressoCarregado ? "" : obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const lidoEmRemoto = progressoPorCapitulo.get(capitulo.id) || "";
      const lido = progressoCarregado
        ? Boolean(lidoEmRemoto)
        : Boolean(lidoEmRemoto) || capitulo.lido;
      const lidoEm = lido
        ? lidoEmRemoto || capitulo.lidoEm
        : "";

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

type UsuariosPorChavePerfilAutor = Record<string, string[]>;

function adicionarUsuarioUnicoPerfilAutor(
  usuariosPorChave: Map<string, Set<string>>,
  chave: string,
  userId: string,
) {
  const chaveLimpa = chave.trim();
  const userIdLimpo = userId.trim();

  if (!chaveLimpa || !userIdLimpo) {
    return;
  }

  const usuarios = usuariosPorChave.get(chaveLimpa) || new Set<string>();

  usuarios.add(userIdLimpo);
  usuariosPorChave.set(chaveLimpa, usuarios);
}

function converterUsuariosPerfilAutor(
  usuariosPorChave: Map<string, Set<string>>,
): UsuariosPorChavePerfilAutor {
  return Array.from(usuariosPorChave.entries()).reduce<
    UsuariosPorChavePerfilAutor
  >((resultado, [chave, usuarios]) => {
    resultado[chave] = Array.from(usuarios);

    return resultado;
  }, {});
}

function combinarUsuariosPerfilAutor(
  ...fontes: UsuariosPorChavePerfilAutor[]
): UsuariosPorChavePerfilAutor {
  const usuariosCombinados = new Map<string, Set<string>>();

  fontes.forEach((fonte) => {
    Object.entries(fonte).forEach(([chave, usuarios]) => {
      usuarios.forEach((userId) => {
        adicionarUsuarioUnicoPerfilAutor(
          usuariosCombinados,
          chave,
          userId,
        );
      });
    });
  });

  return converterUsuariosPerfilAutor(usuariosCombinados);
}

function contarUsuariosPerfilAutor(
  usuariosPorChave: UsuariosPorChavePerfilAutor,
) {
  return Object.entries(usuariosPorChave).reduce<Record<string, number>>(
    (contagens, [chave, usuarios]) => {
      contagens[chave] = new Set(
        usuarios.map((userId) => userId.trim()).filter(Boolean),
      ).size;

      return contagens;
    },
    {},
  );
}

function mapearUsuariosCapitulosParaObrasPerfilAutor(
  usuariosPorCapitulo: UsuariosPorChavePerfilAutor,
  obraIdPorCapitulo: Record<string, string>,
) {
  const usuariosPorObra = new Map<string, Set<string>>();

  Object.entries(usuariosPorCapitulo).forEach(([capituloId, usuarios]) => {
    const obraId = obraIdPorCapitulo[capituloId]?.trim() || "";

    usuarios.forEach((userId) => {
      adicionarUsuarioUnicoPerfilAutor(
        usuariosPorObra,
        obraId,
        userId,
      );
    });
  });

  return converterUsuariosPerfilAutor(usuariosPorObra);
}

function somarContagensCapitulosPerfilAutor(
  obra: Pick<ObraLocal, "capitulos">,
  contagensPorCapitulo: Record<string, number>,
) {
  return obra.capitulos.reduce((total, capitulo) => {
    const capituloId = capitulo.id.trim();

    if (!capituloId) {
      return total;
    }

    return total + normalizarNumeroPerfilAutor(contagensPorCapitulo[capituloId], 0);
  }, 0);
}

function obterTotalCurtidasObraPerfilAutor(
  obra: Pick<ObraLocal, "id" | "capitulos">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();
  const totalUsuariosUnicos = obraId
    ? normalizarNumeroPerfilAutor(totais.curtidasPorObra[obraId], 0)
    : 0;

  if (totalUsuariosUnicos > 0) {
    return totalUsuariosUnicos;
  }

  const totalCapitulos = somarContagensCapitulosPerfilAutor(
    obra,
    totais.curtidasPorCapitulo,
  );
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.curtiu).length;

  return Math.max(totalCapitulos, totalLocal);
}

function obterTotalComentariosObraPerfilAutor(
  obra: Pick<ObraLocal, "id" | "capitulos">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();
  const totalUsuariosUnicos = obraId
    ? normalizarNumeroPerfilAutor(totais.comentariosPorObra[obraId], 0)
    : 0;

  if (totalUsuariosUnicos > 0) {
    return totalUsuariosUnicos;
  }

  const totalCapitulos = somarContagensCapitulosPerfilAutor(
    obra,
    totais.comentariosPorCapitulo,
  );
  const totalLocal = obra.capitulos.filter((capitulo) =>
    capitulo.comentario.trim(),
  ).length;

  return Math.max(totalCapitulos, totalLocal);
}

function obterTotalSalvosObraPerfilAutor(
  obra: Pick<ObraLocal, "id" | "capitulos">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();
  const totalUsuariosUnicos = obraId
    ? normalizarNumeroPerfilAutor(totais.salvosPorObra[obraId], 0)
    : 0;

  if (totalUsuariosUnicos > 0) {
    return totalUsuariosUnicos;
  }

  const totalCapitulos = somarContagensCapitulosPerfilAutor(
    obra,
    totais.salvosPorCapitulo,
  );
  const totalLocal = obra.capitulos.filter((capitulo) => capitulo.salvo).length;

  return Math.max(totalCapitulos, totalLocal);
}

function obterTotalConcluidasObraPerfilAutor(
  obra: Pick<ObraLocal, "id">,
  totais: TotaisInteracoesObrasPerfilAutor,
) {
  const obraId = obra.id.trim();

  return obraId
    ? normalizarNumeroPerfilAutor(totais.concluidasPorObra[obraId], 0)
    : 0;
}

function obterIdsUnicosPerfilAutor(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

async function carregarUsuariosTabelaPerfilAutor(
  tabela: string,
  coluna: string,
  ids: string[],
): Promise<UsuariosPorChavePerfilAutor> {
  const idsUnicos = obterIdsUnicosPerfilAutor(ids);
  const usuariosPorChave = new Map<string, Set<string>>();

  if (idsUnicos.length === 0) {
    return {};
  }

  const tamanhoChunk = 80;
  const tamanhoPagina = 1000;

  for (
    let inicioChunk = 0;
    inicioChunk < idsUnicos.length;
    inicioChunk += tamanhoChunk
  ) {
    const idsChunk = idsUnicos.slice(inicioChunk, inicioChunk + tamanhoChunk);
    let inicioPagina = 0;

    while (true) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select(`${coluna},user_id`)
          .in(coluna, idsChunk)
          .range(inicioPagina, inicioPagina + tamanhoPagina - 1);

        if (error || !Array.isArray(data) || data.length === 0) {
          break;
        }

        data.forEach((item: unknown) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return;
          }

          const registro = item as Record<string, unknown>;
          const id = pegarTexto(registro[coluna]);
          const userId = pegarTexto(registro.user_id);

          adicionarUsuarioUnicoPerfilAutor(
            usuariosPorChave,
            id,
            userId,
          );
        });

        if (data.length < tamanhoPagina) {
          break;
        }

        inicioPagina += tamanhoPagina;
      } catch {
        break;
      }
    }
  }

  return converterUsuariosPerfilAutor(usuariosPorChave);
}

async function carregarTotaisInteracoesObrasPerfilAutor(
  obrasParaContar: ObraLocal[],
): Promise<TotaisInteracoesObrasPerfilAutor> {
  const obraIds = obterIdsUnicosPerfilAutor(
    obrasParaContar.map((obra) => obra.id),
  );
  const capituloIds = obterIdsUnicosPerfilAutor(
    obrasParaContar.flatMap((obra) =>
      obra.capitulos.map((capitulo) => capitulo.id),
    ),
  );
  const obraIdPorCapitulo = obrasParaContar.reduce<Record<string, string>>(
    (mapa, obra) => {
      const obraId = obra.id.trim();

      obra.capitulos.forEach((capitulo) => {
        const capituloId = capitulo.id.trim();

        if (obraId && capituloId) {
          mapa[capituloId] = obraId;
        }
      });

      return mapa;
    },
    {},
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return totaisInteracoesObrasPerfilVazio;
  }

  const [
    usuariosCurtidasCapitulos,
    usuariosComentariosCapitulos,
    usuariosSalvosCapitulos,
    usuariosCurtidasObras,
    usuariosComentariosObras,
    usuariosObrasSeguidas,
    usuariosObrasFavoritas,
    usuariosObrasConcluidas,
  ] = await Promise.all([
    carregarUsuariosTabelaPerfilAutor(
      "curtidas_capitulos",
      "capitulo_id",
      capituloIds,
    ),
    carregarUsuariosTabelaPerfilAutor(
      "comentarios_capitulos",
      "capitulo_id",
      capituloIds,
    ),
    carregarUsuariosTabelaPerfilAutor(
      "salvos_capitulos",
      "capitulo_id",
      capituloIds,
    ),
    carregarUsuariosTabelaPerfilAutor("obra_curtidas", "obra_id", obraIds),
    carregarUsuariosTabelaPerfilAutor("comentarios_obras", "obra_id", obraIds),
    carregarUsuariosTabelaPerfilAutor("seguindo_obras", "obra_id", obraIds),
    carregarUsuariosTabelaPerfilAutor("favoritos", "obra_id", obraIds),
    carregarUsuariosTabelaPerfilAutor("concluidas", "obra_id", obraIds),
  ]);

  const usuariosCurtidasCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasPerfilAutor(
      usuariosCurtidasCapitulos,
      obraIdPorCapitulo,
    );
  const usuariosComentariosCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasPerfilAutor(
      usuariosComentariosCapitulos,
      obraIdPorCapitulo,
    );
  const usuariosSalvosCapitulosPorObra =
    mapearUsuariosCapitulosParaObrasPerfilAutor(
      usuariosSalvosCapitulos,
      obraIdPorCapitulo,
    );

  const usuariosCurtidasPorObra = combinarUsuariosPerfilAutor(
    usuariosCurtidasObras,
    usuariosCurtidasCapitulosPorObra,
  );
  const usuariosComentariosPorObra = combinarUsuariosPerfilAutor(
    usuariosComentariosObras,
    usuariosComentariosCapitulosPorObra,
  );
  const usuariosSalvosPorObra = combinarUsuariosPerfilAutor(
    usuariosObrasSeguidas,
    usuariosObrasFavoritas,
    usuariosSalvosCapitulosPorObra,
  );

  return {
    curtidasPorObra: contarUsuariosPerfilAutor(usuariosCurtidasPorObra),
    comentariosPorObra: contarUsuariosPerfilAutor(
      usuariosComentariosPorObra,
    ),
    curtidasPorCapitulo: contarUsuariosPerfilAutor(
      usuariosCurtidasCapitulos,
    ),
    comentariosPorCapitulo: contarUsuariosPerfilAutor(
      usuariosComentariosCapitulos,
    ),
    salvosPorObra: contarUsuariosPerfilAutor(usuariosSalvosPorObra),
    salvosPorCapitulo: contarUsuariosPerfilAutor(
      usuariosSalvosCapitulos,
    ),
    concluidasPorObra: contarUsuariosPerfilAutor(
      usuariosObrasConcluidas,
    ),
  };
}

async function carregarObrasPublicadasSupabase() {
  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,criada_em,atualizado_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (obrasError || !Array.isArray(obrasData)) {
      return [];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as unknown as SupabaseObraRow, index),
    );

    const idsObras = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsObras.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id,obra_id,titulo,ordem,publicado,criado_em,atualizado_em")
        .in("obra_id", idsObras)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(600);

      if (Array.isArray(capitulosData)) {
        const capitulosPorObra = new Map<string, CapituloLocal[]>();

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as unknown as SupabaseCapituloRow,
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

function coletarObraIdsRegistrosDiarioPerfil(
  registros: Record<string, unknown>[],
) {
  return registros
    .map((registro) => pegarTexto(registro.obra_id ?? registro.obraId))
    .filter(Boolean);
}

async function carregarObrasPublicadasPorIdsSupabase(obraIds: string[]) {
  const idsUnicos = Array.from(
    new Set(obraIds.map((obraId) => obraId.trim()).filter(Boolean)),
  );

  if (idsUnicos.length === 0) {
    return [] as ObraLocal[];
  }

  try {
    const { data: obrasData, error: obrasError } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,criada_em,atualizado_em"
      )
      .in("id", idsUnicos)
      .eq("publicado", true)
      .limit(Math.max(idsUnicos.length, 1));

    if (obrasError || !Array.isArray(obrasData)) {
      return [] as ObraLocal[];
    }

    const obrasSupabase = obrasData.map((obra, index) =>
      normalizarObraSupabase(obra as unknown as SupabaseObraRow, index),
    );
    const idsEncontrados = obrasSupabase.map((obra) => obra.id).filter(Boolean);

    if (idsEncontrados.length === 0) {
      return obrasSupabase;
    }

    try {
      const { data: capitulosData } = await supabase
        .from("capitulos")
        .select("id,obra_id,titulo,ordem,publicado,criado_em,atualizado_em")
        .in("obra_id", idsEncontrados)
        .eq("publicado", true)
        .order("ordem", { ascending: true })
        .limit(Math.max(idsEncontrados.length * 20, 1));

      if (Array.isArray(capitulosData)) {
        const capitulosPorObra = new Map<string, CapituloLocal[]>();

        capitulosData.forEach((capitulo, index) => {
          const capituloNormalizado = normalizarCapituloSupabase(
            capitulo as unknown as SupabaseCapituloRow,
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
      // Se capítulos falhar, a Biblioteca ainda mostra a obra salva.
    }

    return obrasSupabase;
  } catch {
    return [] as ObraLocal[];
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
      .eq("user_id", userId)
      .limit(1000);

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
      .eq("user_id", userId)
      .limit(1000);

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
  let progressoCarregado = false;

  try {
    const { data } = await supabase
      .from("comentarios_capitulos")
      .select("capitulo_id, comentario, texto")
      .eq("user_id", userId)
      .limit(1000);

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
    const { data, error } = await supabase
      .from("progresso_leitura")
      .select("capitulo_id,lido,atualizado_em,criado_em")
      .eq("user_id", userId)
      .order("atualizado_em", { ascending: false })
      .limit(1000);

    if (!error && Array.isArray(data)) {
      progressoCarregado = true;

      data.forEach((item) => {
        const registro = item as Record<string, unknown>;
        const capituloId = pegarTexto(registro.capitulo_id);
        const registroLido =
          typeof registro.lido === "boolean" ? registro.lido : true;
        const lidoEm = pegarTexto(
          registro.atualizado_em ??
            registro.criado_em ??
            registro.updated_at ??
            registro.created_at,
        );

        if (capituloId && registroLido && lidoEm) {
          progresso.set(capituloId, lidoEm);
        }
      });
    }
  } catch {
    // Progresso continua apenas localmente se houver erro.
  }

  return {
    curtidas,
    salvos,
    comentarios,
    progresso,
    progressoCarregado,
  };
}

async function carregarEstadoUsuarioSupabase() {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [favoritas, concluidas, obrasSeguidas, autoresSeguidos, interacoes] =
      await Promise.all([
        carregarIdsTabelaUsuario("favoritos", "obra_id", userId),
        carregarIdsTabelaUsuario("concluidas", "obra_id", userId),
        carregarIdsTabelaUsuario("seguindo_obras", "obra_id", userId),
        carregarAutoresSeguidosSupabase(userId),
        carregarInteracoesCapitulosSupabase(userId),
      ]);

    return {
      userId,
      favoritas,
      concluidas,
      obrasSeguidas,
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


function dataDiarioPerfilFormatada(dataIso: string) {
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

function obterApresentacaoTipoDiarioPerfil(tipo: DiarioPerfilItem["tipo"]) {
  if (tipo === "lendo") {
    return { icone: "▶", texto: "Lendo", cor: "var(--historietas-perfil-accent-strong, #FB923C)", fundo: "var(--historietas-perfil-accent-14, rgba(249,115,22,0.14))" };
  }

  if (tipo === "favorita") {
    return { icone: "❤️", texto: "Favorita", cor: "var(--historietas-perfil-rose, #FB7185)", fundo: "var(--historietas-perfil-rose-14, rgba(251,113,133,0.14))" };
  }

  if (tipo === "concluida") {
    return { icone: "✓", texto: "Concluída", cor: "var(--historietas-perfil-success-soft, #86EFAC)", fundo: "var(--historietas-perfil-success-14, rgba(34,197,94,0.14))" };
  }

  if (tipo === "avaliacao") {
    return { icone: "★", texto: "Avaliação", cor: "var(--historietas-perfil-gold, #FBBF24)", fundo: "var(--historietas-perfil-gold-14, rgba(251,191,36,0.14))" };
  }

  if (tipo === "review") {
    return { icone: "✎", texto: "Review", cor: "var(--historietas-perfil-purple-soft, #C084FC)", fundo: "var(--historietas-perfil-purple-soft-14, rgba(192,132,252,0.14))" };
  }

  if (tipo === "quero_ler") {
    return { icone: "+", texto: "Quero ler", cor: "var(--historietas-perfil-blue-soft, #7DD3FC)", fundo: "var(--historietas-perfil-blue-14, rgba(56,189,248,0.14))" };
  }

  return { icone: "●", texto: "Atividade", cor: "#D4D4D8", fundo: "rgba(255,255,255,0.08)" };
}


function criarEstrelaDiarioPerfilStyle(
  estrela: number,
  nota: number,
): CSSProperties {
  const preenchimento =
    nota >= estrela ? "100%" : nota >= estrela - 0.5 ? "50%" : "0%";

  return {
    display: "inline-block",
    fontSize: "13px",
    lineHeight: 1,
    fontWeight: 950,
    color: "transparent",
    backgroundImage: `linear-gradient(90deg, var(--historietas-perfil-gold, #FBBF24) ${preenchimento}, rgba(255,255,255,0.18) ${preenchimento})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  };
}

function normalizarTipoAnotacaoDiarioPerfil(
  valor: unknown,
): DiarioPerfilItem["tipo"] | "" {
  if (
    valor === "lendo" ||
    valor === "quero_ler" ||
    valor === "favorita" ||
    valor === "concluida" ||
    valor === "avaliacao" ||
    valor === "review" ||
    valor === "atividade"
  ) {
    return valor;
  }

  return "";
}

function criarChaveAnotacaoDiarioPerfil(
  obraId: string,
  tipo: DiarioPerfilItem["tipo"],
) {
  return `${obraId.trim()}::${tipo}`;
}

function montarMapaAnotacoesDiarioPerfil(
  registros: Record<string, unknown>[],
  incluirPrivados: boolean,
) {
  const mapa = new Map<string, AnotacaoDiarioPerfil>();

  registros.forEach((registro) => {
    if (!registroDiarioPodeAparecer(registro, incluirPrivados, "privado")) {
      return;
    }

    const obraId = pegarTexto(registro.obra_id ?? registro.obraId);
    const tipo = normalizarTipoAnotacaoDiarioPerfil(registro.tipo);
    const texto = pegarTexto(registro.texto);
    const id = pegarTexto(registro.id);
    const atualizadoEm = obterDataRegistroDiario(registro);
    const visibilidade = obterVisibilidadeRegistroDiario(
      registro,
      "privado",
    );

    if (!obraId || !tipo || !texto) {
      return;
    }

    const chave = criarChaveAnotacaoDiarioPerfil(obraId, tipo);
    const existente = mapa.get(chave);

    if (
      existente &&
      obterTimestampData(existente.atualizadoEm) >=
        obterTimestampData(atualizadoEm)
    ) {
      return;
    }

    mapa.set(chave, {
      id,
      obraId,
      tipo,
      texto,
      visibilidade,
      atualizadoEm,
    });
  });

  return mapa;
}

function aplicarAnotacoesDiarioPerfil(
  itens: DiarioPerfilItem[],
  anotacoes: Map<string, AnotacaoDiarioPerfil>,
) {
  return itens.map((item) => {
    const obraId = item.obra?.id?.trim() || "";

    if (!obraId) {
      return item;
    }

    const anotacao = anotacoes.get(
      criarChaveAnotacaoDiarioPerfil(obraId, item.tipo),
    );

    if (!anotacao) {
      return item;
    }

    return {
      ...item,
      anotacao: anotacao.texto,
      anotacaoId: anotacao.id,
      anotacaoVisibilidade: anotacao.visibilidade,
    };
  });
}

function criarItemDiarioPerfil(
  tipo: DiarioPerfilItem["tipo"],
  obra: ObraLocal,
  data: string,
  descricao: string,
  complemento: Partial<
    Pick<DiarioPerfilItem, "nota" | "progresso" | "visibilidade">
  > = {},
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
  const href = obra
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
    visibilidade: obterVisibilidadeRegistroDiario(
      registro,
      tipoAtividade === "publicou_review" ? "publico" : "privado",
    ),
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

const CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR: Record<string, string> = {
  seguindo_obras: "obra_id,visibilidade,criado_em",
  favoritos: "obra_id,visibilidade,criado_em",
  concluidas: "obra_id,visibilidade,criado_em",
  obra_avaliacoes: "obra_id,nota,criado_em,atualizado_em",
  progresso_leitura: "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
  diario_atividades:
    "id,tipo,texto,nota,obra_id,capitulo_id,metadata,visibilidade,criado_em",
  diario_anotacoes:
    "id,obra_id,tipo,texto,visibilidade,criado_em,atualizado_em",
};

function obterCamposRegistrosDiarioPerfilAutor(tabela: string) {
  return CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR[tabela] || "id";
}

async function carregarRegistrosDiarioPerfil(tabela: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(obterCamposRegistrosDiarioPerfilAutor(tabela))
      .eq("user_id", userId)
      .limit(1000);

    if (error) {
      console.warn(
        `Não consegui carregar ${tabela} no Diário/Biblioteca do perfil:`,
        error.message,
      );

      return [] as Record<string, unknown>[];
    }

    if (!Array.isArray(data)) {
      return [] as Record<string, unknown>[];
    }

    const registros: Record<string, unknown>[] = [];

    data.forEach((registro: unknown) => {
      if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
        return;
      }

      registros.push(registro as Record<string, unknown>);
    });

    return registros;
  } catch {
    return [] as Record<string, unknown>[];
  }
}

async function carregarNomesUsuariosComentariosDiario(
  userIds: string[],
) {
  const idsUnicos = Array.from(
    new Set(userIds.map((userId) => userId.trim()).filter(Boolean)),
  );
  const nomes = new Map<string, string>();

  if (idsUnicos.length === 0) {
    return nomes;
  }

  async function carregarPorColuna(coluna: "user_id" | "id") {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,user_id,nome,nome_usuario,username,display_name,apelido")
        .in(coluna, idsUnicos)
        .limit(Math.max(idsUnicos.length, 1));

      if (error || !Array.isArray(data)) {
        return;
      }

      data.forEach((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return;
        }

        const registro = item as Record<string, unknown>;
        const userId = pegarTexto(registro.user_id);
        const id = pegarTexto(registro.id);
        const nome =
          pegarTexto(registro.nome) ||
          pegarTexto(registro.nome_usuario) ||
          pegarTexto(registro.username) ||
          pegarTexto(registro.display_name) ||
          pegarTexto(registro.apelido) ||
          "Leitor";

        if (userId) {
          nomes.set(userId, nome);
        }

        if (id) {
          nomes.set(id, nome);
        }
      });
    } catch {
      // O comentário continua visível como "Leitor".
    }
  }

  await carregarPorColuna("user_id");
  await carregarPorColuna("id");

  return nomes;
}

async function carregarInteracoesAnotacoesDiario(
  anotacaoIds: string[],
  usuarioAtualId: string,
): Promise<InteracoesAnotacoesDiarioEstado> {
  const idsUnicos = Array.from(
    new Set(anotacaoIds.map((id) => id.trim()).filter(Boolean)),
  );
  const resultado = idsUnicos.reduce<InteracoesAnotacoesDiarioEstado>(
    (estado, anotacaoId) => {
      estado[anotacaoId] = criarInteracaoAnotacaoDiarioVazia();
      return estado;
    },
    {},
  );

  if (idsUnicos.length === 0) {
    return resultado;
  }

  const [curtidasResposta, comentariosResposta] = await Promise.all([
    supabase
      .from("diario_anotacao_curtidas")
      .select("id, anotacao_id, user_id")
      .in("anotacao_id", idsUnicos)
      .limit(1000),
    supabase
      .from("diario_anotacao_comentarios")
      .select("id, anotacao_id, user_id, texto, criado_em, atualizado_em")
      .in("anotacao_id", idsUnicos)
      .order("criado_em", { ascending: true })
      .limit(1000),
  ]);

  if (Array.isArray(curtidasResposta.data)) {
    curtidasResposta.data.forEach((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const anotacaoId = pegarTexto(registro.anotacao_id);
      const userId = pegarTexto(registro.user_id);
      const interacao = resultado[anotacaoId];

      if (!interacao) {
        return;
      }

      interacao.totalCurtidas += 1;

      if (usuarioAtualId && userId === usuarioAtualId) {
        interacao.curtiu = true;
      }
    });
  }

  const comentariosRegistros: Record<string, unknown>[] = Array.isArray(
    comentariosResposta.data,
  )
    ? comentariosResposta.data
        .filter(
          (item) =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item),
        )
        .map((item) => item as Record<string, unknown>)
    : [];
  const nomesUsuarios = await carregarNomesUsuariosComentariosDiario(
    comentariosRegistros
      .map((registro) => pegarTexto(registro.user_id))
      .filter(Boolean),
  );

  comentariosRegistros.forEach((registro) => {
    const anotacaoId = pegarTexto(registro.anotacao_id);
    const userId = pegarTexto(registro.user_id);
    const texto = pegarTexto(registro.texto);
    const id = pegarTexto(registro.id);
    const interacao = resultado[anotacaoId];

    if (!interacao || !id || !texto) {
      return;
    }

    interacao.comentarios.push({
      id,
      anotacaoId,
      userId,
      autorNome: nomesUsuarios.get(userId) || "Leitor",
      texto,
      criadoEm: pegarTexto(
        registro.criado_em ?? registro.atualizado_em,
      ),
    });
  });

  return resultado;
}

function montarDiarioPerfilLocal(
  perfil: AutorPerfil,
  obrasFavoritasIds: string[],
  obrasConcluidasIds: string[],
  obrasSeguidasIds: string[],
  obrasDisponiveis: ObraLocal[] = perfil.obras,
): Omit<DiarioPerfilEstado, "carregando"> {
  const obrasBiblioteca = obrasDisponiveis.length > 0 ? obrasDisponiveis : perfil.obras;

  const lendoAgora = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter((obra) => obra.progressoLeitura > 0 && obra.progressoLeitura < 100)
      .map((obra) =>
        criarItemDiarioPerfil(
          "lendo",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          `Leitura em andamento • ${obra.progressoLeitura}% concluída`,
          { progresso: obra.progressoLeitura, visibilidade: "privado" },
        ),
      ),
  );

  const favoritas = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter((obra) => colecaoTemObraPerfilBiblioteca(obrasFavoritasIds, obra))
      .map((obra) =>
        criarItemDiarioPerfil(
          "favorita",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Obra favoritada no perfil",
          { visibilidade: "parcial" },
        ),
      ),
  );

  const concluidas = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter((obra) => colecaoTemObraPerfilBiblioteca(obrasConcluidasIds, obra))
      .map((obra) =>
        criarItemDiarioPerfil(
          "concluida",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Obra marcada como concluída",
          { visibilidade: "parcial" },
        ),
      ),
  );

  const queroLer = ordenarItensDiarioPerfil(
    obrasBiblioteca
      .filter(
        (obra) =>
          colecaoTemObraPerfilBiblioteca(obrasSeguidasIds, obra) &&
          !colecaoTemObraPerfilBiblioteca(obrasConcluidasIds, obra),
      )
      .map((obra) =>
        criarItemDiarioPerfil(
          "quero_ler",
          obra,
          obra.ultimaLeituraEm || obra.criadaEm,
          "Adicionada para acompanhar depois",
          { visibilidade: "publico" },
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

type DiarioPerfilSemCarregando = Omit<DiarioPerfilEstado, "carregando">;

function criarChaveMesclaDiarioPerfil(item: DiarioPerfilItem) {
  const obraId = item.obra?.id || "";
  const capituloId = item.obra?.ultimoCapituloLidoId || "";

  return [item.tipo, obraId || item.chave, capituloId].join("::");
}

function mesclarItensDiarioPerfil(
  itensPrincipais: DiarioPerfilItem[],
  itensComplementares: DiarioPerfilItem[],
) {
  const mapa = new Map<string, DiarioPerfilItem>();

  [...itensComplementares, ...itensPrincipais].forEach((item) => {
    mapa.set(criarChaveMesclaDiarioPerfil(item), item);
  });

  return ordenarItensDiarioPerfil(Array.from(mapa.values()));
}

function mesclarDiarioPerfilComLocal(
  diarioSupabase: DiarioPerfilSemCarregando,
  diarioLocal: DiarioPerfilSemCarregando,
): DiarioPerfilSemCarregando {
  const lendoAgora = mesclarItensDiarioPerfil(
    diarioSupabase.lendoAgora,
    diarioLocal.lendoAgora,
  );
  const queroLer = mesclarItensDiarioPerfil(
    diarioSupabase.queroLer,
    diarioLocal.queroLer,
  );
  const favoritas = mesclarItensDiarioPerfil(
    diarioSupabase.favoritas,
    diarioLocal.favoritas,
  );
  const concluidas = mesclarItensDiarioPerfil(
    diarioSupabase.concluidas,
    diarioLocal.concluidas,
  );
  const avaliacoes = mesclarItensDiarioPerfil(
    diarioSupabase.avaliacoes,
    diarioLocal.avaliacoes,
  );
  const reviews = mesclarItensDiarioPerfil(
    diarioSupabase.reviews,
    diarioLocal.reviews,
  );
  const atividades = ordenarItensDiarioPerfil(
    Array.from(
      new Map(
        [
          ...lendoAgora,
          ...queroLer,
          ...favoritas,
          ...concluidas,
          ...avaliacoes,
          ...reviews,
          ...diarioSupabase.atividades,
          ...diarioLocal.atividades,
        ].map((item) => [criarChaveMesclaDiarioPerfil(item), item]),
      ).values(),
    ),
  ).slice(0, 8);

  return {
    lendoAgora,
    queroLer,
    favoritas,
    concluidas,
    avaliacoes,
    reviews,
    atividades,
  };
}

async function carregarDiarioPerfilSupabase(
  userId: string,
  obrasDisponiveis: ObraLocal[],
  incluirPrivados: boolean,
): Promise<Omit<DiarioPerfilEstado, "carregando">> {
  const [
    seguindoObras,
    favoritos,
    concluidas,
    progresso,
  ] = incluirPrivados
    ? await Promise.all([
        carregarRegistrosDiarioPerfil("seguindo_obras", userId),
        carregarRegistrosDiarioPerfil("favoritos", userId),
        carregarRegistrosDiarioPerfil("concluidas", userId),
        carregarRegistrosDiarioPerfil("progresso_leitura", userId),
      ])
    : [
        [] as Record<string, unknown>[],
        [] as Record<string, unknown>[],
        [] as Record<string, unknown>[],
        [] as Record<string, unknown>[],
      ];

  const [avaliacoes, diarioAtividades, diarioAnotacoes] = await Promise.all([
    carregarRegistrosDiarioPerfil("obra_avaliacoes", userId),
    carregarRegistrosDiarioPerfil("diario_atividades", userId),
    carregarRegistrosDiarioPerfil("diario_anotacoes", userId),
  ]);

  const idsObrasDiario = Array.from(
    new Set([
      ...coletarObraIdsRegistrosDiarioPerfil(seguindoObras),
      ...coletarObraIdsRegistrosDiarioPerfil(favoritos),
      ...coletarObraIdsRegistrosDiarioPerfil(concluidas),
      ...coletarObraIdsRegistrosDiarioPerfil(avaliacoes),
      ...coletarObraIdsRegistrosDiarioPerfil(progresso),
      ...coletarObraIdsRegistrosDiarioPerfil(diarioAtividades),
      ...coletarObraIdsRegistrosDiarioPerfil(diarioAnotacoes),
    ]),
  );
  const idsObrasDisponiveis = new Set(
    obrasDisponiveis.map((obra) => obra.id).filter(Boolean),
  );
  const idsObrasFaltantes = idsObrasDiario.filter(
    (obraId) => !idsObrasDisponiveis.has(obraId),
  );
  const obrasFaltantes = await carregarObrasPublicadasPorIdsSupabase(
    idsObrasFaltantes,
  );
  const obrasParaDiario = mesclarObrasPorIdSlug(
    obrasDisponiveis,
    obrasFaltantes,
  );
  const { obrasPorId, obrasPorCapituloId } =
    montarMapaObrasDiario(obrasParaDiario);

  const concluidasIds = new Set(
    concluidas
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirPrivados, "parcial"),
      )
      .map((registro) => pegarTexto(registro.obra_id ?? registro.obraId))
      .filter(Boolean),
  );

  const progressoPorObra = new Map<
    string,
    {
      obra: ObraLocal;
      capitulosLidos: Map<string, string>;
      ultimoCapituloLidoId: string;
      ultimaLeituraEm: string;
      visibilidade: VisibilidadeDiarioPerfil;
    }
  >();

  progresso.forEach((registro) => {
    if (!registroDiarioPodeAparecer(registro, incluirPrivados, "privado")) {
      return;
    }

    const registroLido =
      typeof registro.lido === "boolean" ? registro.lido : true;

    if (!registroLido) {
      return;
    }

    const obra = obterObraRegistroDiario(
      registro,
      obrasPorId,
      obrasPorCapituloId,
    );

    if (!obra || concluidasIds.has(obra.id)) {
      return;
    }

    const capituloId = pegarTexto(
      registro.capitulo_id ?? registro.capituloId,
    );
    const capituloPublicado = obra.capitulos.find(
      (capitulo) => capitulo.id === capituloId,
    );

    if (!capituloId || !capituloPublicado) {
      return;
    }

    const data =
      obterDataRegistroDiario(registro) ||
      capituloPublicado.lidoEm ||
      obra.ultimaLeituraEm ||
      obra.criadaEm;
    const grupoAtual = progressoPorObra.get(obra.id) || {
      obra,
      capitulosLidos: new Map<string, string>(),
      ultimoCapituloLidoId: "",
      ultimaLeituraEm: "",
      visibilidade: obterVisibilidadeRegistroDiario(
        registro,
        "privado",
      ),
    };

    grupoAtual.capitulosLidos.set(capituloId, data);

    if (
      obterTimestampData(data) >=
      obterTimestampData(grupoAtual.ultimaLeituraEm)
    ) {
      grupoAtual.ultimoCapituloLidoId = capituloId;
      grupoAtual.ultimaLeituraEm = data;
      grupoAtual.visibilidade = obterVisibilidadeRegistroDiario(
        registro,
        "privado",
      );
    }

    progressoPorObra.set(obra.id, grupoAtual);
  });

  const lendoPorObra = new Map<string, DiarioPerfilItem>();

  progressoPorObra.forEach((grupo, obraId) => {
    const totalCapitulos = grupo.obra.capitulos.length;

    if (totalCapitulos <= 0) {
      return;
    }

    const capitulos = grupo.obra.capitulos.map((capitulo) => {
      const lidoEm = grupo.capitulosLidos.get(capitulo.id) || "";

      return {
        ...capitulo,
        lido: Boolean(lidoEm),
        lidoEm,
      };
    });
    const progressoObra = calcularProgressoLeitura(capitulos);

    if (progressoObra <= 0 || progressoObra >= 100) {
      return;
    }

    const obraComProgresso: ObraLocal = {
      ...grupo.obra,
      capitulos,
      ultimoCapituloLidoId: grupo.ultimoCapituloLidoId,
      ultimaLeituraEm: grupo.ultimaLeituraEm,
      progressoLeitura: progressoObra,
    };

    lendoPorObra.set(
      obraId,
      criarItemDiarioPerfil(
        "lendo",
        obraComProgresso,
        grupo.ultimaLeituraEm || grupo.obra.criadaEm,
        `Leitura em andamento • ${progressoObra}% concluída`,
        {
          progresso: progressoObra,
          visibilidade: grupo.visibilidade,
        },
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

        if (!obra || concluidasIds.has(obra.id)) {
          return null;
        }

        return criarItemDiarioPerfil(
          "quero_ler",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          "Adicionada para acompanhar depois",
          {
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "privado",
            ),
          },
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
          {
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "parcial",
            ),
          },
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
          {
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "parcial",
            ),
          },
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
          {
            nota,
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "publico",
            ),
          },
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

  const anotacoesPorItem = montarMapaAnotacoesDiarioPerfil(
    diarioAnotacoes,
    incluirPrivados,
  );

  return {
    lendoAgora: aplicarAnotacoesDiarioPerfil(
      lendoAgora,
      anotacoesPorItem,
    ),
    queroLer: aplicarAnotacoesDiarioPerfil(
      queroLer,
      anotacoesPorItem,
    ),
    favoritas: aplicarAnotacoesDiarioPerfil(
      favoritas,
      anotacoesPorItem,
    ),
    concluidas: aplicarAnotacoesDiarioPerfil(
      concluidasItens,
      anotacoesPorItem,
    ),
    avaliacoes: aplicarAnotacoesDiarioPerfil(
      avaliacoesItens,
      anotacoesPorItem,
    ),
    reviews: aplicarAnotacoesDiarioPerfil(
      reviews,
      anotacoesPorItem,
    ),
    atividades: aplicarAnotacoesDiarioPerfil(
      atividades,
      anotacoesPorItem,
    ),
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
      .select("id", { count: "exact", head: true })
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


type NotificacaoSocialPerfilAutorPayload = {
  receptorId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string;
  notificacaoId: string;
};

async function criarNotificacaoSocialPerfilAutor({
  receptorId,
  tipo,
  titulo,
  mensagem,
  link,
  notificacaoId,
}: NotificacaoSocialPerfilAutorPayload) {
  const receptorIdLimpo = receptorId.trim();
  const tipoLimpo = tipo.trim();

  if (!receptorIdLimpo || !idAutorSupabaseValido(receptorIdLimpo) || !tipoLimpo) {
    return false;
  }

  try {
    const { error } = await supabase.rpc("criar_notificacao_social", {
      p_user_id: receptorIdLimpo,
      p_tipo: tipoLimpo,
      p_titulo: titulo.trim() || "Nova notificação",
      p_mensagem: mensagem.trim() || "Você recebeu uma nova notificação.",
      p_link: link.trim() || "/notificacoes",
      p_notificacao_id: notificacaoId.trim() || null,
      p_obra_id: null,
      p_capitulo_id: null,
    });

    if (error) {
      console.warn("Não consegui criar notificação social:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Não consegui criar notificação social:", error);
    return false;
  }
}

function DiaryCarouselRow({
  children,
  isDesktop,
  totalItems,
}: {
  children: ReactNode;
  isDesktop: boolean;
  totalItems: number;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const mostrarSetas = isDesktop && totalItems > 3;
  const listStyle = isDesktop
    ? desktopDiaryItemsCarouselStyle
    : diaryItemsCarouselStyle;

  function rolarCarrossel(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 360,
      behavior: "smooth",
    });
  }

  if (!mostrarSetas) {
    return <div style={listStyle}>{children}</div>;
  }

  return (
    <div style={desktopDiaryCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolarCarrossel(-1)}
        style={desktopDiaryCarouselArrowLeftStyle}
        aria-label="Rolar Diário para a esquerda"
      >
        <span style={desktopDiaryCarouselArrowIconStyle}>‹</span>
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolarCarrossel(1)}
        style={desktopDiaryCarouselArrowRightStyle}
        aria-label="Rolar Diário para a direita"
      >
        <span style={desktopDiaryCarouselArrowIconStyle}>›</span>
      </button>
    </div>
  );
}


type MenuPerfilIconeTipo =
  | "painel"
  | "notificacoes"
  | "configuracoes"
  | "link"
  | "sair"
  | "comunidade"
  | "denunciar"
  | "explorar";

function MenuPerfilIcone({ tipo }: { tipo: MenuPerfilIconeTipo }) {
  const iconProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.1,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  } as const;

  if (tipo === "painel") {
    return (
      <svg {...iconProps}>
        <path d="M4 19V5" />
        <path d="M20 19H4" />
        <path d="M8 16V10" />
        <path d="M12 16V7" />
        <path d="M16 16v-4" />
      </svg>
    );
  }

  if (tipo === "notificacoes") {
    return (
      <svg {...iconProps}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }

  if (tipo === "configuracoes") {
    return (
      <svg {...iconProps}>
        <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6A1.65 1.65 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.42.18.72.56.72 1v4c0 .44-.3.82-.72 1Z" />
      </svg>
    );
  }

  if (tipo === "link") {
    return (
      <svg {...iconProps}>
        <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5.03" />
        <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07l1.22-1.22" />
      </svg>
    );
  }

  if (tipo === "sair") {
    return (
      <svg {...iconProps}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    );
  }

  if (tipo === "comunidade") {
    return (
      <svg {...iconProps}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>
    );
  }

  if (tipo === "denunciar") {
    return (
      <svg {...iconProps}>
        <path d="M12 3 3 7v6c0 5 3.8 7.6 9 8 5.2-.4 9-3 9-8V7l-9-4Z" />
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}



type DadosCompartilhamentoPerfilAutor = {
  title?: string;
  text?: string;
  url?: string;
};

type NavegadorCompartilhamentoPerfilAutor = Navigator & {
  share?: (data: DadosCompartilhamentoPerfilAutor) => Promise<void>;
  canShare?: (data: DadosCompartilhamentoPerfilAutor) => boolean;
};

function criarUrlAbsolutaCompartilhamentoPerfilAutor(href: string) {
  const hrefLimpo = href.trim();

  if (typeof window === "undefined") {
    return hrefLimpo;
  }

  try {
    return new URL(hrefLimpo || window.location.href, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}

async function copiarTextoComFallbackPerfilAutor(texto: string) {
  const textoLimpo = texto.trim();

  if (!textoLimpo || typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    if (
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(textoLimpo);
      return true;
    }
  } catch {
    // Continua para o fallback abaixo.
  }

  let campoTemporario: HTMLTextAreaElement | null = null;

  try {
    campoTemporario = document.createElement("textarea");
    campoTemporario.value = textoLimpo;
    campoTemporario.setAttribute("readonly", "true");
    campoTemporario.style.position = "fixed";
    campoTemporario.style.top = "-9999px";
    campoTemporario.style.left = "-9999px";
    campoTemporario.style.width = "1px";
    campoTemporario.style.height = "1px";
    campoTemporario.style.opacity = "0";

    document.body.appendChild(campoTemporario);
    campoTemporario.focus();
    campoTemporario.select();
    campoTemporario.setSelectionRange(0, campoTemporario.value.length);

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    if (campoTemporario?.parentNode) {
      campoTemporario.parentNode.removeChild(campoTemporario);
    }
  }
}

function erroCompartilhamentoFoiCanceladoPerfilAutor(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const nomeErro = "name" in error ? String((error as { name?: unknown }).name || "") : "";

  return nomeErro === "AbortError";
}

export default function PerfilAutorPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [totaisInteracoesObras, setTotaisInteracoesObras] =
    useState<TotaisInteracoesObrasPerfilAutor>(totaisInteracoesObrasPerfilVazio);
  const [autorSelecionado, setAutorSelecionado] = useState("");
  const [autorIdSelecionado, setAutorIdSelecionado] = useState("");
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [topFiveObraIds, setTopFiveObraIds] = useState<string[]>([]);
  const [topFiveCurtidasTotal, setTopFiveCurtidasTotal] = useState(0);
  const [topFiveCurtidoPorMim, setTopFiveCurtidoPorMim] = useState(false);
  const [topFiveCurtidaSalvando, setTopFiveCurtidaSalvando] = useState(false);
  const [mostrarDestaquesVisitante, setMostrarDestaquesVisitante] = useState(false);
  const [perfisAutoresSalvos, setPerfisAutoresSalvos] =
    useState<PerfisAutoresSalvos>({});
  const [avatarErro, setAvatarErro] = useState("");
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [perfilUsuarioRemoto, setPerfilUsuarioRemoto] =
    useState<PerfilUsuarioRemoto | null>(null);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [podeEditarPerfil, setPodeEditarPerfil] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [editorPerfilAberto, setEditorPerfilAberto] = useState(false);
  const [nomePerfilEditor, setNomePerfilEditor] = useState("");
  const [usernamePerfilEditor, setUsernamePerfilEditor] = useState("");
  const [editorSobreAberto, setEditorSobreAberto] = useState(false);
  const [abaPerfil, setAbaPerfil] = useState<AbaPerfilAutor>("obras");
  const [abaBibliotecaPerfil, setAbaBibliotecaPerfil] =
    useState<AbaBibliotecaPerfil>("tudo");
  const [obrasSeguidasBiblioteca, setObrasSeguidasBiblioteca] = useState<string[]>([]);
  const [versaoSincronizacaoBiblioteca, setVersaoSincronizacaoBiblioteca] =
    useState(0);
  const [obraMenuAbertoId, setObraMenuAbertoId] = useState("");
  const [diarioMenuAbertoChave, setDiarioMenuAbertoChave] = useState("");
  const [bibliotecaMenuAbertoChave, setBibliotecaMenuAbertoChave] = useState("");
  const [avaliacaoAutor, setAvaliacaoAutor] =
    useState<AvaliacaoAutorPublica>(avaliacaoAutorVazia);
  const [diarioPerfil, setDiarioPerfil] =
    useState<DiarioPerfilEstado>(diarioPerfilVazio);
  const [editorAnotacaoDiario, setEditorAnotacaoDiario] =
    useState<EditorAnotacaoDiarioEstado>(editorAnotacaoDiarioVazio);
  const [interacoesAnotacoesDiario, setInteracoesAnotacoesDiario] =
    useState<InteracoesAnotacoesDiarioEstado>({});
  const [
    comentariosAnotacaoDiarioAbertoChave,
    setComentariosAnotacaoDiarioAbertoChave,
  ] = useState("");
  const [resumoDiarioAberto, setResumoDiarioAberto] = useState(false);
  const [reviewsDiarioAberto, setReviewsDiarioAberto] = useState(false);
  const [atividadesDiarioAberto, setAtividadesDiarioAberto] = useState(false);
  const [seguindoUsuarioPerfil, setSeguindoUsuarioPerfil] = useState(false);
  const [seguidoresUsuarioPerfilTotal, setSeguidoresUsuarioPerfilTotal] =
    useState(0);
  const [seguindoUsuarioPerfilTotal, setSeguindoUsuarioPerfilTotal] =
    useState(0);
  const [seguirUsuarioSalvando, setSeguirUsuarioSalvando] = useState(false);
  const [denunciaPerfilAberta, setDenunciaPerfilAberta] = useState(false);
  const [motivoDenunciaPerfil, setMotivoDenunciaPerfil] =
    useState<MotivoDenunciaPerfil>("spam");
  const [descricaoDenunciaPerfil, setDescricaoDenunciaPerfil] = useState("");
  const [denunciaPerfilErro, setDenunciaPerfilErro] = useState("");
  const [denunciaPerfilSalvando, setDenunciaPerfilSalvando] = useState(false);
  const seguidoresTotalEstavelRef = useRef<Record<string, number>>({});
  const seguindoTotalEstavelRef = useRef<Record<string, number>>({});

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const timerMensagemAcao = window.setTimeout(() => {
      setMensagemAcao("");
    }, 3000);

    return () => {
      window.clearTimeout(timerMensagemAcao);
    };
  }, [mensagemAcao]);

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

    async function carregarUsuarioAutenticadoPerfil() {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";

        if (componenteAtivo && userId) {
          setUsuarioIdLogado(userId);
        }
      } catch {
        // A aba Biblioteca depende do usuário logado, mas o perfil continua abrindo sem travar.
      }
    }

    void carregarUsuarioAutenticadoPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (componenteAtivo) {
        setUsuarioIdLogado(session?.user?.id || "");
      }
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarTotaisReaisPerfil() {
      if (obras.length === 0) {
        setTotaisInteracoesObras(totaisInteracoesObrasPerfilVazio);
        return;
      }

      const totaisReais = await carregarTotaisInteracoesObrasPerfilAutor(obras);

      if (!cancelado) {
        setTotaisInteracoesObras(totaisReais);
      }
    }

    void carregarTotaisReaisPerfil();

    return () => {
      cancelado = true;
    };
  }, [obras]);


  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPerfilAutor() {
      const params = new URLSearchParams(window.location.search);
      const autorParam = params.get("autor") || "";
      const autorIdParam =
        params.get("autorId") || params.get("id") || params.get("userId") || "";
      const abaParam = normalizarAbaPerfilAutor(params.get("aba"));
      setAbaPerfil(abaParam);
      setAutorSelecionado(autorParam.trim());
      setAutorIdSelecionado(autorIdParam.trim());
      setPodeEditarPerfil(false);

      let obrasNormalizadas: ObraLocal[] = [];
      let autoresSeguidosNormalizados: string[] = [];
      let obrasFavoritasNormalizadas: string[] = [];
      let obrasConcluidasNormalizadas: string[] = [];
      let obrasSeguidasBibliotecaNormalizadas: string[] = [];
      let perfilUsuarioRemotoCarregado: PerfilUsuarioRemoto | null = null;

      const obrasSupabase = await carregarObrasPublicadasSupabase();
      const estadoUsuarioSupabase = await carregarEstadoUsuarioSupabase();
      const usuarioIdAtual = estadoUsuarioSupabase?.userId || "";

      if (usuarioIdAtual) {
        try {
          const obrasSalvasJson = carregarJsonUsuarioPerfilAutor(
            STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasNormalizadas = Array.isArray(obrasSalvasJson)
            ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
                normalizarObra(obra, index),
              )
            : [];

          const autoresSeguidosJson = carregarJsonUsuarioPerfilAutor(
            AUTHOR_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
          );

          autoresSeguidosNormalizados = Array.isArray(autoresSeguidosJson)
            ? autoresSeguidosJson
                .filter(
                  (autor): autor is string =>
                    typeof autor === "string" && Boolean(autor.trim()),
                )
                .map((autor) => normalizarNomeAutor(autor))
            : [];

          obrasFavoritasNormalizadas = carregarListaIdsPerfilBiblioteca(
            FAVORITES_STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasConcluidasNormalizadas = carregarListaIdsPerfilBiblioteca(
            COMPLETED_STORAGE_KEY,
            usuarioIdAtual,
          );

          obrasSeguidasBibliotecaNormalizadas =
            carregarListaIdsPerfilBiblioteca(
              LIBRARY_FOLLOW_STORAGE_KEY,
              usuarioIdAtual,
            );
        } catch {
          obrasNormalizadas = [];
          autoresSeguidosNormalizados = [];
          obrasFavoritasNormalizadas = [];
          obrasConcluidasNormalizadas = [];
          obrasSeguidasBibliotecaNormalizadas = [];
        }
      }

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
        obrasSeguidasBibliotecaNormalizadas = Array.from(
          new Set([
            ...obrasSeguidasBibliotecaNormalizadas,
            ...estadoUsuarioSupabase.obrasSeguidas,
          ]),
        );

        obrasMescladas = aplicarInteracoesNasObras(
          obrasMescladas,
          estadoUsuarioSupabase.interacoes.curtidas,
          estadoUsuarioSupabase.interacoes.salvos,
          estadoUsuarioSupabase.interacoes.comentarios,
          estadoUsuarioSupabase.interacoes.progresso,
          estadoUsuarioSupabase.interacoes.progressoCarregado,
        );
      }

      const idsBibliotecaLocal = Array.from(
        new Set([
          ...obrasFavoritasNormalizadas,
          ...obrasConcluidasNormalizadas,
          ...obrasSeguidasBibliotecaNormalizadas,
        ]),
      ).filter((obraId) => idObraSupabaseValido(obraId));

      if (idsBibliotecaLocal.length > 0) {
        const idsObrasCarregadas = new Set(
          obrasMescladas.map((obra) => obra.id).filter(Boolean),
        );
        const idsObrasBibliotecaFaltantes = idsBibliotecaLocal.filter(
          (obraId) => !idsObrasCarregadas.has(obraId),
        );

        if (idsObrasBibliotecaFaltantes.length > 0) {
          const obrasBibliotecaFaltantes =
            await carregarObrasPublicadasPorIdsSupabase(
              idsObrasBibliotecaFaltantes,
            );

          obrasMescladas = mesclarObrasPorIdSlug(
            obrasMescladas,
            obrasBibliotecaFaltantes,
          );
        }
      }

      if (usuarioIdAtual) {
        try {
          const obrasDoUsuarioParaPersistir = obrasMescladas.filter((obra) =>
            obraPertenceAoUsuarioPerfilAutor(obra, usuarioIdAtual),
          );
          const obrasParaPersistir = mesclarObrasLocalStoragePerfilAutor(
            obrasNormalizadas,
            obrasDoUsuarioParaPersistir,
            usuarioIdAtual,
          );

          salvarJsonUsuarioPerfilAutor(
            STORAGE_KEY,
            usuarioIdAtual,
            obrasParaPersistir,
          );

          salvarJsonUsuarioPerfilAutor(
            AUTHOR_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
            autoresSeguidosNormalizados,
          );
          salvarListaIdsPerfilBiblioteca(
            FAVORITES_STORAGE_KEY,
            usuarioIdAtual,
            obrasFavoritasNormalizadas,
          );
          salvarListaIdsPerfilBiblioteca(
            COMPLETED_STORAGE_KEY,
            usuarioIdAtual,
            obrasConcluidasNormalizadas,
          );
          salvarListaIdsPerfilBiblioteca(
            LIBRARY_FOLLOW_STORAGE_KEY,
            usuarioIdAtual,
            obrasSeguidasBibliotecaNormalizadas,
          );
        } catch {
          // Se o navegador bloquear localStorage, a página ainda usa o estado em memória.
        }
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
      setObrasSeguidasBiblioteca(obrasSeguidasBibliotecaNormalizadas);
      setPerfisAutoresSalvos(carregarPerfisAutores(usuarioIdAtual));
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

        const totalCurtidas = obrasDoAutor.reduce(
          (total, obra) =>
            total + obterTotalCurtidasObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            ),
          0,
        );

        const totalComentarios = obrasDoAutor.reduce(
          (total, obra) =>
            total + obterTotalComentariosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            ),
          0,
        );

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
  }, [obras, totaisInteracoesObras]);

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

  const perfilSemParametro =
    !autorSelecionado.trim() && !autorIdSelecionado.trim();
  const perfilSemLoginSemParametro =
    perfilSemParametro && !usuarioIdLogado.trim();

  const perfilParaMostrar =
    autorSelecionado || autorIdSelecionado
      ? perfilAtual
      : perfilSemLoginSemParametro
        ? null
        : perfilDoUsuarioLogado || perfilUsuarioRemotoComoAutor || null;

  useEffect(() => {
    const perfilAutorId = perfilParaMostrar?.autorId?.trim() || "";
    const topFiveUserId = perfilAutorId || usuarioIdLogado.trim();

    function atualizarTopFivePerfil() {
      setTopFiveObraIds(carregarTopFivePerfilAutor(topFiveUserId));
    }

    atualizarTopFivePerfil();

    if (typeof window === "undefined") {
      return;
    }

    function atualizarQuandoVoltarParaTela() {
      if (document.visibilityState !== "hidden") {
        atualizarTopFivePerfil();
      }
    }

    window.addEventListener("focus", atualizarTopFivePerfil);
    window.addEventListener("storage", atualizarTopFivePerfil);
    document.addEventListener("visibilitychange", atualizarQuandoVoltarParaTela);

    return () => {
      window.removeEventListener("focus", atualizarTopFivePerfil);
      window.removeEventListener("storage", atualizarTopFivePerfil);
      document.removeEventListener(
        "visibilitychange",
        atualizarQuandoVoltarParaTela,
      );
    };
  }, [perfilParaMostrar?.autorId, usuarioIdLogado]);

  useEffect(() => {
    setMostrarDestaquesVisitante(false);
  }, [perfilParaMostrar?.autorId]);

  useEffect(() => {
    const perfilAutorId = perfilParaMostrar?.autorId?.trim() || "";

    if (!perfilAutorId) {
      setTopFiveCurtidasTotal(0);
      setTopFiveCurtidoPorMim(false);
      return;
    }

    let cancelado = false;

    async function atualizarCurtidasTopFive() {
      const estadoLocal = carregarCurtidasTopFiveLocais(
        perfilAutorId,
        usuarioIdLogado,
      );

      setTopFiveCurtidasTotal(estadoLocal.total);
      setTopFiveCurtidoPorMim(estadoLocal.curtiu);

      const estadoRemoto = await carregarCurtidasTopFivePerfil(
        perfilAutorId,
        usuarioIdLogado,
      );

      if (cancelado) {
        return;
      }

      setTopFiveCurtidasTotal(estadoRemoto.total);
      setTopFiveCurtidoPorMim(estadoRemoto.curtiu);
    }

    void atualizarCurtidasTopFive();

    if (typeof window === "undefined") {
      return () => {
        cancelado = true;
      };
    }

    window.addEventListener("focus", atualizarCurtidasTopFive);
    window.addEventListener("storage", atualizarCurtidasTopFive);

    return () => {
      cancelado = true;
      window.removeEventListener("focus", atualizarCurtidasTopFive);
      window.removeEventListener("storage", atualizarCurtidasTopFive);
    };
  }, [perfilParaMostrar?.autorId, usuarioIdLogado]);

  const perfilPertenceAoUsuario = useMemo(() => {
    const usuarioIdNormalizado = usuarioIdLogado.trim().toLowerCase();
    const autorIdPerfilNormalizado =
      perfilParaMostrar?.autorId.trim().toLowerCase() || "";
    const autorIdUrlNormalizado = autorIdSelecionado.trim().toLowerCase();
    const perfilSemParametro =
      !autorSelecionado.trim() && !autorIdSelecionado.trim();

    return Boolean(
      usuarioIdNormalizado &&
        (perfilSemParametro ||
          autorIdPerfilNormalizado === usuarioIdNormalizado ||
          autorIdUrlNormalizado === usuarioIdNormalizado),
    );
  }, [perfilParaMostrar, autorIdSelecionado, autorSelecionado, usuarioIdLogado]);

  const bibliotecaPerfilVisivel = perfilPertenceAoUsuario;

  useEffect(() => {
    setPodeEditarPerfil(perfilPertenceAoUsuario);
  }, [perfilPertenceAoUsuario]);

  useEffect(() => {
    if (!bibliotecaPerfilVisivel && abaPerfil === "biblioteca") {
      setAbaPerfil("obras");
    }
  }, [bibliotecaPerfilVisivel, abaPerfil]);

  useEffect(() => {
    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";

    if (!perfilUserId || !idAutorSupabaseValido(perfilUserId)) {
      setSeguindoUsuarioPerfil(false);
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

      const seguidoresMinimoPorEstadoAtual = estadoSeguimento.seguindo ? 1 : 0;
      const seguidoresTotalSeguro = Math.max(
        estadoSeguimento.seguidoresTotal,
        seguidoresMinimoPorEstadoAtual,
        seguidoresTotalEstavelRef.current[perfilUserId] || 0,
      );
      const seguindoTotalSeguro = Math.max(
        estadoSeguimento.seguindoTotal,
        seguindoTotalEstavelRef.current[perfilUserId] || 0,
      );

      seguidoresTotalEstavelRef.current[perfilUserId] = seguidoresTotalSeguro;
      seguindoTotalEstavelRef.current[perfilUserId] = seguindoTotalSeguro;

      setSeguindoUsuarioPerfil(estadoSeguimento.seguindo);
      setSeguidoresUsuarioPerfilTotal(seguidoresTotalSeguro);
      setSeguindoUsuarioPerfilTotal(seguindoTotalSeguro);
    }

    void carregarSeguimentoUsuario();

    return () => {
      cancelado = true;
    };
  }, [perfilParaMostrar?.autorId, usuarioIdLogado]);

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
  const chaveSeguimentoPerfil =
    perfilUserIdParaSeguir || autorChavePerfil || autorNormalizadoParaSeguir;
  const seguindoPerfilAtual = podeUsarSeguimentoUsuario
    ? seguindoUsuarioPerfil
    : seguindoAutor;
  const seguidoresTotal = useMemo(() => {
    const totalMinimoPorSeguimentoAtual =
      seguindoPerfilAtual || seguindoUsuarioPerfil || seguindoAutor ? 1 : 0;
    const totalAtual = podeUsarSeguimentoUsuario
      ? Math.max(
          seguidoresUsuarioPerfilTotal,
          totalMinimoPorSeguimentoAtual,
        )
      : seguindoAutor
        ? 1
        : 0;

    if (!chaveSeguimentoPerfil) {
      return totalAtual;
    }

    const ultimoTotalValido =
      seguidoresTotalEstavelRef.current[chaveSeguimentoPerfil] || 0;
    const totalSeguro = Math.max(totalAtual, ultimoTotalValido);

    seguidoresTotalEstavelRef.current[chaveSeguimentoPerfil] = totalSeguro;

    return totalSeguro;
  }, [
    chaveSeguimentoPerfil,
    podeUsarSeguimentoUsuario,
    seguidoresUsuarioPerfilTotal,
    seguindoPerfilAtual,
    seguindoUsuarioPerfil,
    seguindoAutor,
  ]);
  const seguindoTotalPerfil = useMemo(() => {
    const totalAtual = podeUsarSeguimentoUsuario
      ? Math.max(
          seguindoUsuarioPerfilTotal,
          podeEditarPerfil ? autoresSeguidos.length : 0,
        )
      : podeEditarPerfil
        ? autoresSeguidos.length
        : 0;

    if (!chaveSeguimentoPerfil) {
      return totalAtual;
    }

    const ultimoTotalValido =
      seguindoTotalEstavelRef.current[chaveSeguimentoPerfil] || 0;
    const totalSeguro = Math.max(totalAtual, ultimoTotalValido);

    if (totalSeguro > 0) {
      seguindoTotalEstavelRef.current[chaveSeguimentoPerfil] = totalSeguro;
    }

    return totalSeguro;
  }, [
    chaveSeguimentoPerfil,
    podeUsarSeguimentoUsuario,
    seguindoUsuarioPerfilTotal,
    podeEditarPerfil,
    autoresSeguidos.length,
  ]);
  const seguidoresPerfilHref = podeEditarPerfil
    ? "/seguindo?conteudo=seguidores"
    : criarHrefListaSeguimentoPerfilAutor(
        "seguidores",
        perfilParaMostrar,
      );
  const seguindoPerfilHref = podeEditarPerfil
    ? "/seguindo?conteudo=pessoas"
    : criarHrefListaSeguimentoPerfilAutor(
        "seguindo",
        perfilParaMostrar,
      );
  const obrasSeguidasPerfilHref = "/seguindo?conteudo=obras";
  const obrasConcluidasPerfilPorObrasDoAutor = perfilParaMostrar
    ? perfilParaMostrar.obras.reduce((total, obra) => {
        const totalConcluidasReais = obterTotalConcluidasObraPerfilAutor(
          obra,
          totaisInteracoesObras,
        );
        const concluidaLocal = colecaoTemObraPerfilBiblioteca(
          obrasConcluidas,
          obra,
        )
          ? 1
          : 0;

        return total + Math.max(totalConcluidasReais, concluidaLocal);
      }, 0)
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
    ? criarHandlePerfilAutor(
        perfilParaMostrar.nome,
        perfilParaMostrar.autorId,
        perfilUsuarioRemotoAtivo?.username || "",
      )
    : "@autor.historietas";
  const avatarAutor = perfilSalvoAutor.avatar || perfilUsuarioRemotoAtivo?.avatar || "";

  useEffect(() => {
    if (!editorPerfilAberto || !podeEditarPerfil || !perfilParaMostrar) {
      return;
    }

    setNomePerfilEditor("");
    setUsernamePerfilEditor(perfilUsuarioRemotoAtivo?.username || "");
  }, [
    editorPerfilAberto,
    podeEditarPerfil,
    perfilParaMostrar?.autorId,
    perfilParaMostrar?.nome,
    perfilUsuarioRemotoAtivo?.nome,
    perfilUsuarioRemotoAtivo?.username,
  ]);

  const caracteresRestantesBio = BIO_MAX_LENGTH - bioAutorPersonalizada.length;
  const caracteresRestantesBioSobre =
    SOBRE_BIO_MAX_LENGTH - bioSobrePersonalizada.length;
  const autorPodeReceberAvaliacao = Boolean(
    perfilParaMostrar && perfilParaMostrar.obras.length > 0,
  );

  const obrasDoPerfilFiltradas = useMemo(() => {
    if (!perfilParaMostrar) {
      return [];
    }

    return [...perfilParaMostrar.obras].sort(
      (obraA, obraB) =>
        obterTimestampData(obraB.criadaEm) - obterTimestampData(obraA.criadaEm),
    );
  }, [perfilParaMostrar]);

  const obrasEmDestaque = useMemo(() => {
    if (topFiveObraIds.length === 0) {
      return [] as ObraLocal[];
    }

    const obrasDisponiveis = mesclarObrasPorIdSlug(
      obras,
      perfilParaMostrar?.obras || [],
    );
    const obrasSelecionadas = new Map<string, ObraLocal>();

    topFiveObraIds.forEach((obraId) => {
      const obraEncontrada = encontrarObraPorIdentificadorTopFivePerfil(
        obrasDisponiveis,
        obraId,
      );

      if (!obraEncontrada) {
        return;
      }

      const chaveObra =
        obraEncontrada.id.trim() ||
        obraEncontrada.slug.trim() ||
        normalizarTexto(obraEncontrada.titulo);

      if (chaveObra && !obrasSelecionadas.has(chaveObra)) {
        obrasSelecionadas.set(chaveObra, obraEncontrada);
      }
    });

    return Array.from(obrasSelecionadas.values()).slice(0, TOP_FIVE_MAXIMO);
  }, [obras, perfilParaMostrar?.obras, topFiveObraIds]);

  const destaquesPerfilVisivel = podeEditarPerfil
    ? perfilSalvoAutor.mostrarDestaques
    : mostrarDestaquesVisitante;

  async function alternarCurtidaTopFivePerfil() {
    const perfilAutorId = perfilParaMostrar?.autorId?.trim() || "";
    const usuarioId = usuarioIdLogado.trim();

    if (!perfilAutorId) {
      return;
    }

    if (!usuarioId) {
      setMensagemAcao("Entre para curtir o TOP 5 deste perfil.");
      return;
    }

    if (topFiveCurtidaSalvando) {
      return;
    }

    const proximaCurtida = !topFiveCurtidoPorMim;

    setTopFiveCurtidaSalvando(true);
    setTopFiveCurtidoPorMim(proximaCurtida);
    setTopFiveCurtidasTotal((totalAtual) =>
      Math.max(0, totalAtual + (proximaCurtida ? 1 : -1)),
    );
    salvarCurtidaTopFiveLocal(perfilAutorId, usuarioId, proximaCurtida);

    const salvouRemoto = await salvarCurtidaTopFiveSupabase(
      perfilAutorId,
      usuarioId,
      proximaCurtida,
    );

    if (salvouRemoto) {
      const estadoAtualizado = await carregarCurtidasTopFivePerfil(
        perfilAutorId,
        usuarioId,
      );

      setTopFiveCurtidasTotal(estadoAtualizado.total);
      setTopFiveCurtidoPorMim(estadoAtualizado.curtiu);
    }

    setTopFiveCurtidaSalvando(false);
  }

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
      const bibliotecaUsaUsuarioLogado =
        bibliotecaPerfilVisivel &&
        abaPerfil === "biblioteca" &&
        Boolean(usuarioIdLogado.trim());
      const userIdFonteDiario = bibliotecaUsaUsuarioLogado
        ? usuarioIdLogado.trim()
        : userIdPerfil;
      const incluirItensPrivados = bibliotecaUsaUsuarioLogado || podeEditarPerfil;

      setDiarioPerfil({
        ...diarioPerfilVazio,
        carregando: true,
      });

      const diarioLocal = incluirItensPrivados
        ? montarDiarioPerfilLocal(
            perfilDiario,
            obrasFavoritas,
            obrasConcluidas,
            obrasSeguidasBiblioteca,
            obras,
          )
        : criarEstadoDiarioPerfilVazio();

      if (!userIdFonteDiario || !idAutorSupabaseValido(userIdFonteDiario)) {
        if (!cancelado) {
          setDiarioPerfil({
            carregando: false,
            ...diarioLocal,
          });
        }

        return;
      }

      const diarioSupabase = await carregarDiarioPerfilSupabase(
        userIdFonteDiario,
        obras,
        incluirItensPrivados,
      );
      const diarioFinal = incluirItensPrivados
        ? mesclarDiarioPerfilComLocal(diarioSupabase, diarioLocal)
        : diarioSupabase;

      if (!cancelado) {
        setDiarioPerfil({
          carregando: false,
          ...diarioFinal,
        });
      }
    }

    void carregarDiarioPerfil();

    return () => {
      cancelado = true;
    };
  }, [
    perfilParaMostrar,
    obras,
    obrasFavoritas,
    obrasConcluidas,
    obrasSeguidasBiblioteca,
    podeEditarPerfil,
    bibliotecaPerfilVisivel,
    abaPerfil,
    usuarioIdLogado,
    versaoSincronizacaoBiblioteca,
  ]);

  const anotacoesInterativasIds = useMemo(() => {
    const itens = [
      ...diarioPerfil.lendoAgora,
      ...diarioPerfil.queroLer,
      ...diarioPerfil.favoritas,
      ...diarioPerfil.concluidas,
      ...diarioPerfil.avaliacoes,
      ...diarioPerfil.reviews,
      ...diarioPerfil.atividades,
    ];

    return Array.from(
      new Set(
        itens
          .filter(
            (item) =>
              Boolean(item.anotacaoId?.trim()) &&
              item.anotacaoVisibilidade !== "privado",
          )
          .map((item) => item.anotacaoId?.trim() || "")
          .filter(Boolean),
      ),
    ).sort();
  }, [diarioPerfil]);

  useEffect(() => {
    let cancelado = false;

    async function carregarInteracoes() {
      if (anotacoesInterativasIds.length === 0) {
        setInteracoesAnotacoesDiario({});
        return;
      }

      setInteracoesAnotacoesDiario((estadoAtual) => {
        return anotacoesInterativasIds.reduce<InteracoesAnotacoesDiarioEstado>(
          (novoEstado, anotacaoId) => {
            const anterior = estadoAtual[anotacaoId];

            novoEstado[anotacaoId] = {
              ...criarInteracaoAnotacaoDiarioVazia(true),
              novoComentario: anterior?.novoComentario || "",
            };

            return novoEstado;
          },
          {},
        );
      });

      const interacoes = await carregarInteracoesAnotacoesDiario(
        anotacoesInterativasIds,
        usuarioIdLogado,
      );

      if (cancelado) {
        return;
      }

      setInteracoesAnotacoesDiario((estadoAtual) => {
        return Object.entries(interacoes).reduce<InteracoesAnotacoesDiarioEstado>(
          (novoEstado, [anotacaoId, interacao]) => {
            const anterior = estadoAtual[anotacaoId];

            novoEstado[anotacaoId] = {
              ...interacao,
              novoComentario: anterior?.novoComentario || "",
            };

            return novoEstado;
          },
          {},
        );
      });
    }

    void carregarInteracoes();

    return () => {
      cancelado = true;
    };
  }, [anotacoesInterativasIds, usuarioIdLogado]);

  const totalLeiturasDiario = diarioPerfil.lendoAgora.length;
  const totalQueroLerDiario = diarioPerfil.queroLer.length;
  const totalFavoritasDiario = diarioPerfil.favoritas.length;
  const totalConcluidasDiario = diarioPerfil.concluidas.length;
  const totalAvaliacoesDiario = diarioPerfil.avaliacoes.length;
  const totalReviewsDiario = diarioPerfil.reviews.length;
  useEffect(() => {
    if (!perfilParaMostrar || !autorPodeReceberAvaliacao) {
      setAvaliacaoAutor(avaliacaoAutorVazia);
      return;
    }

    const perfilAtualAutor = perfilParaMostrar;
    const notaLocal = obterAvaliacaoAutorLocal(
      perfilAtualAutor,
      usuarioIdLogado,
    );

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
          .eq("autor_id", autorId)
          .limit(1000);

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

  const obraMenuAberta = useMemo(() => {
    if (!obraMenuAbertoId) {
      return null;
    }

    return (
      obrasDoPerfilFiltradas.find((obra) => obra.id === obraMenuAbertoId) ||
      null
    );
  }, [obraMenuAbertoId, obrasDoPerfilFiltradas]);

  const diarioMenuAberto = useMemo(() => {
    if (!diarioMenuAbertoChave) {
      return null;
    }

    const itensDiario = [
      ...diarioPerfil.lendoAgora,
      ...diarioPerfil.queroLer,
      ...diarioPerfil.favoritas,
      ...diarioPerfil.concluidas,
      ...diarioPerfil.avaliacoes,
      ...diarioPerfil.reviews,
      ...diarioPerfil.atividades,
    ];

    return (
      itensDiario.find((item) => item.chave === diarioMenuAbertoChave) || null
    );
  }, [diarioMenuAbertoChave, diarioPerfil]);


  const itensBibliotecaQueroLer = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.queroLer,
      "quero-ler",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.queroLer]);

  const itensBibliotecaLendoAgora = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.lendoAgora,
      "lendo-agora",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.lendoAgora]);

  const itensBibliotecaFavoritas = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.favoritas,
      "favorita",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.favoritas]);

  const itensBibliotecaConcluidas = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterItensDiarioParaBiblioteca(
      diarioPerfil.concluidas,
      "concluida",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.concluidas]);

  const itensBibliotecaHistorico = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    const atividadesLeitura = diarioPerfil.atividades.filter(
      (item) => item.tipo === "lendo",
    );

    return converterItensDiarioParaBiblioteca(
      atividadesLeitura,
      "historico",
    );
  }, [bibliotecaPerfilVisivel, diarioPerfil.atividades]);

  const itensBibliotecaSalvos = useMemo(() => {
    if (!bibliotecaPerfilVisivel) {
      return [] as ItemBibliotecaPerfil[];
    }

    return converterCapitulosSalvosParaBiblioteca(obras);
  }, [bibliotecaPerfilVisivel, obras]);

  const obrasSeguidasPerfilTotal = useMemo(() => {
    const totalPorObrasCarregadas = obras.filter((obra) =>
      colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, obra),
    ).length;

    return Math.max(totalPorObrasCarregadas, itensBibliotecaQueroLer.length);
  }, [obras, obrasSeguidasBiblioteca, itensBibliotecaQueroLer.length]);

  const obrasConcluidasPerfilTotal = useMemo(() => {
    const totalPorObrasCarregadas = obras.filter((obra) =>
      colecaoTemObraPerfilBiblioteca(obrasConcluidas, obra),
    ).length;

    return Math.max(
      obrasConcluidasPerfilPorObrasDoAutor,
      totalPorObrasCarregadas,
      itensBibliotecaConcluidas.length,
    );
  }, [
    obras,
    obrasConcluidas,
    obrasConcluidasPerfilPorObrasDoAutor,
    itensBibliotecaConcluidas.length,
  ]);

  const itensBibliotecaAtivos = useMemo(() => {
    if (abaBibliotecaPerfil === "quero-ler") {
      return itensBibliotecaQueroLer;
    }

    if (abaBibliotecaPerfil === "lendo-agora") {
      return itensBibliotecaLendoAgora;
    }

    if (abaBibliotecaPerfil === "favoritas") {
      return itensBibliotecaFavoritas;
    }

    if (abaBibliotecaPerfil === "concluidas") {
      return itensBibliotecaConcluidas;
    }

    if (abaBibliotecaPerfil === "salvos") {
      return itensBibliotecaSalvos;
    }

    if (abaBibliotecaPerfil === "historico") {
      return itensBibliotecaHistorico;
    }

    return mesclarItensBibliotecaPerfil(
      itensBibliotecaQueroLer,
      itensBibliotecaLendoAgora,
      itensBibliotecaFavoritas,
      itensBibliotecaConcluidas,
      itensBibliotecaSalvos,
      itensBibliotecaHistorico,
    );
  }, [
    abaBibliotecaPerfil,
    itensBibliotecaConcluidas,
    itensBibliotecaFavoritas,
    itensBibliotecaHistorico,
    itensBibliotecaLendoAgora,
    itensBibliotecaQueroLer,
    itensBibliotecaSalvos,
  ]);

  const bibliotecaMenuAberto = useMemo(() => {
    if (!bibliotecaMenuAbertoChave) {
      return null;
    }

    return (
      itensBibliotecaAtivos.find(
        (item) => item.chave === bibliotecaMenuAbertoChave,
      ) || null
    );
  }, [bibliotecaMenuAbertoChave, itensBibliotecaAtivos]);

  const rotuloBibliotecaAtiva =
    abaBibliotecaPerfil === "tudo"
      ? "todos os itens"
      : abaBibliotecaPerfil === "quero-ler"
        ? "quero ler"
        : abaBibliotecaPerfil === "lendo-agora"
          ? "lendo agora"
          : abaBibliotecaPerfil === "favoritas"
            ? "na lista"
            : abaBibliotecaPerfil === "concluidas"
              ? "concluídas"
              : abaBibliotecaPerfil === "salvos"
                ? "capítulos salvos"
                : "histórico";

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
  const profileVisitorActionsAtualStyle = isDesktop
    ? desktopProfileVisitorActionsStyle
    : profileVisitorActionsStyle;
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

    if (usuarioIdLogado.trim()) {
      salvarJsonUsuarioPerfilAutor(
        AUTHOR_PROFILE_STORAGE_KEY,
        usuarioIdLogado,
        novosPerfis,
      );
    }

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
        username: perfilUsuarioRemotoAtivo?.username || "",
        avatar: perfilNormalizado.avatar,
        bio: perfilNormalizado.bio,
        sobreBio: perfilNormalizado.sobreBio,
        criadoEm: perfilUsuarioRemotoAtivo?.criadoEm || "",
      });

      void salvarPerfilUsuarioSupabase({
        userId: perfilUserId,
        nome: nomePerfil,
        perfil: perfilNormalizado,
        username: perfilUsuarioRemotoAtivo?.username || undefined,
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
      setNomePerfilEditor("");
      return;
    }

    if (nomeFinal === perfilParaMostrar.nome && nomeFinal === perfilUsuarioRemotoAtivo?.nome) {
      setNomePerfilEditor("");
      return;
    }

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
      username: perfilUsuarioRemotoAtivo?.username || "",
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
      const obrasSalvasJson = carregarJsonUsuarioPerfilAutor(
        STORAGE_KEY,
        perfilUserId,
      );
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

      salvarJsonUsuarioPerfilAutor(
        STORAGE_KEY,
        perfilUserId,
        obrasLocaisAtualizadas,
      );
    } catch {
      // Se o localStorage falhar, a alteração em profiles ainda continua.
    }

    const [resultadoPerfil, resultadoObras] = await Promise.all([
      salvarPerfilUsuarioSupabase({
        userId: perfilUserId,
        nome: nomeFinal,
        perfil: perfilNormalizado,
        username: perfilUsuarioRemotoAtivo?.username || undefined,
      }),
      sincronizarNomeAutorObrasSupabase(perfilUserId, nomeFinal),
    ]);

    if (!resultadoPerfil.ok) {
      setNomePerfilEditor("");
      setMensagemAcao(
        `Nome salvo neste aparelho. Supabase: ${resultadoPerfil.erro}`,
      );
      return;
    }

    if (!resultadoObras.ok) {
      setNomePerfilEditor("");
      setMensagemAcao(
        `Nome do perfil atualizado. Obras locais atualizadas; Supabase obras: ${resultadoObras.erro}`,
      );
      return;
    }

    setNomePerfilEditor("");
    setMensagemAcao("Nome do perfil atualizado.");
  }

  async function salvarUsernamePerfilAutor(usernameAtualizado: string) {
    const usernameDigitado = usernameAtualizado.trim();
    const usernameFinal = usernameDigitado
      ? normalizarUsernamePerfilAutor(usernameDigitado)
      : "";
    const usernameAtual = perfilUsuarioRemotoAtivo?.username || "";
    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";
    const usuarioIdAtual = usuarioIdLogado.trim();

    if (!podeEditarPerfil || !perfilParaMostrar || !perfilUserId || !usuarioIdAtual) {
      return;
    }

    if (perfilUserId.toLowerCase() !== usuarioIdAtual.toLowerCase()) {
      return;
    }

    if (usernameDigitado && usernameFinal.length < 3) {
      setMensagemAcao("O @username precisa ter pelo menos 3 caracteres.");
      setUsernamePerfilEditor(usernameAtual);
      return;
    }

    if (usernameFinal === usernameAtual) {
      setUsernamePerfilEditor(usernameFinal);
      return;
    }

    setUsernamePerfilEditor(usernameFinal);
    setMensagemAcao(usernameFinal ? "Salvando @username..." : "Removendo @username...");

    const nomePerfil = nomePerfilEditor.trim().replace(/\s+/g, " ").slice(0, 80) ||
      perfilUsuarioRemotoAtivo?.nome ||
      perfilParaMostrar.nome ||
      "Usuário";
    const perfilNormalizado: PerfilAutorSalvo = {
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    };

    const resultado = await salvarPerfilUsuarioSupabase({
      userId: perfilUserId,
      nome: nomePerfil,
      perfil: perfilNormalizado,
      username: usernameFinal || null,
    });

    if (!resultado.ok) {
      const erro = resultado.erro.toLowerCase();

      if (
        erro.includes("profiles_username_unique") ||
        erro.includes("duplicate key") ||
        erro.includes("unique")
      ) {
        setMensagemAcao("Esse @username já está em uso.");
      } else {
        setMensagemAcao(`Não consegui salvar o @username. Supabase: ${resultado.erro}`);
      }

      setUsernamePerfilEditor(usernameAtual);
      return;
    }

    setPerfilUsuarioRemoto({
      userId: perfilUserId,
      nome: nomePerfil,
      username: usernameFinal,
      avatar: avatarAutor,
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      criadoEm: perfilUsuarioRemotoAtivo?.criadoEm || "",
    });

    setMensagemAcao(usernameFinal ? "@username atualizado." : "@username removido.");
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
    salvarAvaliacaoAutorLocal(
      perfilParaMostrar,
      notaNormalizada,
      usuarioIdLogado,
    );

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
      setAvatarErro("A imagem precisa ter no máximo 1 MB.");
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

  async function compartilharLinkPerfilAutor({
    url,
    titulo,
    texto,
    mensagemCompartilhado,
    mensagemCopiado,
    mensagemErro,
  }: {
    url: string;
    titulo: string;
    texto: string;
    mensagemCompartilhado: string;
    mensagemCopiado: string;
    mensagemErro: string;
  }) {
    const urlFinal = criarUrlAbsolutaCompartilhamentoPerfilAutor(url);
    const dadosCompartilhamento: DadosCompartilhamentoPerfilAutor = {
      title: titulo,
      text: texto,
      url: urlFinal,
    };
    const navegadorCompartilhamento =
      navigator as NavegadorCompartilhamentoPerfilAutor;

    if (typeof navegadorCompartilhamento.share === "function") {
      try {
        if (
          !navegadorCompartilhamento.canShare ||
          navegadorCompartilhamento.canShare(dadosCompartilhamento)
        ) {
          await navegadorCompartilhamento.share(dadosCompartilhamento);
          setMensagemAcao(mensagemCompartilhado);
          return;
        }
      } catch (error) {
        if (erroCompartilhamentoFoiCanceladoPerfilAutor(error)) {
          return;
        }
      }
    }

    const linkCopiado = await copiarTextoComFallbackPerfilAutor(urlFinal);

    setMensagemAcao(linkCopiado ? mensagemCopiado : mensagemErro);
  }

  async function copiarLinkPerfil() {
    setMenuPerfilAberto(false);

    const nomePerfil = perfilParaMostrar?.nome || "este autor";
    const usernamePerfil = perfilUsuarioRemotoAtivo?.username
      ? ` (@${perfilUsuarioRemotoAtivo.username})`
      : "";

    await compartilharLinkPerfilAutor({
      url: window.location.href,
      titulo: `${nomePerfil} no HISTORIETAS`,
      texto: `Confira o perfil de ${nomePerfil}${usernamePerfil} no HISTORIETAS.`,
      mensagemCompartilhado: "Compartilhamento do perfil aberto.",
      mensagemCopiado: "Link do perfil copiado.",
      mensagemErro:
        "Não consegui compartilhar nem copiar o link do perfil neste navegador.",
    });
  }

  function abrirDenunciaPerfil() {
    if (podeEditarPerfil) {
      return;
    }

    setMenuPerfilAberto(false);
    setDenunciaPerfilErro("");
    setMensagemAcao("");
    setDenunciaPerfilAberta(true);
  }

  function fecharDenunciaPerfil() {
    if (denunciaPerfilSalvando) {
      return;
    }

    setDenunciaPerfilAberta(false);
    setDenunciaPerfilErro("");
  }

  async function enviarDenunciaPerfil() {
    if (!perfilParaMostrar || podeEditarPerfil || denunciaPerfilSalvando) {
      return;
    }

    const perfilDenunciadoId = perfilParaMostrar.autorId.trim();

    if (!perfilDenunciadoId || !idAutorSupabaseValido(perfilDenunciadoId)) {
      setDenunciaPerfilErro("Não foi possível identificar este perfil.");
      return;
    }

    setDenunciaPerfilSalvando(true);
    setDenunciaPerfilErro("");

    try {
      const { data } = await supabase.auth.getUser();
      const denuncianteId = data.user?.id || usuarioIdLogado.trim();

      if (!denuncianteId) {
        setDenunciaPerfilSalvando(false);
        setDenunciaPerfilAberta(false);
        avisarLoginNecessario("Entre na sua conta para denunciar este perfil.");
        return;
      }

      if (denuncianteId === perfilDenunciadoId) {
        setDenunciaPerfilSalvando(false);
        setDenunciaPerfilErro("Você não pode denunciar o próprio perfil.");
        return;
      }

      const descricao = descricaoDenunciaPerfil
        .trim()
        .slice(0, DENUNCIA_PERFIL_DESCRICAO_MAX_LENGTH);
      const perfilUrl =
        typeof window !== "undefined"
          ? criarUrlAbsolutaCompartilhamentoPerfilAutor(window.location.href)
          : "";

      const { error } = await supabase.from("denuncias_perfis").insert({
        denunciante_id: denuncianteId,
        denunciado_id: perfilDenunciadoId,
        perfil_nome: perfilParaMostrar.nome,
        perfil_url: perfilUrl,
        motivo: motivoDenunciaPerfil,
        descricao,
        status: "pendente",
        criado_em: new Date().toISOString(),
      });

      if (error) {
        setDenunciaPerfilErro(
          "Não consegui enviar a denúncia agora. Verifique se a tabela denuncias_perfis já existe no Supabase.",
        );
        setDenunciaPerfilSalvando(false);
        return;
      }

      setDenunciaPerfilAberta(false);
      setMotivoDenunciaPerfil("spam");
      setDescricaoDenunciaPerfil("");
      setDenunciaPerfilSalvando(false);
      setMensagemAcao("Denúncia enviada para análise.");
    } catch {
      setDenunciaPerfilErro("Não consegui enviar a denúncia agora.");
      setDenunciaPerfilSalvando(false);
    }
  }

  async function compartilharObraPerfilAutor(obra: ObraLocal) {
    setObraMenuAbertoId("");

    const obraHref =
      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;

    await compartilharLinkPerfilAutor({
      url: obraHref,
      titulo: obra.titulo || "Obra na Historietas",
      texto: `Veja ${obra.titulo} na Historietas.`,
      mensagemCompartilhado: "Compartilhamento da obra aberto.",
      mensagemCopiado: "Link da obra copiado.",
      mensagemErro: "Não consegui compartilhar nem copiar o link da obra neste navegador.",
    });
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
      setSeguidoresUsuarioPerfilTotal((totalAtual) => {
        const proximoTotal = proximoEstadoSeguindo
          ? totalAtual + 1
          : Math.max(0, totalAtual - 1);

        seguidoresTotalEstavelRef.current[userIdPerfil] = proximoTotal;

        return proximoTotal;
      });

      const resultadoSeguimento = await sincronizarUsuarioSeguidoSupabase(
        userIdAtual,
        userIdPerfil,
        proximoEstadoSeguindo,
      );

      setSeguirUsuarioSalvando(false);

      if (!resultadoSeguimento.ok) {
        setSeguindoUsuarioPerfil(!proximoEstadoSeguindo);
        setSeguidoresUsuarioPerfilTotal((totalAtual) => {
          const totalAnterior = proximoEstadoSeguindo
            ? Math.max(0, totalAtual - 1)
            : totalAtual + 1;

          seguidoresTotalEstavelRef.current[userIdPerfil] = totalAnterior;

          return totalAnterior;
        });
        setMensagemAcao("Não consegui atualizar este seguimento agora.");
        return;
      }

      if (proximoEstadoSeguindo) {
        const nomeSeguidor =
          perfilDoUsuarioLogado?.nome.trim() || "Um leitor";
        const linkSeguidor = criarPerfilAutorHref(nomeSeguidor, userIdAtual);

        void criarNotificacaoSocialPerfilAutor({
          receptorId: userIdPerfil,
          tipo: "seguir-usuario",
          titulo: "Novo seguidor",
          mensagem: `${nomeSeguidor} começou a seguir você.`,
          link: linkSeguidor,
          notificacaoId: `seguir-usuario:${userIdAtual}:${userIdPerfil}`,
        });
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

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_FOLLOW_STORAGE_KEY,
      usuarioIdLogado,
      novosAutoresSeguidos,
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

    const obraAlvo = obras.find((obra) => obra.id === obraId) || null;
    const jaFavorita = obraAlvo
      ? colecaoTemObraPerfilBiblioteca(obrasFavoritas, obraAlvo)
      : obrasFavoritas.includes(obraId);
    const proximoEstadoFavorito = !jaFavorita;

    const novasObrasFavoritas = obraAlvo
      ? proximoEstadoFavorito
        ? Array.from(new Set([...obrasFavoritas, obraAlvo.id]))
        : removerObraDaColecaoPerfilBiblioteca(obrasFavoritas, obraAlvo)
      : proximoEstadoFavorito
        ? Array.from(new Set([...obrasFavoritas, obraId]))
        : obrasFavoritas.filter((id) => id !== obraId);

    salvarListaIdsPerfilBiblioteca(
      FAVORITES_STORAGE_KEY,
      usuarioIdLogado,
      novasObrasFavoritas,
    );

    setObrasFavoritas(novasObrasFavoritas);
    await sincronizarTabelaUsuario(
      "favoritos",
      "obra_id",
      obraId,
      proximoEstadoFavorito,
      "parcial",
    );
    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);
  }

  async function alternarConcluidoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para concluir obras.");
      return;
    }

    const obraAlvo = obras.find((obra) => obra.id === obraId) || null;
    const jaConcluida = obraAlvo
      ? colecaoTemObraPerfilBiblioteca(obrasConcluidas, obraAlvo)
      : obrasConcluidas.includes(obraId);
    const proximoEstadoConcluido = !jaConcluida;

    const novasObrasConcluidas = obraAlvo
      ? proximoEstadoConcluido
        ? Array.from(new Set([...obrasConcluidas, obraAlvo.id]))
        : removerObraDaColecaoPerfilBiblioteca(obrasConcluidas, obraAlvo)
      : proximoEstadoConcluido
        ? Array.from(new Set([...obrasConcluidas, obraId]))
        : obrasConcluidas.filter((id) => id !== obraId);

    salvarListaIdsPerfilBiblioteca(
      COMPLETED_STORAGE_KEY,
      usuarioIdLogado,
      novasObrasConcluidas,
    );

    setObrasConcluidas(novasObrasConcluidas);
    await sincronizarTabelaUsuario(
      "concluidas",
      "obra_id",
      obraId,
      proximoEstadoConcluido,
      "parcial",
    );
    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);
  }


  function salvarObrasBibliotecaPerfil(novasObras: ObraLocal[]) {
    setObras(novasObras);

    try {
      salvarJsonUsuarioPerfilAutor(
        STORAGE_KEY,
        usuarioIdLogado,
        novasObras,
      );
    } catch {
      // A tela continua usando o estado em memória se o localStorage falhar.
    }
  }

  async function alternarSalvoCapituloBibliotecaPerfil(
    obraId: string,
    capituloId: string,
    ativo?: boolean,
  ) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para atualizar a Biblioteca.");
      return;
    }

    let proximoEstadoSalvo = false;

    const novasObras = obras.map((obra) => {
      if (obra.id !== obraId) {
        return obra;
      }

      return {
        ...obra,
        capitulos: obra.capitulos.map((capitulo) => {
          if (capitulo.id !== capituloId) {
            return capitulo;
          }

          proximoEstadoSalvo =
            typeof ativo === "boolean" ? ativo : !capitulo.salvo;

          return {
            ...capitulo,
            salvo: proximoEstadoSalvo,
          };
        }),
      };
    });

    salvarObrasBibliotecaPerfil(novasObras);

    void sincronizarTabelaUsuario(
      "salvos_capitulos",
      "capitulo_id",
      capituloId,
      proximoEstadoSalvo,
      "privado",
    );

    setMensagemAcao(
      proximoEstadoSalvo
        ? "Capítulo salvo na Biblioteca."
        : "Capítulo removido dos salvos.",
    );
  }

  async function alternarObraSeguindoBibliotecaPerfil(obra: ObraLocal, ativo?: boolean) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para atualizar a Biblioteca.");
      return;
    }

    const jaSegue = colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, obra);
    const proximoEstadoSeguindo = typeof ativo === "boolean" ? ativo : !jaSegue;
    const listaAtualizada = proximoEstadoSeguindo
      ? Array.from(new Set([...obrasSeguidasBiblioteca, obra.id]))
      : removerObraDaColecaoPerfilBiblioteca(obrasSeguidasBiblioteca, obra);

    salvarListaIdsPerfilBiblioteca(
      LIBRARY_FOLLOW_STORAGE_KEY,
      usuarioIdLogado,
      listaAtualizada,
    );
    setObrasSeguidasBiblioteca(listaAtualizada);

    await sincronizarTabelaUsuario(
      "seguindo_obras",
      "obra_id",
      obra.id,
      proximoEstadoSeguindo,
      "publico",
    );
    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);

    setMensagemAcao(
      proximoEstadoSeguindo
        ? "Obra adicionada ao Quero ler."
        : "Obra removida do Quero ler.",
    );
  }

  async function removerHistoricoLeituraBibliotecaPerfil(obra: ObraLocal) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para limpar o histórico.");
      return;
    }

    const novasObras = obras.map((obraAtual) => {
      if (obraAtual.id !== obra.id) {
        return obraAtual;
      }

      return {
        ...obraAtual,
        ultimoCapituloLidoId: "",
        ultimaLeituraEm: "",
        progressoLeitura: 0,
        capitulos: obraAtual.capitulos.map((capitulo) => ({
          ...capitulo,
          lido: false,
          lidoEm: "",
        })),
      };
    });

    salvarObrasBibliotecaPerfil(novasObras);

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || usuarioIdLogado;

      if (userId && idObraSupabaseValido(obra.id)) {
        await Promise.all([
          supabase
            .from("progresso_leitura")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", obra.id),
          supabase
            .from("diario_atividades")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", obra.id)
            .in("tipo", ["comecou_ler", "leu_capitulo"]),
        ]);
      }
    } catch (error) {
      console.warn("Não consegui limpar o histórico remoto da obra:", error);
    }

    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);
    setMensagemAcao("Histórico de leitura removido.");
  }

  async function removerItemBibliotecaPerfil(item: ItemBibliotecaPerfil) {
    if (
      item.capitulo?.salvo &&
      (abaBibliotecaPerfil === "tudo" || abaBibliotecaPerfil === "salvos")
    ) {
      await alternarSalvoCapituloBibliotecaPerfil(
        item.obra.id,
        item.capitulo.id,
        false,
      );
      return;
    }

    if (
      abaBibliotecaPerfil === "tudo" &&
      item.tipoDiario === "quero_ler" &&
      colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, item.obra)
    ) {
      await alternarObraSeguindoBibliotecaPerfil(item.obra, false);
      return;
    }

    if (
      abaBibliotecaPerfil === "tudo" &&
      item.tipoDiario === "favorita" &&
      colecaoTemObraPerfilBiblioteca(obrasFavoritas, item.obra)
    ) {
      await alternarFavoritoObra(item.obra.id);
      return;
    }

    if (
      abaBibliotecaPerfil === "tudo" &&
      item.tipoDiario === "concluida" &&
      colecaoTemObraPerfilBiblioteca(obrasConcluidas, item.obra)
    ) {
      await alternarConcluidoObra(item.obra.id);
      return;
    }

    if (abaBibliotecaPerfil === "quero-ler") {
      await alternarObraSeguindoBibliotecaPerfil(item.obra, false);
      return;
    }

    if (abaBibliotecaPerfil === "favoritas") {
      if (colecaoTemObraPerfilBiblioteca(obrasFavoritas, item.obra)) {
        await alternarFavoritoObra(item.obra.id);
      }
      return;
    }

    if (abaBibliotecaPerfil === "concluidas") {
      if (colecaoTemObraPerfilBiblioteca(obrasConcluidas, item.obra)) {
        await alternarConcluidoObra(item.obra.id);
      }
      return;
    }

    if (abaBibliotecaPerfil === "salvos" && item.capitulo) {
      await alternarSalvoCapituloBibliotecaPerfil(
        item.obra.id,
        item.capitulo.id,
        false,
      );
      return;
    }

    await removerHistoricoLeituraBibliotecaPerfil(item.obra);
  }

  function atualizarAnotacaoNosItensDiarioPerfil(
    obraId: string,
    tipo: DiarioPerfilItem["tipo"],
    atualizacao: Pick<
      DiarioPerfilItem,
      "anotacao" | "anotacaoId" | "anotacaoVisibilidade"
    >,
  ) {
    const atualizarLista = (itens: DiarioPerfilItem[]) =>
      itens.map((item) =>
        item.obra?.id === obraId && item.tipo === tipo
          ? { ...item, ...atualizacao }
          : item,
      );

    setDiarioPerfil((estadoAtual) => ({
      ...estadoAtual,
      lendoAgora: atualizarLista(estadoAtual.lendoAgora),
      queroLer: atualizarLista(estadoAtual.queroLer),
      favoritas: atualizarLista(estadoAtual.favoritas),
      concluidas: atualizarLista(estadoAtual.concluidas),
      avaliacoes: atualizarLista(estadoAtual.avaliacoes),
      reviews: atualizarLista(estadoAtual.reviews),
      atividades: atualizarLista(estadoAtual.atividades),
    }));
  }

  function itemDiarioPertenceAoUsuarioLogado(item: DiarioPerfilItem) {
    const userIdNormalizado = usuarioIdLogado.trim().toLowerCase();
    const perfilUserIdNormalizado =
      perfilParaMostrar?.autorId.trim().toLowerCase() || "";
    const obraAutorIdNormalizado =
      item.obra?.autorId?.trim().toLowerCase() || "";

    return Boolean(
      userIdNormalizado &&
        (podeEditarPerfil ||
          perfilUserIdNormalizado === userIdNormalizado ||
          obraAutorIdNormalizado === userIdNormalizado),
    );
  }

  function abrirEditorAnotacaoDiario(item: DiarioPerfilItem) {
    const obraId = item.obra?.id?.trim() || "";

    if (
      !itemDiarioPertenceAoUsuarioLogado(item) ||
      !obraId ||
      !idAutorSupabaseValido(obraId)
    ) {
      setMensagemAcao(
        "Esta anotação só pode ser criada em uma obra salva no Supabase.",
      );
      return;
    }

    setEditorAnotacaoDiario({
      aberto: true,
      itemChave: item.chave,
      obraId,
      tipo: item.tipo,
      texto: item.anotacao || "",
      visibilidade: item.anotacao
        ? item.anotacaoVisibilidade || item.visibilidade || "privado"
        : "privado",
      salvando: false,
      erro: "",
    });
  }

  function fecharEditorAnotacaoDiario() {
    setEditorAnotacaoDiario(editorAnotacaoDiarioVazio);
  }

  async function salvarAnotacaoDiario() {
    const userId = usuarioIdLogado.trim();
    const obraId = editorAnotacaoDiario.obraId.trim();
    const texto = editorAnotacaoDiario.texto.trim();

    if (!userId || !idAutorSupabaseValido(userId)) {
      setEditorAnotacaoDiario((estadoAtual) => ({
        ...estadoAtual,
        erro: "Entre na sua conta para salvar a anotação.",
      }));
      return;
    }

    if (!obraId || !idAutorSupabaseValido(obraId)) {
      setEditorAnotacaoDiario((estadoAtual) => ({
        ...estadoAtual,
        erro: "A obra ainda não possui um ID válido no Supabase.",
      }));
      return;
    }

    if (!texto) {
      setEditorAnotacaoDiario((estadoAtual) => ({
        ...estadoAtual,
        erro: "Escreva uma anotação antes de salvar.",
      }));
      return;
    }

    setEditorAnotacaoDiario((estadoAtual) => ({
      ...estadoAtual,
      salvando: true,
      erro: "",
    }));

    try {
      const atualizadoEm = new Date().toISOString();
      const payload = {
        user_id: userId,
        obra_id: obraId,
        tipo: editorAnotacaoDiario.tipo,
        texto: texto.slice(0, DIARIO_ANOTACAO_MAX_LENGTH),
        visibilidade: editorAnotacaoDiario.visibilidade,
        atualizado_em: atualizadoEm,
      };

      const { data, error } = await supabase
        .from("diario_anotacoes")
        .upsert(payload, {
          onConflict: "user_id,obra_id,tipo",
        })
        .select("id, texto, visibilidade, atualizado_em")
        .maybeSingle();

      if (error) {
        setEditorAnotacaoDiario((estadoAtual) => ({
          ...estadoAtual,
          salvando: false,
          erro: error.message,
        }));
        return;
      }

      const registro =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : {};

      atualizarAnotacaoNosItensDiarioPerfil(
        obraId,
        editorAnotacaoDiario.tipo,
        {
          anotacao: pegarTexto(registro.texto, payload.texto),
          anotacaoId: pegarTexto(registro.id),
          anotacaoVisibilidade: obterVisibilidadeRegistroDiario(
            registro,
            payload.visibilidade,
          ),
        },
      );

      setEditorAnotacaoDiario(editorAnotacaoDiarioVazio);
      setMensagemAcao("Anotação salva no Diário.");
    } catch (error) {
      setEditorAnotacaoDiario((estadoAtual) => ({
        ...estadoAtual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a anotação.",
      }));
    }
  }

  async function removerAnotacaoDiario() {
    const userId = usuarioIdLogado.trim();
    const obraId = editorAnotacaoDiario.obraId.trim();

    if (
      !userId ||
      !obraId ||
      !window.confirm("Remover esta anotação do Diário?")
    ) {
      return;
    }

    setEditorAnotacaoDiario((estadoAtual) => ({
      ...estadoAtual,
      salvando: true,
      erro: "",
    }));

    try {
      const { error } = await supabase
        .from("diario_anotacoes")
        .delete()
        .eq("user_id", userId)
        .eq("obra_id", obraId)
        .eq("tipo", editorAnotacaoDiario.tipo);

      if (error) {
        setEditorAnotacaoDiario((estadoAtual) => ({
          ...estadoAtual,
          salvando: false,
          erro: error.message,
        }));
        return;
      }

      atualizarAnotacaoNosItensDiarioPerfil(
        obraId,
        editorAnotacaoDiario.tipo,
        {
          anotacao: undefined,
          anotacaoId: undefined,
          anotacaoVisibilidade: undefined,
        },
      );

      setEditorAnotacaoDiario(editorAnotacaoDiarioVazio);
      setMensagemAcao("Anotação removida do Diário.");
    } catch (error) {
      setEditorAnotacaoDiario((estadoAtual) => ({
        ...estadoAtual,
        salvando: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a anotação.",
      }));
    }
  }

  function atualizarInteracaoAnotacaoDiario(
    anotacaoId: string,
    atualizar: (
      estadoAtual: InteracaoAnotacaoDiarioEstado,
    ) => InteracaoAnotacaoDiarioEstado,
  ) {
    setInteracoesAnotacoesDiario((estadoAtual) => {
      const interacaoAtual =
        estadoAtual[anotacaoId] ||
        criarInteracaoAnotacaoDiarioVazia();

      return {
        ...estadoAtual,
        [anotacaoId]: atualizar(interacaoAtual),
      };
    });
  }

  function alternarComentariosAnotacaoDiario(item: DiarioPerfilItem) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (!anotacaoId || item.anotacaoVisibilidade === "privado") {
      return;
    }

    setComentariosAnotacaoDiarioAbertoChave((chaveAtual) =>
      chaveAtual === item.chave ? "" : item.chave,
    );

    atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
      ...estadoAtual,
      erro: "",
    }));
  }

  function atualizarTextoComentarioAnotacaoDiario(
    anotacaoId: string,
    texto: string,
  ) {
    atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
      ...estadoAtual,
      novoComentario: texto.slice(0, DIARIO_COMENTARIO_MAX_LENGTH),
      erro: "",
    }));
  }

  async function alternarCurtidaAnotacaoDiario(
    item: DiarioPerfilItem,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioIdLogado.trim();

    if (!anotacaoId || item.anotacaoVisibilidade === "privado") {
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefPerfilAutor());
      return;
    }

    const interacaoAtual =
      interacoesAnotacoesDiario[anotacaoId] ||
      criarInteracaoAnotacaoDiarioVazia();

    if (interacaoAtual.salvandoCurtida) {
      return;
    }

    atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
      ...estadoAtual,
      salvandoCurtida: true,
      erro: "",
    }));

    try {
      if (interacaoAtual.curtiu) {
        const { error } = await supabase
          .from("diario_anotacao_curtidas")
          .delete()
          .eq("anotacao_id", anotacaoId)
          .eq("user_id", userId);

        if (error) {
          atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
            ...estadoAtual,
            salvandoCurtida: false,
            erro: error.message,
          }));
          return;
        }

        atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
          ...estadoAtual,
          curtiu: false,
          totalCurtidas: Math.max(0, estadoAtual.totalCurtidas - 1),
          salvandoCurtida: false,
        }));
        return;
      }

      const { error } = await supabase
        .from("diario_anotacao_curtidas")
        .insert({
          anotacao_id: anotacaoId,
          user_id: userId,
        });

      if (error) {
        atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
          ...estadoAtual,
          salvandoCurtida: false,
          erro: error.message,
        }));
        return;
      }

      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        curtiu: true,
        totalCurtidas: estadoAtual.totalCurtidas + 1,
        salvandoCurtida: false,
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        salvandoCurtida: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a curtida.",
      }));
    }
  }

  async function enviarComentarioAnotacaoDiario(
    item: DiarioPerfilItem,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";
    const userId = usuarioIdLogado.trim();

    if (!anotacaoId || item.anotacaoVisibilidade === "privado") {
      return;
    }

    if (!userId) {
      router.push(criarLoginHrefPerfilAutor());
      return;
    }

    const interacaoAtual =
      interacoesAnotacoesDiario[anotacaoId] ||
      criarInteracaoAnotacaoDiarioVazia();
    const textoComentario = interacaoAtual.novoComentario.trim();

    if (!textoComentario) {
      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        erro: "Escreva um comentário antes de enviar.",
      }));
      return;
    }

    if (interacaoAtual.enviandoComentario) {
      return;
    }

    atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
      ...estadoAtual,
      enviandoComentario: true,
      erro: "",
    }));

    try {
      const { data, error } = await supabase
        .from("diario_anotacao_comentarios")
        .insert({
          anotacao_id: anotacaoId,
          user_id: userId,
          texto: textoComentario.slice(
            0,
            DIARIO_COMENTARIO_MAX_LENGTH,
          ),
        })
        .select("id, anotacao_id, user_id, texto, criado_em")
        .maybeSingle();

      if (error) {
        atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
          ...estadoAtual,
          enviandoComentario: false,
          erro: error.message,
        }));
        return;
      }

      const registro =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : {};
      const perfilComentario = await carregarPerfilUsuarioSupabase(
        userId,
        "Você",
      );

      const comentario: ComentarioAnotacaoDiarioPerfil = {
        id: pegarTexto(registro.id),
        anotacaoId,
        userId,
        autorNome: perfilComentario?.nome || "Você",
        texto: pegarTexto(registro.texto, textoComentario),
        criadoEm: pegarTexto(
          registro.criado_em,
          new Date().toISOString(),
        ),
      };

      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        comentarios: comentario.id
          ? [...estadoAtual.comentarios, comentario]
          : estadoAtual.comentarios,
        novoComentario: "",
        enviandoComentario: false,
      }));
      setComentariosAnotacaoDiarioAbertoChave(item.chave);
    } catch (error) {
      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        enviandoComentario: false,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o comentário.",
      }));
    }
  }

  async function removerComentarioAnotacaoDiario(
    item: DiarioPerfilItem,
    comentario: ComentarioAnotacaoDiarioPerfil,
  ) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (
      !anotacaoId ||
      !comentario.id ||
      !window.confirm("Remover este comentário?")
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("diario_anotacao_comentarios")
        .delete()
        .eq("id", comentario.id);

      if (error) {
        atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
          ...estadoAtual,
          erro: error.message,
        }));
        return;
      }

      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        comentarios: estadoAtual.comentarios.filter(
          (itemComentario) => itemComentario.id !== comentario.id,
        ),
        erro: "",
      }));
    } catch (error) {
      atualizarInteracaoAnotacaoDiario(anotacaoId, (estadoAtual) => ({
        ...estadoAtual,
        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível remover o comentário.",
      }));
    }
  }

  function renderizarItemDiarioPerfil(
    item: DiarioPerfilItem,
    emCarrossel = false,
  ) {
    const itemHref = obterHrefItemDiarioPerfil(item);
    const obra = item.obra;
    const estiloCardDiario = emCarrossel
      ? isDesktop
        ? desktopDiaryVisualCarouselCardStyle
        : diaryVisualCarouselCardStyle
      : isDesktop
        ? desktopDiaryVisualCardStyle
        : diaryVisualCardStyle;
    const totalCurtidasDiario = obra
      ? obterTotalCurtidasObraPerfilAutor(obra, totaisInteracoesObras)
      : 0;
    const totalComentariosDiario = obra
      ? obterTotalComentariosObraPerfilAutor(obra, totaisInteracoesObras)
      : 0;
    const visualizacoesDiario = compactarNumeroPerfilAutor(
      obra?.visualizacoes || 0,
    );
    const nota = Math.max(0, Math.min(5, item.nota || 0));
    const avaliacaoDiario = nota > 0 ? nota.toFixed(1) : "0.0";

    return (
      <article key={item.chave} style={estiloCardDiario}>
        <Link
          href={itemHref}
          style={diaryVisualCoverLinkStyle}
          aria-label={`Abrir ${item.titulo}`}
        >
          <div
            style={criarCapaGridPerfilAutor(obra?.capa || "", isDesktop)}
          >
            <div style={diaryCardCoverOverlayStyle}>
              <strong style={diaryCardCoverTitleStyle}>{item.titulo}</strong>

              <span style={diaryCardCoverMetaStyle}>
                <span>👁 {visualizacoesDiario}</span>
                <span>
                  <span style={diaryCardHeartMetaStyle}>❤️</span>{" "}
                  {totalCurtidasDiario}
                </span>
                {item.tipo === "avaliacao" && nota > 0 ? (
                  <span>
                    <span style={diaryCardStarMetaStyle}>★</span>{" "}
                    {avaliacaoDiario}
                  </span>
                ) : (
                  <span>
                    <span style={diaryCardCommentMetaStyle}>💬</span>{" "}
                    {totalComentariosDiario}
                  </span>
                )}
              </span>
            </div>
          </div>
        </Link>

        <div style={profileWorkMenuAnchorStyle}>
          <button
            type="button"
            onClick={() =>
              setDiarioMenuAbertoChave((chaveAtual) =>
                chaveAtual === item.chave ? "" : item.chave,
              )
            }
            style={profileWorkDotsButtonStyle}
            aria-label={`Abrir opções de ${item.titulo}`}
            aria-expanded={diarioMenuAbertoChave === item.chave}
          >
            ⋮
          </button>
        </div>
      </article>
    );
  }

  function renderizarItemBibliotecaPerfil(item: ItemBibliotecaPerfil) {
    const obraHref =
      item.obra.link ||
      `/obra/${item.obra.slug || criarSlugBase(item.obra.titulo)}`;
    const capituloHref = item.capitulo
      ? criarHrefLeituraCapituloPerfilAutor(
          item.obra,
          item.capitulo,
          item.numeroCapitulo || 1,
        )
      : obraHref;
    const totalCurtidasBiblioteca = obterTotalCurtidasObraPerfilAutor(
      item.obra,
      totaisInteracoesObras,
    );
    const totalComentariosBiblioteca = obterTotalComentariosObraPerfilAutor(
      item.obra,
      totaisInteracoesObras,
    );
    const visualizacoesBiblioteca = compactarNumeroPerfilAutor(
      item.obra.visualizacoes || 0,
    );

    return (
      <article
        key={item.chave}
        style={isDesktop ? desktopDiaryVisualCardStyle : diaryVisualCardStyle}
      >
        <Link
          href={capituloHref}
          style={diaryVisualCoverLinkStyle}
          aria-label={`Abrir ${item.obra.titulo}`}
        >
          <div style={criarCapaGridPerfilAutor(item.obra.capa, isDesktop)}>
            <div style={diaryCardCoverOverlayStyle}>
              <strong style={diaryCardCoverTitleStyle}>{item.obra.titulo}</strong>

              <span style={diaryCardCoverMetaStyle}>
                <span>👁 {visualizacoesBiblioteca}</span>
                <span>
                  <span style={diaryCardHeartMetaStyle}>❤️</span>{" "}
                  {totalCurtidasBiblioteca}
                </span>
                <span>
                  <span style={diaryCardCommentMetaStyle}>💬</span>{" "}
                  {totalComentariosBiblioteca}
                </span>
              </span>
            </div>
          </div>
        </Link>

        <div style={profileWorkMenuAnchorStyle}>
          <button
            type="button"
            onClick={() =>
              setBibliotecaMenuAbertoChave((chaveAtual) =>
                chaveAtual === item.chave ? "" : item.chave,
              )
            }
            style={profileWorkDotsButtonStyle}
            aria-label={`Abrir opções de ${item.obra.titulo}`}
            aria-expanded={bibliotecaMenuAbertoChave === item.chave}
          >
            ⋮
          </button>
        </div>
      </article>
    );
  }

  function renderizarConteudoSecaoDiarioPerfil(
    itens: DiarioPerfilItem[],
    vazio: string,
  ) {
    if (itens.length === 0) {
      return <div style={diaryEmptyStateStyle}>{vazio}</div>;
    }

    return (
      <div
        style={
          isDesktop
            ? desktopProfileWorksGridStyle
            : profileWorksGridStyle
        }
      >
        {itens.slice(0, 8).map((item) => renderizarItemDiarioPerfil(item))}
      </div>
    );
  }

  function renderizarCarrosselSecaoDiarioPerfil(
    itens: DiarioPerfilItem[],
    vazio: string,
  ) {
    if (itens.length === 0) {
      return <div style={diaryEmptyStateStyle}>{vazio}</div>;
    }

    return (
      <DiaryCarouselRow isDesktop={isDesktop} totalItems={itens.length}>
        {itens
          .slice(0, 12)
          .map((item) => renderizarItemDiarioPerfil(item, true))}
      </DiaryCarouselRow>
    );
  }

  function renderizarSecaoDiarioPerfil(
    titulo: string,
    itens: DiarioPerfilItem[],
    vazio: string,
  ) {
    void vazio;

    if (itens.length === 0) {
      return null;
    }

    const tituloLimpo = titulo.trim();

    return (
      <section style={diarySectionStyle}>
        {tituloLimpo && (
          <div style={diarySectionHeaderStyle}>
            <strong style={diarySectionTitleStyle}>{tituloLimpo}</strong>
          </div>
        )}

        {renderizarCarrosselSecaoDiarioPerfil(itens, "")}
      </section>
    );
  }

  function renderizarSecaoDiarioRecolhivelPerfil(
    titulo: string,
    aberto: boolean,
    alternar: () => void,
    itens: DiarioPerfilItem[],
    vazio: string,
  ) {
    return (
      <section style={diarySectionStyle}>
        <div style={diaryCollapsibleHeaderStyle}>
          <strong style={diarySectionTitleStyle}>{titulo}</strong>

          <button
            type="button"
            onClick={alternar}
            style={diaryToggleButtonStyle}
            aria-expanded={aberto}
          >
            <span>{aberto ? "Ocultar" : "Abrir"}</span>
            <span style={diaryToggleButtonIconStyle}>
              {aberto ? "↑" : "↓"}
            </span>
          </button>
        </div>

        {aberto && renderizarConteudoSecaoDiarioPerfil(itens, vazio)}
      </section>
    );
  }

  function renderizarAtividadeRecenteDiarioPerfil() {
    return (
      <section style={diaryTimelineStyle}>
        <div style={diaryCollapsibleHeaderStyle}>
          <strong style={diarySectionTitleStyle}>Atividade recente</strong>

          <button
            type="button"
            onClick={() =>
              setAtividadesDiarioAberto((valorAtual) => !valorAtual)
            }
            style={diaryToggleButtonStyle}
            aria-expanded={atividadesDiarioAberto}
          >
            <span>{atividadesDiarioAberto ? "Ocultar" : "Abrir"}</span>
            <span style={diaryToggleButtonIconStyle}>
              {atividadesDiarioAberto ? "↑" : "↓"}
            </span>
          </button>
        </div>

        {atividadesDiarioAberto &&
          (diarioPerfil.atividades.length === 0 ? (
            <div style={diaryEmptyStateStyle}>
              Nenhuma atividade recente para mostrar.
            </div>
          ) : (
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
                    {dataDiarioPerfilFormatada(item.data)}
                  </span>
                </Link>
              ))}
            </div>
          ))}
      </section>
    );
  }


  if (carregando) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>

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
        <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>

        {isDesktop && (
          <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
        )}
        {!isDesktop && (
          <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
        )}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Perfil não encontrado
          </p>
        </section>
      </main>
    );
  }

  if (!perfilParaMostrar) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>

        {isDesktop && (
          <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
        )}
        {!isDesktop && (
          <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
        )}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {perfilSemLoginSemParametro
              ? "Entre para acessar seu perfil"
              : "Nenhum autor encontrado"}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={containerAtualStyle}>
        <header
          style={
            isDesktop ? profileHeaderDesktopStyle : profileHeaderStyle
          }
        >
          <Link href="/" style={profileHeaderLogoStyle} aria-label="Historietas">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-home-logo-text" style={logoTextStyle}>
              istorietas
            </span>
          </Link>

          {isDesktop ? (
            <Link
              href="/notificacoes"
              style={profileNotificationButtonStyle}
              aria-label={
                notificacoesNaoLidas > 0
                  ? `Notificações: ${notificacoesNaoLidas} não lidas`
                  : "Notificações"
              }
            >
              N

              {notificacoesNaoLidas > 0 ? (
                <span style={profileNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}

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
                  {!podeEditarPerfil ? (
                    <span style={menuSubtitleStyle}>Ações do perfil</span>
                  ) : null}
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
                    <span style={menuSectionTitleStyle}>Conta e sistema</span>

                    <Link
                      href="/painel-autor"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="painel" />
                      </span>
                      <strong style={menuItemTextStyle}>Painel do Autor</strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <Link
                      href="/notificacoes"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                      aria-label={
                        notificacoesNaoLidas > 0
                          ? `Notificações: ${notificacoesNaoLidas} não lidas`
                          : "Notificações"
                      }
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="notificacoes" />
                      </span>
                      <strong style={menuItemTextStyle}>Notificações</strong>
                      <span style={menuNotificationRightStyle}>
                        {notificacoesNaoLidas > 0 ? (
                          <span
                            style={menuNotificationBadgeStyle}
                            aria-label={`${notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas} notificações não lidas`}
                          >
                            {notificacoesNaoLidas > 99
                              ? "99+"
                              : notificacoesNaoLidas}
                          </span>
                        ) : null}
                        <span style={menuChevronStyle}>›</span>
                      </span>
                    </Link>

                    <Link
                      href="/configuracoes"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="configuracoes" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        Configurações e atividade
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => void copiarLinkPerfil()}
                      style={menuItemStyle}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="link" />
                      </span>
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
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="sair" />
                      </span>
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
                      <span style={menuItemIconStyle}><MenuPerfilIcone tipo="link" /></span>
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
                      <span style={menuItemIconStyle}><MenuPerfilIcone tipo="comunidade" /></span>
                      <strong style={menuItemTextStyle}>
                        Comunidade do autor
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </Link>

                    <button
                      type="button"
                      onClick={abrirDenunciaPerfil}
                      style={menuDangerItemStyle}
                    >
                      <span style={menuItemIconStyle}>
                        <MenuPerfilIcone tipo="denunciar" />
                      </span>
                      <strong style={menuItemTextStyle}>
                        Denunciar perfil
                      </strong>
                      <span style={menuChevronStyle}>›</span>
                    </button>

                    <div style={menuDividerStyle} />
                    <span style={menuSectionTitleStyle}>Descoberta</span>

                    <Link
                      href="/explorar"
                      style={menuItemStyle}
                      onClick={() => setMenuPerfilAberto(false)}
                    >
                      <span style={menuItemIconStyle}><MenuPerfilIcone tipo="explorar" /></span>
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

        {denunciaPerfilAberta && !podeEditarPerfil && (
          <div
            style={denunciaPerfilOverlayStyle}
            role="presentation"
            onClick={fecharDenunciaPerfil}
          >
            <section
              style={denunciaPerfilSheetStyle}
              role="dialog"
              aria-modal="true"
              aria-label="Denunciar perfil"
              onClick={(event) => event.stopPropagation()}
            >
              <div style={denunciaPerfilHeaderStyle}>
                <div style={denunciaPerfilTitleBlockStyle}>
                  <strong style={denunciaPerfilTitleStyle}>
                    Denunciar perfil
                  </strong>
                  <span style={denunciaPerfilSubtitleStyle}>
                    Essa denúncia será enviada para análise da moderação.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fecharDenunciaPerfil}
                  disabled={denunciaPerfilSalvando}
                  style={denunciaPerfilCloseButtonStyle}
                  aria-label="Fechar denúncia"
                >
                  ×
                </button>
              </div>

              <div style={denunciaPerfilMotivosGridStyle}>
                {DENUNCIA_PERFIL_MOTIVOS.map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => {
                      setMotivoDenunciaPerfil(opcao.valor);
                      setDenunciaPerfilErro("");
                    }}
                    disabled={denunciaPerfilSalvando}
                    style={
                      motivoDenunciaPerfil === opcao.valor
                        ? denunciaPerfilMotivoAtivoStyle
                        : denunciaPerfilMotivoButtonStyle
                    }
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>

              <textarea
                value={descricaoDenunciaPerfil}
                onChange={(event) => {
                  setDescricaoDenunciaPerfil(
                    event.target.value.slice(
                      0,
                      DENUNCIA_PERFIL_DESCRICAO_MAX_LENGTH,
                    ),
                  );
                  setDenunciaPerfilErro("");
                }}
                placeholder="Explique rapidamente o problema, se quiser."
                maxLength={DENUNCIA_PERFIL_DESCRICAO_MAX_LENGTH}
                rows={4}
                disabled={denunciaPerfilSalvando}
                style={denunciaPerfilTextareaStyle}
              />

              <span style={denunciaPerfilCounterStyle}>
                {descricaoDenunciaPerfil.length}/
                {DENUNCIA_PERFIL_DESCRICAO_MAX_LENGTH}
              </span>

              {denunciaPerfilErro && (
                <span style={denunciaPerfilErrorStyle}>
                  {denunciaPerfilErro}
                </span>
              )}

              <div style={denunciaPerfilActionsStyle}>
                <button
                  type="button"
                  onClick={fecharDenunciaPerfil}
                  disabled={denunciaPerfilSalvando}
                  style={denunciaPerfilCancelButtonStyle}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void enviarDenunciaPerfil()}
                  disabled={denunciaPerfilSalvando}
                  style={denunciaPerfilSubmitButtonStyle}
                >
                  {denunciaPerfilSalvando ? "Enviando..." : "Enviar denúncia"}
                </button>
              </div>
            </section>
          </div>
        )}

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
                <Link
                  href={obrasSeguidasPerfilHref}
                  style={profileStatLinkStyle}
                  aria-label={`Abrir obras seguidas por ${perfilParaMostrar.nome}`}
                >
                  <strong style={profileStatWorksNumberStyle}>
                    {obrasSeguidasPerfilTotal}
                  </strong>
                  <span style={profileStatWorksLabelStyle}>
                    <span>obras</span>
                    <span>seguidas</span>
                  </span>
                </Link>

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

                    <span style={profileRatingStackedMetaStyle}>
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

          <div
            style={
              podeEditarPerfil
                ? profileActionsAtualStyle
                : profileVisitorActionsAtualStyle
            }
          >
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
                  style={profilePrimaryButtonStyle}
                >
                  Compartilhar
                </button>

                <button
                  type="button"
                  onClick={alternarDestaquesPerfil}
                  style={profilePrimaryButtonStyle}
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

                <button
                  type="button"
                  onClick={() => void copiarLinkPerfil()}
                  style={profileSecondaryButtonStyle}
                >
                  Compartilhar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarDestaquesVisitante((valorAtual) => !valorAtual)
                  }
                  style={profileSecondaryButtonStyle}
                >
                  {mostrarDestaquesVisitante
                    ? "Ocultar destaque"
                    : "Mostrar destaque"}
                </button>
              </>
            )}
          </div>

          {mensagemAcao && (
            <div
              style={profileActionToastStyle}
              role="status"
              aria-live="polite"
            >
              {mensagemAcao}
            </div>
          )}

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
                <span style={profileEditorLabelStyle}>Nome de usuário</span>

                <input
                  value={nomePerfilEditor}
                  onChange={(event) => setNomePerfilEditor(event.target.value)}
                  onBlur={() => {
                    const nomeDigitado = nomePerfilEditor.trim();

                    if (nomeDigitado) {
                      void salvarNomePerfilAutor(nomeDigitado);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="ex: nome de usuário"
                  maxLength={80}
                  style={profileNameInputStyle}
                  type="text"
                />
              </label>

              <label style={profileEditorFieldStyle}>
                <span style={profileEditorLabelStyle}>@username público</span>

                <input
                  value={usernamePerfilEditor}
                  onChange={(event) =>
                    setUsernamePerfilEditor(
                      normalizarUsernamePerfilAutor(event.target.value),
                    )
                  }
                  onBlur={() =>
                    void salvarUsernamePerfilAutor(usernamePerfilEditor)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  placeholder="ex: username"
                  maxLength={30}
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

        {destaquesPerfilVisivel &&
          (obrasEmDestaque.length > 0 || podeEditarPerfil || mostrarDestaquesVisitante) && (
            <section
              style={isDesktop ? desktopAuthorHighlightsStyle : authorHighlightsStyle}
              aria-label="TOP 5"
            >
              <div style={authorHighlightsHeaderStyle}>
                <div style={authorHighlightsTitleGroupStyle}>
                  <strong style={authorHighlightsTitleStyle}>TOP 5</strong>

                  {podeEditarPerfil && obrasEmDestaque.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void alternarCurtidaTopFivePerfil()}
                      disabled={topFiveCurtidaSalvando}
                      style={
                        topFiveCurtidoPorMim
                          ? authorHighlightsLikeButtonActiveStyle
                          : authorHighlightsLikeButtonStyle
                      }
                      aria-label={
                        topFiveCurtidoPorMim
                          ? "Remover curtida do TOP 5"
                          : "Curtir TOP 5"
                      }
                    >
                      {topFiveCurtidoPorMim ? (
                        <span
                          style={authorHighlightsLikeHeartEmojiStyle}
                          aria-hidden="true"
                        >
                          ❤️
                        </span>
                      ) : (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                        </svg>
                      )}
                      <span style={authorHighlightsLikeCountStyle}>{compactarNumeroPerfilAutor(topFiveCurtidasTotal)}</span>
                    </button>
                  )}
                </div>

                <div style={authorHighlightsHeaderActionsStyle}>
                  {podeEditarPerfil ? (
                    <Link
                      href="/perfil-autor/top-5"
                      style={authorHighlightsTopFiveButtonStyle}
                      aria-label="Montar ou editar TOP 5"
                    >
                      +
                    </Link>
                  ) : (
                    obrasEmDestaque.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void alternarCurtidaTopFivePerfil()}
                        disabled={topFiveCurtidaSalvando}
                        style={
                          topFiveCurtidoPorMim
                            ? authorHighlightsLikeButtonActiveStyle
                            : authorHighlightsLikeButtonStyle
                        }
                        aria-label={
                          topFiveCurtidoPorMim
                            ? "Remover curtida do TOP 5"
                            : "Curtir TOP 5"
                        }
                      >
                        {topFiveCurtidoPorMim ? (
                          <span
                            style={authorHighlightsLikeHeartEmojiStyle}
                            aria-hidden="true"
                          >
                            ❤️
                          </span>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                          </svg>
                        )}
                        <span style={authorHighlightsLikeCountStyle}>{compactarNumeroPerfilAutor(topFiveCurtidasTotal)}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {obrasEmDestaque.length === 0 ? (
                podeEditarPerfil ? (
                  <p
                    style={{
                      ...emptyTextStyle,
                      textAlign: "center",
                      fontWeight: 800,
                    }}
                  >
                    Monte seu TOP 5 para destacar suas obras favoritas.
                  </p>
                ) : (
                  <p
                    style={{
                      ...emptyTextStyle,
                      textAlign: "center",
                      fontWeight: 800,
                    }}
                  >
                    {`${perfilParaMostrar.nome} nao montou top 5`}
                  </p>
                )
              ) : (
                <div style={isDesktop ? desktopAuthorHighlightsListStyle : authorHighlightsListStyle}>
                  {obrasEmDestaque.map((obra) => {
                    const obraHref =
                      obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
                    return (
                      <Link
                        key={`destaque-${obra.id}`}
                        href={obraHref}
                        style={authorHighlightItemStyle}
                        aria-label={obra.titulo}
                      >
                        <div style={criarCapaDestaquePerfilAutor(obra.capa)} />
                      </Link>
                    );
                  })}
                </div>
              )}
          </section>
        )}

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

        <div
          role="tablist"
          style={{
            ...profileTabsStyle,
            gridTemplateColumns: bibliotecaPerfilVisivel
              ? "repeat(5, minmax(0, 1fr))"
              : "repeat(4, minmax(0, 1fr))",
          }}
          aria-label="Seções do perfil"
        >
          <button
            type="button"
            onClick={() => setAbaPerfil("obras")}
            style={
              abaPerfil === "obras" ? profileTabActiveStyle : profileTabStyle
            }
          >
            Obras
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
            Comunidade
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

          {bibliotecaPerfilVisivel && (
            <button
              type="button"
              onClick={() => setAbaPerfil("biblioteca")}
              style={
                abaPerfil === "biblioteca"
                  ? profileTabActiveStyle
                  : profileTabStyle
              }
            >
              Biblioteca
            </button>
          )}
        </div>


        {abaPerfil === "biblioteca" && bibliotecaPerfilVisivel && (
          <section
            style={
              isDesktop
                ? desktopProfileLibrarySectionStyle
                : profileLibrarySectionStyle
            }
          >
            <div style={profileLibraryTabsStyle}>
              {[
                ["tudo", "Tudo"],
                ["quero-ler", "Quero ler"],
                ["favoritas", "Na lista"],
                ["salvos", "Salvos"],
                ["lendo-agora", "Lendo"],
                ["concluidas", "Concluídas"],
                ["historico", "Histórico"],
              ].map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setAbaBibliotecaPerfil(valor as AbaBibliotecaPerfil)}
                  style={
                    abaBibliotecaPerfil === valor
                      ? profileLibraryTabActiveStyle
                      : profileLibraryTabStyle
                  }
                >
                  {rotulo}
                </button>
              ))}
            </div>

            {!diarioPerfil.carregando && (
              itensBibliotecaAtivos.length === 0 ? (
                <div style={emptyMiniBoxStyle}>
                  Sua Biblioteca ainda não tem itens em {rotuloBibliotecaAtiva}.
                </div>
              ) : (
                <div
                  style={
                    isDesktop
                      ? desktopProfileWorksGridStyle
                      : profileWorksGridStyle
                  }
                >
                  {itensBibliotecaAtivos.map((item) =>
                    renderizarItemBibliotecaPerfil(item),
                  )}
                </div>
              )
            )}
          </section>
        )}

        {abaPerfil === "diario" && (
          <section style={isDesktop ? desktopDiaryBoxStyle : diaryBoxStyle}>
            <div style={diaryTitleToolbarStyle}>
              <h2 style={diaryMainTitleStyle}>
                {podeEditarPerfil ? "Meu Diário" : `Diário de ${perfilParaMostrar.nome}`}
              </h2>

              <button
                type="button"
                onClick={() => setResumoDiarioAberto((aberto) => !aberto)}
                style={diaryStatsToggleButtonStyle}
                aria-label={resumoDiarioAberto ? "Ocultar resumo do Diário" : "Mostrar resumo do Diário"}
                aria-expanded={resumoDiarioAberto}
              >
                <span style={filtersToggleIconStyle}>+</span>
              </button>
            </div>

            {resumoDiarioAberto && (
              <div
                style={
                  isDesktop
                    ? desktopDiaryStatsGridStyle
                    : diaryStatsGridStyle
                }
              >
                <div style={diaryStatCardStyle}>
                  <strong style={diaryStatNumberStyle}>
                    {totalLeiturasDiario}
                  </strong>
                  <span style={diaryStatLabelStyle}>lendo</span>
                </div>

                <div style={diaryStatCardStyle}>
                  <strong style={diaryStatNumberStyle}>
                    {totalQueroLerDiario}
                  </strong>
                  <span style={diaryStatLabelStyle}>quero ler</span>
                </div>

                <div style={diaryStatCardStyle}>
                  <strong style={diaryStatNumberStyle}>
                    {totalFavoritasDiario}
                  </strong>
                  <span style={diaryStatLabelStyle}>favoritas</span>
                </div>

                <div style={diaryStatCardStyle}>
                  <strong style={diaryStatNumberStyle}>
                    {totalConcluidasDiario}
                  </strong>
                  <span style={diaryStatLabelStyle}>concluídas</span>
                </div>

                <div style={diaryStatCardStyle}>
                  <strong style={diaryStatNumberStyle}>
                    {totalAvaliacoesDiario + totalReviewsDiario}
                  </strong>
                  <span style={diaryStatLabelStyle}>avaliações</span>
                </div>
              </div>
            )}

            {diarioPerfil.carregando ? (
              <div style={diaryEmptyStateStyle}>Carregando Diário...</div>
            ) : (
              <>
                {renderizarSecaoDiarioPerfil(
                  "",
                  diarioPerfil.lendoAgora,
                  podeEditarPerfil
                    ? "Suas leituras recentes aparecerão aqui."
                    : "Este perfil ainda não compartilhou leituras recentes.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Quero ler",
                  diarioPerfil.queroLer,
                  podeEditarPerfil
                    ? "As obras salvas para acompanhar depois aparecerão aqui."
                    : "Este perfil ainda não compartilhou obras para ler depois.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Favoritas",
                  diarioPerfil.favoritas,
                  podeEditarPerfil
                    ? "Favorite obras para montar sua vitrine de leitura."
                    : "Este perfil ainda não compartilhou favoritas.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Concluídas",
                  diarioPerfil.concluidas,
                  podeEditarPerfil
                    ? "Obras concluídas aparecerão nesta área."
                    : "Este perfil ainda não compartilhou obras concluídas.",
                )}

                {renderizarSecaoDiarioPerfil(
                  "Avaliações recentes",
                  diarioPerfil.avaliacoes,
                  podeEditarPerfil
                    ? "Suas avaliações públicas aparecerão aqui."
                    : "Este perfil ainda não possui avaliações públicas.",
                )}

                {renderizarSecaoDiarioRecolhivelPerfil(
                  "Avaliações",
                  reviewsDiarioAberto,
                  () => setReviewsDiarioAberto((valorAtual) => !valorAtual),
                  diarioPerfil.reviews,
                  podeEditarPerfil
                    ? "Suas avaliações publicadas na Comunidade aparecerão aqui."
                    : "Este perfil ainda não publicou avaliações.",
                )}

                {renderizarAtividadeRecenteDiarioPerfil()}
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
              <h2 style={authorCommunityTitleStyle}>
                Comunidade de {perfilParaMostrar.nome}
              </h2>
            </div>

            <div
              style={
                isDesktop
                  ? desktopAuthorCommunityGridStyle
                  : authorCommunityGridStyle
              }
            >
              <Link
                href={comunidadeAutorHref}
                style={authorCommunityCardStyle}
                aria-label={`Abrir publicações de ${perfilParaMostrar.nome} na comunidade`}
              >
                <strong style={authorCommunityCardNumberStyle}>0</strong>
                <span style={authorCommunityCardTitleStyle}>PUBLICAÇÕES</span>
                <span style={authorCommunityCardTextStyle}>posts do perfil</span>
              </Link>

              <Link
                href={comunidadeAutorTeoriasHref}
                style={authorCommunityCardStyle}
                aria-label={`Abrir teorias de ${perfilParaMostrar.nome} na comunidade`}
              >
                <strong style={authorCommunityCardNumberStyle}>0</strong>
                <span style={authorCommunityCardTitleStyle}>TEORIAS</span>
                <span style={authorCommunityCardTextStyle}>discussões</span>
              </Link>

              <Link
                href={comunidadeAutorReviewsHref}
                style={authorCommunityCardStyle}
                aria-label={`Abrir reviews de ${perfilParaMostrar.nome} na comunidade`}
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
                      {compactarNumeroPerfilAutor(perfilParaMostrar.totalPublicadas)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>publicadas</span>
                  </div>

                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {compactarNumeroPerfilAutor(perfilParaMostrar.totalCapitulos)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>capítulos</span>
                  </div>

                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {compactarNumeroPerfilAutor(perfilParaMostrar.totalCurtidas)}
                    </strong>
                    <span style={profileAboutMetricLabelStyle}>curtidas</span>
                  </div>

                  <div style={profileAboutMetricCardStyle}>
                    <strong style={profileAboutMetricNumberStyle}>
                      {compactarNumeroPerfilAutor(totalVisualizacoesPerfil)}
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
                    <strong>{obrasConcluidasPerfilTotal}</strong>
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
            {obrasDoPerfilFiltradas.length === 0 ? (
              <div style={emptyMiniBoxStyle}>
                {perfilParaMostrar.obras.length === 0
                  ? podeEditarPerfil
                    ? "Você ainda não publicou obras. Seu perfil continua ativo como leitor, com Diário e Comunidade."
                    : "Este perfil ainda não publicou obras. O Diário e a Comunidade continuam disponíveis."
                  : "Nenhuma obra encontrada."}
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
                  const obraFavorita = colecaoTemObraPerfilBiblioteca(obrasFavoritas, obra);
                  const obraConcluida = colecaoTemObraPerfilBiblioteca(obrasConcluidas, obra);
                  const totalCurtidas = obterTotalCurtidasObraPerfilAutor(
                    obra,
                    totaisInteracoesObras,
                  );
                  const totalComentarios = obterTotalComentariosObraPerfilAutor(
                    obra,
                    totaisInteracoesObras,
                  );
                  const visualizacoesObra = compactarNumeroPerfilAutor(
                    obra.visualizacoes,
                  );
                  const menuObraAberto = obraMenuAbertoId === obra.id;

                  return (
                    <article key={obra.id} style={profileWorkCardStyle}>
                      <Link href={obraHref} style={profileWorkCoverLinkStyle}>
                        <div
                          style={criarCapaGridPerfilAutor(obra.capa, isDesktop)}
                        >
                          <div style={profileWorkCoverOverlayStyle}>
                            <strong style={profileWorkCoverTitleStyle}>
                              {obra.titulo}
                            </strong>

                            <span style={diaryCardCoverMetaStyle}>
                              <span>👁 {visualizacoesObra}</span>
                              <span>
                                <span style={diaryCardHeartMetaStyle}>❤️</span>{" "}
                                {totalCurtidas}
                              </span>
                              <span>
                                <span style={diaryCardCommentMetaStyle}>💬</span>{" "}
                                {totalComentarios}
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
            const obraFavorita = colecaoTemObraPerfilBiblioteca(obrasFavoritas, obra);
            const obraConcluida = colecaoTemObraPerfilBiblioteca(obrasConcluidas, obra);
            const totalCurtidas = obterTotalCurtidasObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            );
            const totalComentarios = obterTotalComentariosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            );
            const totalSalvos = obterTotalSalvosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            );
            const visualizacoesObra = compactarNumeroPerfilAutor(
              obra.visualizacoes,
            );
            const formatoObra = formatarFormatoPerfilAutor(obra.formato);
            const tagPrincipalObra = obterTagPrincipalPerfilAutor(obra);
            const metaObraSheet = [
              formatarGeneroPerfilAutor(obra.genero),
              formatoObra,
              tagPrincipalObra,
              mostrarClassificacao(obra) ? obra.classificacaoIndicativa : "",
            ]
              .filter(Boolean)
              .join(" • ");
            const metricasObraSheet = [
              `👁 ${visualizacoesObra}`,
              `❤️ ${totalCurtidas}`,
              `💬 ${totalComentarios}`,
              `🔖 ${totalSalvos}`,
              `📚 ${obra.capitulos.length}`,
            ]
              .filter(Boolean)
              .join(" • ");

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

                      <span style={workActionSheetAuthorStyle}>
                        Por {obra.autor}
                      </span>

                      <span style={workActionSheetMetaStyle}>
                        {metaObraSheet}
                      </span>

                      <span style={workActionSheetMetricsStyle}>
                        {metricasObraSheet}
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

                    {!podeEditarPerfil && (
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

        {bibliotecaMenuAberto &&
          (() => {
            const item = bibliotecaMenuAberto;
            const obra = item.obra;
            const obraHref =
              obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
            const capituloHref = item.capitulo
              ? criarHrefLeituraCapituloPerfilAutor(
                  obra,
                  item.capitulo,
                  item.numeroCapitulo || 1,
                )
              : obraHref;
            const obraFavorita = colecaoTemObraPerfilBiblioteca(
              obrasFavoritas,
              obra,
            );
            const obraConcluida = colecaoTemObraPerfilBiblioteca(
              obrasConcluidas,
              obra,
            );
            const obraNoQueroLer = colecaoTemObraPerfilBiblioteca(
              obrasSeguidasBiblioteca,
              obra,
            );
            const totalCapitulos = obra.capitulos.length;
            const progresso = Math.max(
              0,
              Math.min(100, Math.round(obra.progressoLeitura || 0)),
            );
            const metaSheet = `${
              item.tipoDiario === "lendo"
                ? "Lendo"
                : item.tipoDiario === "favorita"
                  ? "Favorita"
                  : item.tipoDiario === "concluida"
                    ? "Concluída"
                    : item.tipoDiario === "quero_ler"
                      ? "Quero ler"
                      : "Biblioteca"
            } • ${
              item.capitulo
                ? `Capítulo ${item.numeroCapitulo || 1} de ${totalCapitulos || 1}`
                : totalCapitulos > 0
                  ? `${totalCapitulos} ${totalCapitulos === 1 ? "capítulo" : "capítulos"}`
                  : "Obra"
            } • ${progresso}% concluído`;

            return (
              <div
                style={workActionSheetOverlayStyle}
                role="presentation"
                onClick={() => setBibliotecaMenuAbertoChave("")}
              >
                <section
                  style={workActionSheetStyle}
                  role="dialog"
                  aria-label={`Ações da Biblioteca ${obra.titulo}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div style={workActionSheetHandleStyle} aria-hidden="true" />

                  <div style={workActionSheetHeaderStyle}>
                    <div style={workActionSheetTextBlockStyle}>
                      <strong style={workActionSheetTitleStyle}>
                        {obra.titulo}
                      </strong>
                      <span style={workActionSheetMetaStyle}>{metaSheet}</span>
                    </div>
                  </div>

                  <div style={workActionSheetActionsStyle}>
                    <Link
                      href={capituloHref}
                      onClick={() => setBibliotecaMenuAbertoChave("")}
                      style={workActionSheetItemStyle}
                    >
                      Ler capítulo
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void alternarObraSeguindoBibliotecaPerfil(
                          obra,
                          !obraNoQueroLer,
                        );
                      }}
                      style={
                        obraNoQueroLer
                          ? workActionSheetItemActiveStyle
                          : workActionSheetItemStyle
                      }
                    >
                      {obraNoQueroLer ? "Remover do Quero ler" : "Quero ler"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void alternarFavoritoObra(obra.id);
                      }}
                      style={
                        obraFavorita
                          ? workActionSheetItemActiveStyle
                          : workActionSheetItemStyle
                      }
                    >
                      {obraFavorita ? "Remover favorita" : "Favoritar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void alternarConcluidoObra(obra.id);
                      }}
                      style={
                        obraConcluida
                          ? workActionSheetItemActiveStyle
                          : workActionSheetItemStyle
                      }
                    >
                      {obraConcluida ? "Marcar como não concluída" : "Concluir"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void removerItemBibliotecaPerfil(item);
                      }}
                      style={workActionSheetItemStyle}
                    >
                      {abaBibliotecaPerfil === "lendo-agora"
                        ? "Parar leitura"
                        : abaBibliotecaPerfil === "historico"
                          ? "Limpar histórico"
                          : "Remover"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBibliotecaMenuAbertoChave("");
                        void compartilharObraPerfilAutor(obra);
                      }}
                      style={workActionSheetItemStyle}
                    >
                      Compartilhar
                    </button>
                  </div>
                </section>
              </div>
            );
          })()}

        {diarioMenuAberto &&
          (() => {
            const item = diarioMenuAberto;
            const obra = item.obra;
            const apresentacaoTipo = obterApresentacaoTipoDiarioPerfil(item.tipo);
            const progresso = Math.max(
              0,
              Math.min(
                100,
                Math.round(item.progresso ?? obra?.progressoLeitura ?? 0),
              ),
            );
            const capituloAtual =
              item.tipo === "lendo" && obra
                ? encontrarCapituloParaContinuar(obra)
                : null;
            const indiceCapituloAtual =
              capituloAtual && obra
                ? obra.capitulos.findIndex(
                    (capitulo) => capitulo.id === capituloAtual.id,
                  )
                : -1;
            const numeroCapituloAtual =
              indiceCapituloAtual >= 0 ? indiceCapituloAtual + 1 : 1;
            const totalCapitulos = obra?.capitulos.length || 0;
            const hrefAcao =
              capituloAtual && obra
                ? criarHrefLeituraCapituloPerfilAutor(
                    obra,
                    capituloAtual,
                    numeroCapituloAtual,
                  )
                : obterHrefItemDiarioPerfil(item);
            const podeEditarItemDiario = itemDiarioPertenceAoUsuarioLogado(item);
            const continuarLeituraDisponivel = Boolean(
              item.tipo === "lendo" && capituloAtual && obra,
            );
            const nota = Math.max(0, Math.min(5, item.nota || 0));
            const editorAbertoNesteItem =
              editorAnotacaoDiario.aberto &&
              editorAnotacaoDiario.itemChave === item.chave;
            const anotacaoId = item.anotacaoId?.trim() || "";
            const interacaoAnotacao = anotacaoId
              ? interacoesAnotacoesDiario[anotacaoId] ||
                criarInteracaoAnotacaoDiarioVazia()
              : criarInteracaoAnotacaoDiarioVazia();
            const anotacaoPodeReceberCurtida = Boolean(
              item.anotacao &&
                anotacaoId &&
                item.anotacaoVisibilidade !== "privado",
            );
            const totalCurtidasAnotacao = compactarNumeroPerfilAutor(
              interacaoAnotacao.totalCurtidas,
            );
            const metaSheet =
              item.tipo === "lendo" && obra
                ? `${apresentacaoTipo.texto} • ${
                    totalCapitulos > 0
                      ? `Capítulo ${numeroCapituloAtual} de ${totalCapitulos}`
                      : "Leitura em andamento"
                  } • ${progresso}% concluído`
                : item.tipo === "avaliacao" && nota > 0
                  ? `${apresentacaoTipo.texto} • ★ ${nota
                      .toFixed(1)
                      .replace(".", ",")} • ${dataDiarioPerfilFormatada(item.data)}`
                  : `${apresentacaoTipo.texto} • ${dataDiarioPerfilFormatada(
                      item.data,
                    )}`;

            return (
              <div
                style={workActionSheetOverlayStyle}
                role="presentation"
                onClick={() => setDiarioMenuAbertoChave("")}
              >
                <section
                  style={workActionSheetStyle}
                  role="dialog"
                  aria-label={`Ações do Diário ${item.titulo}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div style={workActionSheetHandleStyle} aria-hidden="true" />

                  <div style={workActionSheetHeaderStyle}>
                    <div style={workActionSheetTextBlockStyle}>
                      <strong style={workActionSheetTitleStyle}>
                        {item.titulo}
                      </strong>
                      <span style={workActionSheetMetaStyle}>
                        {metaSheet}
                      </span>
                    </div>
                  </div>

                  <div style={workActionSheetActionsStyle}>
                    <Link
                      href={hrefAcao}
                      onClick={() => setDiarioMenuAbertoChave("")}
                      style={workActionSheetItemStyle}
                    >
                      {continuarLeituraDisponivel ? "Continuar leitura" : "Ver obra"}
                    </Link>

                    {podeEditarItemDiario &&
                      obra &&
                      idAutorSupabaseValido(obra.id) && (
                        <button
                          type="button"
                          onClick={() => abrirEditorAnotacaoDiario(item)}
                          style={workActionSheetItemStyle}
                        >
                          {item.anotacao ? "Editar anotação" : "Adicionar anotação"}
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => {
                        if (obra) {
                          void compartilharObraPerfilAutor(obra);
                        }
                      }}
                      style={workActionSheetItemStyle}
                    >
                      Compartilhar
                    </button>
                  </div>

                  {editorAbertoNesteItem && (
                    <div style={diaryActionSheetEditorStyle}>
                      <textarea
                        value={editorAnotacaoDiario.texto}
                        onChange={(event) =>
                          setEditorAnotacaoDiario((estadoAtual) => ({
                            ...estadoAtual,
                            texto: event.target.value.slice(
                              0,
                              DIARIO_ANOTACAO_MAX_LENGTH,
                            ),
                            erro: "",
                          }))
                        }
                        placeholder="Escreva o que achou desta leitura..."
                        maxLength={DIARIO_ANOTACAO_MAX_LENGTH}
                        rows={4}
                        style={diaryItemAnnotationTextareaStyle}
                        disabled={editorAnotacaoDiario.salvando}
                      />

                      <div style={diaryItemAnnotationEditorMetaStyle}>
                        <span style={diaryItemAnnotationCounterStyle}>
                          {editorAnotacaoDiario.texto.length}/
                          {DIARIO_ANOTACAO_MAX_LENGTH}
                        </span>
                      </div>

                      {editorAnotacaoDiario.erro && (
                        <span style={diaryItemAnnotationErrorStyle}>
                          {editorAnotacaoDiario.erro}
                        </span>
                      )}

                      <div style={diaryItemAnnotationEditorActionsStyle}>
                        <button
                          type="button"
                          onClick={() => void salvarAnotacaoDiario()}
                          disabled={editorAnotacaoDiario.salvando}
                          style={diaryItemAnnotationSaveStyle}
                        >
                          {editorAnotacaoDiario.salvando ? "Salvando..." : "Salvar"}
                        </button>

                        <button
                          type="button"
                          onClick={fecharEditorAnotacaoDiario}
                          disabled={editorAnotacaoDiario.salvando}
                          style={diaryItemAnnotationCancelStyle}
                        >
                          Cancelar
                        </button>

                        {item.anotacao && (
                          <button
                            type="button"
                            onClick={() => void removerAnotacaoDiario()}
                            disabled={editorAnotacaoDiario.salvando}
                            style={diaryItemAnnotationRemoveStyle}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {item.anotacao && !editorAbertoNesteItem && (
                    <div style={diaryActionSheetAnnotationStyle}>
                      <div style={diaryActionSheetAnnotationHeaderStyle}>
                        <span aria-hidden="true" />

                        <strong style={diaryActionSheetAnnotationTitleStyle}>
                          Anotação
                        </strong>

                        {anotacaoPodeReceberCurtida ? (
                          <button
                            type="button"
                            onClick={() => void alternarCurtidaAnotacaoDiario(item)}
                            disabled={interacaoAnotacao.salvandoCurtida}
                            style={{
                              ...diaryActionSheetAnnotationLikeButtonStyle,
                              opacity: interacaoAnotacao.salvandoCurtida ? 0.58 : 1,
                              cursor: interacaoAnotacao.salvandoCurtida
                                ? "not-allowed"
                                : "pointer",
                            }}
                            aria-label={
                              interacaoAnotacao.curtiu
                                ? "Remover curtida da anotação"
                                : "Curtir anotação"
                            }
                            aria-pressed={interacaoAnotacao.curtiu}
                          >
                            <span
                              style={{
                                ...diaryActionSheetAnnotationLikeIconStyle,
                                color: interacaoAnotacao.curtiu
                                  ? "var(--historietas-perfil-rose, #FB7185)"
                                  : "#FFFFFF",
                              }}
                              aria-hidden="true"
                            >
                              ❤️
                            </span>
                            <span style={diaryActionSheetAnnotationLikeCountStyle}>
                              {totalCurtidasAnotacao}
                            </span>
                          </button>
                        ) : (
                          <span aria-hidden="true" />
                        )}
                      </div>

                      <p style={diaryActionSheetAnnotationTextStyle}>
                        {item.anotacao}
                      </p>
                    </div>
                  )}

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
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

const workActionSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 190px)",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-perfil-bg-page, #070212)",
  border: "none",
  borderBottom: "0",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  display: "grid",
  gap: 0,
  boxSizing: "border-box",
  touchAction: "none",
};

const workActionSheetHandleStyle: CSSProperties = {
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  justifySelf: "center",
  margin: "0 auto 12px",
};

const workActionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  padding: "0 24px 12px",
  boxSizing: "border-box",
  borderBottom: "none",
};

const workActionSheetTextBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  width: "100%",
};

const workActionSheetTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  fontWeight: 950,
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
};

const workActionSheetAuthorStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
};

const workActionSheetMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
};

const workActionSheetMetricsStyle: CSSProperties = {
  ...workActionSheetMetaStyle,
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "6px 10px",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
};


const workActionSheetActionsStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  borderTop: "none",
  background: "transparent",
  overflow: "hidden",
};

const workActionSheetItemStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "14px",
  border: "none",
  borderBottom: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  padding: "0 30px",
  fontSize: "18px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

const workActionSheetItemActiveStyle: CSSProperties = {
  ...workActionSheetItemStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

const workActionSheetCancelButtonStyle: CSSProperties = {
  ...workActionSheetItemStyle,
  justifyContent: "center",
  textAlign: "center",
  background: "transparent",
  color: "rgba(255,255,255,0.58)",
};

const diaryVisualCardStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  position: "relative",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
};

const desktopDiaryVisualCardStyle: CSSProperties = {
  ...diaryVisualCardStyle,
};

const diaryVisualCarouselCardStyle: CSSProperties = {
  ...diaryVisualCardStyle,
  width: "clamp(142px, 42vw, 172px)",
  minWidth: "clamp(142px, 42vw, 172px)",
  flex: "0 0 clamp(142px, 42vw, 172px)",
  scrollSnapAlign: "start",
};

const desktopDiaryVisualCarouselCardStyle: CSSProperties = {
  ...diaryVisualCarouselCardStyle,
  width: "190px",
  minWidth: "190px",
  flex: "0 0 190px",
};

const diaryVisualCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  textDecorationLine: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
  width: "100%",
};

const diaryVisualCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  minHeight: "208px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-perfil-surface, #08030F)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-perfil-surface, #08030F) 0%, var(--historietas-perfil-bg-deep, #04000A) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "0",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "none",
};

const desktopDiaryVisualCoverStyle: CSSProperties = {
  ...diaryVisualCoverStyle,
  minHeight: "236px",
};

const diaryActionSheetEditorStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "12px 18px 14px",
  borderBottom: "0",
  boxSizing: "border-box",
};

const diaryActionSheetAnnotationStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  maxHeight: "min(34dvh, 260px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  padding: "12px 24px 14px",
  borderBottom: "0",
  boxSizing: "border-box",
};

const diaryActionSheetAnnotationHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(54px, 1fr) auto minmax(54px, 1fr)",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  minWidth: 0,
};

const diaryActionSheetAnnotationTitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.82)",
  fontSize: "12px",
  fontWeight: 900,
  lineHeight: 1.2,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  textAlign: "center",
};

const diaryActionSheetAnnotationLikeButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  justifySelf: "end",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minWidth: "54px",
  minHeight: "30px",
  padding: "0 2px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  lineHeight: 1,
};

const diaryActionSheetAnnotationLikeIconStyle: CSSProperties = {
  fontSize: "17px",
  fontWeight: 950,
  lineHeight: 1,
  transition: "color 160ms ease, transform 160ms ease",
};

const diaryActionSheetAnnotationLikeCountStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 850,
  lineHeight: 1,
};

const diaryActionSheetAnnotationTextStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 650,
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};



const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};


const profileLibrarySectionStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "100%",
  marginTop: "14px",
  minWidth: 0,
};

const desktopProfileLibrarySectionStyle: CSSProperties = {
  ...profileLibrarySectionStyle,
  gap: "18px",
  marginTop: "18px",
};


const profileLibraryTabsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
  padding: "0 2px 4px",
  minWidth: 0,
  maxWidth: "100%",
};

const profileLibraryTabStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.055)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "0 12px",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

const profileLibraryTabActiveStyle: CSSProperties = {
  ...profileLibraryTabStyle,
  background: "var(--historietas-active-surface, var(--historietas-perfil-secondary-18, rgba(124,58,237,0.18)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const profileLibraryStatsGridStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  scrollSnapType: "x mandatory",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
  marginTop: "4px",
  padding: "0 2px 2px",
  maxWidth: "100%",
  minWidth: 0,
};

const desktopProfileLibraryStatsGridStyle: CSSProperties = {
  ...profileLibraryStatsGridStyle,
  justifyContent: "center",
  overflowX: "visible",
  flexWrap: "wrap",
  gap: "8px",
  padding: 0,
};

const profileLibraryStatCardStyle: CSSProperties = {
  flex: "0 0 84px",
  scrollSnapAlign: "start",
  borderRadius: "11px",
  background: "var(--historietas-perfil-deep-72, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "4px 4px",
  minHeight: "46px",
  display: "grid",
  gap: "1px",
  alignContent: "center",
  justifyItems: "center",
  minWidth: 0,
  overflow: "hidden",
  color: "var(--historietas-text-primary, #FFFFFF)",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  appearance: "none",
  boxShadow: "none",
};

const profileLibraryStatCardActiveStyle: CSSProperties = {
  ...profileLibraryStatCardStyle,
  background: "var(--historietas-perfil-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const profileLibraryStatNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const profileLibraryStatLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.2px",
  lineHeight: 1.02,
  fontWeight: 950,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  ...safeTextStyle,
};

const profileLibrarySummaryTitleStyle: CSSProperties = {
  margin: "14px 0 2px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 4.4vw, 24px)",
  lineHeight: 1.08,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const profileLibraryListStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "12px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const profileLibraryCardStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: "11px",
  borderRadius: "22px",
  background: "var(--historietas-perfil-deep-72, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
};


const profileLibraryBookActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(58px, 66px) minmax(0, 1fr) minmax(0, 1fr)",
  gridTemplateRows: "auto auto",
  gap: "5px",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopProfileLibraryBookActionGridStyle: CSSProperties = {
  ...profileLibraryBookActionGridStyle,
  gridTemplateColumns: "minmax(76px, 88px) minmax(0, 1fr) minmax(0, 1fr)",
  gap: "6px",
};

const profileLibraryBookInfoActionGridStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  gridColumn: "2 / 4",
  gridRow: "1 / 2",
};

const desktopProfileLibraryBookInfoActionGridStyle: CSSProperties = {
  ...profileLibraryBookInfoActionGridStyle,
  gap: "5px",
};


const profileLibraryCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  minWidth: 0,
  height: "100%",
};

const profileLibraryCoverStyle: CSSProperties = {
  gridColumn: "1 / 2",
  gridRow: "1 / 3",
  width: "100%",
  height: "100%",
  minHeight: 0,
  maxHeight: "none",
  aspectRatio: "auto",
  alignSelf: "stretch",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  textDecoration: "none",
  background: "var(--historietas-perfil-bg-deep, #04000A)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-perfil-surface, #08030F) 0%, var(--historietas-perfil-bg-deep, #04000A) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "block",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const profileLibraryCoverDesktopStyle: CSSProperties = {
  ...profileLibraryCoverStyle,
  borderRadius: "16px",
};

const profileLibraryCardContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
};

const profileLibraryBadgesRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  flexWrap: "wrap",
  minWidth: 0,
};

const profileLibraryChapterBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const profileLibraryStatusStyle: CSSProperties = {
  ...profileLibraryChapterBadgeStyle,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.62)",
};

const profileLibraryStatusActiveStyle: CSSProperties = {
  ...profileLibraryChapterBadgeStyle,
  background: "var(--historietas-perfil-success-spaced-12, rgba(34, 197, 94, 0.12))",
  border: "1px solid var(--historietas-perfil-success-spaced-22, rgba(34, 197, 94, 0.22))",
  color: "var(--historietas-perfil-success-soft, #86EFAC)",
  fontWeight: 950,
};

const profileLibraryTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  paddingBottom: "2px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const profileLibraryMetaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 700,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const profileLibraryAuthorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, var(--historietas-perfil-lavender, #D8C8FF))",
  fontSize: "12px",
  fontWeight: 800,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const profileLibraryPrimaryActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const profileLibrarySecondaryActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  paddingTop: "1px",
  marginTop: 0,
};

const profileLibraryReadButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-perfil-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  textAlign: "center",
  gridColumn: "2 / 3",
  gridRow: "2 / 3",
  ...safeTextStyle,
};

const profileLibraryViewButtonStyle: CSSProperties = {
  ...profileLibraryReadButtonStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  gridColumn: "3 / 4",
  gridRow: "2 / 3",
};

const profileLibraryListButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "inherit",
  ...safeTextStyle,
};

const profileLibraryListButtonActiveStyle: CSSProperties = {
  ...profileLibraryListButtonStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const profileLibraryDoneButtonStyle: CSSProperties = {
  ...profileLibraryListButtonStyle,
  background: "var(--historietas-perfil-success-spaced-12, rgba(34, 197, 94, 0.12))",
  border: "1px solid var(--historietas-perfil-success-spaced-22, rgba(34, 197, 94, 0.22))",
  color: "var(--historietas-perfil-success-soft, #86EFAC)",
};

const profileLibraryDoneButtonActiveStyle: CSSProperties = {
  ...profileLibraryDoneButtonStyle,
  background: "var(--historietas-perfil-emerald-18, rgba(16,185,129,0.18))",
  border: "1px solid var(--historietas-perfil-emerald-38, rgba(16,185,129,0.38))",
};

const profileLibraryRemoveButtonStyle: CSSProperties = {
  ...profileLibraryListButtonStyle,
  background: "var(--historietas-perfil-danger-dark-spaced-28, rgba(127, 29, 29, 0.28))",
  border: "1px solid var(--historietas-perfil-danger-spaced-22, rgba(248, 113, 113, 0.22))",
  color: "var(--historietas-perfil-danger-soft, #FCA5A5)",
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

const perfilAutorThemeCss = `
  html {
    --historietas-perfil-bg-page: #070212;
    --historietas-perfil-bg-deep: #04000A;
    --historietas-perfil-surface: #08030F;
    --historietas-perfil-surface-alt: #120B1C;
    --historietas-perfil-accent: #F97316;
    --historietas-perfil-accent-strong: #FB923C;
    --historietas-perfil-accent-soft: #FDBA74;
    --historietas-perfil-gold: #FBBF24;
    --historietas-perfil-danger-soft: #FCA5A5;
    --historietas-perfil-danger: #EF4444;
    --historietas-perfil-rose-soft: #FDA4AF;
    --historietas-perfil-rose: #FB7185;
    --historietas-perfil-success-soft: #86EFAC;
    --historietas-perfil-lavender-text: #DDD6FE;
    --historietas-perfil-purple-soft: #C084FC;
    --historietas-perfil-blue-soft: #7DD3FC;
    --historietas-perfil-lavender: #D8C8FF;
    --historietas-perfil-purple: #A78BFA;
    --historietas-perfil-secondary: #7C3AED;
    --historietas-perfil-accent-14: rgba(249,115,22,0.14);
    --historietas-perfil-rose-14: rgba(251,113,133,0.14);
    --historietas-perfil-success-14: rgba(34,197,94,0.14);
    --historietas-perfil-gold-14: rgba(251,191,36,0.14);
    --historietas-perfil-purple-soft-14: rgba(192,132,252,0.14);
    --historietas-perfil-blue-14: rgba(56,189,248,0.14);
    --historietas-perfil-secondary-18: rgba(124,58,237,0.18);
    --historietas-perfil-deep-72: rgba(4, 0, 10, 0.72);
    --historietas-perfil-success-spaced-12: rgba(34, 197, 94, 0.12);
    --historietas-perfil-success-spaced-22: rgba(34, 197, 94, 0.22);
    --historietas-perfil-emerald-18: rgba(16,185,129,0.18);
    --historietas-perfil-emerald-38: rgba(16,185,129,0.38);
    --historietas-perfil-danger-dark-spaced-28: rgba(127, 29, 29, 0.28);
    --historietas-perfil-danger-spaced-22: rgba(248, 113, 113, 0.22);
    --historietas-perfil-purple-dark-58: rgba(59, 7, 100, 0.58);
    --historietas-perfil-danger-42: rgba(248,113,113,0.42);
    --historietas-perfil-danger-dark-24: rgba(127,29,29,0.24);
    --historietas-perfil-danger-36: rgba(248,113,113,0.36);
    --historietas-perfil-danger-dark-34: rgba(127,29,29,0.34);
    --historietas-perfil-gold-spaced-34: rgba(251, 191, 36, 0.34);
    --historietas-perfil-surface-fade-0: rgba(8,5,13,0);
    --historietas-perfil-surface-fade-58: rgba(8,5,13,0.58);
    --historietas-perfil-surface-fade-92: rgba(8,5,13,0.92);
    --historietas-perfil-success-10: rgba(34,197,94,0.10);
    --historietas-perfil-success-22: rgba(34,197,94,0.22);
    --historietas-perfil-rose-dark-14: rgba(190,18,60,0.14);
    --historietas-perfil-rose-28: rgba(251,113,133,0.28);
    --historietas-perfil-surface-purple-92: rgba(18,8,31,0.92);
    --historietas-perfil-surface-purple-94: rgba(38,20,62,0.94);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-perfil-bg-page: #000000;
    --historietas-perfil-bg-deep: #000000;
    --historietas-perfil-surface: #050505;
    --historietas-perfil-surface-alt: #090909;
    --historietas-perfil-accent: #FFFFFF;
    --historietas-perfil-accent-strong: #FFFFFF;
    --historietas-perfil-accent-soft: #FFFFFF;
    --historietas-perfil-gold: #FFFFFF;
    --historietas-perfil-danger-soft: #FFFFFF;
    --historietas-perfil-danger: #FFFFFF;
    --historietas-perfil-rose-soft: #D4D4D8;
    --historietas-perfil-rose: #FFFFFF;
    --historietas-perfil-success-soft: #FFFFFF;
    --historietas-perfil-lavender-text: #FFFFFF;
    --historietas-perfil-purple-soft: #FFFFFF;
    --historietas-perfil-blue-soft: #D4D4D8;
    --historietas-perfil-lavender: #FFFFFF;
    --historietas-perfil-purple: #FFFFFF;
    --historietas-perfil-secondary: #A1A1AA;
    --historietas-perfil-accent-14: rgba(255,255,255,0.08);
    --historietas-perfil-rose-14: rgba(255,255,255,0.08);
    --historietas-perfil-success-14: rgba(255,255,255,0.08);
    --historietas-perfil-gold-14: rgba(255,255,255,0.08);
    --historietas-perfil-purple-soft-14: rgba(255,255,255,0.08);
    --historietas-perfil-blue-14: rgba(255,255,255,0.08);
    --historietas-perfil-secondary-18: rgba(255,255,255,0.08);
    --historietas-perfil-deep-72: rgba(0,0,0,0.72);
    --historietas-perfil-success-spaced-12: rgba(255,255,255,0.06);
    --historietas-perfil-success-spaced-22: rgba(255,255,255,0.10);
    --historietas-perfil-emerald-18: rgba(255,255,255,0.08);
    --historietas-perfil-emerald-38: rgba(255,255,255,0.18);
    --historietas-perfil-danger-dark-spaced-28: rgba(255,255,255,0.10);
    --historietas-perfil-danger-spaced-22: rgba(255,255,255,0.10);
    --historietas-perfil-purple-dark-58: rgba(255,255,255,0.14);
    --historietas-perfil-danger-42: rgba(255,255,255,0.24);
    --historietas-perfil-danger-dark-24: rgba(255,255,255,0.08);
    --historietas-perfil-danger-36: rgba(255,255,255,0.20);
    --historietas-perfil-danger-dark-34: rgba(255,255,255,0.12);
    --historietas-perfil-gold-spaced-34: rgba(255,255,255,0.18);
    --historietas-perfil-surface-fade-0: rgba(0,0,0,0);
    --historietas-perfil-surface-fade-58: rgba(0,0,0,0.58);
    --historietas-perfil-surface-fade-92: rgba(0,0,0,0.92);
    --historietas-perfil-success-10: rgba(255,255,255,0.06);
    --historietas-perfil-success-22: rgba(255,255,255,0.10);
    --historietas-perfil-rose-dark-14: rgba(255,255,255,0.08);
    --historietas-perfil-rose-28: rgba(255,255,255,0.14);
    --historietas-perfil-surface-purple-92: rgba(0,0,0,0.92);
    --historietas-perfil-surface-purple-94: rgba(5,5,5,0.94);
  }
`;

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "var(--historietas-bg-start, var(--historietas-perfil-bg-page, #070212))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
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
  background: "var(--historietas-perfil-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-perfil-purple-dark-58, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-perfil-lavender-text, #DDD6FE) 44%, var(--historietas-perfil-purple, #A78BFA) 100%)",
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

const profileHeaderDesktopStyle: CSSProperties = {
  ...profileHeaderStyle,
  gridTemplateColumns: "minmax(0, 1fr) 34px 36px",
};

const profileNotificationButtonStyle: CSSProperties = {
  position: "relative",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, var(--historietas-perfil-bg-deep, #04000A))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
};

const profileNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, var(--historietas-perfil-bg-page, #070212))",
  background: "var(--historietas-perfil-danger, #EF4444)",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
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
  background: "rgba(0,0,0,0.62)",
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
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-perfil-bg-page, #070212)",
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
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border: "0",
  background: "rgba(255,255,255,0.075)",
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
};

const menuListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  paddingBottom: "24px",
};

const menuSectionTitleStyle: CSSProperties = {
  marginTop: "8px",
  color: "rgba(255,255,255,0.52)",
  fontSize: "10px",
  lineHeight: 1.2,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  ...safeTextStyle,
};

const menuDividerStyle: CSSProperties = {
  height: "1px",
  background: "rgba(255,255,255,0.075)",
  margin: "8px 0 4px",
};

const menuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "0",
  border: "0",
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "grid",
  gridTemplateColumns: "32px minmax(0, 1fr) auto",
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
  color: "var(--historietas-perfil-danger-soft, #FCA5A5)",
};

const menuItemIconStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "10px",
  background: "transparent",
  color: "rgba(255,255,255,0.82)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

const menuItemTextStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 900,
  lineHeight: 1.2,
  color: "inherit",
  ...safeTextStyle,
};

const menuChevronStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 700,
  textAlign: "right",
};

const menuNotificationRightStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "6px",
  minWidth: 0,
};

const menuNotificationBadgeStyle: CSSProperties = {
  minWidth: "18px",
  height: "18px",
  borderRadius: "999px",
  padding: "0 5px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-perfil-danger, #EF4444)",
  color: "#FFFFFF",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 0 0 2px var(--historietas-perfil-bg-page, #070212)",
  pointerEvents: "none",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  border: "1px solid var(--historietas-perfil-purple-dark-58, rgba(59, 7, 100, 0.58))",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-perfil-bg-deep, #04000A)",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
  overflow: "hidden",
  fontFamily: "inherit",
  boxSizing: "border-box",
  boxShadow: "none",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #08030F)",
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #08030F)",
  color: "#FFFFFF",
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
};

const avatarErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-danger-soft, #FCA5A5)",
  fontSize: "10px",
  fontWeight: 800,
  ...safeTextStyle,
};


const denunciaPerfilOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  boxSizing: "border-box",
  background: "rgba(0,0,0,0.68)",
};

const denunciaPerfilSheetStyle: CSSProperties = {
  width: "min(430px, 100%)",
  maxHeight: "calc(100dvh - 36px)",
  overflowY: "auto",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-bg-page, #070212)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
  padding: "18px",
  display: "grid",
  gap: "14px",
  boxSizing: "border-box",
};

const denunciaPerfilHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  minWidth: 0,
};

const denunciaPerfilTitleBlockStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const denunciaPerfilTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "17px",
  lineHeight: 1.1,
  fontWeight: 950,
  ...safeTextStyle,
};

const denunciaPerfilSubtitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

const denunciaPerfilCloseButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "0",
  background: "rgba(255,255,255,0.075)",
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  flex: "0 0 auto",
};

const denunciaPerfilMotivosGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
};

const denunciaPerfilMotivoButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#FFFFFF",
  padding: "0 10px",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const denunciaPerfilMotivoAtivoStyle: CSSProperties = {
  ...denunciaPerfilMotivoButtonStyle,
  border: "1px solid var(--historietas-perfil-danger-42, rgba(248,113,113,0.42))",
  background: "var(--historietas-perfil-danger-dark-24, rgba(127,29,29,0.24))",
  color: "var(--historietas-perfil-danger-soft, #FCA5A5)",
};

const denunciaPerfilTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "92px",
  resize: "vertical",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #08030F)",
  color: "#FFFFFF",
  padding: "12px",
  outline: "none",
  fontSize: "12px",
  lineHeight: 1.42,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  ...safeTextStyle,
};

const denunciaPerfilCounterStyle: CSSProperties = {
  marginTop: "-8px",
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.2,
  fontWeight: 850,
  textAlign: "right",
  ...safeTextStyle,
};

const denunciaPerfilErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-danger-soft, #FCA5A5)",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 850,
  ...safeTextStyle,
};

const denunciaPerfilActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  minWidth: 0,
};

const denunciaPerfilCancelButtonStyle: CSSProperties = {
  minHeight: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
};

const denunciaPerfilSubmitButtonStyle: CSSProperties = {
  ...denunciaPerfilCancelButtonStyle,
  border: "1px solid var(--historietas-perfil-danger-36, rgba(248,113,113,0.36))",
  background: "var(--historietas-perfil-danger-dark-34, rgba(127,29,29,0.34))",
  color: "var(--historietas-perfil-danger-soft, #FCA5A5)",
};

const bioTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "64px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #08030F)",
  color: "#FFFFFF",
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
  color: "var(--historietas-text-secondary, #D4D4D8)",
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

const profileStatWorksNumberStyle: CSSProperties = {
  ...profileStatNumberStyle,
  position: "relative",
  top: "5px",
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

const profileStatStackedLabelStyle: CSSProperties = {
  ...profileStatLabelStyle,
  display: "grid",
  justifyItems: "center",
  gap: 0,
  whiteSpace: "nowrap",
};

const profileStatWorksLabelStyle: CSSProperties = {
  ...profileStatStackedLabelStyle,
  position: "relative",
  top: "5px",
};

const profileRatingStatItemStyle: CSSProperties = {
  ...profileStatItemStyle,
  gap: "3px",
};

const profileRatingNumberStyle: CSSProperties = {
  ...profileStatNumberStyle,
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
  position: "relative",
  top: "5px",
};

const profileRatingStackedMetaStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "10px 9.68px",
  alignItems: "center",
  justifyItems: "center",
  gap: 0,
  position: "relative",
  top: "5px",
  minWidth: 0,
  whiteSpace: "nowrap",
};

const profileRatingMiniStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-perfil-gold, #FBBF24)",
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  position: "relative",
  top: "-1px",
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
  color: "var(--historietas-perfil-gold-spaced-34, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const profileRatingMiniStarFillStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold, #FBBF24)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const profileRatingTotalStyle: CSSProperties = {
  ...profileStatLabelStyle,
  fontSize: "7.8px",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
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
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
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
  background: "transparent",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const authorRatingStarButtonStyle: CSSProperties = {
  minHeight: "auto",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-perfil-gold-spaced-34, rgba(251, 191, 36, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: "0 2px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const authorRatingStarActiveStyle: CSSProperties = {
  ...authorRatingStarButtonStyle,
  border: "none",
  background: "transparent",
  color: "var(--historietas-perfil-gold, #FBBF24)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const authorRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

const authorRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold-spaced-34, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

const authorRatingStarFillStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold, #FBBF24)",
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

const profileVisitorActionsStyle: CSSProperties = {
  ...profileActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const desktopProfileVisitorActionsStyle: CSSProperties = {
  ...desktopProfileActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

const profileActionToastStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "calc(92px + env(safe-area-inset-bottom))",
  transform: "translateX(-50%)",
  zIndex: 1400,
  width: "max-content",
  maxWidth: "calc(100vw - 32px)",
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-surface-strong, #120822)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
  padding: "9px 14px",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 900,
  textAlign: "center",
  pointerEvents: "none",
};

const profilePrimaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #08030F)",
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
  border: profilePrimaryButtonStyle.border,
  background: profilePrimaryButtonStyle.background,
  color: profilePrimaryButtonStyle.color,
  boxShadow: "none",
};

const profileActiveButtonStyle: CSSProperties = {
  ...profilePrimaryButtonStyle,
  border: profilePrimaryButtonStyle.border,
  background: profilePrimaryButtonStyle.background,
  color: profilePrimaryButtonStyle.color,
  boxShadow: "none",
};

const authorHighlightsStyle: CSSProperties = {
  width: "100%",
  marginTop: "0",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

const desktopAuthorHighlightsStyle: CSSProperties = {
  ...authorHighlightsStyle,
  marginTop: "0",
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

const authorHighlightsTitleGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "7px",
  minWidth: 0,
  flex: "1 1 auto",
};

const authorHighlightsTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const authorHighlightsHeaderActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const authorHighlightsLikeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  height: "22px",
  padding: 0,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-muted, rgba(255,255,255,0.76))",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 850,
  cursor: "pointer",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const authorHighlightsLikeButtonActiveStyle: CSSProperties = {
  ...authorHighlightsLikeButtonStyle,
  color: "var(--historietas-perfil-danger, #EF4444)",
};

const authorHighlightsLikeHeartEmojiStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "14px",
  lineHeight: 1,
};

const authorHighlightsLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 850,
  ...safeTextStyle,
};

const authorHighlightsTopFiveButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 2px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 900,
  textDecoration: "none",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

const authorHighlightsListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 70px)",
  alignItems: "start",
  justifyContent: "center",
  columnGap: "3px",
  rowGap: "0",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "visible",
  padding: "0",
  margin: 0,
  scrollSnapType: "none",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  touchAction: "pan-y",
  overscrollBehaviorX: "none",
};

const desktopAuthorHighlightsListStyle: CSSProperties = {
  ...authorHighlightsListStyle,
  gridTemplateColumns: "repeat(5, 70px)",
  justifyContent: "center",
  columnGap: "3px",
  rowGap: "0",
  width: "100%",
  maxWidth: "100%",
  padding: "0",
  margin: 0,
};

const authorHighlightItemStyle: CSSProperties = {
  flex: "0 0 70px",
  width: "70px",
  minWidth: "70px",
  maxWidth: "70px",
  scrollSnapAlign: "none",
  display: "grid",
  justifyItems: "stretch",
  gap: "0",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
};

const authorHighlightCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "70 / 99",
  minHeight: "0",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-perfil-surface, #08030F)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
};

const profileTabsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  alignItems: "end",
  gap: 0,
  margin: "4px 0 0",
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
  fontSize: "clamp(9px, 2.45vw, 10.5px)",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  padding: "0 3px",
  boxSizing: "border-box",
  ...safeTextStyle,
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
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
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #08030F)",
  color: "#FFFFFF",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  color: "var(--historietas-text-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  color: "#FFFFFF",
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
  color: "#FFFFFF",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
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
  color: "var(--historietas-text-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1.08,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const diaryMainTitleStyle: CSSProperties = {
  ...authorCommunityTitleStyle,
  color: "#FFFFFF",
};

const diaryTitleToolbarStyle: CSSProperties = {
  width: "100%",
  position: "relative",
  display: "grid",
  justifyItems: "center",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const diaryStatsToggleButtonStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2px 4px",
  boxSizing: "border-box",
  cursor: "pointer",
  fontFamily: "inherit",
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
  background: "var(--historietas-perfil-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const authorCommunityCardNumberStyle: CSSProperties = {
  color: "#FFFFFF",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  background: "var(--historietas-perfil-surface, #08030F)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const authorCommunityStatNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #08030F))",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  marginBottom: "4px",
  maxWidth: "100%",
  ...safeTextStyle,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #08030F))",
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
  background: "var(--historietas-input-bg, var(--historietas-perfil-bg-deep, #04000A))",
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
  background: "var(--historietas-input-bg, var(--historietas-perfil-bg-deep, #04000A))",
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
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
};

const profileWorkCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  textDecorationLine: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
};

const profileWorkCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  minHeight: "180px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-perfil-surface, #08030F)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "0",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "none",
};

const desktopProfileWorkCoverStyle: CSSProperties = {
  ...profileWorkCoverStyle,
  minHeight: "240px",
  borderRadius: "20px",
};

const profileWorkCoverOverlayStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "28px 42px 9px 10px",
  display: "grid",
  gap: "4px",
  background:
    "linear-gradient(180deg, var(--historietas-perfil-surface-fade-0, rgba(8,5,13,0)) 0%, var(--historietas-perfil-surface-fade-58, rgba(8,5,13,0.58)) 44%, var(--historietas-perfil-surface-fade-92, rgba(8,5,13,0.92)) 100%)",
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

const diaryCardCoverOverlayStyle: CSSProperties = {
  ...profileWorkCoverOverlayStyle,
  padding: "28px 42px 9px 10px",
  justifyItems: "start",
  textAlign: "left",
};

const diaryCardCoverTitleStyle: CSSProperties = {
  ...profileWorkCoverTitleStyle,
  width: "100%",
  textAlign: "left",
};

const diaryCardCoverMetaStyle: CSSProperties = {
  ...profileWorkCoverMetaStyle,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  color: "#FFFFFF",
  textAlign: "left",
};

const diaryCardHeartMetaStyle: CSSProperties = {
  color: "var(--historietas-perfil-danger, #EF4444)",
  fontWeight: 950,
};

const diaryCardStarMetaStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold, #FBBF24)",
  fontWeight: 950,
};

const diaryCardCommentMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.92)",
  fontWeight: 950,
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

const profileWorkHeartIconMetaStyle: CSSProperties = {
  color: "var(--historietas-perfil-danger, #EF4444)",
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
  zIndex: 45,
  width: "184px",
  minWidth: "184px",
  maxWidth: "calc(100vw - 36px)",
  padding: "5px",
  borderRadius: "13px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-perfil-bg-page, #070212)",
  boxShadow: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: "1px",
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  overflow: "visible",
};

const profileWorkMenuItemStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "30px",
  border: "none",
  borderRadius: "9px",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "11.5px",
  lineHeight: 1,
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflowWrap: "normal",
  wordBreak: "normal",
  overflow: "visible",
  textOverflow: "clip",
  padding: "0 9px",
  boxSizing: "border-box",
  flexShrink: 0,
};

const profileWorkMenuItemActiveStyle: CSSProperties = {
  ...profileWorkMenuItemStyle,
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
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
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #08030F))",
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
    "var(--historietas-perfil-surface, #08030F)",
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
    "var(--historietas-perfil-success-10, rgba(34,197,94,0.10))",
  border:
    "1px solid var(--historietas-perfil-success-22, rgba(34,197,94,0.22))",
  color:
    "var(--historietas-perfil-success-soft, #86EFAC)",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  color: "var(--historietas-secondary, var(--historietas-perfil-lavender-text, #DDD6FE))",
};

const favoriteBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background:
    "rgba(255,255,255,0.06)",
  border:
    "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
};

const completedBadgeStyle: CSSProperties = {
  ...publishedStatusStyle,
  background:
    "var(--historietas-perfil-success-10, rgba(34,197,94,0.10))",
  border:
    "1px solid var(--historietas-perfil-success-22, rgba(34,197,94,0.22))",
  color:
    "var(--historietas-perfil-success-soft, #86EFAC)",
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
    "linear-gradient(90deg, var(--historietas-accent, var(--historietas-perfil-accent, #F97316)) 0%, var(--historietas-secondary, var(--historietas-perfil-secondary, #7C3AED)) 100%)",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #08030F))",
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
  width: "100%",
  marginTop: "8px",
  padding: "8px 0 138px",
  display: "grid",
  justifyItems: "stretch",
  alignItems: "stretch",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

const diaryStatsGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const diaryStatCardStyle: CSSProperties = {
  ...statCardStyle,
  minHeight: "52px",
  borderRadius: "14px",
  padding: "7px 2px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const diaryStatNumberStyle: CSSProperties = {
  ...statNumberStyle,
  color: "#FFFFFF",
  fontSize: "18px",
};

const diaryStatLabelStyle: CSSProperties = {
  ...statLabelStyle,
  fontSize: "7px",
  letterSpacing: "0.025em",
  color: "rgba(255,255,255,0.72)",
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

const diaryCollapsibleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

const diaryToggleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minHeight: "auto",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.01em",
  cursor: "pointer",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const diaryToggleButtonIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
};

const diarySectionTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const diaryItemsCarouselStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "10px",
  width: "calc(100% + 20px)",
  maxWidth: "calc(100% + 20px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 10px 10px",
  margin: "0 -10px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "10px",
  scrollPaddingRight: "10px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const diaryItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "76px minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "10px",
  width: "min(318px, calc(100vw - 48px))",
  minWidth: "min(318px, calc(100vw - 48px))",
  flex: "0 0 min(318px, calc(100vw - 48px))",
  scrollSnapAlign: "start",
  minHeight: "142px",
  padding: "10px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopDiaryItemStyle: CSSProperties = {
  ...diaryItemStyle,
  gridTemplateColumns: "84px minmax(0, 1fr)",
  width: "340px",
  minWidth: "340px",
  flex: "0 0 340px",
  minHeight: "152px",
};

const diaryItemCoverLinkStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  minWidth: 0,
  textDecoration: "none",
};

const diaryItemCoverStyle: CSSProperties = {
  width: "76px",
  height: "108px",
  borderRadius: "15px",
  background: "var(--historietas-perfil-surface, #08030F)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  boxShadow: "none",
};

const desktopDiaryItemCoverStyle: CSSProperties = {
  ...diaryItemCoverStyle,
  width: "84px",
  height: "120px",
};

const diaryItemTextBlockStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "5px",
  minWidth: 0,
  textAlign: "left",
};

const diaryItemTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  minWidth: 0,
};

const diaryItemTypeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  width: "fit-content",
  minHeight: "20px",
  padding: "4px 7px",
  borderRadius: "999px",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const diaryItemTitleLinkStyle: CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  minWidth: 0,
};

const diaryItemTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  ...safeTextStyle,
};

const diaryItemAuthorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.15,
  fontWeight: 800,
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const diaryItemDescriptionStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9.5px",
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
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 850,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const diaryItemRatingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const diaryItemStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "1px",
  minWidth: 0,
};

const diaryItemRatingNumberStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold, #FBBF24)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
};

const diaryItemReadingBlockStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const diaryItemChapterStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  lineHeight: 1.2,
  fontWeight: 850,
};

const diaryItemProgressTrackStyle: CSSProperties = {
  width: "100%",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  overflow: "hidden",
};

const diaryItemProgressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
};

const diaryItemProgressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 850,
};

const diaryItemAnnotationBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "7px 8px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.045)",
  borderLeft: "2px solid var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  minWidth: 0,
};

const diaryItemAnnotationLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const diaryItemAnnotationTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  lineHeight: 1.35,
  fontWeight: 720,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const diaryItemAnnotationButtonStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
  fontSize: "8px",
  lineHeight: 1.15,
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "left",
};

const diaryItemAnnotationEditorStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "8px",
  borderRadius: "13px",
  background: "rgba(0,0,0,0.24)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  minWidth: 0,
};

const diaryItemAnnotationTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "78px",
  resize: "vertical",
  padding: "8px 9px",
  borderRadius: "11px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  lineHeight: 1.4,
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
};

const diaryItemAnnotationEditorMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const diaryItemAnnotationSelectStyle: CSSProperties = {
  minHeight: "28px",
  padding: "5px 8px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-perfil-surface-alt, #120B1C)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 850,
  outline: "none",
};

const diaryItemAnnotationCounterStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const diaryItemAnnotationErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "8px",
  lineHeight: 1.3,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const diaryItemAnnotationEditorActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "5px",
};

const diaryItemAnnotationSaveStyle: CSSProperties = {
  minHeight: "27px",
  padding: "5px 9px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  color: "#FFFFFF",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

const diaryItemAnnotationCancelStyle: CSSProperties = {
  ...diaryItemAnnotationSaveStyle,
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const diaryItemAnnotationRemoveStyle: CSSProperties = {
  ...diaryItemAnnotationSaveStyle,
  background: "var(--historietas-perfil-rose-dark-14, rgba(190,18,60,0.14))",
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
};

const diaryItemSocialBlockStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const diaryItemSocialActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const diaryItemSocialButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: "38px",
  minHeight: "27px",
  padding: "5px 8px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.055)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

const diaryItemSocialButtonActiveStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose, #FB7185)",
  background: "var(--historietas-perfil-rose-14, rgba(251,113,133,0.14))",
  border: "1px solid var(--historietas-perfil-rose-28, rgba(251,113,133,0.28))",
};

const diaryItemSocialErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "8px",
  lineHeight: 1.3,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const diaryItemCommentsPanelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "8px",
  borderRadius: "13px",
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

const diaryItemCommentsEmptyStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.5px",
  lineHeight: 1.3,
  fontWeight: 750,
};

const diaryItemCommentsListStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  maxHeight: "210px",
  overflowY: "auto",
  minWidth: 0,
};

const diaryItemCommentStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "7px",
  borderRadius: "11px",
  background: "rgba(255,255,255,0.04)",
  minWidth: 0,
};

const diaryItemCommentHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  minWidth: 0,
};

const diaryItemCommentAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8px",
  lineHeight: 1.1,
  fontWeight: 950,
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const diaryItemCommentDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7px",
  lineHeight: 1,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const diaryItemCommentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "8.5px",
  lineHeight: 1.35,
  fontWeight: 720,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

const diaryItemCommentRemoveStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "7px",
  lineHeight: 1,
  fontWeight: 850,
  cursor: "pointer",
};

const diaryItemCommentFormStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const diaryItemCommentTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  resize: "vertical",
  padding: "7px 8px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "8.5px",
  lineHeight: 1.35,
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
};

const diaryItemCommentFormFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const diaryItemCommentSendStyle: CSSProperties = {
  minHeight: "27px",
  padding: "5px 9px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  color: "#FFFFFF",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

const diaryItemLoginToCommentStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FDBA74))",
  fontSize: "8px",
  lineHeight: 1.2,
  fontWeight: 900,
  cursor: "pointer",
};

const diaryItemFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "7px",
  marginTop: "auto",
  minWidth: 0,
};

const diaryItemPrivacyStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 850,
  whiteSpace: "nowrap",
};

const diaryItemActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "25px",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
  color: "#FFFFFF",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const diaryEmptyStateStyle: CSSProperties = {
  width: "100%",
  margin: "0",
  padding: "2px 0",
  background: "transparent",
  border: "0",
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
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
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
  padding: "12px 12px 28px",
  gap: "10px",
};

const desktopDiaryStatsGridStyle: CSSProperties = {
  ...diaryStatsGridStyle,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  maxWidth: "760px",
  justifySelf: "center",
};

const desktopDiaryCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const desktopDiaryItemsCarouselStyle: CSSProperties = {
  ...diaryItemsCarouselStyle,
  width: "100%",
  maxWidth: "100%",
  gap: "12px",
  padding: "2px 0 12px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopDiaryCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: "28px",
  height: "28px",
  padding: 0,
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.16)",
  background:
    "linear-gradient(135deg, var(--historietas-perfil-surface-purple-92, rgba(18,8,31,0.92)) 0%, var(--historietas-perfil-surface-purple-94, rgba(38,20,62,0.94)) 100%)",
  color: "#FFFFFF",
  fontSize: 0,
  lineHeight: 1,
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const desktopDiaryCarouselArrowLeftStyle: CSSProperties = {
  ...desktopDiaryCarouselArrowBaseStyle,
  left: "4px",
};

const desktopDiaryCarouselArrowRightStyle: CSSProperties = {
  ...desktopDiaryCarouselArrowBaseStyle,
  right: "4px",
};

const desktopDiaryCarouselArrowIconStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
};

const emptyBoxStyle: CSSProperties = {
  marginTop: "20px",
  borderRadius: "24px",
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #08030F))",
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
  color: "var(--historietas-accent, var(--historietas-perfil-accent, #F97316))",
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
  background: "var(--historietas-perfil-surface, #08030F)",
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
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #08030F))",
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