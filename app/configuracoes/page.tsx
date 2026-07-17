"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
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

type TemaVisual = TemaVisualHistorietas;

type PreferenciasConta = {
  nomeExibicao: string;
  username: string;
  emailContato: string;
  receberAvisos: boolean;
  leituraConfortavel: boolean;
  reduzirEfeitos: boolean;
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
const CHAVES_RESUMO = [
  "historietas-obras",
  "historietas-notificacoes",
  "historietas-lancamentos-salvos",
  "historietas-obras-favoritas",
  "historietas-obras-concluidas",
  "historietas-obras-seguidas",
  "historietas-autores-seguidos",
  "historietas-perfis-autores",
  THEME_STORAGE_KEY,
];

const preferenciasPadrao: PreferenciasConta = {
  nomeExibicao: "",
  username: "",
  emailContato: "",
  receberAvisos: true,
  leituraConfortavel: true,
  reduzirEfeitos: false,
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
      leituraConfortavel:
        typeof preferencias.leituraConfortavel === "boolean"
          ? preferencias.leituraConfortavel
          : true,
      reduzirEfeitos:
        typeof preferencias.reduzirEfeitos === "boolean"
          ? preferencias.reduzirEfeitos
          : false,
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
  salvarJsonStorageUsuarioConfiguracoes(CONFIG_STORAGE_KEY, userId, preferencias);
  salvarTemaVisualSalvo(preferencias.temaVisual, userId);
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

function traduzirErroUsernameConfiguracoes(mensagem: string) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("profiles_username_unique") ||
    mensagemNormalizada.includes("duplicate") ||
    mensagemNormalizada.includes("unique")
  ) {
    return "Esse @username já está em uso.";
  }

  return "Não consegui salvar esse @username agora.";
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
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [erroUsername, setErroUsername] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrarTemas, setMostrarTemas] = useState(false);
  const [adminLiberado, setAdminLiberado] = useState(false);
  const { pageThemeStyle, setTemaVisual } =
    useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  const usuarioIdLogado = usuario?.id || "";
  const temaAtual = TEMAS_VISUAIS[preferencias.temaVisual];

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

        setUsuario(usuarioCarregado);
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
        setResumo(criarResumoLocal(usuarioCarregado.id));
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

  const buscaNormalizada = busca.trim().toLowerCase();

  function deveMostrar(...termos: string[]) {
    if (!buscaNormalizada) {
      return true;
    }

    return termos.join(" ").toLowerCase().includes(buscaNormalizada);
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

    const userIdSeguro = usuarioIdLogado.trim();
    const usernameLimpo = normalizarUsernameConfiguracoes(preferencias.username);

    if (!idUsuarioSupabaseValido(userIdSeguro)) {
      router.replace(criarLoginHrefConfiguracoes());
      return;
    }

    if (preferencias.username.trim() && usernameLimpo.length < 3) {
      setErroUsername("Use pelo menos 3 caracteres no @username.");
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

      const resultadoPerfil = await salvarPerfilConfiguracoesSupabase({
        userId: userIdSeguro,
        nome:
          preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
        username: usernameLimpo,
      });

      if (!resultadoPerfil.ok) {
        setErroUsername(
          traduzirErroUsernameConfiguracoes(resultadoPerfil.erro),
        );
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
        console.warn(
          "O perfil foi salvo, mas os metadados da autenticação não sincronizaram:",
          erroMetadata.message,
        );
      }

      salvarPreferencias(preferenciasNormalizadas, userIdSeguro);
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
      setResumo(criarResumoLocal(userIdSeguro));
    } catch (error) {
      console.warn("Não consegui salvar as configurações da conta:", error);
      setErroUsername("Não consegui salvar suas alterações agora.");
    } finally {
      setSalvando(false);
    }
  }

  async function copiarBackup() {
    try {
      await copiarTexto(criarBackupLocal(usuarioIdLogado));
    } catch {
      // A ação de copiar não mostra bloco visual na página.
    }
  }

  function baixarBackup() {
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
      URL.revokeObjectURL(url);

    } catch {
      // A ação de baixar backup não mostra bloco visual na página.
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
            aria-label="Voltar"
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.4} />
          </button>

          <h1 style={pageTitleStyle}>Configurações e atividade</h1>
        </header>

        <label style={searchBoxStyle} htmlFor="buscar-configuracoes">
          <SvgIcon name="search" size={23} strokeWidth={2.3} />
          <input
            id="buscar-configuracoes"
            className="configuracoes-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar"
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
              {preferencias.nomeExibicao || usuario?.nome || "Conta Historietas"}
            </strong>
            <span style={profileUsernameStyle}>
              {preferencias.username ? `@${preferencias.username}` : "@username não definido"}
            </span>
            <span style={profileEmailStyle}>
              {preferencias.emailContato || usuario?.email || "E-mail não informado"}
            </span>
          </div>
        </section>


        {deveMostrar("conta", "nome", "username", "usuário", "email", "senha", "privacidade", "salvar") ? (
          <SettingsSection title="Sua conta">
            {deveMostrar("nome", "exibição", "autor") ? (
              <SettingsInput
                icon="user"
                label="Nome de exibição"
                value={preferencias.nomeExibicao}
                onChange={(valor) => atualizarPreferencia("nomeExibicao", valor)}
                placeholder="Ex: Nome do autor"
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
                placeholder="ex: username"
                maxLength={30}
                autoComplete="username"
                helperText={
                  erroUsername ||
                  "Nome pode repetir. @username não pode repetir."
                }
                error={Boolean(erroUsername)}
              />
            ) : null}

            {deveMostrar("email", "contato") ? (
              <SettingsInput
                icon="mail"
                label="E-mail de contato"
                value={preferencias.emailContato}
                onChange={(valor) => atualizarPreferencia("emailContato", valor)}
                placeholder="Ex: seuemail@email.com"
                type="email"
                maxLength={254}
                autoComplete="email"
              />
            ) : null}

            {deveMostrar("salvar", "alterações", "configurações") ? (
              <SettingsRow
                icon="check"
                title={salvando ? "Salvando..." : "Salvar alterações"}
                subtitle="Grava suas preferências nesta conta"
                onClick={salvar}
              />
            ) : null}

            {deveMostrar("privacidade", "conta") ? (
              <SettingsRow
                icon="shield"
                title="Privacidade da conta"
                subtitle="Em breve: público, privado ou seguidores"
                right={<ValorLinha>Em breve</ValorLinha>}
              />
            ) : null}

            {deveMostrar("senha", "segurança") ? (
              <SettingsRow
                icon="lock"
                title="Senha e segurança"
                subtitle="Gerenciada pela sua autenticação"
                right={<ValorLinha>Conta</ValorLinha>}
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {adminLiberado && deveMostrar("moderação", "admin", "comunidade") ? (
          <SettingsSection title="Moderação">
            <SettingsRow
              icon="admin"
              title="Área de moderação"
              subtitle="Revisar denúncias e conteúdos enviados"
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
          <SettingsSection title="Como você usa o Historietas">
            {deveMostrar("obras", "criadas") ? (
              <SettingsRow
                icon="book"
                title="Obras criadas"
                subtitle="Total publicado ou salvo no seu dispositivo"
                right={<ValorLinha>{resumo.obras}</ValorLinha>}
                href="/perfil-autor?aba=obras"
              />
            ) : null}

            {deveMostrar("biblioteca", "lista", "favoritas", "concluidas") ? (
              <SettingsRow
                icon="bookmark"
                title="Biblioteca"
                subtitle="Favoritas, concluídas e obras seguidas"
                right={<ValorLinha>{totalBiblioteca}</ValorLinha>}
                href="/perfil-autor?aba=biblioteca"
              />
            ) : null}

            {deveMostrar("notificações", "avisos") ? (
              <SettingsRow
                icon="bell"
                title="Notificações"
                subtitle="Mensagens, avisos e atividade recente"
                right={<ValorLinha>{notificacoesNaoLidas}</ValorLinha>}
                href="/notificacoes"
              />
            ) : null}

            {deveMostrar("comunidade", "autor") ? (
              <SettingsRow
                icon="comment"
                title="Comunidade do autor"
                subtitle="Interações e publicações da comunidade"
                href="/perfil-autor?aba=comunidade"
              />
            ) : null}

            {deveMostrar("top 5", "favoritas") ? (
              <SettingsRow
                icon="trophy"
                title="TOP 5"
                subtitle="Escolha suas cinco obras favoritas"
                href="/perfil-autor/top-5"
              />
            ) : null}

            {deveMostrar("histórico", "leitura", "diário") ? (
              <SettingsRow
                icon="clock"
                title="Histórico de leitura"
                subtitle="Diário, leituras recentes e avaliações"
                href="/perfil-autor?aba=diario"
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("preferências", "tema", "aparência", "efeitos", "avisos") ? (
          <SettingsSection title="Preferências">
            {deveMostrar("tema", "visual", "aparência") ? (
              <>
                <SettingsRow
                  icon="palette"
                  title="Tema visual"
                  subtitle="Escolha entre o visual original e o modo foco"
                  right={<ValorLinha>{temaAtual.nome}</ValorLinha>}
                  onClick={() => setMostrarTemas((atual) => !atual)}
                />

                {mostrarTemas ? (
                  <div style={themeListStyle}>
                    {ORDEM_TEMAS_VISUAIS.map((temaVisual) => {
                      const tema = TEMAS_VISUAIS[temaVisual];
                      const ativo = preferencias.temaVisual === temaVisual;

                      return (
                        <button
                          key={temaVisual}
                          type="button"
                          onClick={() => atualizarTemaVisual(temaVisual)}
                          style={ativo ? themeOptionActiveStyle : themeOptionStyle}
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
                            <strong style={themeNameStyle}>{tema.nome}</strong>
                            <span style={themeDescriptionStyle}>{tema.descricao}</span>
                          </span>

                          {ativo ? (
                            <span style={themeCheckStyle}>
                              <SvgIcon name="check" size={21} strokeWidth={2.2} />
                            </span>
                          ) : null}
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
                title="Receber avisos"
                subtitle="Ativa alertas importantes do site"
                right={
                  <Toggle
                    checked={preferencias.receberAvisos}
                    onChange={() =>
                      atualizarPreferencia(
                        "receberAvisos",
                        !preferencias.receberAvisos,
                      )
                    }
                    ariaLabel="Ativar ou desativar avisos"
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("leitura", "confortável") ? (
              <SettingsRow
                icon="moon"
                title="Leitura confortável"
                subtitle="Reduz contraste e deixa a leitura mais suave"
                right={
                  <Toggle
                    checked={preferencias.leituraConfortavel}
                    onChange={() =>
                      atualizarPreferencia(
                        "leituraConfortavel",
                        !preferencias.leituraConfortavel,
                      )
                    }
                    ariaLabel="Ativar ou desativar leitura confortável"
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("efeitos", "reduzir") ? (
              <SettingsRow
                icon="spark"
                title="Reduzir efeitos"
                subtitle="Diminui brilhos, transições e animações"
                right={
                  <Toggle
                    checked={preferencias.reduzirEfeitos}
                    onChange={() =>
                      atualizarPreferencia("reduzirEfeitos", !preferencias.reduzirEfeitos)
                    }
                    ariaLabel="Ativar ou desativar redução de efeitos"
                  />
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("dados", "backup", "copiar", "baixar", "download") ? (
          <SettingsSection title="Dados e arquivos">
            {deveMostrar("copiar", "dados") ? (
              <SettingsRow
                icon="copy"
                title="Copiar dados"
                subtitle="Copia um backup em texto para a área de transferência"
                onClick={copiarBackup}
              />
            ) : null}

            {deveMostrar("baixar", "backup", "download") ? (
              <SettingsRow
                icon="download"
                title="Baixar backup"
                subtitle="Salva um arquivo JSON com seus dados locais"
                onClick={baixarBackup}
              />
            ) : null}

            {deveMostrar("resumo", "dados") ? (
              <SettingsRow
                icon="database"
                title="Resumo da conta"
                subtitle={`${resumo.obras} obras, ${resumo.favoritas} na lista, ${
                  resumo.seguindoObras + resumo.seguindoAutores
                } seguindo`}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("suporte", "ajuda", "termos", "políticas", "sobre") ? (
          <SettingsSection title="Suporte e sobre">
            {deveMostrar("ajuda", "suporte") ? (
              <SettingsRow
                icon="help"
                title="Central de ajuda"
                subtitle="Dúvidas, problemas e orientação"
                right={<ValorLinha>Em breve</ValorLinha>}
              />
            ) : null}

            {deveMostrar("termos", "políticas", "privacidade") ? (
              <SettingsRow
                icon="file"
                title="Termos e políticas"
                subtitle="Privacidade, uso da plataforma e regras"
                right={<ValorLinha>Em breve</ValorLinha>}
              />
            ) : null}

            {deveMostrar("sobre", "versão") ? (
              <SettingsRow
                icon="settings"
                title="Sobre o Historietas"
                subtitle="Versão local de desenvolvimento"
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
                title="Sair da conta"
                subtitle="Encerrar sessão neste dispositivo"
                onClick={sairDaConta}
                danger
              />
            </div>
          </section>
        ) : null}
      </section>
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
  width: "26px",
  height: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-accent, #F97316)",
};