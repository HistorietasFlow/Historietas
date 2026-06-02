"use client";

import Link from "next/link";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, TouchEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";

type CategoriaComunidade =
  | "Geral"
  | "Divulgação"
  | "Recomendações"
  | "Discussão"
  | "Dúvidas";

type TipoPublicacaoComunidade =
  | "Discussão"
  | "Teoria"
  | "Pedido de indicação"
  | "Divulgação"
  | "Review"
  | "Aviso de capítulo"
  | "Dúvida";

type UsuarioComunidade = {
  id: string;
  nome: string;
  email: string;
};

type ComentarioComunidade = {
  id: string;
  autorId: string;
  autorNome: string;
  texto: string;
  criadoEm: string;
  curtidas: string[];
};

type PostComunidade = {
  id: string;
  autorId: string;
  autorNome: string;
  categoria: CategoriaComunidade;
  tipoPublicacao: TipoPublicacaoComunidade;
  temSpoiler: boolean;
  texto: string;
  obraRelacionada: string;
  criadoEm: string;
  fixado: boolean;
  fixadoEm: string;
  fixadoPor: string;
  curtidas: string[];
  comentarios: ComentarioComunidade[];
};

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
};

type AlvoDenunciaComunidade = "post" | "comentario";

type ResultadoVotosEnquete = Record<string, Record<string, number>>;

type SupabaseEnqueteVotoRow = {
  post_id: string | null;
  user_id: string | null;
  opcao: string | null;
};

type OrdenacaoComunidade = "Recentes" | "Em alta" | "Mais comentadas";
type TipoPublicacaoFiltro = TipoPublicacaoComunidade | "Todos";

const CATEGORIAS_COMUNIDADE: CategoriaComunidade[] = [
  "Geral",
  "Divulgação",
  "Recomendações",
  "Discussão",
  "Dúvidas",
];

const ORDENACOES_COMUNIDADE: OrdenacaoComunidade[] = [
  "Recentes",
  "Em alta",
  "Mais comentadas",
];

const TIPOS_PUBLICACAO_COMUNIDADE: TipoPublicacaoComunidade[] = [
  "Discussão",
  "Teoria",
  "Pedido de indicação",
  "Divulgação",
  "Review",
  "Aviso de capítulo",
  "Dúvida",
];

const CHAVE_POSTS_SALVOS_COMUNIDADE = "historietas:comunidade:posts-salvos";
const CHAVE_VOTOS_ENQUETES_COMUNIDADE = "historietas:comunidade:votos-enquetes";

const AVISO_FIXADO_COMUNIDADE =
  "Use este espaço para falar sobre obras, pedir recomendações, divulgar capítulos e conversar com outros leitores sem spam e sem spoiler fora de aviso.";

const DESAFIO_SEMANA_COMUNIDADE = {
  titulo: "Desafio da semana",
  pergunta: "Qual obra da Historietas merece mais leitores agora?",
};

type FigurinhaComentario = {
  id: string;
  rotulo: string;
  alt: string;
  src: string;
};

function criarFigurinhaSvg(rotulo: string, destaque: string, fundo: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${destaque}" />
          <stop offset="1" stop-color="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="42" fill="${fundo}" />
      <circle cx="80" cy="70" r="44" fill="url(#g)" />
      <circle cx="62" cy="62" r="7" fill="#FFFFFF" />
      <circle cx="98" cy="62" r="7" fill="#FFFFFF" />
      <path d="M60 88c12 11 28 11 40 0" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" />
      <path d="M37 117c16-18 33-24 50-18 13 5 24 15 33 29" fill="none" stroke="${destaque}" stroke-width="10" stroke-linecap="round" opacity="0.9" />
      <text x="80" y="139" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">${rotulo}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FIGURINHAS_COMENTARIOS: FigurinhaComentario[] = [
  {
    id: "impacto",
    rotulo: "Impacto",
    alt: "Figurinha Impacto",
    src: criarFigurinhaSvg("BOOM", "#F97316", "#12081F"),
  },
  {
    id: "chocado",
    rotulo: "Chocado",
    alt: "Figurinha Chocado",
    src: criarFigurinhaSvg("WOW", "#FDBA74", "#0B0614"),
  },
  {
    id: "fofo",
    rotulo: "Fofo",
    alt: "Figurinha Fofo",
    src: criarFigurinhaSvg("FOFO", "#F472B6", "#12081F"),
  },
  {
    id: "sombrio",
    rotulo: "Sombrio",
    alt: "Figurinha Sombrio",
    src: criarFigurinhaSvg("DARK", "#7C3AED", "#0B0614"),
  },
  {
    id: "fogo",
    rotulo: "Fogo",
    alt: "Figurinha Fogo",
    src: criarFigurinhaSvg("FIRE", "#F97316", "#180B2D"),
  },
  {
    id: "amei",
    rotulo: "Amei",
    alt: "Figurinha Amei",
    src: criarFigurinhaSvg("LOVE", "#F43F5E", "#12081F"),
  },
  {
    id: "genial",
    rotulo: "Genial",
    alt: "Figurinha Genial",
    src: criarFigurinhaSvg("TOP", "#FACC15", "#0B0614"),
  },
  {
    id: "vilao",
    rotulo: "Vilão",
    alt: "Figurinha Vilão",
    src: criarFigurinhaSvg("VILÃO", "#A855F7", "#0B0614"),
  },
];

function obterCodigoFigurinha(id: string) {
  return `[figurinha:${id}]`;
}

function obterFigurinhaPorTexto(texto: string) {
  const match = /^\[figurinha:([a-z0-9-]+)\]$/i.exec(texto.trim());

  if (!match) {
    return null;
  }

  return (
    FIGURINHAS_COMENTARIOS.find((figurinha) => figurinha.id === match[1]) ||
    null
  );
}

function obterNomeUsuario(email: string, nomeProfile = "") {
  const nomeLimpo = nomeProfile.trim();

  if (nomeLimpo) {
    return nomeLimpo;
  }

  const nomeEmail = email.trim().split("@")[0];

  return nomeEmail || "Usuário";
}

function formatarDataComunidade(dataIso: string) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "Agora";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizarCategoria(valor: unknown): CategoriaComunidade {
  return CATEGORIAS_COMUNIDADE.includes(valor as CategoriaComunidade)
    ? (valor as CategoriaComunidade)
    : "Geral";
}

function normalizarTipoPublicacao(valor: unknown): TipoPublicacaoComunidade {
  return TIPOS_PUBLICACAO_COMUNIDADE.includes(valor as TipoPublicacaoComunidade)
    ? (valor as TipoPublicacaoComunidade)
    : "Discussão";
}

function normalizarTextoBusca(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function criarSlugObraRelacionada(titulo: string) {
  const slug = normalizarTextoBusca(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function criarLinkObraRelacionada(titulo: string) {
  return `/obra/${criarSlugObraRelacionada(titulo)}`;
}

function obterTipoPublicacaoPorParametro(valor: string) {
  const valorNormalizado = normalizarTextoBusca(valor);

  if (!valorNormalizado) {
    return null;
  }

  return (
    TIPOS_PUBLICACAO_COMUNIDADE.find(
      (tipo) => normalizarTextoBusca(tipo) === valorNormalizado
    ) || null
  );
}

function normalizarSugestaoObraLocal(valor: unknown, index: number) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const obra = valor as Record<string, unknown>;
  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "";

  if (!titulo || obra.publicado !== true) {
    return null;
  }

  const autor =
    typeof obra.autor === "string" && obra.autor.trim()
      ? obra.autor.trim()
      : "Autor não informado";

  const id =
    typeof obra.id === "string" && obra.id.trim()
      ? obra.id.trim()
      : `obra-local-${index}`;

  return {
    id,
    titulo,
    autor,
  } satisfies ObraRelacionadaSugestao;
}

function carregarSugestoesObrasLocais() {
  try {
    const obrasTexto = window.localStorage.getItem("historietas-obras");
    const obrasJson: unknown = obrasTexto ? JSON.parse(obrasTexto) : [];

    if (!Array.isArray(obrasJson)) {
      return [];
    }

    return obrasJson
      .map((obra, index) => normalizarSugestaoObraLocal(obra, index))
      .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));
  } catch {
    return [];
  }
}

function removerSugestoesObrasDuplicadas(obrasBase: ObraRelacionadaSugestao[]) {
  const titulosRegistrados = new Set<string>();

  return obrasBase.filter((obra) => {
    const chaveTitulo = normalizarTextoBusca(obra.titulo);

    if (!chaveTitulo || titulosRegistrados.has(chaveTitulo)) {
      return false;
    }

    titulosRegistrados.add(chaveTitulo);
    return true;
  });
}

function obterLinhasTexto(texto: string) {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

function postEhEnquete(post: Pick<PostComunidade, "texto">) {
  const linhas = obterLinhasTexto(post.texto);
  const primeiraLinha = linhas[0] || "";
  const totalOpcoes = linhas.filter((linha) => {
    return /^(?:opção|opcao|alternativa)\s*\d*\s*[:\-]\s*.+$/i.test(linha);
  }).length;

  return /^enquete\s*[:\-]/i.test(primeiraLinha) && totalOpcoes >= 2;
}

function obterPerguntaEnquete(texto: string) {
  const linhas = obterLinhasTexto(texto);
  const primeiraLinha = linhas[0] || "Enquete da comunidade";

  return (
    primeiraLinha.replace(/^enquete\s*[:\-]\s*/i, "").trim() ||
    "Enquete da comunidade"
  );
}

function obterOpcoesEnquete(texto: string) {
  const opcoes = obterLinhasTexto(texto)
    .map((linha) => {
      const match = /^(?:opção|opcao|alternativa)\s*\d*\s*[:\-]\s*(.+)$/i.exec(linha);

      return match?.[1]?.trim() || "";
    })
    .filter(Boolean)
    .slice(0, 4);

  return opcoes.length >= 2 ? opcoes : [];
}

function carregarVotosEnquetesLocais() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  try {
    const texto = window.localStorage.getItem(CHAVE_VOTOS_ENQUETES_COMUNIDADE);
    const json: unknown = texto ? JSON.parse(texto) : {};

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {} as Record<string, string>;
    }

    return Object.fromEntries(
      Object.entries(json).filter((entrada): entrada is [string, string] => {
        return typeof entrada[0] === "string" && typeof entrada[1] === "string";
      })
    );
  } catch {
    return {} as Record<string, string>;
  }
}

function salvarVotosEnquetesLocais(votos: Record<string, string>) {
  try {
    window.localStorage.setItem(
      CHAVE_VOTOS_ENQUETES_COMUNIDADE,
      JSON.stringify(votos)
    );
  } catch {
    // Se o navegador bloquear localStorage, a votação continua no estado da página.
  }
}

function calcularTotalVotosEnquete(
  resultados: ResultadoVotosEnquete,
  postId: string
) {
  return Object.values(resultados[postId] || {}).reduce((total, quantidade) => {
    return total + quantidade;
  }, 0);
}

function calcularPorcentagemOpcaoEnquete(
  resultados: ResultadoVotosEnquete,
  postId: string,
  opcao: string
) {
  const total = calcularTotalVotosEnquete(resultados, postId);

  if (total <= 0) {
    return 0;
  }

  const quantidade = resultados[postId]?.[opcao] || 0;

  return Math.round((quantidade / total) * 100);
}

async function carregarVotosEnquetesSupabase(
  postIds: string[],
  usuarioId: string
) {
  if (postIds.length === 0 || !usuarioId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("comunidade_enquete_votos")
      .select("post_id, user_id, opcao")
      .in("post_id", postIds);

    if (error || !Array.isArray(data)) {
      return null;
    }

    const resultados: ResultadoVotosEnquete = {};
    const meusVotos: Record<string, string> = {};

    (data as SupabaseEnqueteVotoRow[]).forEach((voto) => {
      const postId = typeof voto.post_id === "string" ? voto.post_id : "";
      const opcao = typeof voto.opcao === "string" ? voto.opcao : "";
      const userId = typeof voto.user_id === "string" ? voto.user_id : "";

      if (!postId || !opcao) {
        return;
      }

      resultados[postId] = {
        ...(resultados[postId] || {}),
        [opcao]: (resultados[postId]?.[opcao] || 0) + 1,
      };

      if (userId === usuarioId) {
        meusVotos[postId] = opcao;
      }
    });

    return {
      resultados,
      meusVotos,
    };
  } catch {
    return null;
  }
}

function obterPontuacaoPost(post: PostComunidade) {
  return post.curtidas.length * 2 + post.comentarios.length * 3;
}

function obterLinkPublicacaoComunidade(postId: string) {
  if (typeof window === "undefined") {
    return `/comunidade?post=${encodeURIComponent(postId)}`;
  }

  const url = new URL(window.location.href);
  url.pathname = "/comunidade";
  url.search = `?post=${encodeURIComponent(postId)}`;
  url.hash = "";

  return url.toString();
}

