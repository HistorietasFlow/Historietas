"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  aplicarTemaVisual,
  carregarTemaVisualSalvo,
  historietasThemeCss,
  obterTemaVisualSeguro,
  salvarTemaVisualSalvo,
  TEMAS_VISUAIS_HISTORIETAS,
  THEME_STORAGE_KEY,
  useHistorietasTheme,
  type TemaVisualHistorietas,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
type TemaVisual = TemaVisualHistorietas;

type TipoMensagemAcaoConfiguracoes = "sucesso" | "erro" | "aviso";

type MensagemAcaoConfiguracoes = {
  id: number;
  tipo: TipoMensagemAcaoConfiguracoes;
  texto: string;
};

type QuemPodeComentarDiario = "todos" | "seguidores" | "ninguem";
type VisibilidadeAbaPerfil =
  | "publico"
  | "seguidores"
  | "seguindo"
  | "somente_eu";

type PreferenciasPrivacidadeHistorietas = {
  perfilPrivado: boolean;
  aprovarNovosSeguidores: boolean;
  visibilidadeObras: VisibilidadeAbaPerfil;
  visibilidadeSobre: VisibilidadeAbaPerfil;
  visibilidadeDiario: VisibilidadeAbaPerfil;
  visibilidadeComunidade: VisibilidadeAbaPerfil;
  visibilidadeBiblioteca: VisibilidadeAbaPerfil;
  visibilidadeAtividades: VisibilidadeAbaPerfil;
  quemPodeComentarDiario: QuemPodeComentarDiario;
};

const PRIVACIDADE_STORAGE_KEY = "historietas-privacidade";
const PRIVACIDADE_ATUALIZADA_EVENT =
  "historietas:privacidade-atualizada";

const preferenciasPrivacidadePadrao: PreferenciasPrivacidadeHistorietas = {
  perfilPrivado: false,
  aprovarNovosSeguidores: false,
  visibilidadeObras: "publico",
  visibilidadeSobre: "publico",
  visibilidadeDiario: "publico",
  visibilidadeComunidade: "publico",
  visibilidadeBiblioteca: "somente_eu",
  visibilidadeAtividades: "seguidores",
  quemPodeComentarDiario: "todos",
};

function criarChavePrivacidadeUsuario(userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo
    ? `${PRIVACIDADE_STORAGE_KEY}:${userIdLimpo}`
    : PRIVACIDADE_STORAGE_KEY;
}

function normalizarBooleanoPrivacidade(valor: unknown, fallback: boolean) {
  return typeof valor === "boolean" ? valor : fallback;
}

function normalizarVisibilidadeAba(
  valor: unknown,
  fallback: VisibilidadeAbaPerfil,
): VisibilidadeAbaPerfil {
  return valor === "publico" ||
    valor === "seguidores" ||
    valor === "seguindo" ||
    valor === "somente_eu"
    ? valor
    : fallback;
}

function normalizarQuemPodeComentarDiario(
  valor: unknown,
): QuemPodeComentarDiario {
  return valor === "seguidores" || valor === "ninguem" || valor === "todos"
    ? valor
    : preferenciasPrivacidadePadrao.quemPodeComentarDiario;
}

function normalizarPreferenciasPrivacidade(
  valor: unknown,
): PreferenciasPrivacidadeHistorietas {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...preferenciasPrivacidadePadrao };
  }

  const registro = valor as Record<string, unknown>;
  const perfilPrivado = normalizarBooleanoPrivacidade(
    registro.perfilPrivado ?? registro.perfil_privado,
    preferenciasPrivacidadePadrao.perfilPrivado,
  );
  const mostrarObrasLegado = normalizarBooleanoPrivacidade(
    registro.mostrarObrasParaTodos ?? registro.mostrar_obras_para_todos,
    true,
  );
  const mostrarSobreLegado = normalizarBooleanoPrivacidade(
    registro.mostrarSobreParaTodos ?? registro.mostrar_sobre_para_todos,
    true,
  );
  const mostrarDiarioLegado = normalizarBooleanoPrivacidade(
    registro.mostrarDiarioNoPerfil ?? registro.mostrar_diario_perfil,
    true,
  );
  const mostrarAtividadesLegado = normalizarBooleanoPrivacidade(
    registro.mostrarAtividadesLeitura ?? registro.mostrar_atividades_leitura,
    true,
  );

  return {
    perfilPrivado,
    aprovarNovosSeguidores: normalizarBooleanoPrivacidade(
      registro.aprovarNovosSeguidores ?? registro.aprovar_novos_seguidores,
      preferenciasPrivacidadePadrao.aprovarNovosSeguidores,
    ),
    visibilidadeObras: normalizarVisibilidadeAba(
      registro.visibilidadeObras ?? registro.visibilidade_obras,
      mostrarObrasLegado ? "publico" : "seguidores",
    ),
    visibilidadeSobre: normalizarVisibilidadeAba(
      registro.visibilidadeSobre ?? registro.visibilidade_sobre,
      mostrarSobreLegado ? "publico" : "seguidores",
    ),
    visibilidadeDiario: normalizarVisibilidadeAba(
      registro.visibilidadeDiario ?? registro.visibilidade_diario,
      mostrarDiarioLegado
        ? perfilPrivado
          ? "seguidores"
          : "publico"
        : "somente_eu",
    ),
    visibilidadeComunidade: normalizarVisibilidadeAba(
      registro.visibilidadeComunidade ?? registro.visibilidade_comunidade,
      perfilPrivado ? "seguidores" : "publico",
    ),
    visibilidadeBiblioteca: normalizarVisibilidadeAba(
      registro.visibilidadeBiblioteca ?? registro.visibilidade_biblioteca,
      perfilPrivado ? "seguidores" : "somente_eu",
    ),
    visibilidadeAtividades: normalizarVisibilidadeAba(
      registro.visibilidadeAtividades ?? registro.visibilidade_atividades,
      mostrarAtividadesLegado
        ? perfilPrivado
          ? "seguidores"
          : "publico"
        : "somente_eu",
    ),
    quemPodeComentarDiario: normalizarQuemPodeComentarDiario(
      registro.quemPodeComentarDiario ??
        registro.quem_pode_comentar_diario,
    ),
  };
}

function carregarPreferenciasPrivacidadeLocal(
  userId: string,
): PreferenciasPrivacidadeHistorietas {
  if (typeof window === "undefined") {
    return { ...preferenciasPrivacidadePadrao };
  }

  try {
    const texto = localStorage.getItem(criarChavePrivacidadeUsuario(userId));

    return texto
      ? normalizarPreferenciasPrivacidade(JSON.parse(texto))
      : { ...preferenciasPrivacidadePadrao };
  } catch {
    return { ...preferenciasPrivacidadePadrao };
  }
}

function salvarPreferenciasPrivacidadeLocal(
  preferencias: PreferenciasPrivacidadeHistorietas,
  userId: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const preferenciasSeguras = normalizarPreferenciasPrivacidade(preferencias);

    localStorage.setItem(
      criarChavePrivacidadeUsuario(userId),
      JSON.stringify(preferenciasSeguras),
    );
    window.dispatchEvent(
      new CustomEvent(PRIVACIDADE_ATUALIZADA_EVENT, {
        detail: { userId: userId.trim() },
      }),
    );
  } catch {
    // O Supabase continua sendo a fonte principal quando disponível.
  }
}

async function carregarPreferenciasPrivacidade(
  userId: string,
  opcoes: { usarFallbackLocal?: boolean } = {},
): Promise<PreferenciasPrivacidadeHistorietas> {
  const userIdLimpo = userId.trim();
  const usarFallbackLocal = opcoes.usarFallbackLocal !== false;
  const fallback = usarFallbackLocal
    ? carregarPreferenciasPrivacidadeLocal(userIdLimpo)
    : { ...preferenciasPrivacidadePadrao };

  if (!userIdLimpo) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from("preferencias_privacidade")
      .select(
        "perfil_privado,aprovar_novos_seguidores,visibilidade_obras,visibilidade_sobre,visibilidade_diario,visibilidade_comunidade,visibilidade_biblioteca,visibilidade_atividades,quem_pode_comentar_diario",
      )
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (error || !data) {
      return fallback;
    }

    const preferencias = normalizarPreferenciasPrivacidade(data);

    if (usarFallbackLocal) {
      salvarPreferenciasPrivacidadeLocal(preferencias, userIdLimpo);
    }

    return preferencias;
  } catch {
    return fallback;
  }
}