async function copiarTextoComFallback(texto: string) {
  try {
    if (
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Continua para o fallback abaixo.
  }

  let campoTemporario: HTMLTextAreaElement | null = null;

  try {
    campoTemporario = document.createElement("textarea");
    campoTemporario.value = texto;
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

type SupabaseObraPublicaRow = {
  id: string;
  titulo: string | null;
  autor: string | null;
  publicado: boolean | null;
};

type SupabasePostRow = {
  id: string;
  autor_id: string;
  autor_nome: string;
  categoria: string;
  tipo_publicacao: string | null;
  tem_spoiler: boolean | null;
  texto: string;
  obra_relacionada: string | null;
  criado_em: string;
  fixado: boolean | null;
  fixado_em: string | null;
  fixado_por: string | null;
};

type SupabaseComentarioRow = {
  id: string;
  post_id: string;
  autor_id: string;
  autor_nome: string;
  texto: string;
  criado_em: string;
};

type SupabaseCurtidaRow = {
  post_id: string;
  usuario_id: string;
};

type SupabaseComentarioCurtidaRow = {
  comentario_id: string;
  usuario_id: string;
};

function mapearComentarioSupabase(
  comentario: SupabaseComentarioRow,
  curtidasPorComentario: Map<string, string[]>
): ComentarioComunidade {
  return {
    id: comentario.id,
    autorId: comentario.autor_id,
    autorNome: comentario.autor_nome?.trim() || "Usuário",
    texto: comentario.texto.trim().slice(0, 420),
    criadoEm: comentario.criado_em,
    curtidas: curtidasPorComentario.get(comentario.id) || [],
  };
}

function mapearPostSupabase(
  post: SupabasePostRow,
  comentariosPorPost: Map<string, ComentarioComunidade[]>,
  curtidasPorPost: Map<string, string[]>
): PostComunidade {
  return {
    id: post.id,
    autorId: post.autor_id,
    autorNome: post.autor_nome?.trim() || "Usuário",
    categoria: normalizarCategoria(post.categoria),
    tipoPublicacao: normalizarTipoPublicacao(post.tipo_publicacao),
    temSpoiler: Boolean(post.tem_spoiler),
    texto: post.texto.trim().slice(0, 700),
    obraRelacionada: (post.obra_relacionada || "").trim().slice(0, 90),
    criadoEm: post.criado_em,
    fixado: Boolean(post.fixado),
    fixadoEm: post.fixado_em || "",
    fixadoPor: post.fixado_por || "",
    curtidas: curtidasPorPost.get(post.id) || [],
    comentarios: comentariosPorPost.get(post.id) || [],
  };
}

function mapearPostsSupabase(
  postsSupabase: SupabasePostRow[],
  comentariosSupabase: SupabaseComentarioRow[],
  curtidasSupabase: SupabaseCurtidaRow[],
  comentarioCurtidasSupabase: SupabaseComentarioCurtidaRow[]
) {
  const comentariosPorPost = new Map<string, ComentarioComunidade[]>();
  const curtidasPorPost = new Map<string, string[]>();
  const curtidasPorComentario = new Map<string, string[]>();

  comentarioCurtidasSupabase.forEach((curtida) => {
    const curtidasAtuais = curtidasPorComentario.get(curtida.comentario_id) || [];

    if (!curtidasAtuais.includes(curtida.usuario_id)) {
      curtidasPorComentario.set(curtida.comentario_id, [
        ...curtidasAtuais,
        curtida.usuario_id,
      ]);
    }
  });

  comentariosSupabase.forEach((comentarioSupabase) => {
    const comentario = mapearComentarioSupabase(
      comentarioSupabase,
      curtidasPorComentario
    );
    const comentariosAtuais =
      comentariosPorPost.get(comentarioSupabase.post_id) || [];

    comentariosPorPost.set(comentarioSupabase.post_id, [
      ...comentariosAtuais,
      comentario,
    ]);
  });

  curtidasSupabase.forEach((curtida) => {
    const curtidasAtuais = curtidasPorPost.get(curtida.post_id) || [];

    if (!curtidasAtuais.includes(curtida.usuario_id)) {
      curtidasPorPost.set(curtida.post_id, [
        ...curtidasAtuais,
        curtida.usuario_id,
      ]);
    }
  });

  return postsSupabase.map((post) =>
    mapearPostSupabase(post, comentariosPorPost, curtidasPorPost)
  );
}

function formatarErroSupabase(acao: string, erro: unknown) {
  if (!erro || typeof erro !== "object") {
    return `${acao}: erro desconhecido.`;
  }

  const supabaseErro = erro as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  const detalhes = [
    supabaseErro.message,
    supabaseErro.code ? `código ${supabaseErro.code}` : "",
    supabaseErro.details,
    supabaseErro.hint,
  ]
    .filter(Boolean)
    .join(" · ");

  return detalhes ? `${acao}: ${detalhes}` : `${acao}: erro desconhecido.`;
}

type ComentariosSheetProps = {
  post: PostComunidade | null;
  podeComentar: boolean;
  usuarioId: string;
  usuarioNome: string;
  erroInteracao: string;
  onFechar: () => void;
  onEnviar: (postId: string, texto: string) => boolean | Promise<boolean>;
  onCurtirComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onRemoverComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

const ComentariosSheet = memo(function ComentariosSheet({
  post,
  podeComentar,
  usuarioId,
  usuarioNome,
  erroInteracao,
  onFechar,
  onEnviar,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: ComentariosSheetProps) {
  const comentarioRef = useRef<HTMLTextAreaElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);
  const [sheetExpandido, setSheetExpandido] = useState(false);
  const [figurinhasAbertas, setFigurinhasAbertas] = useState(false);
  const [figurinhaSelecionadaId, setFigurinhaSelecionadaId] = useState<
    string | null
  >(null);
  const [comentarioEnviando, setComentarioEnviando] = useState(false);
  const [comentarioCurtindoId, setComentarioCurtindoId] = useState<string | null>(null);
  const [comentarioRemovendoId, setComentarioRemovendoId] = useState<
    string | null
  >(null);
  const [comentarioDenunciandoId, setComentarioDenunciandoId] = useState<
    string | null
  >(null);
  const comentarioAcoesRef = useRef<Set<string>>(new Set<string>());

  const figurinhaSelecionada = useMemo(() => {
    if (!figurinhaSelecionadaId) {
      return null;
    }

    return (
      FIGURINHAS_COMENTARIOS.find(
        (figurinha) => figurinha.id === figurinhaSelecionadaId
      ) || null
    );
  }, [figurinhaSelecionadaId]);

  function inserirNoComentario(valor: string) {
    if (!podeComentar || !comentarioRef.current) {
      return;
    }

    const campo = comentarioRef.current;
    const inicio = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? campo.value.length;
    const textoAtual = campo.value;

    campo.value = `${textoAtual.slice(0, inicio)}${valor}${textoAtual.slice(fim)}`;
    campo.focus();

    const novaPosicao = inicio + valor.length;
    campo.setSelectionRange(novaPosicao, novaPosicao);
  }

  function inserirFigurinha(id: string) {
    if (!podeComentar) {
      return;
    }

    setFigurinhaSelecionadaId(id);
    setFigurinhasAbertas(false);

    if (comentarioRef.current) {
      comentarioRef.current.value = "";
      comentarioRef.current.blur();
    }
  }

  function removerFigurinhaSelecionada() {
    setFigurinhaSelecionadaId(null);

    if (comentarioRef.current) {
      comentarioRef.current.focus();
    }
  }

  function iniciarAcaoComentario(chave: string) {
    if (comentarioAcoesRef.current.has(chave)) {
      return false;
    }

    comentarioAcoesRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComentario(chave: string) {
    comentarioAcoesRef.current.delete(chave);
  }

  async function curtirComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioCurtindoId(comentarioId);

    try {
      await onCurtirComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioCurtindoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function removerComentarioSeguro(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioRemovendoId(comentarioId);

    try {
      await onRemoverComentario(postId, comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioRemovendoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  async function denunciarComentarioSeguro(comentarioId: string) {
    const chaveAcao = `denunciar-comentario:${comentarioId}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioDenunciandoId(comentarioId);

    try {
      await onDenunciarComentario(comentarioId);
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioDenunciandoId((comentarioAtualId) =>
        comentarioAtualId === comentarioId ? null : comentarioAtualId
      );
    }
  }

  function responderComentario(nomeAutor: string) {
    if (!podeComentar) {
      return;
    }

    const mencao = `@${nomeAutor.replace(/\s+/g, " ").trim()} `;

    setFigurinhaSelecionadaId(null);
    setFigurinhasAbertas(false);

    window.setTimeout(() => {
      if (!comentarioRef.current) {
        return;
      }

      comentarioRef.current.value = mencao;
      comentarioRef.current.focus();
      comentarioRef.current.setSelectionRange(mencao.length, mencao.length);
    }, 0);
  }

  function iniciarArraste(event: TouchEvent<HTMLDivElement>) {
    dragStartYRef.current = event.touches[0]?.clientY || 0;
    dragOffsetYRef.current = 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function moverArraste(event: TouchEvent<HTMLDivElement>) {
    const posicaoAtual = event.touches[0]?.clientY || dragStartYRef.current;
    const limiteSuperior = sheetExpandido ? -46 : -58;
    const limiteInferior = sheetExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(limiteInferior, posicaoAtual - dragStartYRef.current)
    );

    dragOffsetYRef.current = deslocamento;

    if (sheetRef.current) {
      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
      }
    }
  }

  function finalizarArraste() {
    const deslocamento = dragOffsetYRef.current;

    if (sheetRef.current) {
      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (deslocamento < -34) {
      setSheetExpandido(true);
      return;
    }

    if (deslocamento > 52 && sheetExpandido) {
      setSheetExpandido(false);
      return;
    }

    if (deslocamento > 118 && !sheetExpandido) {
      onFechar();
    }
  }

  if (!post) {
    return null;
  }

  async function enviarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!post) {
      return;
    }

    const chaveAcao = `enviar-comentario:${post.id}`;

    if (!iniciarAcaoComentario(chaveAcao)) {
      return;
    }

    setComentarioEnviando(true);

    try {
      const conteudoComentario = figurinhaSelecionadaId
        ? obterCodigoFigurinha(figurinhaSelecionadaId)
        : comentarioRef.current?.value || "";

      const enviado = await onEnviar(post.id, conteudoComentario);

      if (enviado) {
        setFigurinhaSelecionadaId(null);

        if (comentarioRef.current) {
          comentarioRef.current.value = "";
        }
      }
    } finally {
      finalizarAcaoComentario(chaveAcao);
      setComentarioEnviando(false);
    }
  }

  return (
    <section style={commentsSheetOverlayStyle} aria-label="Comentários">
      <button
        type="button"
        aria-label="Fechar comentários"
        onClick={onFechar}
        style={commentsSheetBackdropStyle}
      />

      <article
        ref={sheetRef}
        style={{
          ...commentsSheetStyle,
          ...(sheetExpandido
            ? commentsSheetExpandedStyle
            : commentsSheetCompactStyle),
        }}
      >
        <div
          data-comments-sheet-handle="true"
          style={commentsSheetHandleWrapStyle}
          onTouchStart={iniciarArraste}
          onTouchMove={moverArraste}
          onTouchEnd={finalizarArraste}
          onTouchCancel={finalizarArraste}
        >
          <div style={commentsSheetHandleStyle} />
        </div>

        <header style={commentsSheetHeaderStyle}>
          <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

          <strong style={commentsSheetTitleStyle}>
            {post.comentarios.length === 1
              ? "1 comentário"
              : `${post.comentarios.length} comentários`}
          </strong>

          <button type="button" onClick={onFechar} style={commentsSheetCloseStyle}>
            ×
          </button>
        </header>

        <section style={commentsSheetListStyle}>
          {post.comentarios.length > 0 ? (
            post.comentarios.map((comentario) => {
              const usuarioCurtiuComentario = Boolean(
                usuarioId && comentario.curtidas.includes(usuarioId)
              );
              const podeRemoverComentario = Boolean(
                usuarioId && comentario.autorId === usuarioId
              );
              const podeDenunciarComentario = Boolean(
                usuarioId && comentario.autorId !== usuarioId
              );
              const comentarioCurtindo = comentarioCurtindoId === comentario.id;
              const comentarioRemovendo = comentarioRemovendoId === comentario.id;
              const comentarioDenunciando =
                comentarioDenunciandoId === comentario.id;

              return (
              <article key={comentario.id} style={commentItemStyle}>
                <div style={commentAvatarStyle}>
                  {comentario.autorNome.slice(0, 1).toUpperCase()}
                </div>

                <div style={commentContentStyle}>
                  <div style={commentTopLineStyle}>
                    <strong style={commentAuthorStyle}>{comentario.autorNome}</strong>
                    <span style={commentTimeStyle}>agora</span>
                  </div>

                  {obterFigurinhaPorTexto(comentario.texto) ? (
                    <img
                      src={obterFigurinhaPorTexto(comentario.texto)?.src}
                      alt={
                        obterFigurinhaPorTexto(comentario.texto)?.alt ||
                        "Figurinha"
                      }
                      style={commentStickerImageStyle}
                    />
                  ) : (
                    <p style={commentTextStyle}>{comentario.texto}</p>
                  )}

                  <div style={commentActionsRowStyle}>
                    <button
                      type="button"
                      onClick={() => responderComentario(comentario.autorNome)}
                      disabled={!podeComentar}
                      style={{
                        ...commentReplyButtonStyle,
                        opacity: podeComentar ? 1 : 0.52,
                        cursor: podeComentar ? "pointer" : "not-allowed",
                      }}
                    >
                      Responder
                    </button>

                    {podeRemoverComentario && (
                      <button
                        type="button"
                        onClick={() => removerComentarioSeguro(post.id, comentario.id)}
                        disabled={comentarioRemovendo}
                        style={{
                          ...commentRemoveButtonStyle,
                          opacity: comentarioRemovendo ? 0.58 : 1,
                          cursor: comentarioRemovendo ? "not-allowed" : "pointer",
                        }}
                      >
                        {comentarioRemovendo ? "Removendo..." : "Remover"}
                      </button>
                    )}

                    {podeDenunciarComentario && (
                      <button
                        type="button"
                        onClick={() => denunciarComentarioSeguro(comentario.id)}
                        disabled={comentarioDenunciando}
                        style={{
                          ...commentReportButtonStyle,
                          opacity: comentarioDenunciando ? 0.58 : 1,
                          cursor: comentarioDenunciando ? "not-allowed" : "pointer",
                        }}
                      >
                        {comentarioDenunciando ? "Enviando..." : "Denunciar"}
                      </button>
                    )}
                  </div>
                </div>

                <div style={commentLikeWrapStyle}>
                  <button
                    type="button"
                    aria-label={
                      usuarioCurtiuComentario
                        ? "Remover curtida do comentário"
                        : "Curtir comentário"
                    }
                    onClick={() => curtirComentarioSeguro(post.id, comentario.id)}
                    disabled={!podeComentar || comentarioCurtindo}
                    style={{
                      ...commentLikeButtonStyle,
                      opacity: podeComentar && !comentarioCurtindo ? 1 : 0.58,
                      cursor:
                        podeComentar && !comentarioCurtindo
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={commentHeartIconStyle}
                    >
                      <path
                        d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                        fill={usuarioCurtiuComentario ? "#F43F5E" : "none"}
                        stroke={
                          usuarioCurtiuComentario
                            ? "#F43F5E"
                            : "var(--historietas-text-secondary, #D4D4D8)"
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <span style={commentLikeCountStyle}>
                    {comentario.curtidas.length}
                  </span>
                </div>
              </article>
              );
            })
          ) : (
            <div style={commentsSheetEmptyStyle}>
              <strong style={commentsSheetEmptyTitleStyle}>Sem comentários ainda</strong>
              <span style={commentsSheetEmptyTextStyle}>
                Seja o primeiro a comentar.
              </span>
            </div>
          )}
        </section>

        {erroInteracao && (
          <span style={commentsSheetErrorStyle}>{erroInteracao}</span>
        )}

        <section style={commentsToolsStyle}>
          <div style={commentsQuickReactionsStyle}>
            {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => inserirNoComentario(emoji)}
                disabled={!podeComentar || Boolean(figurinhaSelecionada)}
                style={commentsQuickReactionButtonStyle}
              >
                {emoji}
              </button>
            ))}

            <button
              type="button"
              aria-label="Abrir figurinhas"
              title="Figurinhas"
              onClick={() => setFigurinhasAbertas((aberto) => !aberto)}
              disabled={!podeComentar}
              style={
                figurinhasAbertas
                  ? commentsStickerToggleActiveStyle
                  : commentsStickerToggleStyle
              }
            >
              ▣
            </button>
          </div>

          {figurinhasAbertas && (
            <div style={commentsStickerTrayStyle}>
              <div style={commentsStickerTrayHeaderStyle}>
                <strong style={commentsStickerTrayTitleStyle}>
                  Figurinhas Historietas
                </strong>

                <button
                  type="button"
                  onClick={() => setFigurinhasAbertas(false)}
                  style={commentsStickerTrayCloseStyle}
                >
                  ×
                </button>
              </div>

              <div style={commentsStickersGridStyle}>
                {FIGURINHAS_COMENTARIOS.map((figurinha) => (
                  <button
                    key={figurinha.id}
                    type="button"
                    aria-label={figurinha.alt}
                    onClick={() => inserirFigurinha(figurinha.id)}
                    style={commentsStickerButtonStyle}
                  >
                    <img
                      src={figurinha.src}
                      alt={figurinha.alt}
                      style={commentsStickerPreviewStyle}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <form onSubmit={enviarComentario} style={commentsSheetFormStyle}>
          <div style={commentsInputAvatarStyle}>
            {(podeComentar ? usuarioNome : "H").slice(0, 1).toUpperCase()}
          </div>

          <div style={commentsInputBoxStyle}>
            {figurinhaSelecionada ? (
              <div style={commentsSelectedStickerStyle}>
                <img
                  src={figurinhaSelecionada.src}
                  alt={figurinhaSelecionada.alt}
                  style={commentsSelectedStickerImageStyle}
                />

                <button
                  type="button"
                  aria-label="Remover figurinha"
                  onClick={removerFigurinhaSelecionada}
                  style={commentsSelectedStickerRemoveStyle}
                >
                  ×
                </button>
              </div>
            ) : (
              <textarea
                ref={comentarioRef}
                placeholder={
                  podeComentar ? "Adicionar comentário..." : "Entre para comentar."
                }
                disabled={!podeComentar || comentarioEnviando}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="send"
                maxLength={420}
                rows={1}
                style={commentsSheetInputStyle}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => inserirNoComentario("@")}
            disabled={!podeComentar || Boolean(figurinhaSelecionada)}
            style={commentsInputIconButtonStyle}
          >
            @
          </button>

          <button
            type="submit"
            aria-label="Enviar comentário"
            disabled={!podeComentar || comentarioEnviando}
            style={{
              ...commentsSheetSendStyle,
              opacity: podeComentar && !comentarioEnviando ? 1 : 0.58,
              cursor:
                podeComentar && !comentarioEnviando ? "pointer" : "not-allowed",
            }}
          >
            {comentarioEnviando ? "..." : "↑"}
          </button>
        </form>
      </article>
    </section>
  );
});

export default function ComunidadePage() {
  const [usuario, setUsuario] = useState<UsuarioComunidade | null>(null);
  const [usuarioEhAdmin, setUsuarioEhAdmin] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [posts, setPosts] = useState<PostComunidade[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaComunidade | "Todos">(
    "Todos"
  );
  const [tipoPublicacaoAtiva, setTipoPublicacaoAtiva] =
    useState<TipoPublicacaoFiltro>("Todos");
  const [categoriaPost, setCategoriaPost] =
    useState<CategoriaComunidade>("Geral");
  const [tipoPublicacaoPost, setTipoPublicacaoPost] =
    useState<TipoPublicacaoComunidade>("Discussão");
  const [temSpoilerPost, setTemSpoilerPost] = useState(false);
  const [spoilersReveladosIds, setSpoilersReveladosIds] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const termoBuscaAdiado = useDeferredValue(termoBusca);
  const [ordenacaoAtiva, setOrdenacaoAtiva] =
    useState<OrdenacaoComunidade>("Recentes");
  const [mostrarApenasSalvos, setMostrarApenasSalvos] = useState(false);
  const [postsSalvosIds, setPostsSalvosIds] = useState<string[]>([]);
  const [votosEnquetes, setVotosEnquetes] = useState<Record<string, string>>({});
  const [resultadosEnquetes, setResultadosEnquetes] =
    useState<ResultadoVotosEnquete>({});
  const [votandoEnqueteId, setVotandoEnqueteId] = useState<string | null>(null);
  const [feedbackAcao, setFeedbackAcao] = useState("");
  const [publicandoPost, setPublicandoPost] = useState(false);
  const [postCurtindoId, setPostCurtindoId] = useState<string | null>(null);
  const [postSalvandoId, setPostSalvandoId] = useState<string | null>(null);
  const [postCompartilhandoId, setPostCompartilhandoId] = useState<
    string | null
  >(null);
  const [postRemovendoId, setPostRemovendoId] = useState<string | null>(null);
  const [postFixandoId, setPostFixandoId] = useState<string | null>(null);
  const [denunciaEnviandoId, setDenunciaEnviandoId] = useState<string | null>(
    null
  );
  const [carregandoFeed, setCarregandoFeed] = useState(true);
  const [erro, setErro] = useState("");
  const [comentariosPostId, setComentariosPostId] = useState<string | null>(null);
  const [publicacaoDestacadaId, setPublicacaoDestacadaId] = useState<string | null>(null);
  const [obraRelacionadaBusca, setObraRelacionadaBusca] = useState("");
  const [obrasRelacionadasSugestoes, setObrasRelacionadasSugestoes] = useState<
    ObraRelacionadaSugestao[]
  >([]);
  const [sugestoesObrasAbertas, setSugestoesObrasAbertas] = useState(false);
  const textoPostRef = useRef<HTMLTextAreaElement | null>(null);
  const obraRelacionadaRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const acoesComunidadeRef = useRef<Set<string>>(new Set<string>());
  const parametrosComunidadeAplicadosRef = useRef(false);
  const comentarioUrlAplicadoRef = useRef(false);
  const [composerAberto, setComposerAberto] = useState(false);
  const [mostrarFiltrosAvancadosComunidade, setMostrarFiltrosAvancadosComunidade] =
    useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
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
    try {
      const postsSalvos = window.localStorage.getItem(
        CHAVE_POSTS_SALVOS_COMUNIDADE
      );
      const postsSalvosParseados = postsSalvos ? JSON.parse(postsSalvos) : [];

      if (Array.isArray(postsSalvosParseados)) {
        setPostsSalvosIds(
          postsSalvosParseados.filter(
            (postId): postId is string => typeof postId === "string"
          )
        );
      } else {
        setPostsSalvosIds([]);
      }
    } catch {
      setPostsSalvosIds([]);
    }

    setVotosEnquetes(carregarVotosEnquetesLocais());
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarVotosReaisEnquetes() {
      const postsEnqueteIds = posts
        .filter((post) => postEhEnquete(post))
        .map((post) => post.id)
        .filter(Boolean);

      if (postsEnqueteIds.length === 0) {
        setResultadosEnquetes({});
        return;
      }

      const votosLocais = carregarVotosEnquetesLocais();

      setVotosEnquetes((votosAtuais) => ({
        ...votosLocais,
        ...votosAtuais,
      }));

      if (!usuario?.id) {
        return;
      }

      const votosReais = await carregarVotosEnquetesSupabase(
        postsEnqueteIds,
        usuario.id
      );

      if (cancelado || !votosReais) {
        return;
      }

      setResultadosEnquetes(votosReais.resultados);

      setVotosEnquetes((votosAtuais) => {
        const votosAtualizados = {
          ...votosAtuais,
          ...votosReais.meusVotos,
        };

        salvarVotosEnquetesLocais(votosAtualizados);

        return votosAtualizados;
      });
    }

    void carregarVotosReaisEnquetes();

    return () => {
      cancelado = true;
    };
  }, [posts, usuario?.id]);

  useEffect(() => {
    let cancelado = false;

    async function carregarUsuario() {
      setCarregandoUsuario(true);

      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user || null;

        if (!user) {
          if (!cancelado) {
            setUsuario(null);
            setUsuarioEhAdmin(false);
          }

          return;
        }

        let nomeProfile = "";
        let usuarioAdmin = false;

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome")
            .eq("user_id", user.id)
            .maybeSingle();

          if (typeof profile?.nome === "string") {
            nomeProfile = profile.nome;
          }
        } catch {
          nomeProfile = "";
        }

        try {
          const { data: adminData } = await supabase.rpc("usuario_e_admin");
          usuarioAdmin = adminData === true;
        } catch {
          usuarioAdmin = false;
        }

        if (!cancelado) {
          setUsuarioEhAdmin(usuarioAdmin);
          setUsuario({
            id: user.id,
            email: user.email || "",
            nome: obterNomeUsuario(user.email || "", nomeProfile),
          });
        }
      } finally {
        if (!cancelado) {
          setCarregandoUsuario(false);
        }
      }
    }

    carregarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      carregarUsuario();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarObrasRelacionadas() {
      const obrasLocais = carregarSugestoesObrasLocais();

      try {
        const { data, error } = await supabase
          .from("obras")
          .select("id, titulo, autor, publicado")
          .eq("publicado", true)
          .order("criada_em", { ascending: false });

        if (error) {
          throw error;
        }

        const obrasSupabase = ((data || []) as SupabaseObraPublicaRow[])
          .map((obra, index) => {
            const titulo = obra.titulo?.trim() || "";

            if (!titulo) {
              return null;
            }

            return {
              id: obra.id || `obra-supabase-${index}`,
              titulo,
              autor: obra.autor?.trim() || "Autor não informado",
            } satisfies ObraRelacionadaSugestao;
          })
          .filter((obra): obra is ObraRelacionadaSugestao => Boolean(obra));

        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas([...obrasSupabase, ...obrasLocais])
          );
        }
      } catch {
        if (!cancelado) {
          setObrasRelacionadasSugestoes(
            removerSugestoesObrasDuplicadas(obrasLocais)
          );
        }
      }
    }

    void carregarObrasRelacionadas();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!composerAberto) {
      setSugestoesObrasAbertas(false);
      setObraRelacionadaBusca("");
    }
  }, [composerAberto]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    carregarPostsComunidade(true);
  }, []);

  useEffect(() => {
    if (parametrosComunidadeAplicadosRef.current) {
      return;
    }

    parametrosComunidadeAplicadosRef.current = true;

    const parametrosUrl = new URLSearchParams(window.location.search);
    const buscaUrl = (parametrosUrl.get("busca") || "").trim();
    const tipoUrl = obterTipoPublicacaoPorParametro(
      parametrosUrl.get("tipo") || ""
    );

    if (!buscaUrl && !tipoUrl) {
      return;
    }

    if (buscaUrl) {
      setTermoBusca(buscaUrl.slice(0, 90));
    }

    if (tipoUrl) {
      setTipoPublicacaoAtiva(tipoUrl);
      setMostrarFiltrosAvancadosComunidade(true);
    }

    setMostrarApenasSalvos(false);
    setOrdenacaoAtiva("Recentes");
  }, []);

  useEffect(() => {
    if (comentarioUrlAplicadoRef.current || comentariosPostId || posts.length === 0) {
      return;
    }

    const postIdUrl = new URLSearchParams(window.location.search).get("post");

    if (postIdUrl && posts.some((post) => post.id === postIdUrl)) {
      comentarioUrlAplicadoRef.current = true;
      setPublicacaoDestacadaId(postIdUrl);
      setComentariosPostId(postIdUrl);
    }
  }, [comentariosPostId, posts]);

  const termoBuscaNormalizado = useMemo(
    () => normalizarTextoBusca(termoBuscaAdiado),
    [termoBuscaAdiado]
  );

  const postsVisiveis = useMemo(() => {
    const postsFiltrados = posts.filter((post) => {
      const categoriaCombina =
        categoriaAtiva === "Todos" || post.categoria === categoriaAtiva;
      const tipoPublicacaoCombina =
        tipoPublicacaoAtiva === "Todos" ||
        post.tipoPublicacao === tipoPublicacaoAtiva;

      if (!categoriaCombina || !tipoPublicacaoCombina) {
        return false;
      }

      if (mostrarApenasSalvos && !postsSalvosIds.includes(post.id)) {
        return false;
      }

      if (!termoBuscaNormalizado) {
        return true;
      }

      const textoBuscaPost = normalizarTextoBusca(
        [post.texto, post.autorNome, post.categoria, post.tipoPublicacao, post.obraRelacionada]
          .filter(Boolean)
          .join(" ")
      );

      return textoBuscaPost.includes(termoBuscaNormalizado);
    });

    return [...postsFiltrados].sort((postA, postB) => {
      const dataA = new Date(postA.criadoEm).getTime();
      const dataB = new Date(postB.criadoEm).getTime();
      const dataOrdenacaoA = Number.isNaN(dataA) ? 0 : dataA;
      const dataOrdenacaoB = Number.isNaN(dataB) ? 0 : dataB;

      if (postA.fixado !== postB.fixado) {
        return postA.fixado ? -1 : 1;
      }

      if (postA.fixado && postB.fixado) {
        const fixadoA = new Date(postA.fixadoEm || postA.criadoEm).getTime();
        const fixadoB = new Date(postB.fixadoEm || postB.criadoEm).getTime();
        const fixadoOrdenacaoA = Number.isNaN(fixadoA) ? dataOrdenacaoA : fixadoA;
        const fixadoOrdenacaoB = Number.isNaN(fixadoB) ? dataOrdenacaoB : fixadoB;

        return fixadoOrdenacaoB - fixadoOrdenacaoA;
      }

      if (ordenacaoAtiva === "Mais comentadas") {
        const diferencaComentarios =
          postB.comentarios.length - postA.comentarios.length;

        return diferencaComentarios || dataOrdenacaoB - dataOrdenacaoA;
      }

      if (ordenacaoAtiva === "Em alta") {
        const pontuacaoA = obterPontuacaoPost(postA);
        const pontuacaoB = obterPontuacaoPost(postB);

        return pontuacaoB - pontuacaoA || dataOrdenacaoB - dataOrdenacaoA;
      }

      return dataOrdenacaoB - dataOrdenacaoA;
    });
  }, [
    categoriaAtiva,
    tipoPublicacaoAtiva,
    mostrarApenasSalvos,
    ordenacaoAtiva,
    posts,
    postsSalvosIds,
    termoBuscaNormalizado,
  ]);

  const postComentariosAberto = useMemo(() => {
    if (!comentariosPostId) {
      return null;
    }

    return posts.find((post) => post.id === comentariosPostId) || null;
  }, [comentariosPostId, posts]);

  const publicacaoDestacada = useMemo(() => {
    if (!publicacaoDestacadaId) {
      return null;
    }

    return posts.find((post) => post.id === publicacaoDestacadaId) || null;
  }, [posts, publicacaoDestacadaId]);

  const sugestoesObrasRelacionadasVisiveis = useMemo(() => {
    const buscaNormalizada = normalizarTextoBusca(obraRelacionadaBusca);

    if (!buscaNormalizada) {
      return [];
    }

    return obrasRelacionadasSugestoes
      .filter((obra) => {
        const tituloObra = normalizarTextoBusca(obra.titulo);

        return tituloObra.startsWith(buscaNormalizada);
      })
      .slice(0, 8);
  }, [obraRelacionadaBusca, obrasRelacionadasSugestoes]);

  useEffect(() => {
    if (!comentariosPostId) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const overscrollAnterior = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.documentElement.style.overscrollBehavior = overscrollAnterior;
    };
  }, [comentariosPostId]);

  useEffect(() => {
    if (!composerAberto) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const overscrollAnterior = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    const focoTimer = window.setTimeout(() => {
      textoPostRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(focoTimer);
      document.body.style.overflow = overflowAnterior;
      document.documentElement.style.overscrollBehavior = overscrollAnterior;
    };
  }, [composerAberto]);

  const totalComentarios = posts.reduce((total, post) => {
    return total + post.comentarios.length;
  }, 0);

  const totalCurtidas = posts.reduce((total, post) => {
    return total + post.curtidas.length;
  }, 0);

  const totalPostsSalvos = postsSalvosIds.filter((postId) =>
    posts.some((post) => post.id === postId)
  ).length;

  const filtrosAtivos =
    categoriaAtiva !== "Todos" ||
    tipoPublicacaoAtiva !== "Todos" ||
    Boolean(termoBuscaNormalizado) ||
    mostrarApenasSalvos ||
    ordenacaoAtiva !== "Recentes";
  const totalPublicacoesVisiveis = postsVisiveis.length;

  const totalFiltrosAvancadosAtivos = [
    categoriaAtiva !== "Todos",
    tipoPublicacaoAtiva !== "Todos",
    ordenacaoAtiva !== "Recentes",
    mostrarApenasSalvos,
  ].filter(Boolean).length;

  const textoBotaoFiltrosAvancadosComunidade =
    totalFiltrosAvancadosAtivos > 0
      ? `Filtros avançados (${totalFiltrosAvancadosAtivos})`
      : "Filtros avançados";

  function iniciarAcaoComunidade(chave: string) {
    if (acoesComunidadeRef.current.has(chave)) {
      return false;
    }

    acoesComunidadeRef.current.add(chave);
    return true;
  }

  function finalizarAcaoComunidade(chave: string) {
    acoesComunidadeRef.current.delete(chave);
  }

  function obterChaveDenuncia(alvoTipo: AlvoDenunciaComunidade, alvoId: string) {
    return `denunciar-${alvoTipo}:${alvoId}`;
  }

  function limparFiltrosComunidade() {
    setCategoriaAtiva("Todos");
    setTipoPublicacaoAtiva("Todos");
    setTermoBusca("");
    setOrdenacaoAtiva("Recentes");
    setMostrarApenasSalvos(false);
  }

  function emitirFeedbackAcao(mensagem: string) {
    setFeedbackAcao(mensagem);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackAcao("");
      feedbackTimerRef.current = null;
    }, 2600);
  }

  function verFeedEmAlta() {
    setCategoriaAtiva("Todos");
    setTermoBusca("");
    setMostrarApenasSalvos(false);
    setOrdenacaoAtiva("Em alta");
  }

  function prepararEnqueteComunidade() {
    setErro("");
    setCategoriaPost("Discussão");
    setTipoPublicacaoPost("Discussão");
    setTemSpoilerPost(false);
    setComposerAberto(true);

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      textoPostRef.current.value =
        "Enquete: qual opção você escolheria?\nOpção 1: primeira opção\nOpção 2: segunda opção";
      textoPostRef.current.focus();
      textoPostRef.current.setSelectionRange(
        textoPostRef.current.value.length,
        textoPostRef.current.value.length
      );
    }, 0);
  }

  async function votarEnquete(postId: string, opcao: string) {
    if (votandoEnqueteId === postId) {
      return;
    }

    if (votosEnquetes[postId]) {
      emitirFeedbackAcao("Você já votou nesta enquete.");
      return;
    }

    if (!exigirLogin() || !usuario) {
      return;
    }

    setVotandoEnqueteId(postId);
    setErro("");

    try {
      const { error } = await supabase.from("comunidade_enquete_votos").insert({
        post_id: postId,
        user_id: usuario.id,
        opcao,
      });

      if (error) {
        const codigoErro = (error as { code?: string }).code;

        if (codigoErro === "23505") {
          emitirFeedbackAcao("Você já votou nesta enquete.");

          const votosReais = await carregarVotosEnquetesSupabase(
            [postId],
            usuario.id
          );

          if (votosReais) {
            setResultadosEnquetes((resultadosAtuais) => ({
              ...resultadosAtuais,
              ...votosReais.resultados,
            }));

            setVotosEnquetes((votosAtuais) => {
              const votosAtualizados = {
                ...votosAtuais,
                ...votosReais.meusVotos,
              };

              salvarVotosEnquetesLocais(votosAtualizados);

              return votosAtualizados;
            });
          }

          return;
        }

        setErro(formatarErroSupabase("Erro ao votar na enquete", error));
        return;
      }

      setVotosEnquetes((votosAtuais) => {
        const votosAtualizados = {
          ...votosAtuais,
          [postId]: opcao,
        };

        salvarVotosEnquetesLocais(votosAtualizados);

        return votosAtualizados;
      });

      setResultadosEnquetes((resultadosAtuais) => ({
        ...resultadosAtuais,
        [postId]: {
          ...(resultadosAtuais[postId] || {}),
          [opcao]: (resultadosAtuais[postId]?.[opcao] || 0) + 1,
        },
      }));

      emitirFeedbackAcao("Voto registrado.");
    } finally {
      setVotandoEnqueteId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function alternarSpoilerRevelado(postId: string) {
    setSpoilersReveladosIds((idsAtuais) =>
      idsAtuais.includes(postId)
        ? idsAtuais.filter((id) => id !== postId)
        : [...idsAtuais, postId]
    );
  }

  function responderDesafioSemana() {
    setErro("");
    setCategoriaPost("Recomendações");
    setTipoPublicacaoPost("Pedido de indicação");
    setTemSpoilerPost(false);
    setComposerAberto(true);

    window.setTimeout(() => {
      if (!textoPostRef.current) {
        return;
      }

      textoPostRef.current.value = `${DESAFIO_SEMANA_COMUNIDADE.pergunta} — Minha recomendação é: `;
      textoPostRef.current.focus();
    }, 0);
  }

  function alternarPostSalvo(postId: string) {
    const chaveAcao = `salvar-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostSalvandoId(postId);

    try {
      const postJaSalvo = postsSalvosIds.includes(postId);
      const postsSalvosAtualizados = postJaSalvo
        ? postsSalvosIds.filter((postSalvoId) => postSalvoId !== postId)
        : [...postsSalvosIds, postId];

      try {
        window.localStorage.setItem(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          JSON.stringify(postsSalvosAtualizados)
        );
      } catch {
        setErro("Não foi possível salvar esta publicação neste navegador.");
        return;
      }

      setPostsSalvosIds(postsSalvosAtualizados);
      emitirFeedbackAcao(
        postJaSalvo
          ? "Publicação removida dos salvos."
          : "Publicação salva neste navegador."
      );
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostSalvandoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  async function compartilharPublicacao(post: PostComunidade) {
    const chaveAcao = `compartilhar-post:${post.id}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostCompartilhandoId(post.id);

    try {
      const linkPublicacao = obterLinkPublicacaoComunidade(post.id);
      const navegador = navigator as Navigator & {
        share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      };

      if (typeof navegador.share === "function") {
        try {
          await navegador.share({
            title: "Comunidade Historietas",
            text: post.texto.slice(0, 120),
            url: linkPublicacao,
          });
          emitirFeedbackAcao("Publicação pronta para compartilhar.");
          return;
        } catch {
          // Se o compartilhamento nativo falhar ou for cancelado, tenta copiar.
        }
      }

      const linkCopiado = await copiarTextoComFallback(linkPublicacao);

      if (linkCopiado) {
        emitirFeedbackAcao("Link da publicação copiado.");
        return;
      }

      setErro(`Não foi possível copiar automaticamente. Link: ${linkPublicacao}`);
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostCompartilhandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

  async function carregarPostsComunidade(mostrarCarregamento = false) {
    if (mostrarCarregamento) {
      setCarregandoFeed(true);
    }

    try {
      const [
        postsResposta,
        comentariosResposta,
        curtidasResposta,
        comentarioCurtidasResposta,
      ] = await Promise.all([
          supabase
            .from("comunidade_posts")
            .select(
              "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por"
            )
            .order("criado_em", { ascending: false }),
          supabase
            .from("comunidade_comentarios")
            .select("id, post_id, autor_id, autor_nome, texto, criado_em")
            .order("criado_em", { ascending: true }),
          supabase
            .from("comunidade_curtidas")
            .select("post_id, usuario_id"),
          supabase
            .from("comunidade_comentario_curtidas")
            .select("comentario_id, usuario_id"),
        ]);

      if (postsResposta.error) {
        throw postsResposta.error;
      }

      if (comentariosResposta.error) {
        throw comentariosResposta.error;
      }

      if (curtidasResposta.error) {
        throw curtidasResposta.error;
      }

      if (comentarioCurtidasResposta.error) {
        throw comentarioCurtidasResposta.error;
      }

      const postsSupabase = mapearPostsSupabase(
        (postsResposta.data || []) as SupabasePostRow[],
        (comentariosResposta.data || []) as SupabaseComentarioRow[],
        (curtidasResposta.data || []) as SupabaseCurtidaRow[],
        (comentarioCurtidasResposta.data || []) as SupabaseComentarioCurtidaRow[]
      );

      setPosts(postsSupabase);
    } catch (error) {
      setErro(formatarErroSupabase("Erro ao carregar Comunidade", error));
      setPosts([]);
    } finally {
      if (mostrarCarregamento) {
        setCarregandoFeed(false);
      }
    }
  }

  function exigirLogin() {
    if (usuario) {
      return true;
    }

    setErro("Entre na sua conta para participar da Comunidade.");
    return false;
  }

  function selecionarObraRelacionada(titulo: string) {
    setObraRelacionadaBusca(titulo);
    setSugestoesObrasAbertas(false);

    if (obraRelacionadaRef.current) {
      obraRelacionadaRef.current.value = titulo;
      obraRelacionadaRef.current.focus();
    }
  }

  async function publicarPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const chaveAcao = "publicar-post";

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPublicandoPost(true);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const textoLimpo = textoPostRef.current?.value.trim() || "";
      const obraLimpa = obraRelacionadaRef.current?.value.trim() || "";

      if (textoLimpo.length < 8) {
        setErro("Escreva uma publicação com pelo menos 8 caracteres.");
        return;
      }

      const { data, error } = await supabase
        .from("comunidade_posts")
        .insert({
          autor_id: usuario.id,
          autor_nome: usuario.nome,
          categoria: categoriaPost,
          tipo_publicacao: tipoPublicacaoPost,
          tem_spoiler: temSpoilerPost,
          texto: textoLimpo.slice(0, 700),
          obra_relacionada: obraLimpa.slice(0, 90),
        })
        .select(
          "id, autor_id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em, fixado, fixado_em, fixado_por"
        )
        .single();

      if (error || !data) {
        setErro(
          error
            ? formatarErroSupabase("Erro ao publicar", error)
            : "Erro ao publicar: o Supabase não retornou a publicação criada."
        );
        return;
      }

      const novoPost = mapearPostSupabase(
        data as SupabasePostRow,
        new Map<string, ComentarioComunidade[]>(),
        new Map<string, string[]>()
      );

      setPosts((postsAtuais) => [novoPost, ...postsAtuais]);

      if (textoPostRef.current) {
        textoPostRef.current.value = "";
      }

      if (obraRelacionadaRef.current) {
        obraRelacionadaRef.current.value = "";
      }

      setObraRelacionadaBusca("");
      setSugestoesObrasAbertas(false);
      setCategoriaPost("Geral");
      setTipoPublicacaoPost("Discussão");
      setTemSpoilerPost(false);
      setComposerAberto(false);
      emitirFeedbackAcao("Publicação enviada para a Comunidade.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPublicandoPost(false);
    }
  }

  async function alternarCurtida(postId: string) {
    const chaveAcao = `curtir-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostCurtindoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const jaCurtiu = Boolean(postAtual?.curtidas.includes(usuario.id));

      if (jaCurtiu) {
        const { error } = await supabase
          .from("comunidade_curtidas")
          .delete()
          .eq("post_id", postId)
          .eq("usuario_id", usuario.id);

        if (error) {
          setErro(formatarErroSupabase("Erro ao remover curtida", error));
          return;
        }
      } else {
        const { error } = await supabase.from("comunidade_curtidas").insert({
          post_id: postId,
          usuario_id: usuario.id,
        });

        if (error) {
          setErro(formatarErroSupabase("Erro ao curtir", error));
          return;
        }
      }

      setPosts((postsAtuais) => {
        return postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            curtidas: jaCurtiu
              ? post.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
              : [...post.curtidas, usuario.id],
          };
        });
      });

      emitirFeedbackAcao(jaCurtiu ? "Curtida removida." : "Publicação curtida.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostCurtindoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function abrirPublicacao(postId: string) {
    setErro("");
    setPublicacaoDestacadaId(postId);

    try {
      const url = new URL(window.location.href);
      url.pathname = "/comunidade";
      url.search = `?post=${encodeURIComponent(postId)}`;
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Se o navegador bloquear a URL, o destaque continua funcionando em estado local.
    }
  }

  function fecharPublicacaoDestacada() {
    setPublicacaoDestacadaId(null);

    try {
      const url = new URL(window.location.href);
      url.pathname = "/comunidade";
      url.search = "";
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Mantém a navegação atual se a URL não puder ser alterada.
    }
  }

  function abrirComentarios(postId: string) {
    setErro("");
    comentarioUrlAplicadoRef.current = true;
    abrirPublicacao(postId);
    setComentariosPostId(postId);
  }

  function fecharComentarios() {
    setComentariosPostId(null);
  }

  async function comentarPost(postId: string, textoRecebido: string) {
    const chaveAcao = `comentar-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return false;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return false;
      }

      const textoComentario = textoRecebido.trim();

      if (textoComentario.length < 1) {
        setErro("Escreva um comentário antes de enviar.");
        return false;
      }

      const { data, error } = await supabase
        .from("comunidade_comentarios")
        .insert({
          post_id: postId,
          autor_id: usuario.id,
          autor_nome: usuario.nome,
          texto: textoComentario.slice(0, 420),
        })
        .select("id, post_id, autor_id, autor_nome, texto, criado_em")
        .single();

      if (error || !data) {
        setErro(
          error
            ? formatarErroSupabase("Erro ao comentar", error)
            : "Erro ao comentar: o Supabase não retornou o comentário criado."
        );
        return false;
      }

      const novoComentario = mapearComentarioSupabase(
        data as SupabaseComentarioRow,
        new Map<string, string[]>()
      );

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: [...post.comentarios, novoComentario],
              }
            : post
        )
      );

      emitirFeedbackAcao("Comentário enviado.");
      return true;
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function denunciarConteudo(
    alvoTipo: AlvoDenunciaComunidade,
    alvoId: string
  ) {
    const chaveAcao = obterChaveDenuncia(alvoTipo, alvoId);

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setDenunciaEnviandoId(chaveAcao);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const { error } = await supabase.from("comunidade_denuncias").insert({
        alvo_tipo: alvoTipo,
        alvo_id: alvoId,
        denunciante_id: usuario.id,
        motivo: "Conteúdo inadequado",
        detalhe: "",
      });

      if (error) {
        const codigoErro = (error as { code?: string }).code;

        if (codigoErro === "23505") {
          setErro("Você já denunciou este conteúdo.");
          return;
        }

        setErro(formatarErroSupabase("Erro ao denunciar", error));
        return;
      }

      setErro("");
      emitirFeedbackAcao("Denúncia enviada para análise.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setDenunciaEnviandoId((denunciaAtualId) =>
        denunciaAtualId === chaveAcao ? null : denunciaAtualId
      );
    }
  }

  async function removerComentario(postId: string, comentarioId: string) {
    const chaveAcao = `remover-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const comentarioAtual = posts
        .find((post) => post.id === postId)
        ?.comentarios.find((comentario) => comentario.id === comentarioId);

      if (!comentarioAtual || comentarioAtual.autorId !== usuario.id) {
        setErro("Você só pode remover seus próprios comentários.");
        return;
      }

      if (!window.confirm("Remover este comentário?")) {
        return;
      }

      const { error } = await supabase
        .from("comunidade_comentarios")
        .delete()
        .eq("id", comentarioId)
        .eq("autor_id", usuario.id);

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover comentário", error));
        return;
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) =>
          post.id === postId
            ? {
                ...post,
                comentarios: post.comentarios.filter(
                  (comentario) => comentario.id !== comentarioId
                ),
              }
            : post
        )
      );

      emitirFeedbackAcao("Comentário removido.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function alternarCurtidaComentario(postId: string, comentarioId: string) {
    const chaveAcao = `curtir-comentario:${comentarioId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const comentarioAtual = postAtual?.comentarios.find(
        (comentario) => comentario.id === comentarioId
      );
      const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(usuario.id));

      if (jaCurtiu) {
        const { error } = await supabase
          .from("comunidade_comentario_curtidas")
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", usuario.id);

        if (error) {
          setErro(formatarErroSupabase("Erro ao remover curtida do comentário", error));
          return;
        }
      } else {
        const { error } = await supabase
          .from("comunidade_comentario_curtidas")
          .insert({
            comentario_id: comentarioId,
            usuario_id: usuario.id,
          });

        if (error) {
          setErro(formatarErroSupabase("Erro ao curtir comentário", error));
          return;
        }
      }

      setPosts((postsAtuais) =>
        postsAtuais.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            comentarios: post.comentarios.map((comentario) => {
              if (comentario.id !== comentarioId) {
                return comentario;
              }

              return {
                ...comentario,
                curtidas: jaCurtiu
                  ? comentario.curtidas.filter((curtidaId) => curtidaId !== usuario.id)
                  : [...comentario.curtidas, usuario.id],
              };
            }),
          };
        })
      );

      emitirFeedbackAcao(
        jaCurtiu ? "Curtida do comentário removida." : "Comentário curtido."
      );
      await carregarPostsComunidade();
    } finally {
      finalizarAcaoComunidade(chaveAcao);
    }
  }

  async function alternarFixadoPost(post: PostComunidade) {
    if (!usuarioEhAdmin) {
      setErro("Apenas administradores podem fixar publicações.");
      return;
    }

    if (postFixandoId === post.id) {
      return;
    }

    setPostFixandoId(post.id);
    setErro("");

    try {
      const novoEstadoFixado = !post.fixado;

      const { data, error } = await supabase
        .from("comunidade_posts")
        .update({ fixado: novoEstadoFixado })
        .eq("id", post.id)
        .select("fixado, fixado_em, fixado_por")
        .single();

      if (error) {
        setErro(formatarErroSupabase("Erro ao atualizar fixado", error));
        return;
      }

      const dadosFixado = data as {
        fixado?: boolean | null;
        fixado_em?: string | null;
        fixado_por?: string | null;
      } | null;

      setPosts((postsAtuais) =>
        postsAtuais.map((postAtual) => {
          if (postAtual.id !== post.id) {
            return postAtual;
          }

          return {
            ...postAtual,
            fixado: Boolean(dadosFixado?.fixado),
            fixadoEm: dadosFixado?.fixado_em || "",
            fixadoPor: dadosFixado?.fixado_por || "",
          };
        })
      );

      emitirFeedbackAcao(
        novoEstadoFixado
          ? "Publicação fixada no topo."
          : "Publicação desafixada."
      );
    } finally {
      setPostFixandoId((postAtualId) =>
        postAtualId === post.id ? null : postAtualId
      );
    }
  }

  async function removerPost(postId: string) {
    const chaveAcao = `remover-post:${postId}`;

    if (!iniciarAcaoComunidade(chaveAcao)) {
      return;
    }

    setPostRemovendoId(postId);
    setErro("");

    try {
      if (!usuario) {
        return;
      }

      if (!window.confirm("Remover esta publicação?")) {
        return;
      }

      const { error } = await supabase
        .from("comunidade_posts")
        .delete()
        .eq("id", postId)
        .eq("autor_id", usuario.id);

      if (error) {
        setErro(formatarErroSupabase("Erro ao remover publicação", error));
        return;
      }

      setPosts((postsAtuais) =>
        postsAtuais.filter((post) => post.id !== postId)
      );

      const postsSalvosAtualizados = postsSalvosIds.filter(
        (postSalvoId) => postSalvoId !== postId
      );

      setPostsSalvosIds(postsSalvosAtualizados);

      try {
        window.localStorage.setItem(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          JSON.stringify(postsSalvosAtualizados)
        );
      } catch {
        setErro("Publicação removida. Não foi possível atualizar os salvos locais.");
      }

      emitirFeedbackAcao("Publicação removida.");
    } finally {
      finalizarAcaoComunidade(chaveAcao);
      setPostRemovendoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{historietasThemeCss}</style>

      {isDesktop ? (
        <div style={desktopTopWaterFadeStyle} aria-hidden="true" />
      ) : (
        <div style={mobileTopWaterFadeStyle} aria-hidden="true" />
      )}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section style={titleSectionStyle}>
          <h1 style={isDesktop ? communityTitleStyle : mobileCommunityTitleStyle}>
            <span style={titleGroupStyle}>
              <span style={titleMarkStyle}>C</span>
              <span style={titleWordStyle}>omunidade</span>
            </span>

            <span style={titleGroupStyle}>
              <span style={titleMarkStyle}>H</span>
              <span style={titleWordStyle}>istorietas</span>
            </span>
          </h1>

          <div style={titleUserAreaStyle}>
            {usuario ? (
              <span style={titleUserChipStyle}>
                <span style={titleUserIconStyle}>
                  {usuario.nome.slice(0, 1).toUpperCase()}
                </span>
                <span style={titleUserNameStyle}>{usuario.nome}</span>
              </span>
            ) : !carregandoUsuario ? (
              <Link href="/login" style={titleLoginButtonStyle}>
                Entrar
              </Link>
            ) : null}
          </div>
        </section>

        <section style={isDesktop ? desktopLayoutStyle : layoutStyle}>
          <section style={feedColumnStyle}>
            {publicacaoDestacada && (
              <section style={isDesktop ? desktopFocusedPostStyle : focusedPostStyle}>
                <div style={focusedPostHeaderStyle}>
                  <div style={focusedPostTitleBoxStyle}>
                    <span style={miniTitleStyle}>
                      {publicacaoDestacada.fixado ? "PUBLICAÇÃO FIXADA" : "PUBLICAÇÃO ABERTA"}
                    </span>

                    <h2 style={focusedPostTitleStyle}>
                      {publicacaoDestacada.tipoPublicacao}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={fecharPublicacaoDestacada}
                    style={focusedPostCloseButtonStyle}
                  >
                    Fechar
                  </button>
                </div>

                <article style={focusedPostCardStyle}>
                  <div style={focusedPostAuthorRowStyle}>
                    <div style={focusedPostAvatarStyle}>
                      {publicacaoDestacada.autorNome.slice(0, 1).toUpperCase()}
                    </div>

                    <div style={focusedPostAuthorInfoStyle}>
                      <strong style={focusedPostAuthorNameStyle}>
                        {publicacaoDestacada.autorNome}
                      </strong>

                      <span style={focusedPostMetaStyle}>
                        {publicacaoDestacada.categoria} • {formatarDataComunidade(publicacaoDestacada.criadoEm)}
                      </span>
                    </div>
                  </div>

                  {publicacaoDestacada.obraRelacionada && (
                    <Link
                      href={criarLinkObraRelacionada(publicacaoDestacada.obraRelacionada)}
                      style={focusedPostWorkLinkStyle}
                    >
                      Obra relacionada: {publicacaoDestacada.obraRelacionada}
                    </Link>
                  )}

                  {publicacaoDestacada.temSpoiler &&
                  !spoilersReveladosIds.includes(publicacaoDestacada.id) ? (
                    <div style={focusedSpoilerBoxStyle}>
                      <strong style={spoilerHiddenTitleStyle}>
                        Conteúdo com spoiler oculto
                      </strong>

                      <span style={spoilerHiddenTextStyle}>
                        Esta publicação pode revelar eventos, capítulos ou detalhes importantes.
                        Revele somente se quiser ver o conteúdo completo.
                      </span>

                      <button
                        type="button"
                        onClick={() => alternarSpoilerRevelado(publicacaoDestacada.id)}
                        style={spoilerRevealButtonStyle}
                      >
                        Revelar conteúdo
                      </button>
                    </div>
                  ) : (
                    postEhEnquete(publicacaoDestacada) ? (
                      <div style={focusedPollBoxStyle}>
                        <strong style={focusedPollQuestionStyle}>
                          {obterPerguntaEnquete(publicacaoDestacada.texto)}
                        </strong>

                        <div style={focusedPollOptionsStyle}>
                          {obterOpcoesEnquete(publicacaoDestacada.texto).map((opcao) => {
                            const votoAtual =
                              votosEnquetes[publicacaoDestacada.id] || "";
                            const selecionada = votoAtual === opcao;
                            const totalVotos = calcularTotalVotosEnquete(
                              resultadosEnquetes,
                              publicacaoDestacada.id
                            );
                            const porcentagem = calcularPorcentagemOpcaoEnquete(
                              resultadosEnquetes,
                              publicacaoDestacada.id,
                              opcao
                            );
                            const larguraResultado =
                              totalVotos > 0
                                ? `${porcentagem}%`
                                : selecionada
                                  ? "100%"
                                  : "0%";

                            return (
                              <button
                                key={opcao}
                                type="button"
                                onClick={() =>
                                  votarEnquete(publicacaoDestacada.id, opcao)
                                }
                                disabled={Boolean(votoAtual) || votandoEnqueteId === publicacaoDestacada.id}
                                style={
                                  selecionada
                                    ? focusedPollOptionSelectedStyle
                                    : focusedPollOptionStyle
                                }
                              >
                                <span
                                  style={{
                                    ...focusedPollResultBarStyle,
                                    width: larguraResultado,
                                  }}
                                />

                                <span style={focusedPollOptionTextStyle}>
                                  {opcao}
                                </span>

                                <span style={focusedPollStatusStyle}>
                                  {selecionada
                                    ? `Seu voto · ${totalVotos > 0 ? porcentagem : 100}%`
                                    : totalVotos > 0
                                      ? `${porcentagem}%`
                                      : "Votar"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p style={focusedPostTextStyle}>
                        {publicacaoDestacada.texto}
                      </p>
                    )
                  )}

                  {publicacaoDestacada.temSpoiler &&
                    spoilersReveladosIds.includes(publicacaoDestacada.id) && (
                      <button
                        type="button"
                        onClick={() => alternarSpoilerRevelado(publicacaoDestacada.id)}
                        style={focusedPostSmallButtonStyle}
                      >
                        Ocultar conteúdo com spoiler
                      </button>
                    )}

                  <div style={focusedPostStatsStyle}>
                    {publicacaoDestacada.fixado && <span>Fixado</span>}
                    <span>{publicacaoDestacada.curtidas.length} curtidas</span>
                    <span>{publicacaoDestacada.comentarios.length} comentários</span>
                    <span>{publicacaoDestacada.temSpoiler ? "Com spoiler" : "Sem spoiler"}</span>
                  </div>

                  <div style={focusedPostActionsStyle}>
                    <button
                      type="button"
                      onClick={() => alternarCurtida(publicacaoDestacada.id)}
                      disabled={postCurtindoId === publicacaoDestacada.id}
                      style={focusedPostPrimaryButtonStyle}
                    >
                      {usuario && publicacaoDestacada.curtidas.includes(usuario.id)
                        ? "Curtido"
                        : "Curtir"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setComentariosPostId(publicacaoDestacada.id)}
                      style={focusedPostSecondaryButtonStyle}
                    >
                      Comentários
                    </button>

                    <button
                      type="button"
                      onClick={() => compartilharPublicacao(publicacaoDestacada)}
                      disabled={postCompartilhandoId === publicacaoDestacada.id}
                      style={focusedPostSecondaryButtonStyle}
                    >
                      Compartilhar
                    </button>

                    {usuarioEhAdmin && (
                      <button
                        type="button"
                        onClick={() => alternarFixadoPost(publicacaoDestacada)}
                        disabled={postFixandoId === publicacaoDestacada.id}
                        style={
                          publicacaoDestacada.fixado
                            ? focusedPostPinnedButtonStyle
                            : focusedPostSecondaryButtonStyle
                        }
                      >
                        {postFixandoId === publicacaoDestacada.id
                          ? "Atualizando..."
                          : publicacaoDestacada.fixado
                            ? "Desfixar"
                            : "Fixar"}
                      </button>
                    )}

                    {usuario && usuario.id !== publicacaoDestacada.autorId && (
                      <button
                        type="button"
                        onClick={() => denunciarConteudo("post", publicacaoDestacada.id)}
                        disabled={denunciaEnviandoId === obterChaveDenuncia("post", publicacaoDestacada.id)}
                        style={focusedPostDangerButtonStyle}
                      >
                        Denunciar
                      </button>
                    )}
                  </div>
                </article>
              </section>
            )}

            <section style={composerStyle}>
              <div style={composerHeaderStyle}>
                <div style={composerTitleWrapStyle}>
                  <h2 style={publishTitleStyle}>
                    {usuario ? "Publicar" : "Entre para participar"}
                  </h2>
                </div>

                {!usuario && !carregandoUsuario && (
                  <Link href="/login" style={loginButtonStyle}>
                    Entrar
                  </Link>
                )}
              </div>

              {carregandoUsuario ? (
                <div style={authLoadingStyle}>Carregando sua conta...</div>
              ) : usuario ? (
                <div style={compactComposerStyle}>
                  <div style={compactComposerActionsStyle}>
                    <button
                      type="button"
                      onClick={() => {
                        setErro("");
                        setComposerAberto(true);
                      }}
                      style={compactComposerButtonStyle}
                    >
                      Escreva uma publicação...
                    </button>

                    <button
                      type="button"
                      onClick={prepararEnqueteComunidade}
                      style={compactComposerPollButtonStyle}
                    >
                      Enquete
                    </button>
                  </div>
                </div>
              ) : (
                <div style={visitorComposerStyle}>
                  <p style={visitorComposerTextStyle}>
                    Você pode ler tudo. Para publicar, curtir ou comentar, entre na sua conta.
                  </p>

                  {erro && <span style={errorStyle}>{erro}</span>}

                  <Link href="/login" style={primaryLinkButtonStyle}>
                    Entrar para participar
                  </Link>
                </div>
              )}
            </section>

            {usuario && erro && !composerAberto && (
              <span style={communityErrorNoticeStyle}>{erro}</span>
            )}

            <section style={isDesktop ? weeklyChallengeDesktopStyle : weeklyChallengeStyle}>
              <div style={weeklyChallengeTextStyle}>
                <span style={weeklyChallengeKickerStyle}>
                  {DESAFIO_SEMANA_COMUNIDADE.titulo}
                </span>

                <strong style={weeklyChallengeTitleStyle}>
                  {DESAFIO_SEMANA_COMUNIDADE.pergunta}
                </strong>

              </div>

              <button
                type="button"
                onClick={responderDesafioSemana}
                style={isDesktop ? weeklyChallengeButtonDesktopStyle : weeklyChallengeButtonStyle}
              >
                Responder desafio
              </button>
            </section>

            <section
              style={
                isDesktop
                  ? desktopExploreLikeFilterBoxStyle
                  : exploreLikeFilterBoxStyle
              }
            >
              <p style={isDesktop ? desktopCompactCommunitySummaryStyle : compactCommunitySummaryStyle}>
                <span style={compactCommunitySummaryItemStyle}>
                  {totalPublicacoesVisiveis === 1
                    ? "1 publicação"
                    : `${totalPublicacoesVisiveis} publicações`}
                </span>
                <span style={compactCommunitySummaryItemStyle}>
                  <span style={compactCommunitySummarySeparatorStyle}>•</span>
                  {totalComentarios === 1 ? "1 comentário" : `${totalComentarios} comentários`}
                </span>
                <span style={compactCommunitySummaryItemStyle}>
                  <span style={compactCommunitySummarySeparatorStyle}>•</span>
                  {totalCurtidas === 1 ? "1 curtida" : `${totalCurtidas} curtidas`}
                </span>
                <span style={compactCommunitySummaryItemStyle}>
                  <span style={compactCommunitySummarySeparatorStyle}>•</span>
                  {totalPostsSalvos === 1
                    ? "1 post salvo"
                    : `${totalPostsSalvos} posts salvos`}
                </span>
              </p>

              <input
                value={termoBusca}
                onChange={(event) => setTermoBusca(event.target.value)}
                placeholder="Buscar por obra, autor, tipo ou assunto..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={90}
                style={isDesktop ? desktopExploreLikeSearchInputStyle : exploreLikeSearchInputStyle}
              />

              <div style={isDesktop ? desktopExploreLikeQuickFiltersStyle : exploreLikeQuickFiltersStyle}>
                <button
                  type="button"
                  onClick={limparFiltrosComunidade}
                  style={
                    !filtrosAtivos
                      ? isDesktop
                        ? desktopExploreLikeQuickFilterActiveStyle
                        : exploreLikeQuickFilterActiveStyle
                      : isDesktop
                        ? desktopExploreLikeQuickFilterButtonStyle
                        : exploreLikeQuickFilterButtonStyle
                  }
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrdenacaoAtiva("Em alta");
                    setMostrarApenasSalvos(false);
                  }}
                  style={
                    ordenacaoAtiva === "Em alta" && !mostrarApenasSalvos
                      ? isDesktop
                        ? desktopExploreLikeQuickFilterActiveStyle
                        : exploreLikeQuickFilterActiveStyle
                      : isDesktop
                        ? desktopExploreLikeQuickFilterButtonStyle
                        : exploreLikeQuickFilterButtonStyle
                  }
                >
                  Em alta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrdenacaoAtiva("Mais comentadas");
                    setMostrarApenasSalvos(false);
                  }}
                  style={
                    ordenacaoAtiva === "Mais comentadas" && !mostrarApenasSalvos
                      ? isDesktop
                        ? desktopExploreLikeQuickFilterActiveStyle
                        : exploreLikeQuickFilterActiveStyle
                      : isDesktop
                        ? desktopExploreLikeQuickFilterButtonStyle
                        : exploreLikeQuickFilterButtonStyle
                  }
                >
                  Mais comentadas
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarApenasSalvos((ativo) => !ativo)}
                  style={
                    mostrarApenasSalvos
                      ? isDesktop
                        ? desktopExploreLikeQuickFilterActiveStyle
                        : exploreLikeQuickFilterActiveStyle
                      : isDesktop
                        ? desktopExploreLikeQuickFilterButtonStyle
                        : exploreLikeQuickFilterButtonStyle
                  }
                >
                  Posts salvos
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarFiltrosAvancadosComunidade((aberto) => !aberto)
                }
                style={exploreLikeToggleFiltersStyle}
              >
                <span>{textoBotaoFiltrosAvancadosComunidade}</span>
                <span>{mostrarFiltrosAvancadosComunidade ? "↑" : "↓"}</span>
              </button>

              {mostrarFiltrosAvancadosComunidade && (
                <div
                  style={
                    isDesktop
                      ? desktopExploreLikeAdvancedFiltersStyle
                      : exploreLikeAdvancedFiltersStyle
                  }
                >
                  <div style={exploreLikeFieldBoxStyle}>
                    <label style={exploreLikeSearchLabelStyle}>Tipo de publicação</label>

                    <select
                      value={tipoPublicacaoAtiva}
                      onChange={(event) =>
                        setTipoPublicacaoAtiva(event.target.value as TipoPublicacaoFiltro)
                      }
                      style={exploreLikeSelectStyle}
                    >
                      {(["Todos", ...TIPOS_PUBLICACAO_COMUNIDADE] as const).map(
                        (tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div style={exploreLikeFieldBoxStyle}>
                    <label style={exploreLikeSearchLabelStyle}>Categoria</label>

                    <select
                      value={categoriaAtiva}
                      onChange={(event) =>
                        setCategoriaAtiva(
                          event.target.value as CategoriaComunidade | "Todos"
                        )
                      }
                      style={exploreLikeSelectStyle}
                    >
                      {(["Todos", ...CATEGORIAS_COMUNIDADE] as const).map(
                        (categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div style={exploreLikeFieldBoxStyle}>
                    <label style={exploreLikeSearchLabelStyle}>Ordenar</label>

                    <select
                      value={ordenacaoAtiva}
                      onChange={(event) =>
                        setOrdenacaoAtiva(event.target.value as OrdenacaoComunidade)
                      }
                      style={exploreLikeSelectStyle}
                    >
                      {ORDENACOES_COMUNIDADE.map((ordenacao) => (
                        <option key={ordenacao} value={ordenacao}>
                          {ordenacao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={exploreLikeFieldBoxStyle}>
                    <label style={exploreLikeSearchLabelStyle}>Posts salvos</label>

                    <select
                      value={mostrarApenasSalvos ? "salvos" : "todos"}
                      onChange={(event) =>
                        setMostrarApenasSalvos(event.target.value === "salvos")
                      }
                      style={exploreLikeSelectStyle}
                    >
                      <option value="todos">Todos</option>
                      <option value="salvos">Somente posts salvos</option>
                    </select>
                  </div>
                </div>
              )}

              {filtrosAtivos && (
                <div style={isDesktop ? desktopExploreLikeClearFiltersStyle : exploreLikeClearFiltersStyle}>
                  <button
                    type="button"
                    onClick={limparFiltrosComunidade}
                    style={exploreLikeClearFilterButtonStyle}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </section>

            <section style={feedSummaryStyle}>
              <div style={feedSummaryTextWrapStyle}>
                <span style={miniTitleStyle}>PUBLICAÇÕES DA COMUNIDADE</span>

                <strong style={feedSummaryTitleStyle}>
                  {totalPublicacoesVisiveis === 1
                    ? "1 publicação encontrada"
                    : `${totalPublicacoesVisiveis} publicações encontradas`}
                </strong>
              </div>
            </section>

            <section style={postsListStyle}>
              {carregandoFeed ? (
                <div style={feedLoadingWrapStyle}>
                  {[0, 1, 2].map((item) => (
                    <article key={item} style={feedLoadingCardStyle}>
                      <span style={feedLoadingLineLargeStyle} />
                      <span style={feedLoadingLineStyle} />
                      <span style={feedLoadingLineShortStyle} />
                    </article>
                  ))}
                </div>
              ) : postsVisiveis.length > 0 ? (
                postsVisiveis.map((post) => {
                  const usuarioCurtiu = Boolean(
                    usuario && post.curtidas.includes(usuario.id)
                  );
                  const postSalvo = postsSalvosIds.includes(post.id);
                  const podeRemover = Boolean(usuario && post.autorId === usuario.id);
                  const podeDenunciarPost = Boolean(
                    usuario && post.autorId !== usuario.id
                  );
                  const postCurtindo = postCurtindoId === post.id;
                  const postSalvando = postSalvandoId === post.id;
                  const postCompartilhando = postCompartilhandoId === post.id;
                  const postRemovendo = postRemovendoId === post.id;
                  const postFixando = postFixandoId === post.id;
                  const postDenunciando =
                    denunciaEnviandoId === obterChaveDenuncia("post", post.id);
                  const spoilerRevelado = spoilersReveladosIds.includes(post.id);
                  const ocultarTextoSpoiler = post.temSpoiler && !spoilerRevelado;

                  return (
                    <article key={post.id} style={isDesktop ? postCardDesktopStyle : postCardStyle}>
                      <div style={postHeaderStyle}>
                        <div style={authorAvatarStyle}>
                          {post.autorNome.slice(0, 1).toUpperCase()}
                        </div>

                        <div style={postMetaStyle}>
                          <strong style={postAuthorStyle}>{post.autorNome}</strong>
                          <span style={postSubMetaStyle}>
                            {post.tipoPublicacao} · {post.categoria} · {formatarDataComunidade(post.criadoEm)}
                          </span>
                        </div>

                      </div>

                      <div style={postBadgesRowStyle}>
                        {post.fixado && (
                          <span style={pinnedPostBadgeStyle}>Fixado</span>
                        )}

                        <span style={postTypeBadgeStyle}>{post.tipoPublicacao}</span>

                        {post.temSpoiler && (
                          <span style={spoilerBadgeStyle}>Spoiler</span>
                        )}

                        {post.obraRelacionada && (
                          <Link
                            href={criarLinkObraRelacionada(post.obraRelacionada)}
                            style={obraBadgeStyle}
                          >
                            Obra: {post.obraRelacionada}
                          </Link>
                        )}
                      </div>

                      {ocultarTextoSpoiler ? (
                        <div style={spoilerHiddenBoxStyle}>
                          <strong style={spoilerHiddenTitleStyle}>
                            Conteúdo com spoiler oculto
                          </strong>

                          <span style={spoilerHiddenTextStyle}>
                            Este post pode revelar eventos, capítulos ou detalhes importantes.
                            Revele somente se quiser ver o conteúdo completo.
                          </span>

                          <button
                            type="button"
                            onClick={() => alternarSpoilerRevelado(post.id)}
                            style={spoilerRevealButtonStyle}
                          >
                            Revelar conteúdo
                          </button>
                        </div>
                      ) : (
                        <>
                          {postEhEnquete(post) ? (
                            <div style={pollPostBoxStyle}>
                              <strong style={pollPostQuestionStyle}>
                                {obterPerguntaEnquete(post.texto)}
                              </strong>

                              <div style={pollPostOptionsStyle}>
                                {obterOpcoesEnquete(post.texto).map((opcao) => {
                                  const votoAtual = votosEnquetes[post.id] || "";
                                  const selecionada = votoAtual === opcao;
                                  const totalVotos = calcularTotalVotosEnquete(
                                    resultadosEnquetes,
                                    post.id
                                  );
                                  const porcentagem = calcularPorcentagemOpcaoEnquete(
                                    resultadosEnquetes,
                                    post.id,
                                    opcao
                                  );
                                  const larguraResultado =
                                    totalVotos > 0
                                      ? `${porcentagem}%`
                                      : selecionada
                                        ? "100%"
                                        : "0%";

                                  return (
                                    <button
                                      key={opcao}
                                      type="button"
                                      onClick={() => votarEnquete(post.id, opcao)}
                                      disabled={Boolean(votoAtual) || votandoEnqueteId === post.id}
                                      style={
                                        selecionada
                                          ? pollPostOptionSelectedStyle
                                          : pollPostOptionStyle
                                      }
                                    >
                                      <span
                                        style={{
                                          ...pollPostResultBarStyle,
                                          width: larguraResultado,
                                        }}
                                      />

                                      <span style={pollPostOptionTextStyle}>
                                        {opcao}
                                      </span>

                                      <span style={pollPostStatusStyle}>
                                        {selecionada
                                          ? `Seu voto · ${totalVotos > 0 ? porcentagem : 100}%`
                                          : totalVotos > 0
                                            ? `${porcentagem}%`
                                            : "Votar"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p style={postTextStyle}>{post.texto}</p>
                          )}

                          {post.temSpoiler && (
                            <button
                              type="button"
                              onClick={() => alternarSpoilerRevelado(post.id)}
                              style={spoilerHideButtonStyle}
                            >
                              Ocultar conteúdo com spoiler
                            </button>
                          )}
                        </>
                      )}

                      <div style={isDesktop ? postActionsDesktopStyle : postActionsStyle}>
                        <button
                          type="button"
                          onClick={() => alternarCurtida(post.id)}
                          disabled={postCurtindo}
                          style={{
                            ...(usuarioCurtiu
                              ? likedActionButtonStyle
                              : actionButtonStyle),
                            opacity: postCurtindo ? 0.58 : 1,
                            cursor: postCurtindo ? "not-allowed" : "pointer",
                          }}
                        >
                          {postCurtindo ? "♥ ..." : `♥ ${post.curtidas.length}`}
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirComentarios(post.id)}
                          style={actionButtonStyle}
                        >
                          💬 {post.comentarios.length}
                        </button>

                        <button
                          type="button"
                          onClick={() => alternarPostSalvo(post.id)}
                          disabled={postSalvando}
                          style={{
                            ...(postSalvo ? savedActionButtonStyle : actionButtonStyle),
                            opacity: postSalvando ? 0.58 : 1,
                            cursor: postSalvando ? "not-allowed" : "pointer",
                          }}
                        >
                          {postSalvando ? "☆ ..." : postSalvo ? "★" : "☆"}
                        </button>

                        <button
                          type="button"
                          onClick={() => compartilharPublicacao(post)}
                          disabled={postCompartilhando}
                          style={{
                            ...actionButtonStyle,
                            opacity: postCompartilhando ? 0.58 : 1,
                            cursor: postCompartilhando ? "not-allowed" : "pointer",
                          }}
                        >
                          {postCompartilhando ? "⧉ ..." : "⧉ Copiar link"}
                        </button>

                        {usuarioEhAdmin && (
                          <button
                            type="button"
                            onClick={() => alternarFixadoPost(post)}
                            disabled={postFixando}
                            style={{
                              ...(post.fixado ? pinnedActionButtonStyle : actionButtonStyle),
                              opacity: postFixando ? 0.58 : 1,
                              cursor: postFixando ? "not-allowed" : "pointer",
                            }}
                          >
                            {postFixando
                              ? "Atualizando..."
                              : post.fixado
                                ? "Desfixar"
                                : "Fixar"}
                          </button>
                        )}

                        {podeRemover && (
                          <button
                            type="button"
                            onClick={() => removerPost(post.id)}
                            disabled={postRemovendo}
                            style={{
                              ...removeActionButtonStyle,
                              opacity: postRemovendo ? 0.58 : 1,
                              cursor: postRemovendo ? "not-allowed" : "pointer",
                            }}
                          >
                            {postRemovendo ? "Removendo..." : "Remover"}
                          </button>
                        )}

                        {podeDenunciarPost && (
                          <button
                            type="button"
                            onClick={() => denunciarConteudo("post", post.id)}
                            disabled={postDenunciando}
                            style={{
                              ...reportActionButtonStyle,
                              opacity: postDenunciando ? 0.58 : 1,
                              cursor: postDenunciando ? "not-allowed" : "pointer",
                            }}
                          >
                            {postDenunciando ? "Enviando..." : "Denunciar"}
                          </button>
                        )}

                        {!usuario && (
                          <Link href="/login" style={smallLoginLinkStyle}>
                            Entrar para participar
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article style={emptyFeedStyle}>
                  <strong style={emptyFeedTitleStyle}>
                    {mostrarApenasSalvos
                      ? "Nenhuma publicação salva."
                      : filtrosAtivos
                        ? "Nenhuma publicação encontrada."
                        : "Nenhuma publicação ainda."}
                  </strong>
                  <p style={emptyFeedTextStyle}>
                    {mostrarApenasSalvos
                      ? "Salve publicações pelo símbolo ☆ para voltar nelas depois."
                      : filtrosAtivos
                        ? "Tente limpar a busca, mudar a categoria ou limpar os filtros."
                        : "Seja o primeiro a publicar na Comunidade."}
                  </p>

                  {filtrosAtivos ? (
                    <button
                      type="button"
                      onClick={limparFiltrosComunidade}
                      style={emptyFeedButtonStyle}
                    >
                      Limpar filtros
                    </button>
                  ) : usuario ? (
                    <button
                      type="button"
                      onClick={() => {
                        setErro("");
                        setComposerAberto(true);
                      }}
                      style={emptyFeedButtonStyle}
                    >
                      Criar primeira publicação
                    </button>
                  ) : (
                    <Link href="/login" style={emptyFeedButtonStyle}>
                      Entrar para participar
                    </Link>
                  )}
                </article>
              )}
            </section>

            <section style={isDesktop ? pinnedNoticeDesktopStyle : pinnedNoticeStyle}>
              <div style={pinnedIconStyle}>!</div>

              <div style={pinnedTextWrapStyle}>
                <strong style={pinnedTitleStyle}>Aviso da Comunidade</strong>
                <p style={pinnedTextStyle}>{AVISO_FIXADO_COMUNIDADE}</p>
              </div>

              <button
                type="button"
                onClick={verFeedEmAlta}
                style={isDesktop ? pinnedButtonDesktopStyle : pinnedButtonStyle}
              >
                Ver em alta
              </button>
            </section>
          </section>

        </section>
      </section>

      {composerAberto && usuario && (
        <section style={postComposerOverlayStyle} aria-label="Criar publicação">
          <button
            type="button"
            aria-label="Fechar publicação"
            onClick={() => {
              if (!publicandoPost) {
                setErro("");
                setComposerAberto(false);
              }
            }}
            style={postComposerBackdropStyle}
          />

          <article style={isDesktop ? postComposerDesktopSheetStyle : postComposerSheetStyle}>
            <header style={postComposerHeaderStyle}>
              <strong style={postComposerTitleStyle}>Nova publicação</strong>
            </header>

            <form onSubmit={publicarPost} style={postComposerFormStyle}>
              <div
                style={
                  isDesktop
                    ? postComposerFieldsGridStyle
                    : postComposerFieldsStackStyle
                }
              >
                <label style={fieldStyle}>
                  <span style={labelStyle}>Categoria</span>

                  <select
                    disabled={publicandoPost}
                    value={categoriaPost}
                    onChange={(event) =>
                      setCategoriaPost(event.target.value as CategoriaComunidade)
                    }
                    style={selectStyle}
                  >
                    {CATEGORIAS_COMUNIDADE.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Tipo</span>

                  <select
                    disabled={publicandoPost}
                    value={tipoPublicacaoPost}
                    onChange={(event) =>
                      setTipoPublicacaoPost(
                        event.target.value as TipoPublicacaoComunidade
                      )
                    }
                    style={selectStyle}
                  >
                    {TIPOS_PUBLICACAO_COMUNIDADE.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Obra relacionada</span>

                  <div style={relatedWorkSearchWrapStyle}>
                    <input
                      ref={obraRelacionadaRef}
                      disabled={publicandoPost}
                      value={obraRelacionadaBusca}
                      onChange={(event) => {
                        const valorDigitado = event.target.value;

                        setObraRelacionadaBusca(valorDigitado);
                        setSugestoesObrasAbertas(Boolean(valorDigitado.trim()));
                      }}
                      onFocus={() => {
                        setSugestoesObrasAbertas(
                          Boolean(obraRelacionadaBusca.trim())
                        );
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setSugestoesObrasAbertas(false);
                        }, 120);
                      }}
                      placeholder="Opcional: nome da obra"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={90}
                      style={inputStyle}
                    />

                    {sugestoesObrasAbertas &&
                      sugestoesObrasRelacionadasVisiveis.length > 0 && (
                        <div style={relatedWorkSuggestionsStyle}>
                          {sugestoesObrasRelacionadasVisiveis.map((obra) => (
                            <button
                              key={obra.id}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                selecionarObraRelacionada(obra.titulo);
                              }}
                              style={relatedWorkSuggestionButtonStyle}
                            >
                              <strong style={relatedWorkSuggestionTitleStyle}>
                                {obra.titulo}
                              </strong>
                              <span style={relatedWorkSuggestionAuthorStyle}>
                                Por {obra.autor}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </label>
              </div>

              <label style={fieldStyle}>
                <div style={postComposerPublicationHeaderStyle}>
                  <span style={labelStyle}>Publicação</span>

                  <div style={postComposerHeaderToolsStyle}>
                    <button
                      type="button"
                      disabled={publicandoPost}
                      onClick={prepararEnqueteComunidade}
                      style={{
                        ...pollTemplateButtonStyle,
                        opacity: publicandoPost ? 0.58 : 1,
                        cursor: publicandoPost ? "not-allowed" : "pointer",
                      }}
                    >
                      Modelo de enquete
                    </button>

                    <span style={charCountStyle}>máx. 700</span>
                  </div>
                </div>

                <textarea
                  ref={textoPostRef}
                  disabled={publicandoPost}
                  placeholder="Fale sobre uma obra, peça indicação ou divulgue um capítulo..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={700}
                  rows={3}
                  style={postComposerTextareaStyle}
                />
              </label>

              {erro && <span style={errorStyle}>{erro}</span>}

              <div style={postComposerActionRowStyle}>
                <button
                  type="button"
                  disabled={publicandoPost}
                  onClick={() => setTemSpoilerPost((valorAtual) => !valorAtual)}
                  style={{
                    ...(temSpoilerPost
                      ? spoilerComposerActiveStyle
                      : spoilerComposerStyle),
                    opacity: publicandoPost ? 0.58 : 1,
                    cursor: publicandoPost ? "not-allowed" : "pointer",
                  }}
                >
                  <span style={spoilerComposerLabelStyle}>
                    Este post contém spoiler
                  </span>

                  <span
                    aria-hidden="true"
                    style={
                      temSpoilerPost
                        ? spoilerComposerCheckActiveStyle
                        : spoilerComposerCheckStyle
                    }
                  >
                    {temSpoilerPost ? "✓" : ""}
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={publicandoPost}
                  style={{
                    ...primaryButtonStyle,
                    opacity: publicandoPost ? 0.64 : 1,
                    cursor: publicandoPost ? "not-allowed" : "pointer",
                  }}
                >
                  {publicandoPost ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
          </article>
        </section>
      )}

      <ComentariosSheet
        post={postComentariosAberto}
        podeComentar={Boolean(usuario)}
        usuarioId={usuario?.id || ""}
        usuarioNome={usuario?.nome || "Usuário"}
        erroInteracao={erro}
        onFechar={fecharComentarios}
        onEnviar={comentarPost}
        onCurtirComentario={alternarCurtidaComentario}
        onRemoverComentario={removerComentario}
        onDenunciarComentario={(comentarioId) =>
          denunciarConteudo("comentario", comentarioId)
        }
      />

      {feedbackAcao && (
        <div role="status" aria-live="polite" style={actionFeedbackToastStyle}>
          {feedbackAcao}
        </div>
      )}
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 31%), radial-gradient(circle at 88% 14%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(1120px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "10px 0 calc(20px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "24px 0 44px",
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  marginBottom: "8px",
  minWidth: 0,
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "radial-gradient(ellipse at 8% 74%, var(--historietas-glow-primary, rgba(42,20,76,0.54)) 0%, transparent 62%), radial-gradient(ellipse at 76% 68%, var(--historietas-glow-secondary, rgba(32,13,58,0.36)) 0%, transparent 64%), linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.96)) 42%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const titleSectionStyle: CSSProperties = {
  margin: "8px 0 16px",
  minWidth: 0,
  textAlign: "center",
};

const communityTitleStyle: CSSProperties = {
  margin: "0 auto",
  fontSize: "clamp(40px, 8.8vw, 82px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "760px",
  color: "transparent",
  paddingBottom: "4px",
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  columnGap: "22px",
  rowGap: "8px",
  ...safeTextStyle,
};

const mobileCommunityTitleStyle: CSSProperties = {
  ...communityTitleStyle,
  fontSize: "clamp(27px, 8.5vw, 40px)",
  lineHeight: 0.98,
  letterSpacing: "-0.055em",
  paddingBottom: "2px",
  columnGap: "12px",
  rowGap: "6px",
};

const titleGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  minWidth: 0,
};

const titleWordStyle: CSSProperties = {
  display: "inline-block",
  background:
    "linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 38%, #FFFFFF) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, none)",
};

const titleMarkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.42em",
  height: "1.42em",
  borderRadius: "0.5em",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "0.7em",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  lineHeight: 1,
  flex: "0 0 auto",
  transform: "translateY(-0.02em)",
};

const titleUserAreaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "10px",
  minWidth: 0,
};

const titleUserChipStyle: CSSProperties = {
  maxWidth: "min(280px, 100%)",
  minHeight: "36px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "4px 13px 4px 5px",
  borderRadius: "999px",
  background: "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  overflow: "hidden",
};

const titleUserIconStyle: CSSProperties = {
  width: "27px",
  height: "27px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  lineHeight: 1,
};

const titleUserNameStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const titleLoginButtonStyle: CSSProperties = {
  minHeight: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 14px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  border: "none",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "nowrap",
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
  maxWidth: "calc(100% - 98px)",
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
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #F5F3FF 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 38%, #FFFFFF) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, none)",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  minWidth: 0,
};

const topLinkStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 11px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const loginButtonStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  border: "none",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const userBadgeStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  maxWidth: "112px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "20px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  background:
    "radial-gradient(circle at 16% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent), transparent 30%), radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.18) 100%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "11px",
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  gridTemplateColumns: "minmax(0, 1fr) 260px",
  alignItems: "center",
  padding: "28px",
  gap: "24px",
};

const introStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 8vw, 72px)",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "760px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingBottom: "4px",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.6,
  fontWeight: 700,
  maxWidth: "680px",
  ...safeTextStyle,
};

const mobileTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(27px, 8.3vw, 38px)",
  lineHeight: 0.98,
  letterSpacing: "-0.07em",
  paddingBottom: "2px",
};

const mobileDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "12px",
  lineHeight: 1.34,
};

const heroPillsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "2px",
};

const heroPillStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.065))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.095))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const heroPanelStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "16px",
  borderRadius: "22px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  minWidth: 0,
};

const desktopHeroPanelStyle: CSSProperties = {
  ...heroPanelStyle,
  alignSelf: "stretch",
  alignContent: "center",
  justifyItems: "center",
  textAlign: "center",
};

const panelNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "48px",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.08em",
};

const panelLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
};

const panelMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 800,
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  marginTop: "10px",
};

const desktopLayoutStyle: CSSProperties = {
  ...layoutStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "18px",
  marginTop: "18px",
};

const feedColumnStyle: CSSProperties = {
  width: "min(880px, 100%)",
  display: "grid",
  gap: "11px",
  minWidth: 0,
};

const focusedPostStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  marginBottom: "14px",
  padding: "12px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface, rgba(255,255,255,0.075))) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.035)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopFocusedPostStyle: CSSProperties = {
  ...focusedPostStyle,
  padding: "14px",
  borderRadius: "26px",
};

const focusedPostHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const focusedPostTitleBoxStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const focusedPostTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.052em",
  ...safeTextStyle,
};

const focusedPostCloseButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
};

const focusedPostCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(12,7,23,0.72))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.085))",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const focusedPostAuthorRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  minWidth: 0,
};

const focusedPostAvatarStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED), var(--historietas-accent, #F97316))",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const focusedPostAuthorInfoStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const focusedPostAuthorNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const focusedPostMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 760,
  ...safeTextStyle,
};

const focusedPostWorkLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-accent, #FDBA74)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

const focusedPostTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 720,
  whiteSpace: "pre-wrap",
  ...safeTextStyle,
};

const focusedSpoilerBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "13px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(127,29,29,0.20), rgba(0,0,0,0.20))",
  border: "1px solid rgba(248,113,113,0.22)",
  minWidth: 0,
  boxShadow: "none",
};

const focusedSpoilerButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "16px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  padding: "0 12px",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const focusedPostSmallButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "32px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 10px",
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
};

const focusedPostStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const focusedPostActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
};

const focusedPostPrimaryButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(135deg, var(--historietas-secondary, #7C3AED), var(--historietas-accent, #F97316))",
  color: "#FFFFFF",
  padding: "0 11px",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const focusedPostSecondaryButtonStyle: CSSProperties = {
  ...focusedPostPrimaryButtonStyle,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
};

const focusedPostPinnedButtonStyle: CSSProperties = {
  ...focusedPostSecondaryButtonStyle,
  color: "var(--historietas-accent, #FDBA74)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
};

const focusedPostDangerButtonStyle: CSSProperties = {
  ...focusedPostSecondaryButtonStyle,
  color: "#FCA5A5",
  border: "1px solid rgba(248,113,113,0.26)",
  background: "rgba(127,29,29,0.18)",
};

const compactComposerActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "8px",
  alignItems: "center",
  minWidth: 0,
};

const compactComposerPollButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "17px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const postComposerHeaderToolsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const pollTemplateButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  padding: "0 9px",
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const pollPostBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "2px",
  padding: "10px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const pollPostQuestionStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 950,
  ...safeTextStyle,
};

const pollPostOptionsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const pollPostOptionStyle: CSSProperties = {
  position: "relative",
  minHeight: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "0 10px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  overflow: "hidden",
  boxShadow: "none",
};

const pollPostOptionSelectedStyle: CSSProperties = {
  ...pollPostOptionStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
};

const pollPostResultBarStyle: CSSProperties = {
  position: "absolute",
  inset: "0 auto 0 0",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  pointerEvents: "none",
};

const pollPostOptionTextStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: 0,
  textAlign: "left",
  ...safeTextStyle,
};

const pollPostStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const focusedPollBoxStyle: CSSProperties = {
  ...pollPostBoxStyle,
  gap: "9px",
  padding: "11px",
  borderRadius: "18px",
};

const focusedPollQuestionStyle: CSSProperties = {
  ...pollPostQuestionStyle,
  fontSize: "14px",
};

const focusedPollOptionsStyle: CSSProperties = {
  ...pollPostOptionsStyle,
  gap: "7px",
};

const focusedPollOptionStyle: CSSProperties = {
  ...pollPostOptionStyle,
  minHeight: "39px",
  fontSize: "11.5px",
};

const focusedPollOptionSelectedStyle: CSSProperties = {
  ...focusedPollOptionStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
};

const focusedPollResultBarStyle: CSSProperties = {
  ...pollPostResultBarStyle,
};

const focusedPollOptionTextStyle: CSSProperties = {
  ...pollPostOptionTextStyle,
};

const focusedPollStatusStyle: CSSProperties = {
  ...pollPostStatusStyle,
};

const composerStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: "12px",
  borderRadius: "21px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, rgba(18,12,30,0.90)) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
};

const composerHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "start",
  justifyContent: "center",
  gap: "12px",
  minWidth: 0,
  textAlign: "center",
};

const composerTitleWrapStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: "3px 0 0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const publishTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  width: "100%",
  color: "var(--historietas-accent, #FDBA74)",
  textAlign: "center",
};

const composerFormStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const composerFieldsStackStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const composerFieldsGridStyle: CSSProperties = {
  ...composerFieldsStackStyle,
  gridTemplateColumns: "150px 190px minmax(0, 1fr)",
};

const composerFooterStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const charCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
};

const compactComposerStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const compactComposerButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "17px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  fontWeight: 850,
  fontFamily: "inherit",
  textAlign: "left",
  padding: "0 13px",
  cursor: "pointer",
  boxShadow: "none",
  ...safeTextStyle,
};

const visitorComposerStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

const visitorComposerTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.42,
  fontWeight: 750,
  ...safeTextStyle,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  borderRadius: "15px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const relatedWorkSearchWrapStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  zIndex: 4,
};

const relatedWorkSuggestionsStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 5px)",
  left: 0,
  right: 0,
  zIndex: 18,
  display: "grid",
  gap: "4px",
  padding: "6px",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-surface-strong, rgba(12,7,23,0.98))",
  boxShadow: "none",
  maxHeight: "172px",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

const relatedWorkSuggestionButtonStyle: CSSProperties = {
  minHeight: "40px",
  display: "grid",
  gap: "2px",
  justifyItems: "start",
  padding: "7px 9px",
  borderRadius: "12px",
  border: "1px solid transparent",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  minWidth: 0,
};

const relatedWorkSuggestionTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.15,
  fontWeight: 950,
  ...safeTextStyle,
};

const relatedWorkSuggestionAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 800,
  ...safeTextStyle,
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "82px",
  borderRadius: "17px",
  padding: "10px 12px",
  resize: "vertical",
  lineHeight: 1.45,
};

const postComposerOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 92,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
};

const postComposerBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "rgba(3, 2, 8, 0.30)",
  pointerEvents: "auto",
  cursor: "pointer",
};

const postComposerSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(680px, 100%)",
  maxWidth: "100%",
  maxHeight: "calc(92dvh - env(safe-area-inset-top))",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: "0",
  padding: "10px 12px calc(12px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background:
    "linear-gradient(180deg, var(--historietas-surface-strong, rgba(12,7,23,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  borderBottom: "none",
  boxShadow: "none",
  pointerEvents: "auto",
  boxSizing: "border-box",
  overflow: "hidden",
  contain: "layout paint",
  isolation: "isolate",
};

const postComposerDesktopSheetStyle: CSSProperties = {
  ...postComposerSheetStyle,
  width: "min(760px, calc(100% - 48px))",
  maxHeight: "min(760px, calc(100dvh - 56px))",
  alignSelf: "center",
  borderRadius: "28px",
  borderBottom: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const postComposerHeaderStyle: CSSProperties = {
  minHeight: "36px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  gap: "8px",
  borderBottom: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  paddingBottom: "8px",
  minWidth: 0,
  textAlign: "center",
};

const postComposerTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const postComposerFormStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "10px 2px 0",
  WebkitOverflowScrolling: "touch",
};

const postComposerFieldsStackStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const postComposerFieldsGridStyle: CSSProperties = {
  ...postComposerFieldsStackStyle,
  gridTemplateColumns: "150px 190px minmax(0, 1fr)",
};

const postComposerTextareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "66px",
  maxHeight: "130px",
  borderRadius: "17px",
  padding: "10px 12px",
  resize: "none",
  lineHeight: 1.45,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

const postComposerPublicationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const postComposerActionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const spoilerComposerStyle: CSSProperties = {
  minHeight: "39px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "0 10px 0 12px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  width: "100%",
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const spoilerComposerActiveStyle: CSSProperties = {
  ...spoilerComposerStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const spoilerComposerLabelStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  textAlign: "center",
  ...safeTextStyle,
};

const spoilerComposerCheckStyle: CSSProperties = {
  width: "17px",
  height: "17px",
  borderRadius: "5px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.18))",
  background: "rgba(255,255,255,0.035)",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
};

const spoilerComposerCheckActiveStyle: CSSProperties = {
  ...spoilerComposerCheckStyle,
  border: "1px solid rgba(34,197,94,0.70)",
  background: "rgba(34,197,94,0.10)",
  color: "#22C55E",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  cursor: "pointer",
  ...safeTextStyle,
};

const primaryLinkButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
  cursor: "pointer",
  boxShadow: "none",
};

const errorStyle: CSSProperties = {
  display: "block",
  padding: "9px 11px",
  borderRadius: "15px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border:
    "1px solid color-mix(in srgb, #EF4444 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const authLoadingStyle: CSSProperties = {
  minHeight: "42px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "17px",
  background: "var(--historietas-input-bg, #18181B)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
};


const communityErrorNoticeStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border:
    "1px solid color-mix(in srgb, #EF4444 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  ...safeTextStyle,
};

const pinnedNoticeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "36px minmax(0, 1fr)",
  gap: "10px",
  alignItems: "center",
  padding: "12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, rgba(18,12,30,0.90)) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 9%, rgba(12,7,23,0.98)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, var(--historietas-border-soft, transparent))",
  minWidth: 0,
};

const pinnedNoticeDesktopStyle: CSSProperties = {
  ...pinnedNoticeStyle,
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  gap: "13px",
  padding: "14px 15px",
  borderRadius: "26px",
};

const pinnedIconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const pinnedTextWrapStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const pinnedTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

const pinnedTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.5,
  fontWeight: 760,
  ...safeTextStyle,
};

const pinnedButtonStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.065))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "0 12px",
};

const pinnedButtonDesktopStyle: CSSProperties = {
  ...pinnedButtonStyle,
  gridColumn: "auto",
  minWidth: "116px",
  minHeight: "38px",
};

const weeklyChallengeStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "13px",
  borderRadius: "23px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(18,12,30,0.92)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 8%, rgba(12,7,23,0.98)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, var(--historietas-border-soft, transparent))",
  minWidth: 0,
};

const weeklyChallengeDesktopStyle: CSSProperties = {
  ...weeklyChallengeStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  padding: "16px",
  borderRadius: "27px",
  textAlign: "center",
};

const weeklyChallengeTextStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  textAlign: "center",
};

const weeklyChallengeKickerStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  textAlign: "center",
  ...safeTextStyle,
};

const weeklyChallengeTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(12px, 3.35vw, 15px)",
  lineHeight: 1.18,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const weeklyChallengeButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "0 13px",
  boxShadow: "none",
};

const weeklyChallengeButtonDesktopStyle: CSSProperties = {
  ...weeklyChallengeButtonStyle,
  minWidth: "150px",
  justifySelf: "center",
};


const compactCommunitySummaryStyle: CSSProperties = {
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  minWidth: 0,
  ...safeTextStyle,
};

const desktopCompactCommunitySummaryStyle: CSSProperties = {
  ...compactCommunitySummaryStyle,
  fontSize: "11px",
};

const compactCommunitySummaryItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
};

const compactCommunitySummarySeparatorStyle: CSSProperties = {
  opacity: 0.9,
};

const exploreLikeFilterBoxStyle: CSSProperties = {
  marginTop: "0",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, rgba(255,255,255,0.055)) 0%, rgba(255,255,255,0.045) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, rgba(255,255,255,0.08))",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const desktopExploreLikeFilterBoxStyle: CSSProperties = {
  ...exploreLikeFilterBoxStyle,
  gridTemplateColumns: "1fr",
  alignItems: "stretch",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "22px",
};

const exploreLikeSearchInputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, rgba(8,5,18,0.62))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 720,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.045)",
  minWidth: 0,
};

const desktopExploreLikeSearchInputStyle: CSSProperties = {
  ...exploreLikeSearchInputStyle,
  height: "42px",
  fontSize: "14px",
  padding: "0 15px",
};

const exploreLikeQuickFiltersStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "8px",
  overflowX: "visible",
  paddingBottom: "2px",
  width: "100%",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const desktopExploreLikeQuickFiltersStyle: CSSProperties = {
  ...exploreLikeQuickFiltersStyle,
  justifyContent: "center",
  overflowX: "visible",
  paddingBottom: 0,
  minWidth: 0,
};

const exploreLikeQuickFilterButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "210px",
  minHeight: "32px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.038))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 880,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "0 7px 16px rgba(0,0,0,0.09)",
  ...safeTextStyle,
};

const desktopExploreLikeQuickFilterButtonStyle: CSSProperties = {
  ...exploreLikeQuickFilterButtonStyle,
  minHeight: "34px",
  padding: "0 13px",
  fontSize: "11.5px",
  fontWeight: 900,
  maxWidth: "none",
};

const exploreLikeQuickFilterActiveStyle: CSSProperties = {
  ...exploreLikeQuickFilterButtonStyle,
  background: "rgba(124,58,237,0.28)",
  border: "1px solid rgba(139,92,246,0.34)",
  color: "#FFFFFF",
  boxShadow: "0 12px 28px rgba(124,58,237,0.18)",
};

const desktopExploreLikeQuickFilterActiveStyle: CSSProperties = {
  ...desktopExploreLikeQuickFilterButtonStyle,
  background: "rgba(124,58,237,0.28)",
  border: "1px solid rgba(139,92,246,0.34)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const exploreLikeToggleFiltersStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.10))",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 8%, rgba(255,255,255,0.045)) 0%, rgba(255,255,255,0.032) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  boxShadow: "none",
  ...safeTextStyle,
};

const exploreLikeAdvancedFiltersStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  paddingTop: "2px",
};

const desktopExploreLikeAdvancedFiltersStyle: CSSProperties = {
  ...exploreLikeAdvancedFiltersStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(4, minmax(128px, 1fr))",
  gap: "8px",
  alignItems: "end",
};

const exploreLikeFieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  padding: "8px",
  borderRadius: "15px",
  background: "var(--historietas-surface, rgba(255,255,255,0.03))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
};

const exploreLikeSearchLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 870,
  ...safeTextStyle,
};

const exploreLikeSelectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #120B1F)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "11.5px",
  fontWeight: 820,
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const exploreLikeClearFiltersStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginTop: "2px",
};

const desktopExploreLikeClearFiltersStyle: CSSProperties = {
  ...exploreLikeClearFiltersStyle,
  justifyContent: "center",
};

const exploreLikeClearFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  ...safeTextStyle,
};

const communityToolsStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, rgba(18,12,30,0.86)) 0%, rgba(10,6,18,0.94) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  minWidth: 0,
};

const communityToolsDesktopStyle: CSSProperties = {
  ...communityToolsStyle,
  gridTemplateColumns: "minmax(0, 1fr) minmax(310px, auto)",
  alignItems: "end",
  padding: "14px",
  gap: "14px",
};

const searchFieldStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const searchLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: "16px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, rgba(8,5,15,0.82))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  outline: "none",
  padding: "0 14px",
  fontSize: "13px",
  fontWeight: 820,
  boxSizing: "border-box",
};

const advancedCommunityFiltersPanelStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  padding: "12px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.82)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.94)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textAlign: "center",
};

const desktopAdvancedCommunityFiltersPanelStyle: CSSProperties = {
  ...advancedCommunityFiltersPanelStyle,
  padding: "16px",
  borderRadius: "26px",
  gap: "12px",
};

const advancedCommunityFiltersHeaderStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  textAlign: "center",
};

const advancedCommunityFiltersTitleBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
};

const advancedCommunityFiltersTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

const filterResultBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const advancedCommunitySearchRowStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const quickFiltersGridStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};

const quickFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 11px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  ...safeTextStyle,
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent)",
  color: "#FFFFFF",
};

const advancedToggleRowStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  minWidth: 0,
};

const advancedToggleButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, var(--historietas-border-soft, transparent))",
  background: "rgba(249,115,22,0.10)",
  color: "var(--historietas-accent, #FDBA74)",
  padding: "0 14px",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};

const advancedFiltersGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  paddingTop: "2px",
};

const desktopAdvancedFiltersGridStyle: CSSProperties = {
  ...advancedFiltersGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};

const communityFilterFieldStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "6px",
  minWidth: 0,
  padding: "9px",
  borderRadius: "16px",
  background: "var(--historietas-surface, rgba(255,255,255,0.03))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
  textAlign: "center",
};

const communityFilterSelectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #120B1F)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "11.5px",
  fontWeight: 820,
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  textAlign: "center",
};

const compactClearFiltersStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginTop: "2px",
};

const sortBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  textAlign: "center",
};

const sortLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const sortButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  overflowX: "auto",
  maxWidth: "100%",
  paddingBottom: "1px",
  WebkitOverflowScrolling: "touch",
};

const sortButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  cursor: "pointer",
  fontFamily: "inherit",
};

const sortButtonActiveStyle: CSSProperties = {
  ...sortButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.25))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 48%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const feedSummaryStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  padding: "10px 2px 0",
  minWidth: 0,
  textAlign: "center",
};

const feedSummaryTextWrapStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "3px",
  minWidth: 0,
  textAlign: "center",
};

const feedSummaryTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 5vw, 26px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

const feedSummaryTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.35,
  ...safeTextStyle,
};

const clearFiltersButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  padding: "0 11px",
  fontSize: "11px",
  fontWeight: 950,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const feedLoadingWrapStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const feedLoadingCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "14px",
  borderRadius: "20px",
  background: "var(--historietas-surface, rgba(18,12,30,0.76))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
};

const feedLoadingLineLargeStyle: CSSProperties = {
  display: "block",
  width: "64%",
  height: "14px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
};

const feedLoadingLineStyle: CSSProperties = {
  ...feedLoadingLineLargeStyle,
  width: "92%",
  height: "11px",
};

const feedLoadingLineShortStyle: CSSProperties = {
  ...feedLoadingLineLargeStyle,
  width: "42%",
  height: "11px",
};

const typeFilterPanelStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: "11px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 9%, rgba(18,12,30,0.86)) 0%, rgba(10,6,18,0.94) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  minWidth: 0,
};

const typeFilterHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

const typeFilterTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const typeFilterHintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 850,
  textAlign: "right",
  ...safeTextStyle,
};

const typeFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  overflowX: "auto",
  paddingBottom: "2px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const typeFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 11px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  flex: "0 0 auto",
};

const typeFilterButtonActiveStyle: CSSProperties = {
  ...typeFilterButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.25))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 48%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const filtersStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  padding: "0 28px 5px 2px",
  margin: "0 -2px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const filterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  flex: "0 0 auto",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "var(--historietas-accent, #F97316)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent)",
  color: "#FFFFFF",
};


const savedFilterStyle: CSSProperties = {
  ...filterButtonStyle,
  marginLeft: "auto",
};

const savedFilterActiveStyle: CSSProperties = {
  ...savedFilterStyle,
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-surface, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-accent, #FDBA74)",
};

const postsListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

const emptyFeedStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  padding: "22px 14px",
  borderRadius: "21px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(18,12,30,0.88)) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  textAlign: "center",
  minWidth: 0,
};

const emptyFeedTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  ...safeTextStyle,
};

const emptyFeedTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.45,
  fontWeight: 800,
  ...safeTextStyle,
};

const emptyFeedButtonStyle: CSSProperties = {
  minHeight: "36px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  textDecoration: "none",
  padding: "0 13px",
  cursor: "pointer",
  boxShadow: "none",
};

const postCardStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  padding: "14px",
  borderRadius: "23px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(18,12,30,0.90)) 0%, rgba(10,6,18,0.97) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
};

const postCardDesktopStyle: CSSProperties = {
  ...postCardStyle,
  gap: "12px",
  padding: "16px",
  borderRadius: "26px",
};

const postHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const authorAvatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
};

const postMetaStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const postAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  ...safeTextStyle,
};

const postSubMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  ...safeTextStyle,
};

const removeButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, #EF4444 24%, var(--historietas-border-soft, transparent))",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.11))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 9px",
  cursor: "pointer",
};

const removeActionButtonStyle: CSSProperties = {
  ...removeButtonStyle,
  minHeight: "34px",
  fontSize: "11px",
  padding: "0 12px",
};

const obraBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "var(--historietas-active-surface, rgba(124,58,237,0.18))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  ...safeTextStyle,
};

const postBadgesRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};

const postTypeBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, rgba(255,255,255,0.035))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const pinnedPostBadgeStyle: CSSProperties = {
  ...postTypeBadgeStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 24%, rgba(255,255,255,0.035))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 36%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const spoilerBadgeStyle: CSSProperties = {
  ...postTypeBadgeStyle,
  background: "rgba(248,113,113,0.12)",
  border: "1px solid rgba(248,113,113,0.24)",
  color: "#FCA5A5",
};

const spoilerHiddenBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, rgba(127,29,29,0.20), rgba(0,0,0,0.20))",
  border: "1px solid rgba(248,113,113,0.22)",
  minWidth: 0,
  boxShadow: "none",
};

const spoilerHiddenTitleStyle: CSSProperties = {
  color: "#FCA5A5",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const spoilerHiddenTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 760,
  ...safeTextStyle,
};

const spoilerRevealButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(248,113,113,0.28)",
  background: "rgba(248,113,113,0.12)",
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "0 12px",
  textAlign: "center",
  boxShadow: "none",
};

const spoilerHideButtonStyle: CSSProperties = {
  ...spoilerRevealButtonStyle,
  minHeight: "30px",
  background: "rgba(255,255,255,0.045)",
};

const postTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "13.5px",
  lineHeight: 1.55,
  fontWeight: 720,
  whiteSpace: "pre-wrap",
  ...safeTextStyle,
};

const postActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const postActionsDesktopStyle: CSSProperties = {
  ...postActionsStyle,
  alignItems: "center",
};

const actionButtonStyle: CSSProperties = {
  minHeight: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
  cursor: "pointer",
  minWidth: "0",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const likedActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-surface, transparent))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-accent, #FDBA74)",
};

const pinnedActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
};

const savedActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};

const reportActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const smallLoginLinkStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
};

const commentsBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
};

const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
};

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "rgba(3, 2, 8, 0.28)",
  pointerEvents: "auto",
  cursor: "pointer",
};

const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(680px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background:
    "linear-gradient(180deg, rgba(15,9,28,0.995) 0%, rgba(10,6,18,1) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  borderBottom: "none",
  pointerEvents: "auto",
  overflow: "hidden",
  willChange: "height",
};

const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
};

const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};

const commentsSheetHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

const commentsSheetCloseStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  justifySelf: "end",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "10px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

const commentsSheetEmptyStyle: CSSProperties = {
  minHeight: "100%",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "4px",
  padding: "16px 16px",
  textAlign: "center",
};

const commentsSheetEmptyTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
};

const commentsSheetEmptyTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11.5px",
  fontWeight: 800,
};

const commentItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 26px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const commentContentStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

const commentTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
};

const commentTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
};

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  ...safeTextStyle,
};

const commentStickerImageStyle: CSSProperties = {
  width: "92px",
  height: "92px",
  objectFit: "contain",
  display: "block",
};

const commentActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const commentReplyButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentRemoveButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentReportButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

const commentLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

const commentLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};

const commentLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

const commentHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
};

const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border:
    "1px solid color-mix(in srgb, #EF4444 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  ...safeTextStyle,
};

const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
  borderTop: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
};

const commentsQuickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const commentsQuickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

const commentsStickerToggleStyle: CSSProperties = {
  width: "34px",
  height: "28px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "15px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

const commentsStickerToggleActiveStyle: CSSProperties = {
  ...commentsStickerToggleStyle,
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 60%, transparent)",
};

const commentsStickerTrayStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "8px",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
};

const commentsStickerTrayHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 26px",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const commentsStickerTrayTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const commentsStickerTrayCloseStyle: CSSProperties = {
  width: "26px",
  height: "26px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "20px",
  lineHeight: 1,
  cursor: "pointer",
  padding: 0,
};

const commentsStickersGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "8px",
  maxHeight: "158px",
  overflowY: "auto",
  padding: "1px 0 2px",
  WebkitOverflowScrolling: "touch",
};

const commentsStickerButtonStyle: CSSProperties = {
  minHeight: "62px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  border: "none",
  borderRadius: "16px",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "6px",
};

const commentsStickerPreviewStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  objectFit: "contain",
  display: "block",
};

const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
  background: "var(--historietas-surface-strong, rgba(12,7,23,0.99))",
};

const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

const commentsSelectedStickerStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "5px 6px 5px 10px",
  borderRadius: "20px",
  background: "var(--historietas-input-bg, #18181B)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  minWidth: 0,
};

const commentsSelectedStickerImageStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  objectFit: "contain",
  display: "block",
};

const commentsSelectedStickerRemoveStyle: CSSProperties = {
  width: "26px",
  height: "26px",
  border: "none",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
};

const commentsSheetInputStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  padding: "9px 12px",
  fontSize: "12.5px",
  lineHeight: 1.32,
  resize: "none",
  overflowY: "auto",
};

const commentsInputIconButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

const commentsSheetSendStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};

const commentStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "9px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.04))",
};

const commentButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 12px",
};

const sidebarStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

const desktopSidebarStyle: CSSProperties = {
  ...sidebarStyle,
  position: "sticky",
  top: "18px",
};

const sideCardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "15px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, rgba(18,12,30,0.88)) 0%, rgba(12,7,23,0.96) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const rulesListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
};

const categoryListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
};

const sideCategoryButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  minHeight: "32px",
  fontSize: "11px",
  padding: "0 10px",
};


const sideCategoryButtonActiveStyle: CSSProperties = {
  ...sideCategoryButtonStyle,
  background: "var(--historietas-active-surface, rgba(124,58,237,0.24))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 48%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const sideCardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

const sideMiniButtonStyle: CSSProperties = {
  minHeight: "28px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: "0 9px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const sideTrendsListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const sideTrendButtonStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "6px",
  textAlign: "left",
  padding: "10px",
  borderRadius: "15px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  cursor: "pointer",
  minWidth: 0,
};

const sideTrendTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const sideTrendMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 850,
};

const sideStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
};

const sideStatItemStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  justifyItems: "center",
  padding: "10px 6px",
  borderRadius: "15px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const sideStatNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  fontWeight: 950,
  lineHeight: 1,
};

const sideStatLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const sideTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
  ...safeTextStyle,
};
const actionFeedbackToastStyle: CSSProperties = {
  position: "fixed",
  right: "max(14px, env(safe-area-inset-right))",
  bottom: "calc(16px + env(safe-area-inset-bottom))",
  zIndex: 80,
  maxWidth: "min(360px, calc(100vw - 28px))",
  padding: "12px 14px",
  borderRadius: "18px",
  background: "var(--historietas-surface-strong, rgba(12,7,23,0.98))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  boxShadow: "none",
  ...safeTextStyle,
};