async function salvarPreferenciasPrivacidade(
  preferencias: PreferenciasPrivacidadeHistorietas,
  userId: string,
) {
  const userIdLimpo = userId.trim();
  const preferenciasSeguras = normalizarPreferenciasPrivacidade(preferencias);

  salvarPreferenciasPrivacidadeLocal(preferenciasSeguras, userIdLimpo);

  if (!userIdLimpo) {
    return { ok: false, erro: "Usuário inválido." };
  }

  try {
    const { error } = await supabase.from("preferencias_privacidade").upsert(
      {
        user_id: userIdLimpo,
        perfil_privado: preferenciasSeguras.perfilPrivado,
        aprovar_novos_seguidores:
          preferenciasSeguras.aprovarNovosSeguidores,
        visibilidade_obras: preferenciasSeguras.visibilidadeObras,
        visibilidade_sobre: preferenciasSeguras.visibilidadeSobre,
        visibilidade_diario: preferenciasSeguras.visibilidadeDiario,
        visibilidade_comunidade: preferenciasSeguras.visibilidadeComunidade,
        visibilidade_biblioteca: preferenciasSeguras.visibilidadeBiblioteca,
        visibilidade_atividades: preferenciasSeguras.visibilidadeAtividades,
        quem_pode_comentar_diario:
          preferenciasSeguras.quemPodeComentarDiario,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return { ok: false, erro: error.message };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a privacidade.",
    };
  }
}

function textoIdioma(
  language: HistorietasLanguage,
  portugues: string,
  ingles: string,
  espanhol: string,
) {
  if (language === "en") {
    return ingles;
  }

  if (language === "es") {
    return espanhol;
  }

  return portugues;
}

function normalizarTextoBuscaConfiguracoes(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const ALIASES_BUSCA_CONFIGURACOES: Record<string, string[]> = {
  conta: ["account", "cuenta"],
  nome: ["name", "nombre"],
  exibicao: ["display", "visualizacion"],
  autor: ["author", "autor"],
  usuario: ["user", "usuario"],
  perfil: ["profile", "perfil"],
  arroba: ["handle", "usuario"],
  email: ["email", "correo"],
  contato: ["contact", "contacto"],
  senha: ["password", "contrasena"],
  seguranca: ["security", "seguridad"],
  privacidade: ["privacy", "privacidad"],
  privado: ["private", "privado"],
  visibilidade: ["visibility", "visibilidad"],
  publico: ["public", "público"],
  somente: ["only", "solo"],
  pessoas: ["people", "personas"],
  sigo: ["following", "sigo"],
  progresso: ["progress", "progreso"],
  avaliacoes: ["ratings", "reviews", "valoraciones", "resenas"],
  comentarios: ["comments", "comentarios"],
  seguidores: ["followers", "seguidores"],
  aprovacao: ["approval", "aprobacion"],
  aprovar: ["approve", "aprobar"],
  solicitacoes: ["requests", "solicitudes"],
  salvar: ["save", "guardar"],
  alteracoes: ["changes", "cambios"],
  configuracoes: ["settings", "configuracion"],
  moderacao: ["moderation", "moderacion"],
  comunidade: ["community", "comunidad"],
  obras: ["works", "stories", "obras", "historias"],
  criadas: ["created", "creadas"],
  biblioteca: ["library", "biblioteca"],
  lista: ["list", "lista"],
  favoritas: ["favorites", "favoritas"],
  concluidas: ["completed", "completadas"],
  notificacoes: ["notifications", "notificaciones"],
  avisos: ["alerts", "notices", "avisos"],
  historico: ["history", "historial"],
  leitura: ["reading", "lectura"],
  diario: ["journal", "diario"],
  preferencias: ["preferences", "preferencias"],
  tema: ["theme", "tema"],
  visual: ["appearance", "apariencia"],
  aparencia: ["appearance", "apariencia"],
  idioma: ["language", "idioma"],
  lingua: ["language", "idioma"],
  receber: ["receive", "recibir"],
  dados: ["data", "datos"],
  backup: ["backup", "copia"],
  copiar: ["copy", "copiar"],
  baixar: ["download", "descargar"],
  resumo: ["summary", "resumen"],
  suporte: ["support", "soporte"],
  ajuda: ["help", "ayuda"],
  termos: ["terms", "terminos"],
  politicas: ["policies", "politicas"],
  sobre: ["about", "acerca"],
  versao: ["version", "version"],
  sair: ["sign out", "logout", "cerrar sesion"],
  login: ["login", "inicio de sesion"],
};


type PreferenciasConta = {
  nomeExibicao: string;
  username: string;
  emailContato: string;
  receberAvisos: boolean;
  temaVisual: TemaVisual;
};

type ResumoLocal = {
  obras: number;
  notificacoes: number;
  lancamentos: number;
  favoritas: number;
  concluidas: number;
  seguindoObras: number;
  seguindoAutores: number;
};

type UsuarioConfiguracoes = {
  id: string;
  nome: string;
  username: string;
  email: string;
};

type AppMetadataAdminConfiguracoes = {
  role?: unknown;
  roles?: unknown;
  cargo?: unknown;
  tipo_usuario?: unknown;
  admin?: unknown;
  is_admin?: unknown;
  moderator?: unknown;
};

type IconName =
  | "user"
  | "mail"
  | "lock"
  | "shield"
  | "bell"
  | "book"
  | "bookmark"
  | "clock"
  | "star"
  | "trophy"
  | "palette"
  | "moon"
  | "download"
  | "copy"
  | "database"
  | "help"
  | "file"
  | "logout"
  | "admin"
  | "chart"
  | "pen"
  | "comment"
  | "settings"
  | "search"
  | "arrowLeft"
  | "chevronRight"
  | "check"
  | "layers"
  | "spark";

const CONFIG_STORAGE_KEY = "historietas-configuracoes-conta";
const CONFIGURACOES_ATUALIZADAS_EVENT =
  "historietas:configuracoes-atualizadas";
const CHAVES_RESUMO = [
  "historietas-obras",
  "historietas-notificacoes",
  "historietas-lancamentos-salvos",
  "historietas-obras-favoritas",
  "historietas-obras-concluidas",
  "historietas-obras-seguidas",
  "historietas-autores-seguidos",
  "historietas-perfis-autores",
  "historietas-privacidade",
  THEME_STORAGE_KEY,
];

const preferenciasPadrao: PreferenciasConta = {
  nomeExibicao: "",
  username: "",
  emailContato: "",
  receberAvisos: true,
  temaVisual: "original",
};

const resumoPadrao: ResumoLocal = {
  obras: 0,
  notificacoes: 0,
  lancamentos: 0,
  favoritas: 0,
  concluidas: 0,
  seguindoObras: 0,
  seguindoAutores: 0,
};

const TEMAS_VISUAIS: Record<
  TemaVisual,
  {
    nome: string;
    descricao: string;
    accent: string;
    secondary: string;
  }
> = {
  original: {
    nome: "Original",
    descricao:
      "Visual atual do Historietas em roxo escuro, preto e branco.",
    accent: TEMAS_VISUAIS_HISTORIETAS.original.accent,
    secondary: TEMAS_VISUAIS_HISTORIETAS.original.secondary,
  },
  foco: {
    nome: "Foco",
    descricao:
      "Fundo e blocos pretos, textos brancos e secundários em cinza claro.",
    accent: TEMAS_VISUAIS_HISTORIETAS.foco.accent,
    secondary: TEMAS_VISUAIS_HISTORIETAS.foco.secondary,
  },
};

const ORDEM_TEMAS_VISUAIS: TemaVisual[] = ["original", "foco"];

function obterTemaVisualTraduzido(
  temaVisual: TemaVisual,
  language: HistorietasLanguage,
) {
  const temaBase = TEMAS_VISUAIS[temaVisual];

  if (temaVisual === "foco") {
    return {
      ...temaBase,
      nome: textoIdioma(language, "Foco", "Focus", "Enfoque"),
      descricao: textoIdioma(
        language,
        "Fundo e blocos pretos, textos brancos e secundários em cinza claro.",
        "Black background and sections, white text and light gray secondary text.",
        "Fondo y bloques negros, textos blancos y secundarios en gris claro.",
      ),
    };
  }

  return {
    ...temaBase,
    nome: textoIdioma(language, "Original", "Original", "Original"),
    descricao: textoIdioma(
      language,
      "Visual atual do Historietas em roxo escuro, preto e branco.",
      "Current Historietas look in dark purple, black and white.",
      "Diseño actual de Historietas en morado oscuro, negro y blanco.",
    ),
  };
}

function criarStorageKeyUsuarioConfiguracoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function lerStorageUsuarioConfiguracoes(chave: string, userId = "") {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return null;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioConfiguracoes(chave, userIdLimpo);

    return chaveStorage ? localStorage.getItem(chaveStorage) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioConfiguracoes(
  chave: string,
  userId: string,
  valor: unknown,
) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return;
  }

  try {
    const chaveStorage = criarStorageKeyUsuarioConfiguracoes(chave, userIdLimpo);

    if (!chaveStorage) {
      return;
    }

    localStorage.setItem(chaveStorage, JSON.stringify(valor));
  } catch {
    // localStorage é fallback; as configurações continuam em memória.
  }
}



function carregarJsonArray(chave: string, userId = "") {
  try {
    const texto = lerStorageUsuarioConfiguracoes(chave, userId);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

function criarChaveItemResumo(item: unknown, index: number) {
  if (typeof item === "string" || typeof item === "number") {
    const valor = String(item).trim();

    return valor || `item-${index}`;
  }

  if (item && typeof item === "object" && !Array.isArray(item)) {
    const registro = item as Record<string, unknown>;
    const identificadores = [
      registro.id,
      registro.obra_id,
      registro.obraId,
      registro.capitulo_id,
      registro.capituloId,
      registro.user_id,
      registro.userId,
      registro.autor_id,
      registro.autorId,
      registro.notificacao_id,
    ];
    const identificador = identificadores.find(
      (valor) => typeof valor === "string" && Boolean(valor.trim()),
    );

    if (typeof identificador === "string") {
      return identificador.trim();
    }

    try {
      return JSON.stringify(registro) || `item-${index}`;
    } catch {
      return `item-${index}`;
    }
  }

  return `item-${index}`;
}

function contarItens(chave: string, userId = "") {
  const itens = carregarJsonArray(chave, userId);

  return new Set(
    itens.map((item, index) => criarChaveItemResumo(item, index)),
  ).size;
}

function criarResumoLocal(userId = ""): ResumoLocal {
  return {
    obras: contarItens("historietas-obras", userId),
    notificacoes: contarItens("historietas-notificacoes", userId),
    lancamentos: contarItens("historietas-lancamentos-salvos", userId),
    favoritas: contarItens("historietas-obras-favoritas", userId),
    concluidas: contarItens("historietas-obras-concluidas", userId),
    seguindoObras: contarItens("historietas-obras-seguidas", userId),
    seguindoAutores: contarItens("historietas-autores-seguidos", userId),
  };
}

type ResultadoContagemResumoSupabase = {
  ok: boolean;
  total: number;
};

async function contarRegistrosResumoSupabase({
  tabela,
  campoSelecionado,
  colunaUsuario,
  userId,
}: {
  tabela: string;
  campoSelecionado: string;
  colunaUsuario: string;
  userId: string;
}): Promise<ResultadoContagemResumoSupabase> {
  try {
    const { count, error } = await supabase
      .from(tabela)
      .select(campoSelecionado, { count: "exact", head: true })
      .eq(colunaUsuario, userId);

    if (error) {
      console.warn(
        `Não consegui contar ${tabela} no resumo da conta:`,
        error.message,
      );
      return { ok: false, total: 0 };
    }

    return {
      ok: true,
      total:
        typeof count === "number" && Number.isFinite(count)
          ? Math.max(0, Math.trunc(count))
          : 0,
    };
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no resumo da conta:`, error);
    return { ok: false, total: 0 };
  }
}

async function carregarResumoContaSupabase(
  userId: string,
): Promise<ResumoLocal> {
  const userIdLimpo = userId.trim();
  const fallbackLocal = criarResumoLocal(userIdLimpo);

  if (!idUsuarioSupabaseValido(userIdLimpo)) {
    return fallbackLocal;
  }

  const [
    obras,
    favoritas,
    concluidas,
    seguindoObras,
    seguindoAutores,
  ] = await Promise.all([
    contarRegistrosResumoSupabase({
      tabela: "obras",
      campoSelecionado: "id",
      colunaUsuario: "user_id",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "favoritos",
      campoSelecionado: "obra_id",
      colunaUsuario: "user_id",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "concluidas",
      campoSelecionado: "obra_id",
      colunaUsuario: "user_id",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "seguindo_obras",
      campoSelecionado: "obra_id",
      colunaUsuario: "user_id",
      userId: userIdLimpo,
    }),
    contarRegistrosResumoSupabase({
      tabela: "seguindo_usuarios",
      campoSelecionado: "id",
      colunaUsuario: "seguidor_id",
      userId: userIdLimpo,
    }),
  ]);

  return {
    ...fallbackLocal,
    obras: obras.ok ? obras.total : fallbackLocal.obras,
    favoritas: favoritas.ok ? favoritas.total : fallbackLocal.favoritas,
    concluidas: concluidas.ok ? concluidas.total : fallbackLocal.concluidas,
    seguindoObras: seguindoObras.ok
      ? seguindoObras.total
      : fallbackLocal.seguindoObras,
    seguindoAutores: seguindoAutores.ok
      ? seguindoAutores.total
      : fallbackLocal.seguindoAutores,
  };
}

function carregarPreferencias(userId = ""): PreferenciasConta {
  const temaVisualSalvo = carregarTemaVisualSalvo(userId, true);

  try {
    const texto = lerStorageUsuarioConfiguracoes(CONFIG_STORAGE_KEY, userId);
    const json: unknown = texto ? JSON.parse(texto) : null;

    if (!json || typeof json !== "object") {
      return {
        ...preferenciasPadrao,
        temaVisual: temaVisualSalvo,
      };
    }

    const preferencias = json as Partial<PreferenciasConta>;

    return {
      nomeExibicao:
        typeof preferencias.nomeExibicao === "string"
          ? preferencias.nomeExibicao
          : "",
      username:
        typeof preferencias.username === "string"
          ? normalizarUsernameConfiguracoes(preferencias.username)
          : "",
      emailContato:
        typeof preferencias.emailContato === "string"
          ? preferencias.emailContato
          : "",
      receberAvisos:
        typeof preferencias.receberAvisos === "boolean"
          ? preferencias.receberAvisos
          : true,
      temaVisual: temaVisualSalvo,
    };
  } catch {
    return {
      ...preferenciasPadrao,
      temaVisual: temaVisualSalvo,
    };
  }
}

function salvarPreferencias(preferencias: PreferenciasConta, userId = "") {
  const userIdLimpo = userId.trim();

  salvarJsonStorageUsuarioConfiguracoes(
    CONFIG_STORAGE_KEY,
    userIdLimpo,
    preferencias,
  );
  salvarTemaVisualSalvo(preferencias.temaVisual, userIdLimpo);

  if (typeof window !== "undefined" && userIdLimpo) {
    window.dispatchEvent(
      new CustomEvent(CONFIGURACOES_ATUALIZADAS_EVENT, {
        detail: { userId: userIdLimpo },
      }),
    );
  }
}

function criarBackupLocal(userId = "") {
  const userIdLimpo = userId.trim();
  const backup: Record<string, unknown> = {};

  if (!userIdLimpo) {
    backup.exportadoEm = new Date().toISOString();
    backup.projeto = "Historietas";
    backup.userId = "";

    return JSON.stringify(backup, null, 2);
  }

  CHAVES_RESUMO.forEach((chave) => {
    try {
      const valor = lerStorageUsuarioConfiguracoes(chave, userIdLimpo);
      backup[chave] = valor ? JSON.parse(valor) : null;
    } catch {
      backup[chave] = null;
    }
  });

  backup[CONFIG_STORAGE_KEY] = carregarPreferencias(userIdLimpo);
  backup.exportadoEm = new Date().toISOString();
  backup.projeto = "Historietas";
  backup.userId = userIdLimpo;

  return JSON.stringify(backup, null, 2);
}

async function copiarTexto(texto: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return;
    } catch {
      // Em alguns navegadores o Clipboard API existe, mas é bloqueado.
    }
  }

  const campoTemporario = document.createElement("textarea");

  campoTemporario.value = texto;
  campoTemporario.setAttribute("readonly", "true");
  campoTemporario.style.position = "fixed";
  campoTemporario.style.left = "-9999px";
  document.body.appendChild(campoTemporario);

  try {
    campoTemporario.select();

    if (!document.execCommand("copy")) {
      throw new Error("Não foi possível copiar os dados.");
    }
  } finally {
    campoTemporario.remove();
  }
}

function criarLoginHrefConfiguracoes() {
  const params = new URLSearchParams({
    redirectTo: "/configuracoes",
  });

  return `/login?${params.toString()}`;
}

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function normalizarUsernameConfiguracoes(valor: string) {
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

function idUsuarioSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function valorTextoAdminConfiguracoes(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

function metadataTemAdminConfiguracoes(
  appMetadata: AppMetadataAdminConfiguracoes | null | undefined,
) {
  if (!appMetadata || typeof appMetadata !== "object") {
    return false;
  }

  const cargosPermitidos = new Set(["admin", "moderador", "moderator"]);
  const roles = Array.isArray(appMetadata.roles)
    ? appMetadata.roles.map(valorTextoAdminConfiguracoes)
    : [];

  return (
    [
      valorTextoAdminConfiguracoes(appMetadata.role),
      valorTextoAdminConfiguracoes(appMetadata.cargo),
      valorTextoAdminConfiguracoes(appMetadata.tipo_usuario),
      ...roles,
    ].some((valor) => cargosPermitidos.has(valor)) ||
    appMetadata.admin === true ||
    appMetadata.is_admin === true ||
    appMetadata.moderator === true
  );
}

type PerfilConfiguracoesSupabase = {
  nome: string;
  username: string;
};

function normalizarPerfilConfiguracoesSupabase(
  perfil: Record<string, unknown>,
): PerfilConfiguracoesSupabase {
  return {
    nome: pegarTexto(perfil.nome),
    username: normalizarUsernameConfiguracoes(pegarTexto(perfil.username)),
  };
}

async function carregarPerfilConfiguracoesSupabase(
  userId: string,
): Promise<PerfilConfiguracoesSupabase | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return null;
  }

  try {
    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (
      !erroUserId &&
      perfilPorUserId &&
      typeof perfilPorUserId === "object" &&
      !Array.isArray(perfilPorUserId)
    ) {
      return normalizarPerfilConfiguracoesSupabase(
        perfilPorUserId as Record<string, unknown>,
      );
    }

    const { data: perfilPorId, error: erroId } = await supabase
      .from("profiles")
      .select("id,user_id,nome,username")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (
      erroId ||
      !perfilPorId ||
      typeof perfilPorId !== "object" ||
      Array.isArray(perfilPorId)
    ) {
      return null;
    }

    return normalizarPerfilConfiguracoesSupabase(
      perfilPorId as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}

function traduzirErroSenhaConfiguracoes(
  mensagem: string,
  language: HistorietasLanguage,
) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("invalid login credentials") ||
    mensagemNormalizada.includes("current password") ||
    mensagemNormalizada.includes("incorrect password") ||
    mensagemNormalizada.includes("invalid password")
  ) {
    return textoIdioma(
      language,
      "A senha atual está incorreta.",
      "The current password is incorrect.",
      "La contraseña actual es incorrecta.",
    );
  }

  if (
    mensagemNormalizada.includes("same password") ||
    mensagemNormalizada.includes("different from the old password") ||
    mensagemNormalizada.includes("new password should be different")
  ) {
    return textoIdioma(
      language,
      "A nova senha precisa ser diferente da senha atual.",
      "The new password must be different from the current password.",
      "La nueva contraseña debe ser diferente de la contraseña actual.",
    );
  }

  if (
    mensagemNormalizada.includes("weak password") ||
    mensagemNormalizada.includes("password should") ||
    mensagemNormalizada.includes("password must") ||
    mensagemNormalizada.includes("password is too short")
  ) {
    return textoIdioma(
      language,
      "A nova senha não atende aos requisitos de segurança.",
      "The new password does not meet the security requirements.",
      "La nueva contraseña no cumple los requisitos de seguridad.",
    );
  }

  if (
    mensagemNormalizada.includes("reauth") ||
    mensagemNormalizada.includes("nonce") ||
    mensagemNormalizada.includes("session")
  ) {
    return textoIdioma(
      language,
      "Por segurança, entre novamente na conta e tente alterar a senha.",
      "For security, sign in again and try changing the password.",
      "Por seguridad, inicia sesión de nuevo e intenta cambiar la contraseña.",
    );
  }

  return textoIdioma(
    language,
    "Não foi possível alterar a senha agora.",
    "The password could not be changed right now.",
    "No se pudo cambiar la contraseña ahora.",
  );
}

function traduzirErroUsernameConfiguracoes(
  mensagem: string,
  language: HistorietasLanguage,
) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("profiles_username_unique") ||
    mensagemNormalizada.includes("duplicate") ||
    mensagemNormalizada.includes("unique")
  ) {
    return textoIdioma(
      language,
      "Esse @username já está em uso.",
      "This @username is already in use.",
      "Este @username ya está en uso.",
    );
  }

  return textoIdioma(
    language,
    "Não consegui salvar esse @username agora.",
    "I could not save this @username right now.",
    "No pude guardar este @username ahora.",
  );
}

async function salvarPerfilConfiguracoesSupabase({
  userId,
  nome,
  username,
}: {
  userId: string;
  nome: string;
  username: string;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "Usuário inválido." };
  }

  const usernameLimpo = normalizarUsernameConfiguracoes(username);
  const nomeLimpo = nome.trim() || "Usuário";
  const atualizadoEm = new Date().toISOString();

  try {
    let perfilId = "";
    let erroBusca = "";

    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (erroUserId) {
      erroBusca = erroUserId.message;
    } else if (perfilPorUserId && typeof perfilPorUserId === "object") {
      perfilId = pegarTexto(
        (perfilPorUserId as Record<string, unknown>).id,
      );
    }

    if (!perfilId) {
      const { data: perfilPorId, error: erroId } = await supabase
        .from("profiles")
        .select("id,user_id")
        .eq("id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      if (erroId) {
        erroBusca = erroBusca || erroId.message;
      } else if (perfilPorId && typeof perfilPorId === "object") {
        perfilId = pegarTexto((perfilPorId as Record<string, unknown>).id);
      }
    }

    const payloadAtualizacao = {
      nome: nomeLimpo,
      username: usernameLimpo || null,
      atualizado_em: atualizadoEm,
    };

    if (perfilId) {
      const { data: perfilAtualizado, error } = await supabase
        .from("profiles")
        .update(payloadAtualizacao)
        .eq("id", perfilId)
        .select("id")
        .maybeSingle();

      if (error) {
        return { ok: false, erro: error.message };
      }

      if (!perfilAtualizado) {
        return {
          ok: false,
          erro: "A atualização do perfil não foi confirmada.",
        };
      }

      return { ok: true, erro: "" };
    }

    if (erroBusca) {
      return { ok: false, erro: erroBusca };
    }

    const { data: perfilCriado, error } = await supabase
      .from("profiles")
      .insert({
        id: userIdLimpo,
        user_id: userIdLimpo,
        avatar_url: "",
        bio: "",
        sobre_bio: "",
        ...payloadAtualizacao,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, erro: error.message };
    }

    if (!perfilCriado) {
      return {
        ok: false,
        erro: "A criação do perfil não foi confirmada.",
      };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

function obterIniciais(nome: string, email: string) {
  const base = nome.trim() || email.trim() || "Historietas";
  const partes = base
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return (partes[0] || "H").slice(0, 2).toUpperCase();
}

function SvgIcon({
  name,
  size = 24,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, ReactNode> = {
    user: (
      <>
        <path {...common} d="M20 21a8 8 0 0 0-16 0" />
        <circle {...common} cx="12" cy="7" r="4" />
      </>
    ),
    mail: (
      <>
        <rect {...common} x="3" y="5" width="18" height="14" rx="2" />
        <path {...common} d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
        <path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    shield: <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    bell: (
      <>
        <path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path {...common} d="M10 21h4" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </>
    ),
    bookmark: <path {...common} d="M6 3h12v18l-6-4-6 4V3Z" />,
    clock: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v5l3 3" />
      </>
    ),
    star: (
      <path
        {...common}
        d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3Z"
      />
    ),
    trophy: (
      <>
        <path {...common} d="M8 21h8" />
        <path {...common} d="M12 17v4" />
        <path {...common} d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path {...common} d="M5 5H3v3a3 3 0 0 0 3 3h1" />
        <path {...common} d="M19 5h2v3a3 3 0 0 1-3 3h-1" />
      </>
    ),
    palette: (
      <>
        <circle {...common} cx="13.5" cy="6.5" r=".5" />
        <circle {...common} cx="17.5" cy="10.5" r=".5" />
        <circle {...common} cx="8.5" cy="7.5" r=".5" />
        <circle {...common} cx="6.5" cy="12.5" r=".5" />
        <path
          {...common}
          d="M12 3a9 9 0 0 0 0 18h1.4a2.6 2.6 0 0 0 2.2-4c-.5-.8.1-1.9 1-1.9H18a6 6 0 0 0 0-12h-6Z"
        />
      </>
    ),
    moon: <path {...common} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    download: (
      <>
        <path {...common} d="M12 3v12" />
        <path {...common} d="m7 10 5 5 5-5" />
        <path {...common} d="M5 21h14" />
      </>
    ),
    copy: (
      <>
        <rect {...common} x="9" y="9" width="12" height="12" rx="2" />
        <rect {...common} x="3" y="3" width="12" height="12" rx="2" />
      </>
    ),
    database: (
      <>
        <ellipse {...common} cx="12" cy="5" rx="8" ry="3" />
        <path {...common} d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path {...common} d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 2-2.6 2.2-2.6 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    file: (
      <>
        <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...common} d="M14 2v6h6" />
      </>
    ),
    logout: (
      <>
        <path {...common} d="M10 17l5-5-5-5" />
        <path {...common} d="M15 12H3" />
        <path {...common} d="M21 3v18" />
      </>
    ),
    admin: (
      <>
        <path {...common} d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path {...common} d="m3 13 9 5 9-5" />
      </>
    ),
    chart: (
      <>
        <path {...common} d="M4 19V5" />
        <path {...common} d="M4 19h16" />
        <path {...common} d="M8 16v-5" />
        <path {...common} d="M12 16V8" />
        <path {...common} d="M16 16v-3" />
      </>
    ),
    pen: (
      <>
        <path {...common} d="M12 20h9" />
        <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    comment: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path
          {...common}
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z"
        />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="11" cy="11" r="7" />
        <path {...common} d="m20 20-3.5-3.5" />
      </>
    ),
    arrowLeft: (
      <>
        <path {...common} d="M19 12H5" />
        <path {...common} d="m12 19-7-7 7-7" />
      </>
    ),
    chevronRight: <path {...common} d="m9 18 6-6-6-6" />,
    check: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m8 12 2.6 2.6L16 9" />
      </>
    ),
    layers: (
      <>
        <path {...common} d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path {...common} d="m3 12 9 5 9-5" />
        <path {...common} d="m3 17 9 5 9-5" />
      </>
    ),
    spark: (
      <>
        <path {...common} d="M12 2v5" />
        <path {...common} d="M12 17v5" />
        <path {...common} d="M4.9 4.9 8.4 8.4" />
        <path {...common} d="m15.6 15.6 3.5 3.5" />
        <path {...common} d="M2 12h5" />
        <path {...common} d="M17 12h5" />
        <path {...common} d="m4.9 19.1 3.5-3.5" />
        <path {...common} d="m15.6 8.4 3.5-3.5" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function LoadingSpinner({
  label = "Carregando",
  compacto = false,
}: {
  label?: string;
  compacto?: boolean;
}) {
  if (compacto) {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-label={label}
        style={loadingInlineStyle}
      >
        <span
          className="historietas-loading-spinner"
          style={loadingSpinnerCompactStyle}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={loadingPageStyle}
    >
      <span
        className="historietas-loading-spinner"
        style={loadingSpinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}

function ValorLinha({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <span style={danger ? rowValueDangerStyle : rowValueStyle}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={sectionTitleStyle}>{children}</h2>;
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <SectionTitle>{title}</SectionTitle>
      <div style={listCardStyle}>{children}</div>
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  href,
  onClick,
  danger = false,
  hideChevron = false,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  hideChevron?: boolean;
}) {
  const content = (
    <>
      <span style={rowIconStyle}>
        <SvgIcon name={icon} size={23} strokeWidth={2.15} />
      </span>

      <span style={rowTextBoxStyle}>
        <span style={danger ? rowTitleDangerStyle : rowTitleStyle}>{title}</span>
        {subtitle ? <span style={rowSubtitleStyle}>{subtitle}</span> : null}
      </span>

      {right ? <span style={rowRightStyle}>{right}</span> : null}

      {!hideChevron ? (
        <span style={rowChevronStyle}>
          <SvgIcon name="chevronRight" size={22} strokeWidth={2.6} />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} style={rowLinkStyle}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={rowButtonStyle}>
        {content}
      </button>
    );
  }

  return <div style={rowStaticStyle}>{content}</div>;
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      style={checked ? toggleOnStyle : toggleOffStyle}
    >
      <span style={checked ? toggleKnobOnStyle : toggleKnobOffStyle} />
    </button>
  );
}

function SettingsInput({
  icon,
  label,
  value,
  placeholder,
  type = "text",
  helperText,
  error = false,
  maxLength,
  autoComplete,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  helperText?: string;
  error?: boolean;
  maxLength?: number;
  autoComplete?: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label style={inputRowStyle}>
      <span style={rowIconStyle}>
        <SvgIcon name={icon} size={23} strokeWidth={2.15} />
      </span>

      <span style={inputTextBoxStyle}>
        <span style={inputLabelStyle}>{label}</span>
        <input
          className="configuracoes-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          maxLength={maxLength}
          autoComplete={autoComplete}
          style={inputStyle}
        />

        {helperText ? (
          <span style={error ? inputErrorStyle : inputHelperStyle}>
            {helperText}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioConfiguracoes | null>(null);
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [privacidade, setPrivacidade] =
    useState<PreferenciasPrivacidadeHistorietas>(
      preferenciasPrivacidadePadrao,
    );
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [erroUsername, setErroUsername] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrarTemas, setMostrarTemas] = useState(false);
  const [adminLiberado, setAdminLiberado] = useState(false);
  const [mostrarSeguranca, setMostrarSeguranca] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [senhaAlterada, setSenhaAlterada] = useState(false);
  const [mensagemAcao, setMensagemAcao] =
    useState<MensagemAcaoConfiguracoes | null>(null);
  const { pageThemeStyle, setTemaVisual } =
    useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();
  const { language } = useHistorietasLanguage();

  const usuarioIdLogado = usuario?.id || "";
  const temaAtual = obterTemaVisualTraduzido(
    preferencias.temaVisual,
    language,
  );

  function t(portugues: string, ingles: string, espanhol: string) {
    return textoIdioma(language, portugues, ingles, espanhol);
  }

  function mostrarMensagemAcao(
    tipo: TipoMensagemAcaoConfiguracoes,
    texto: string,
  ) {
    setMensagemAcao({
      id: Date.now(),
      tipo,
      texto,
    });
  }

  useEffect(() => {
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          router.replace(criarLoginHrefConfiguracoes());
          return;
        }

        const perfilRemoto = await carregarPerfilConfiguracoesSupabase(data.user.id);
        const nome =
          pegarTexto(perfilRemoto?.nome) ||
          pegarTexto(data.user.user_metadata?.nome) ||
          pegarTexto(data.user.user_metadata?.name) ||
          pegarTexto(data.user.email) ||
          "Usuário";
        const username =
          perfilRemoto?.username ||
          normalizarUsernameConfiguracoes(
            pegarTexto(data.user.user_metadata?.username),
          );

        const usuarioCarregado: UsuarioConfiguracoes = {
          id: data.user.id,
          nome,
          username,
          email: data.user.email || "",
        };
        const preferenciasCarregadas = carregarPreferencias(usuarioCarregado.id);
        const [privacidadeCarregada, resumoCarregado] = await Promise.all([
          carregarPreferenciasPrivacidade(usuarioCarregado.id, {
            usarFallbackLocal: true,
          }),
          carregarResumoContaSupabase(usuarioCarregado.id),
        ]);

        setUsuario(usuarioCarregado);
        setPrivacidade(privacidadeCarregada);
        setPreferencias({
          ...preferenciasCarregadas,
          nomeExibicao:
            perfilRemoto?.nome ||
            preferenciasCarregadas.nomeExibicao ||
            usuarioCarregado.nome,
          username:
            perfilRemoto?.username ||
            preferenciasCarregadas.username ||
            usuarioCarregado.username,
          emailContato:
            preferenciasCarregadas.emailContato || usuarioCarregado.email,
        });
        salvarTemaVisualSalvo(
          preferenciasCarregadas.temaVisual,
          usuarioCarregado.id,
        );
        setTemaVisual(preferenciasCarregadas.temaVisual);
        aplicarTemaVisual(preferenciasCarregadas.temaVisual);
        setResumo(resumoCarregado);
        setVerificandoAcesso(false);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefConfiguracoes());
        }
      }
    }

    verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router, setTemaVisual]);


  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    let cancelado = false;

    async function verificarAdmin() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        const user = data.user || null;

        if (!user || userError) {
          if (!cancelado) {
            setAdminLiberado(false);
          }

          return;
        }

        const adminPeloToken = metadataTemAdminConfiguracoes(
          user.app_metadata as AppMetadataAdminConfiguracoes | null | undefined,
        );
        const { data: adminLiberadoResposta, error } = await supabase.rpc(
          "usuario_e_admin",
        );

        if (!cancelado) {
          setAdminLiberado(
            error ? adminPeloToken : adminLiberadoResposta === true,
          );
        }
      } catch {
        if (!cancelado) {
          setAdminLiberado(false);
        }
      }
    }

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAdminLiberado(false);
        return;
      }

      void verificarAdmin();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, [verificandoAcesso]);

  useEffect(() => {
    if (!mostrarSeguranca || typeof document === "undefined") {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !salvandoSenha) {
        setMostrarSeguranca(false);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarNovaSenha("");
        setErroSenha("");
        setSenhaAlterada(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [mostrarSeguranca, salvandoSenha]);

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const mensagemId = mensagemAcao.id;
    const timer = window.setTimeout(() => {
      setMensagemAcao((mensagemAtual) =>
        mensagemAtual?.id === mensagemId ? null : mensagemAtual,
      );
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mensagemAcao]);

  const buscaNormalizada = normalizarTextoBuscaConfiguracoes(busca);

  function deveMostrar(...termos: string[]) {
    if (!buscaNormalizada) {
      return true;
    }

    const termosExpandidos = termos.flatMap((termo) => {
      const termoNormalizado = normalizarTextoBuscaConfiguracoes(termo);
      const aliases = ALIASES_BUSCA_CONFIGURACOES[termoNormalizado] || [];

      return [termoNormalizado, ...aliases];
    });

    return termosExpandidos
      .map(normalizarTextoBuscaConfiguracoes)
      .join(" ")
      .includes(buscaNormalizada);
  }

  const totalBiblioteca = useMemo(
    () => resumo.favoritas + resumo.concluidas + resumo.seguindoObras,
    [resumo.concluidas, resumo.favoritas, resumo.seguindoObras],
  );

  function atualizarPreferencia<K extends keyof PreferenciasConta>(
    campo: K,
    valor: PreferenciasConta[K],
  ) {
    setPreferencias((preferenciasAtuais) => ({
      ...preferenciasAtuais,
      [campo]: valor,
    }));
  }

  function alternarReceberAvisos() {
    const preferenciasAtualizadas: PreferenciasConta = {
      ...preferencias,
      receberAvisos: !preferencias.receberAvisos,
    };

    setPreferencias(preferenciasAtualizadas);

    if (usuarioIdLogado) {
      salvarPreferencias(preferenciasAtualizadas, usuarioIdLogado);
    }
  }

  function aplicarPrivacidadeAtualizada(
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) {
    setPrivacidade(privacidadeAtualizada);
    setMensagemAcao(null);

    const userIdSeguro = usuarioIdLogado.trim();

    if (!userIdSeguro) {
      mostrarMensagemAcao(
        "aviso",
        t(
          "A preferência ficou salva apenas neste aparelho porque sua conta não pôde ser confirmada.",
          "The preference was saved only on this device because your account could not be confirmed.",
          "La preferencia se guardó solo en este dispositivo porque no se pudo confirmar tu cuenta.",
        ),
      );
      return;
    }

    void salvarPreferenciasPrivacidade(
      privacidadeAtualizada,
      userIdSeguro,
    )
      .then((resultado) => {
        if (resultado.ok) {
          return;
        }

        console.warn(
          "A privacidade ficou salva neste aparelho, mas não sincronizou:",
          resultado.erro,
        );

        mostrarMensagemAcao(
          "aviso",
          t(
            "A preferência foi salva neste aparelho, mas não sincronizou com sua conta. Verifique sua conexão e tente novamente.",
            "The preference was saved on this device, but it did not sync with your account. Check your connection and try again.",
            "La preferencia se guardó en este dispositivo, pero no se sincronizó con tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
          ),
        );
      })
      .catch((error) => {
        console.warn(
          "Não foi possível sincronizar a preferência de privacidade:",
          error,
        );

        mostrarMensagemAcao(
          "aviso",
          t(
            "A preferência foi salva neste aparelho, mas não sincronizou com sua conta. Verifique sua conexão e tente novamente.",
            "The preference was saved on this device, but it did not sync with your account. Check your connection and try again.",
            "La preferencia se guardó en este dispositivo, pero no se sincronizó con tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
          ),
        );
      });
  }

  function atualizarPrivacidade<
    K extends keyof PreferenciasPrivacidadeHistorietas,
  >(campo: K, valor: PreferenciasPrivacidadeHistorietas[K]) {
    aplicarPrivacidadeAtualizada({
      ...privacidade,
      [campo]: valor,
    });
  }

  function alternarPerfilPrivado() {
    const perfilPrivado = !privacidade.perfilPrivado;

    aplicarPrivacidadeAtualizada({
      ...privacidade,
      perfilPrivado,
      aprovarNovosSeguidores: perfilPrivado
        ? true
        : privacidade.aprovarNovosSeguidores,
    });
  }

  function alternarAprovacaoNovosSeguidores() {
    const aprovarNovosSeguidores = !privacidade.aprovarNovosSeguidores;

    aplicarPrivacidadeAtualizada({
      ...privacidade,
      aprovarNovosSeguidores,
      perfilPrivado: aprovarNovosSeguidores
        ? privacidade.perfilPrivado
        : false,
    });
  }

  function atualizarTemaVisual(temaVisual: TemaVisual) {
    const temaSeguro = obterTemaVisualSeguro(temaVisual);
    const preferenciasAtualizadas: PreferenciasConta = {
      ...preferencias,
      temaVisual: temaSeguro,
    };

    setPreferencias(preferenciasAtualizadas);
    setTemaVisual(temaSeguro);
    aplicarTemaVisual(temaSeguro);

    if (usuarioIdLogado) {
      salvarPreferencias(preferenciasAtualizadas, usuarioIdLogado);
      return;
    }

    salvarTemaVisualSalvo(temaSeguro);
  }

  async function salvar() {
    if (salvando) {
      return;
    }

    setMensagemAcao(null);

    const userIdSeguro = usuarioIdLogado.trim();
    const usernameLimpo = normalizarUsernameConfiguracoes(preferencias.username);

    if (!idUsuarioSupabaseValido(userIdSeguro)) {
      router.replace(criarLoginHrefConfiguracoes());
      return;
    }

    if (preferencias.username.trim() && usernameLimpo.length < 3) {
      const mensagem = t(
        "Use pelo menos 3 caracteres no @username.",
        "Use at least 3 characters in the @username.",
        "Usa al menos 3 caracteres en el @username.",
      );

      setErroUsername(mensagem);
      mostrarMensagemAcao("erro", mensagem);
      return;
    }

    const preferenciasNormalizadas: PreferenciasConta = {
      ...preferencias,
      nomeExibicao: preferencias.nomeExibicao.trim(),
      username: usernameLimpo,
      emailContato: preferencias.emailContato.trim(),
    };

    setSalvando(true);
    setErroUsername("");

    try {
      const { data: dadosUsuarioAtual, error: erroUsuarioAtual } =
        await supabase.auth.getUser();
      const usuarioAtualId = dadosUsuarioAtual.user?.id || "";

      if (
        erroUsuarioAtual ||
        !idUsuarioSupabaseValido(usuarioAtualId) ||
        usuarioAtualId !== userIdSeguro
      ) {
        router.replace(criarLoginHrefConfiguracoes());
        return;
      }

      const falhasSincronizacao: string[] = [];

      const resultadoPerfil = await salvarPerfilConfiguracoesSupabase({
        userId: userIdSeguro,
        nome:
          preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
        username: usernameLimpo,
      });

      if (!resultadoPerfil.ok) {
        const mensagem = traduzirErroUsernameConfiguracoes(
          resultadoPerfil.erro,
          language,
        );

        setErroUsername(mensagem);
        mostrarMensagemAcao("erro", mensagem);
        return;
      }

      const { error: erroMetadata } = await supabase.auth.updateUser({
        data: {
          nome:
            preferenciasNormalizadas.nomeExibicao ||
            usuario?.nome ||
            "Usuário",
          username: usernameLimpo,
        },
      });

      if (erroMetadata) {
        falhasSincronizacao.push("metadados");
        console.warn(
          "O perfil foi salvo, mas os metadados da autenticação não sincronizaram:",
          erroMetadata.message,
        );
      }

      salvarPreferencias(preferenciasNormalizadas, userIdSeguro);
      const resultadoPrivacidade = await salvarPreferenciasPrivacidade(
        privacidade,
        userIdSeguro,
      );

      if (!resultadoPrivacidade.ok) {
        falhasSincronizacao.push("privacidade");
        console.warn(
          "As preferências de privacidade ficaram salvas neste aparelho, mas não sincronizaram:",
          resultadoPrivacidade.erro,
        );
      }

      setPreferencias(preferenciasNormalizadas);
      setUsuario((usuarioAtual) =>
        usuarioAtual
          ? {
              ...usuarioAtual,
              nome:
                preferenciasNormalizadas.nomeExibicao || usuarioAtual.nome,
              username: usernameLimpo,
              email:
                preferenciasNormalizadas.emailContato || usuarioAtual.email,
            }
          : usuarioAtual,
      );
      setResumo(await carregarResumoContaSupabase(userIdSeguro));

      if (falhasSincronizacao.length > 0) {
        mostrarMensagemAcao(
          "aviso",
          t(
            "As alterações foram salvas neste aparelho, mas parte delas não sincronizou com sua conta.",
            "The changes were saved on this device, but some of them did not sync with your account.",
            "Los cambios se guardaron en este dispositivo, pero algunos no se sincronizaron con tu cuenta.",
          ),
        );
      } else {
        mostrarMensagemAcao(
          "sucesso",
          t(
            "Alterações salvas com sucesso.",
            "Changes saved successfully.",
            "Cambios guardados correctamente.",
          ),
        );
      }
    } catch (error) {
      console.warn("Não consegui salvar as configurações da conta:", error);

      const mensagem = t(
        "Não consegui salvar suas alterações agora.",
        "I could not save your changes right now.",
        "No pude guardar tus cambios ahora.",
      );

      setErroUsername(mensagem);
      mostrarMensagemAcao("erro", mensagem);
    } finally {
      setSalvando(false);
    }
  }

  function abrirSeguranca() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroSenha("");
    setSenhaAlterada(false);
    setMostrarSeguranca(true);
  }

  function fecharSeguranca() {
    if (salvandoSenha) {
      return;
    }

    setMostrarSeguranca(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
    setErroSenha("");
    setSenhaAlterada(false);
  }

  async function alterarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (salvandoSenha || senhaAlterada) {
      return;
    }

    setErroSenha("");

    if (!senhaAtual) {
      setErroSenha(
        t(
          "Digite sua senha atual.",
          "Enter your current password.",
          "Escribe tu contraseña actual.",
        ),
      );
      return;
    }

    if (novaSenha.length < 8) {
      setErroSenha(
        t(
          "A nova senha precisa ter pelo menos 8 caracteres.",
          "The new password must be at least 8 characters long.",
          "La nueva contraseña debe tener al menos 8 caracteres.",
        ),
      );
      return;
    }

    if (
      !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novaSenha) ||
      !/[0-9]/.test(novaSenha)
    ) {
      setErroSenha(
        t(
          "Use pelo menos uma letra e um número na nova senha.",
          "Use at least one letter and one number in the new password.",
          "Usa al menos una letra y un número en la nueva contraseña.",
        ),
      );
      return;
    }

    if (novaSenha === senhaAtual) {
      setErroSenha(
        t(
          "A nova senha precisa ser diferente da senha atual.",
          "The new password must be different from the current password.",
          "La nueva contraseña debe ser diferente de la contraseña actual.",
        ),
      );
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha(
        t(
          "A confirmação não corresponde à nova senha.",
          "The confirmation does not match the new password.",
          "La confirmación no coincide con la nueva contraseña.",
        ),
      );
      return;
    }

    setSalvandoSenha(true);

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      if (
        erroUsuario ||
        !dadosUsuario.user ||
        dadosUsuario.user.id !== usuarioIdLogado
      ) {
        setErroSenha(
          t(
            "Sua sessão expirou. Entre novamente na conta.",
            "Your session has expired. Sign in again.",
            "Tu sesión expiró. Inicia sesión de nuevo.",
          ),
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        current_password: senhaAtual,
        password: novaSenha,
      });

      if (error) {
        setErroSenha(traduzirErroSenhaConfiguracoes(error.message, language));
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setSenhaAlterada(true);
    } catch (error) {
      setErroSenha(
        traduzirErroSenhaConfiguracoes(
          error instanceof Error ? error.message : "",
          language,
        ),
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function copiarBackup() {
    setMensagemAcao(null);

    try {
      await copiarTexto(criarBackupLocal(usuarioIdLogado));
      mostrarMensagemAcao(
        "sucesso",
        t(
          "Dados copiados para a área de transferência.",
          "Data copied to the clipboard.",
          "Datos copiados al portapapeles.",
        ),
      );
    } catch {
      mostrarMensagemAcao(
        "erro",
        t(
          "Não foi possível copiar os dados.",
          "The data could not be copied.",
          "No se pudieron copiar los datos.",
        ),
      );
    }
  }

  function baixarBackup() {
    setMensagemAcao(null);

    try {
      const backup = criarBackupLocal(usuarioIdLogado);
      const dataAtual = new Date().toISOString().slice(0, 10);
      const arquivo = new Blob([backup], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = url;
      link.download = `historietas-backup-${dataAtual}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);

      mostrarMensagemAcao(
        "sucesso",
        t(
          "Backup preparado e download iniciado.",
          "Backup prepared and download started.",
          "Copia preparada y descarga iniciada.",
        ),
      );
    } catch {
      mostrarMensagemAcao(
        "erro",
        t(
          "Não foi possível baixar o backup.",
          "The backup could not be downloaded.",
          "No se pudo descargar la copia.",
        ),
      );
    }
  }

  async function sairDaConta() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (verificandoAcesso) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>
        <LoadingSpinner
          label={t(
            "Carregando configurações",
            "Loading settings",
            "Cargando configuración",
          )}
        />
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

      <section style={containerStyle}>
        <header style={headerStyle}>
          <button
            type="button"
            onClick={() => router.back()}
            style={backButtonStyle}
            aria-label={t("Voltar", "Back", "Volver")}
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.4} />
          </button>

          <h1 style={pageTitleStyle}>
            {t(
              "Configurações e atividade",
              "Settings and activity",
              "Configuración y actividad",
            )}
          </h1>
        </header>

        <label style={searchBoxStyle} htmlFor="buscar-configuracoes">
          <SvgIcon name="search" size={23} strokeWidth={2.3} />
          <input
            id="buscar-configuracoes"
            className="configuracoes-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder={t("Pesquisar", "Search", "Buscar")}
            maxLength={80}
            autoComplete="off"
            style={searchInputStyle}
          />
        </label>

        <section style={profileCardStyle}>
          <div style={avatarStyle}>
            {obterIniciais(preferencias.nomeExibicao, preferencias.emailContato)}
          </div>

          <div style={profileTextStyle}>
            <strong style={profileNameStyle}>
              {preferencias.nomeExibicao ||
                usuario?.nome ||
                t(
                  "Conta Historietas",
                  "Historietas account",
                  "Cuenta de Historietas",
                )}
            </strong>
            <span style={profileUsernameStyle}>
              {preferencias.username
                ? `@${preferencias.username}`
                : t(
                    "@username não definido",
                    "@username not set",
                    "@username no definido",
                  )}
            </span>
            <span style={profileEmailStyle}>
              {preferencias.emailContato ||
                usuario?.email ||
                t(
                  "E-mail não informado",
                  "Email not provided",
                  "Correo no informado",
                )}
            </span>
          </div>
        </section>

        {deveMostrar(
          "conta",
          "nome",
          "username",
          "usuário",
          "email",
          "senha",
          "privacidade",
          "salvar",
        ) ? (
          <SettingsSection
            title={t("Sua conta", "Your account", "Tu cuenta")}
          >
            {deveMostrar("nome", "exibição", "autor") ? (
              <SettingsInput
                icon="user"
                label={t(
                  "Nome de exibição",
                  "Display name",
                  "Nombre visible",
                )}
                value={preferencias.nomeExibicao}
                onChange={(valor) =>
                  atualizarPreferencia("nomeExibicao", valor)
                }
                placeholder={t(
                  "Ex: Nome do autor",
                  "Example: Author name",
                  "Ejemplo: Nombre del autor",
                )}
                maxLength={80}
                autoComplete="name"
              />
            ) : null}

            {deveMostrar("username", "usuário", "perfil", "arroba") ? (
              <SettingsInput
                icon="user"
                label="@username"
                value={preferencias.username}
                onChange={(valor) => {
                  setErroUsername("");
                  atualizarPreferencia(
                    "username",
                    normalizarUsernameConfiguracoes(valor),
                  );
                }}
                placeholder={t(
                  "ex: username",
                  "example: username",
                  "ejemplo: username",
                )}
                maxLength={30}
                autoComplete="username"
                helperText={
                  erroUsername ||
                  t(
                    "Nome pode repetir. @username não pode repetir.",
                    "Names may repeat. @username must be unique.",
                    "El nombre puede repetirse. El @username debe ser único.",
                  )
                }
                error={Boolean(erroUsername)}
              />
            ) : null}

            {deveMostrar("email", "contato") ? (
              <SettingsInput
                icon="mail"
                label={t(
                  "E-mail de contato",
                  "Contact email",
                  "Correo de contacto",
                )}
                value={preferencias.emailContato}
                onChange={(valor) =>
                  atualizarPreferencia("emailContato", valor)
                }
                placeholder={t(
                  "Ex: seuemail@email.com",
                  "Example: youremail@email.com",
                  "Ejemplo: tucorreo@email.com",
                )}
                type="email"
                maxLength={254}
                autoComplete="email"
              />
            ) : null}

            {deveMostrar("salvar", "alterações", "configurações") ? (
              <SettingsRow
                icon="check"
                title={
                  salvando
                    ? t("Salvando...", "Saving...", "Guardando...")
                    : t(
                        "Salvar alterações",
                        "Save changes",
                        "Guardar cambios",
                      )
                }
                subtitle={t(
                  "Grava suas preferências nesta conta",
                  "Saves your preferences to this account",
                  "Guarda tus preferencias en esta cuenta",
                )}
                right={
                  salvando ? (
                    <LoadingSpinner
                      compacto
                      label={t(
                        "Salvando alterações",
                        "Saving changes",
                        "Guardando cambios",
                      )}
                    />
                  ) : undefined
                }
                onClick={salvar}
                hideChevron={salvando}
              />
            ) : null}

            {deveMostrar("senha", "segurança") ? (
              <SettingsRow
                icon="lock"
                title={t(
                  "Senha e segurança",
                  "Password and security",
                  "Contraseña y seguridad",
                )}
                subtitle={t(
                  "Altere com segurança sua senha de acesso",
                  "Securely change your access password",
                  "Cambia de forma segura tu contraseña de acceso",
                )}
                right={
                  <ValorLinha>
                    {t("Alterar", "Change", "Cambiar")}
                  </ValorLinha>
                }
                onClick={abrirSeguranca}
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "privacidade",
          "perfil",
          "privado",
          "seguidores",
          "aprovação",
          "solicitações",
        ) ? (
          <SettingsSection
            title={t(
              "Privacidade do perfil",
              "Profile privacy",
              "Privacidad del perfil",
            )}
          >
            {deveMostrar("perfil", "privado", "visibilidade") ? (
              <SettingsRow
                icon="lock"
                title={t(
                  "Perfil privado",
                  "Private profile",
                  "Perfil privado",
                )}
                subtitle={t(
                  "Controla quem pode seguir você.",
                  "Controls who can follow you.",
                  "Controla quién puede seguirte.",
                )}
                right={
                  <Toggle
                    checked={privacidade.perfilPrivado}
                    onChange={alternarPerfilPrivado}
                    ariaLabel={t(
                      "Ativar ou desativar perfil privado",
                      "Enable or disable private profile",
                      "Activar o desactivar el perfil privado",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "aprovar",
              "aprovação",
              "seguidores",
              "solicitações",
            ) ? (
              <SettingsRow
                icon="user"
                title={t(
                  "Aprovar novos seguidores",
                  "Approve new followers",
                  "Aprobar nuevos seguidores",
                )}
                subtitle={
                  privacidade.perfilPrivado
                    ? t(
                        "Novos seguidores precisam da sua aprovação",
                        "New followers need your approval",
                        "Los nuevos seguidores necesitan tu aprobación",
                      )
                    : t(
                        "Ative para receber solicitações antes de alguém seguir você",
                        "Turn this on to receive requests before someone follows you",
                        "Actívalo para recibir solicitudes antes de que alguien te siga",
                      )
                }
                right={
                  <Toggle
                    checked={privacidade.aprovarNovosSeguidores}
                    onChange={alternarAprovacaoNovosSeguidores}
                    ariaLabel={t(
                      "Ativar ou desativar aprovação de novos seguidores",
                      "Enable or disable approval of new followers",
                      "Activar o desactivar la aprobación de nuevos seguidores",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "privacidade",
          "visibilidade",
          "obras",
          "sobre",
          "diário",
          "comunidade",
          "biblioteca",
          "atividades",
          "público",
          "seguidores",
          "pessoas que sigo",
          "somente eu",
        ) ? (
          <SettingsSection
            title={t(
              "Visibilidade das abas",
              "Tab visibility",
              "Visibilidad de las pestañas",
            )}
          >
            {deveMostrar("obras", "publicadas", "visibilidade") ? (
              <SettingsRow
                icon="book"
                title={t("Obras", "Works", "Obras")}
                subtitle={t(
                  "Escolha quem pode ver suas obras publicadas no perfil",
                  "Choose who can see your published works on your profile",
                  "Elige quién puede ver tus obras publicadas en tu perfil",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeObras}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeObras",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Obras",
                      "Works tab visibility",
                      "Visibilidad de la pestaña Obras",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("sobre", "perfil", "visibilidade") ? (
              <SettingsRow
                icon="file"
                title={t("Sobre", "About", "Acerca de")}
                subtitle={t(
                  "Escolha quem pode ver sua biografia e informações pessoais",
                  "Choose who can see your biography and personal information",
                  "Elige quién puede ver tu biografía e información personal",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeSobre}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeSobre",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Sobre",
                      "About tab visibility",
                      "Visibilidad de la pestaña Acerca de",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("diário", "visibilidade") ? (
              <SettingsRow
                icon="pen"
                title={t("Diário", "Journal", "Diario")}
                subtitle={t(
                  "Escolha quem pode ver anotações, avaliações e leituras do Diário",
                  "Choose who can see Journal notes, ratings and reading entries",
                  "Elige quién puede ver las anotaciones, valoraciones y lecturas del Diario",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeDiario}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeDiario",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Diário",
                      "Journal tab visibility",
                      "Visibilidad de la pestaña Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("comunidade", "publicações", "visibilidade") ? (
              <SettingsRow
                icon="comment"
                title={t("Comunidade", "Community", "Comunidad")}
                subtitle={t(
                  "Escolha quem pode ver suas publicações e interações da Comunidade",
                  "Choose who can see your Community posts and interactions",
                  "Elige quién puede ver tus publicaciones e interacciones de la Comunidad",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeComunidade}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeComunidade",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Comunidade",
                      "Community tab visibility",
                      "Visibilidad de la pestaña Comunidad",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("biblioteca", "listas", "visibilidade") ? (
              <SettingsRow
                icon="bookmark"
                title={t("Biblioteca", "Library", "Biblioteca")}
                subtitle={t(
                  "Escolha quem pode ver suas listas, favoritas e obras concluídas",
                  "Choose who can see your lists, favorites and completed works",
                  "Elige quién puede ver tus listas, favoritas y obras completadas",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeBiblioteca}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeBiblioteca",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Biblioteca",
                      "Library tab visibility",
                      "Visibilidad de la pestaña Biblioteca",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("atividades", "leitura", "visibilidade") ? (
              <SettingsRow
                icon="clock"
                title={t("Atividades", "Activity", "Actividad")}
                subtitle={t(
                  "Escolha quem pode ver seu progresso e suas atividades de leitura",
                  "Choose who can see your reading progress and activity",
                  "Elige quién puede ver tu progreso y actividad de lectura",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeAtividades}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeAtividades",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade das atividades",
                      "Activity visibility",
                      "Visibilidad de la actividad",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "diário",
          "comentários",
          "seguidores",
        ) ? (
          <SettingsSection
            title={t(
              "Opções do Diário",
              "Journal options",
              "Opciones del Diario",
            )}
          >
            {deveMostrar("comentários", "seguidores", "diário") ? (
              <SettingsRow
                icon="comment"
                title={t(
                  "Quem pode comentar no Diário",
                  "Who can comment on the Journal",
                  "Quién puede comentar en el Diario",
                )}
                right={
                  <select
                    value={privacidade.quemPodeComentarDiario}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "quemPodeComentarDiario",
                        event.target.value as
                          PreferenciasPrivacidadeHistorietas["quemPodeComentarDiario"],
                      )
                    }
                    aria-label={t(
                      "Quem pode comentar no Diário",
                      "Who can comment on the Journal",
                      "Quién puede comentar en el Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="todos">
                      {t("Todos", "Everyone", "Todos")}
                    </option>
                    <option value="seguidores">
                      {t(
                        "Apenas seguidores",
                        "Followers only",
                        "Solo seguidores",
                      )}
                    </option>
                    <option value="ninguem">
                      {t("Ninguém", "No one", "Nadie")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {adminLiberado &&
        deveMostrar("moderação", "admin", "comunidade") ? (
          <SettingsSection
            title={t("Moderação", "Moderation", "Moderación")}
          >
            <SettingsRow
              icon="admin"
              title={t(
                "Área de moderação",
                "Moderation area",
                "Área de moderación",
              )}
              subtitle={t(
                "Revisar denúncias e conteúdos enviados",
                "Review reports and submitted content",
                "Revisar denuncias y contenidos enviados",
              )}
              href="/admin/comunidade"
            />
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "historietas",
          "obras",
          "biblioteca",
          "notificações",
          "comunidade",
          "top 5",
          "diário",
        ) ? (
          <SettingsSection
            title={t(
              "Como você usa o Historietas",
              "How you use Historietas",
              "Cómo usas Historietas",
            )}
          >
            {deveMostrar("obras", "criadas") ? (
              <SettingsRow
                icon="book"
                title={t(
                  "Obras criadas",
                  "Created works",
                  "Obras creadas",
                )}
                subtitle={t(
                  "Total de obras criadas na sua conta",
                  "Total works created on your account",
                  "Total de obras creadas en tu cuenta",
                )}
                right={<ValorLinha>{resumo.obras}</ValorLinha>}
                href="/perfil-autor?aba=obras"
              />
            ) : null}

            {deveMostrar(
              "biblioteca",
              "lista",
              "favoritas",
              "concluidas",
            ) ? (
              <SettingsRow
                icon="bookmark"
                title={t("Biblioteca", "Library", "Biblioteca")}
                subtitle={t(
                  "Favoritas, concluídas e obras seguidas",
                  "Favorites, completed and followed works",
                  "Favoritas, completadas y obras seguidas",
                )}
                right={<ValorLinha>{totalBiblioteca}</ValorLinha>}
                href="/perfil-autor?aba=biblioteca"
              />
            ) : null}

            {deveMostrar("notificações", "avisos") ? (
              <SettingsRow
                icon="bell"
                title={t(
                  "Notificações",
                  "Notifications",
                  "Notificaciones",
                )}
                subtitle={t(
                  "Mensagens, avisos e atividade recente",
                  "Messages, alerts and recent activity",
                  "Mensajes, avisos y actividad reciente",
                )}
                right={<ValorLinha>{notificacoesNaoLidas}</ValorLinha>}
                href="/notificacoes"
              />
            ) : null}

            {deveMostrar("comunidade", "autor") ? (
              <SettingsRow
                icon="comment"
                title={t(
                  "Comunidade do autor",
                  "Author community",
                  "Comunidad del autor",
                )}
                subtitle={t(
                  "Interações e publicações da comunidade",
                  "Community interactions and posts",
                  "Interacciones y publicaciones de la comunidad",
                )}
                href="/perfil-autor?aba=comunidade"
              />
            ) : null}

            {deveMostrar("top 5", "favoritas") ? (
              <SettingsRow
                icon="trophy"
                title="TOP 5"
                subtitle={t(
                  "Escolha suas cinco obras favoritas",
                  "Choose your five favorite works",
                  "Elige tus cinco obras favoritas",
                )}
                href="/perfil-autor/top-5"
              />
            ) : null}

            {deveMostrar("histórico", "leitura", "diário") ? (
              <SettingsRow
                icon="clock"
                title={t(
                  "Histórico de leitura",
                  "Reading history",
                  "Historial de lectura",
                )}
                subtitle={t(
                  "Diário, leituras recentes e avaliações",
                  "Journal, recent reads and ratings",
                  "Diario, lecturas recientes y valoraciones",
                )}
                href="/perfil-autor?aba=diario"
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "preferências",
          "tema",
          "aparência",
          "avisos",
          "idioma",
          "língua",
        ) ? (
          <SettingsSection
            title={t("Preferências", "Preferences", "Preferencias")}
          >
            {deveMostrar("idioma", "língua") ? (
              <SettingsRow
                icon="layers"
                title={t(
                  "Idioma do site",
                  "Site language",
                  "Idioma del sitio",
                )}
                right={
                  <LanguageSelect
                    showLabel={false}
                    style={{
                      width: "clamp(120px, 34vw, 128px)",
                      maxWidth: "100%",
                      transform: "translateX(22px)",
                    }}
                    selectStyle={{
                      width: "100%",
                      minHeight: 38,
                      padding: "7px 8px",
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("tema", "visual", "aparência") ? (
              <>
                <SettingsRow
                  icon="palette"
                  title={t(
                    "Tema visual",
                    "Visual theme",
                    "Tema visual",
                  )}
                  right={<ValorLinha>{temaAtual.nome}</ValorLinha>}
                  onClick={() => setMostrarTemas((atual) => !atual)}
                />

                {mostrarTemas ? (
                  <div style={themeListStyle}>
                    {ORDEM_TEMAS_VISUAIS.map((temaVisual) => {
                      const tema = obterTemaVisualTraduzido(
                        temaVisual,
                        language,
                      );
                      const ativo =
                        preferencias.temaVisual === temaVisual;

                      return (
                        <button
                          key={temaVisual}
                          type="button"
                          onClick={() =>
                            atualizarTemaVisual(temaVisual)
                          }
                          style={
                            ativo
                              ? themeOptionActiveStyle
                              : themeOptionStyle
                          }
                          aria-pressed={ativo}
                        >
                          <span
                            className="configuracoes-theme-swatch"
                            data-tema-visual-opcao={temaVisual}
                            style={{
                              ...themeSwatchStyle,
                              background: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
                            }}
                          />

                          <span style={themeTextStyle}>
                            <strong style={themeNameStyle}>
                              {tema.nome}
                            </strong>
                            <span style={themeDescriptionStyle}>
                              {tema.descricao}
                            </span>
                          </span>

                          <span
                            style={
                              ativo
                                ? themeCheckActiveStyle
                                : themeCheckStyle
                            }
                          >
                            {ativo ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : null}

            {deveMostrar("receber", "avisos") ? (
              <SettingsRow
                icon="bell"
                title={t(
                  "Receber avisos",
                  "Receive alerts",
                  "Recibir avisos",
                )}
                subtitle={t(
                  "Ativa alertas importantes do site",
                  "Enables important site alerts",
                  "Activa avisos importantes del sitio",
                )}
                right={
                  <Toggle
                    checked={preferencias.receberAvisos}
                    onChange={alternarReceberAvisos}
                    ariaLabel={t(
                      "Ativar ou desativar avisos",
                      "Enable or disable alerts",
                      "Activar o desactivar avisos",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

          </SettingsSection>
        ) : null}

        {deveMostrar(
          "dados",
          "backup",
          "copiar",
          "baixar",
          "download",
        ) ? (
          <SettingsSection
            title={t(
              "Dados e arquivos",
              "Data and files",
              "Datos y archivos",
            )}
          >
            {deveMostrar("copiar", "dados") ? (
              <SettingsRow
                icon="copy"
                title={t("Copiar dados", "Copy data", "Copiar datos")}
                subtitle={t(
                  "Copia um backup em texto para a área de transferência",
                  "Copies a text backup to the clipboard",
                  "Copia una copia de seguridad en texto al portapapeles",
                )}
                onClick={copiarBackup}
              />
            ) : null}

            {deveMostrar("baixar", "backup", "download") ? (
              <SettingsRow
                icon="download"
                title={t(
                  "Baixar backup",
                  "Download backup",
                  "Descargar copia",
                )}
                subtitle={t(
                  "Salva um arquivo JSON com seus dados locais",
                  "Saves a JSON file with your local data",
                  "Guarda un archivo JSON con tus datos locales",
                )}
                onClick={baixarBackup}
              />
            ) : null}

            {deveMostrar("resumo", "dados") ? (
              <SettingsRow
                icon="database"
                title={t(
                  "Resumo da conta",
                  "Account summary",
                  "Resumen de la cuenta",
                )}
                subtitle={t(
                  `${resumo.obras} obras, ${resumo.favoritas} na lista, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } seguindo`,
                  `${resumo.obras} works, ${resumo.favoritas} in the list, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } following`,
                  `${resumo.obras} obras, ${resumo.favoritas} en la lista, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } siguiendo`,
                )}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "suporte",
          "ajuda",
          "termos",
          "políticas",
          "sobre",
        ) ? (
          <SettingsSection
            title={t(
              "Suporte e sobre",
              "Support and about",
              "Soporte y acerca de",
            )}
          >
            {deveMostrar("ajuda", "suporte") ? (
              <SettingsRow
                icon="help"
                title={t(
                  "Central de ajuda",
                  "Help center",
                  "Centro de ayuda",
                )}
                subtitle={t(
                  "Dúvidas, problemas e orientação",
                  "Questions, problems and guidance",
                  "Dudas, problemas y orientación",
                )}
                href="/ajuda"
              />
            ) : null}

            {deveMostrar("termos", "políticas", "privacidade") ? (
              <SettingsRow
                icon="file"
                title={t(
                  "Termos e políticas",
                  "Terms and policies",
                  "Términos y políticas",
                )}
                subtitle={t(
                  "Privacidade, uso da plataforma e regras",
                  "Privacy, platform use and rules",
                  "Privacidad, uso de la plataforma y reglas",
                )}
                href="/termos"
              />
            ) : null}

            {deveMostrar("sobre", "versão") ? (
              <SettingsRow
                icon="settings"
                title={t(
                  "Sobre o Historietas",
                  "About Historietas",
                  "Acerca de Historietas",
                )}
                subtitle={t(
                  "Versão local de desenvolvimento",
                  "Local development version",
                  "Versión local de desarrollo",
                )}
                right={<ValorLinha>Beta</ValorLinha>}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("sair", "conta", "login") ? (
          <section style={sectionStyle}>
            <div style={listCardTransparentStyle}>
              <SettingsRow
                icon="logout"
                title={t(
                  "Sair da conta",
                  "Sign out",
                  "Cerrar sesión",
                )}
                subtitle={t(
                  "Encerrar sessão neste dispositivo",
                  "End the session on this device",
                  "Cerrar la sesión en este dispositivo",
                )}
                onClick={sairDaConta}
                danger
              />
            </div>
          </section>
        ) : null}
      </section>

      {mostrarSeguranca ? (
        <div
          role="presentation"
          style={securityOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharSeguranca();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-seguranca-configuracoes"
            style={securityModalStyle}
          >
            <header style={securityModalHeaderStyle}>
              <span style={securityModalIconStyle}>
                <SvgIcon name="lock" size={24} strokeWidth={2.2} />
              </span>

              <div style={securityModalHeadingStyle}>
                <h2
                  id="titulo-seguranca-configuracoes"
                  style={securityModalTitleStyle}
                >
                  {t(
                    "Alterar senha",
                    "Change password",
                    "Cambiar contraseña",
                  )}
                </h2>
                <p style={securityModalSubtitleStyle}>
                  {t(
                    "Confirme sua senha atual e escolha uma nova senha.",
                    "Confirm your current password and choose a new one.",
                    "Confirma tu contraseña actual y elige una nueva.",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharSeguranca}
                disabled={salvandoSenha}
                aria-label={t("Fechar", "Close", "Cerrar")}
                style={
                  salvandoSenha
                    ? securityCloseButtonDisabledStyle
                    : securityCloseButtonStyle
                }
              >
                ×
              </button>
            </header>

            {senhaAlterada ? (
              <div role="status" aria-live="polite" style={securitySuccessStyle}>
                <SvgIcon name="check" size={25} strokeWidth={2.4} />
                <div style={securityFeedbackTextStyle}>
                  <strong>
                    {t(
                      "Senha alterada com sucesso",
                      "Password changed successfully",
                      "Contraseña cambiada correctamente",
                    )}
                  </strong>
                  <span>
                    {t(
                      "A nova senha já está ativa na sua conta.",
                      "The new password is now active on your account.",
                      "La nueva contraseña ya está activa en tu cuenta.",
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={alterarSenha} style={securityFormStyle}>
                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t(
                      "Senha atual",
                      "Current password",
                      "Contraseña actual",
                    )}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={senhaAtual}
                    onChange={(event) => {
                      setSenhaAtual(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="current-password"
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t("Nova senha", "New password", "Nueva contraseña")}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={novaSenha}
                    onChange={(event) => {
                      setNovaSenha(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t(
                      "Confirmar nova senha",
                      "Confirm new password",
                      "Confirmar nueva contraseña",
                    )}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={confirmarNovaSenha}
                    onChange={(event) => {
                      setConfirmarNovaSenha(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <p style={securityHintStyle}>
                  {t(
                    "Use no mínimo 8 caracteres, incluindo uma letra e um número.",
                    "Use at least 8 characters, including a letter and a number.",
                    "Usa al menos 8 caracteres, incluyendo una letra y un número.",
                  )}
                </p>

                {erroSenha ? (
                  <div role="alert" aria-live="assertive" style={securityErrorStyle}>
                    {erroSenha}
                  </div>
                ) : null}

                <div style={securityActionsStyle}>
                  <button
                    type="button"
                    onClick={fecharSeguranca}
                    disabled={salvandoSenha}
                    style={
                      salvandoSenha
                        ? securitySecondaryButtonDisabledStyle
                        : securitySecondaryButtonStyle
                    }
                  >
                    {t("Cancelar", "Cancel", "Cancelar")}
                  </button>

                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    style={
                      salvandoSenha
                        ? securityPrimaryButtonDisabledStyle
                        : securityPrimaryButtonStyle
                    }
                  >
                    {salvandoSenha ? (
                      <>
                        <LoadingSpinner
                          compacto
                          label={t(
                            "Alterando senha",
                            "Changing password",
                            "Cambiando contraseña",
                          )}
                        />
                        <span>
                          {t(
                            "Alterando...",
                            "Changing...",
                            "Cambiando...",
                          )}
                        </span>
                      </>
                    ) : (
                      t(
                        "Alterar senha",
                        "Change password",
                        "Cambiar contraseña",
                      )
                    )}
                  </button>
                </div>
              </form>
            )}

            {senhaAlterada ? (
              <button
                type="button"
                onClick={fecharSeguranca}
                style={securityDoneButtonStyle}
              >
                {t("Concluído", "Done", "Listo")}
              </button>
            ) : null}
          </section>
        </div>
      ) : null}

      {mensagemAcao ? (
        <div
          role={mensagemAcao.tipo === "erro" ? "alert" : "status"}
          aria-live={mensagemAcao.tipo === "erro" ? "assertive" : "polite"}
          aria-atomic="true"
          style={
            mensagemAcao.tipo === "sucesso"
              ? actionToastSuccessStyle
              : mensagemAcao.tipo === "aviso"
                ? actionToastWarningStyle
                : actionToastErrorStyle
          }
        >
          <span style={actionToastIconStyle}>
            <SvgIcon
              name={
                mensagemAcao.tipo === "sucesso"
                  ? "check"
                  : mensagemAcao.tipo === "aviso"
                    ? "shield"
                    : "file"
              }
              size={23}
              strokeWidth={2.25}
            />
          </span>

          <span style={actionToastTextBoxStyle}>
            <strong style={actionToastTitleStyle}>
              {mensagemAcao.tipo === "sucesso"
                ? t("Sucesso", "Success", "Éxito")
                : mensagemAcao.tipo === "aviso"
                  ? t("Atenção", "Attention", "Atención")
                  : t("Não foi possível", "Something went wrong", "No fue posible")}
            </strong>
            <span style={actionToastMessageStyle}>{mensagemAcao.texto}</span>
          </span>

          <button
            type="button"
            onClick={() => setMensagemAcao(null)}
            aria-label={t("Fechar mensagem", "Close message", "Cerrar mensaje")}
            style={actionToastCloseStyle}
          >
            ×
          </button>
        </div>
      ) : null}
    </main>
  );
}

const configuracoesPageCss = `
  html {
    --configuracoes-page-bg: #050509;
    --configuracoes-danger-text: #FCA5A5;
  }

  html[data-historietas-tema-visual="foco"] {
    --configuracoes-page-bg: #000000;
    --configuracoes-control-bg: #000000;
    --configuracoes-card-bg: #000000;
    --configuracoes-border: rgba(255,255,255,0.18);
    --configuracoes-text-secondary: #A1A1AA;
    --configuracoes-theme-active-bg: #000000;
    --configuracoes-theme-active-shadow: inset 0 0 0 1px #FFFFFF;
    --configuracoes-toggle-knob-bg: #000000;
    --configuracoes-danger-text: #FFFFFF;
    --historietas-accent: #FFFFFF;
    --historietas-secondary: #A1A1AA;
    --historietas-secondary-button-text: #FFFFFF;
    --historietas-input-text: #FFFFFF;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.56) !important;
  }

  html[data-historietas-tema-visual="foco"] input::placeholder,
  html[data-historietas-tema-visual="foco"] textarea::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: var(--historietas-input-text, #FFFFFF) !important;
  }


  html[data-historietas-tema-visual="foco"] .configuracoes-theme-swatch {
    background: linear-gradient(135deg, #D4D4D8 0%, #A1A1AA 100%) !important;
    border-color: rgba(255,255,255,0.22) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] .configuracoes-theme-swatch[data-tema-visual-opcao="foco"] {
    background: linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%) !important;
  }

  html[data-historietas-tema-visual="foco"] button,
  html[data-historietas-tema-visual="foco"] a,
  html[data-historietas-tema-visual="foco"] input {
    box-shadow: none;
  }

  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }

  .configuracoes-input {
    appearance: none;
  }

  .configuracoes-input::-webkit-search-cancel-button {
    appearance: none;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--configuracoes-page-bg, #050509)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const loadingPageStyle: CSSProperties = {
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const loadingInlineStyle: CSSProperties = {
  width: "24px",
  height: "24px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

const loadingSpinnerCompactStyle: CSSProperties = {
  ...loadingSpinnerStyle,
  width: "22px",
  height: "22px",
  borderWidth: "2.5px",
};

const containerStyle: CSSProperties = {
  width: "min(760px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 120px",
  boxSizing: "border-box",
  minWidth: 0,
};

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px",
};

const backButtonStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  border: "0",
  borderRadius: "999px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(20px, 5.2vw, 25px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const searchBoxStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "15px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.11))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.05))",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.55))",
  display: "grid",
  gridTemplateColumns: "23px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "0 15px",
  marginBottom: "18px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "46px",
  border: "0",
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 650,
  fontFamily: "inherit",
  minWidth: 0,
};

const profileCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
  borderRadius: "20px",
  background: "var(--configuracoes-card-bg, rgba(255,255,255,0.09))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.06))",
  marginBottom: "18px",
};

const avatarStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  background:
    "linear-gradient(135deg, rgba(148,163,184,0.90), rgba(75,85,99,0.95))",
  fontSize: "21px",
  fontWeight: 760,
  letterSpacing: "-0.035em",
  flex: "0 0 auto",
};

const profileTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const profileNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.08,
  fontWeight: 780,
  letterSpacing: "-0.025em",
  ...safeTextStyle,
};

const profileUsernameStyle: CSSProperties = {
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 760,
  ...safeTextStyle,
};

const profileEmailStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "13px",
  lineHeight: 1.18,
  fontWeight: 520,
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 760,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

const listCardStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "18px",
  background: "var(--configuracoes-card-bg, rgba(255,255,255,0.09))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.045))",
};

const listCardTransparentStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "20px",
  background: "transparent",
};

const rowBaseStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) auto 22px",
  alignItems: "center",
  gap: "9px",
  padding: "8px 12px",
  boxSizing: "border-box",
  border: "0",
  borderBottom: "1px solid var(--configuracoes-border, rgba(255,255,255,0.065))",
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
};

const rowButtonStyle: CSSProperties = {
  ...rowBaseStyle,
};

const rowLinkStyle: CSSProperties = {
  ...rowBaseStyle,
};

const rowStaticStyle: CSSProperties = {
  ...rowBaseStyle,
  cursor: "default",
};

const rowIconStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.78))",
  flex: "0 0 auto",
};

const rowTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const rowTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  lineHeight: 1.1,
  fontWeight: 760,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const rowTitleDangerStyle: CSSProperties = {
  ...rowTitleStyle,
  color: "var(--configuracoes-danger-text, #FCA5A5)",
};

const rowSubtitleStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "12px",
  lineHeight: 1.22,
  fontWeight: 520,
  ...safeTextStyle,
};

const rowRightStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: 0,
};

const rowValueStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.56))",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 650,
  whiteSpace: "nowrap",
};

const rowValueDangerStyle: CSSProperties = {
  ...rowValueStyle,
  color: "var(--configuracoes-danger-text, #FCA5A5)",
};

const rowChevronStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.46))",
};

const inputRowStyle: CSSProperties = {
  width: "100%",
  minHeight: "76px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  boxSizing: "border-box",
  borderBottom: "1px solid var(--configuracoes-border, rgba(255,255,255,0.065))",
};

const inputTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const inputLabelStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.60))",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 880,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "0",
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.2,
  fontWeight: 760,
  fontFamily: "inherit",
  padding: 0,
  minWidth: 0,
};

const inputHelperStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.46))",
  fontSize: "12px",
  lineHeight: 1.25,
  fontWeight: 620,
  ...safeTextStyle,
};

const inputErrorStyle: CSSProperties = {
  ...inputHelperStyle,
  color: "var(--configuracoes-danger-text, #FCA5A5)",
};

const actionToastBaseStyle: CSSProperties = {
  position: "fixed",
  right: "16px",
  bottom: "16px",
  zIndex: 1400,
  width: "min(390px, calc(100vw - 32px))",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 32px",
  alignItems: "start",
  gap: "10px",
  padding: "13px",
  borderRadius: "16px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.52)",
  backdropFilter: "blur(14px)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const actionToastSuccessStyle: CSSProperties = {
  ...actionToastBaseStyle,
  background: "rgba(20,83,45,0.94)",
  border: "1px solid rgba(74,222,128,0.36)",
  color: "#DCFCE7",
};

const actionToastWarningStyle: CSSProperties = {
  ...actionToastBaseStyle,
  background: "rgba(113,63,18,0.95)",
  border: "1px solid rgba(251,191,36,0.40)",
  color: "#FEF3C7",
};

const actionToastErrorStyle: CSSProperties = {
  ...actionToastBaseStyle,
  background: "rgba(127,29,29,0.95)",
  border: "1px solid rgba(248,113,113,0.40)",
  color: "#FEE2E2",
};

const actionToastIconStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.12)",
  color: "inherit",
};

const actionToastTextBoxStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "4px",
  paddingTop: "1px",
};

const actionToastTitleStyle: CSSProperties = {
  color: "inherit",
  fontSize: "13px",
  lineHeight: 1.1,
  fontWeight: 900,
};

const actionToastMessageStyle: CSSProperties = {
  color: "inherit",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 650,
  opacity: 0.94,
  ...safeTextStyle,
};

const actionToastCloseStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  border: 0,
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "22px",
  lineHeight: 1,
  cursor: "pointer",
};

const securityOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box",
  background: "rgba(0,0,0,0.74)",
  backdropFilter: "blur(8px)",
};

const securityModalStyle: CSSProperties = {
  width: "min(440px, 100%)",
  maxHeight: "calc(100dvh - 40px)",
  overflowY: "auto",
  borderRadius: "22px",
  padding: "20px",
  boxSizing: "border-box",
  background:
    "var(--configuracoes-card-bg, linear-gradient(180deg, #18131F 0%, #0B090E 100%))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.14))",
  boxShadow: "0 28px 90px rgba(0,0,0,0.62)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const securityModalHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) 36px",
  alignItems: "start",
  gap: "11px",
};

const securityModalIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const securityModalHeadingStyle: CSSProperties = {
  minWidth: 0,
};

const securityModalTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.035em",
};

const securityModalSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.58))",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 560,
  ...safeTextStyle,
};

const securityCloseButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  border: "0",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  fontSize: "25px",
  lineHeight: 1,
  cursor: "pointer",
};

const securityCloseButtonDisabledStyle: CSSProperties = {
  ...securityCloseButtonStyle,
  cursor: "not-allowed",
  opacity: 0.45,
};

const securityFormStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  marginTop: "22px",
};

const securityFieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const securityFieldLabelStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.70))",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
};

const securityPasswordInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  boxSizing: "border-box",
  borderRadius: "13px",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.14))",
  outline: "none",
  padding: "10px 13px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.075))",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontFamily: "inherit",
  fontSize: "16px",
  lineHeight: 1.2,
  fontWeight: 680,
};

const securityHintStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.50))",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 570,
  ...safeTextStyle,
};

const securityErrorStyle: CSSProperties = {
  padding: "11px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(248,113,113,0.32)",
  background: "rgba(127,29,29,0.20)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 700,
  ...safeTextStyle,
};

const securitySuccessStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "start",
  marginTop: "22px",
  padding: "15px",
  borderRadius: "15px",
  border: "1px solid rgba(74,222,128,0.30)",
  background: "rgba(20,83,45,0.22)",
  color: "#BBF7D0",
};

const securityFeedbackTextStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  color: "inherit",
  fontSize: "13px",
  lineHeight: 1.35,
  ...safeTextStyle,
};

const securityActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)",
  gap: "10px",
  marginTop: "4px",
};

const securityButtonBaseStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "13px",
  padding: "10px 14px",
  border: "0",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 850,
  cursor: "pointer",
};

const securitySecondaryButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.12))",
};

const securityPrimaryButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "var(--historietas-accent, #F97316)",
  color: "var(--historietas-secondary-button-text, #FFFFFF)",
};

const securitySecondaryButtonDisabledStyle: CSSProperties = {
  ...securitySecondaryButtonStyle,
  cursor: "not-allowed",
  opacity: 0.48,
};

const securityPrimaryButtonDisabledStyle: CSSProperties = {
  ...securityPrimaryButtonStyle,
  cursor: "not-allowed",
  opacity: 0.64,
};

const securityDoneButtonStyle: CSSProperties = {
  ...securityPrimaryButtonStyle,
  width: "100%",
  marginTop: "15px",
};

const toggleBaseStyle: CSSProperties = {
  width: "52px",
  height: "31px",
  borderRadius: "999px",
  border: "0",
  padding: "3px",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "background 160ms ease",
};

const toggleOnStyle: CSSProperties = {
  ...toggleBaseStyle,
  justifyContent: "flex-end",
  background: "var(--historietas-accent, #F97316)",
};

const toggleOffStyle: CSSProperties = {
  ...toggleBaseStyle,
  justifyContent: "flex-start",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.18))",
};

const toggleKnobBaseStyle: CSSProperties = {
  width: "25px",
  height: "25px",
  borderRadius: "999px",
  background: "var(--configuracoes-toggle-knob-bg, #FFFFFF)",
  boxShadow: "0 4px 10px rgba(0,0,0,0.28)",
};

const toggleKnobOnStyle: CSSProperties = {
  ...toggleKnobBaseStyle,
};

const privacySelectStyle: CSSProperties = {
  width: "clamp(120px, 34vw, 128px)",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: 38,
  padding: "7px 20px 7px 8px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  transform: "translateX(22px)",
};

const toggleKnobOffStyle: CSSProperties = {
  ...toggleKnobBaseStyle,
};

const themeListStyle: CSSProperties = {
  padding: "6px 0",
  borderTop: "1px solid var(--configuracoes-border, rgba(255,255,255,0.065))",
};

const themeOptionStyle: CSSProperties = {
  width: "100%",
  minHeight: "62px",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 28px",
  alignItems: "center",
  gap: "12px",
  padding: "10px 14px",
  border: "0",
  borderBottom: "1px solid var(--configuracoes-border, rgba(255,255,255,0.055))",
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

const themeOptionActiveStyle: CSSProperties = {
  ...themeOptionStyle,
  background: "var(--configuracoes-theme-active-bg, rgba(255,255,255,0.055))",
  boxShadow: "var(--configuracoes-theme-active-shadow, none)",
};

const themeSwatchStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.13)",
};

const themeTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const themeNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  lineHeight: 1.1,
  fontWeight: 850,
};

const themeDescriptionStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 620,
  ...safeTextStyle,
};

const themeCheckStyle: CSSProperties = {
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  flex: "0 0 auto",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 900,
};

const themeCheckActiveStyle: CSSProperties = {
  ...themeCheckStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};