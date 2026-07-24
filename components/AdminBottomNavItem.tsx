"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase/client";
import type { HistorietasLanguage } from "../lib/i18n";
import { useHistorietasLanguage } from "./HistorietasLanguageProvider";

type AppMetadataAdmin = {
  role?: unknown;
  cargo?: unknown;
  tipo_usuario?: unknown;
  admin?: unknown;
  is_admin?: unknown;
  moderator?: unknown;
  roles?: unknown;
};

type UsuarioAdminMinimo = {
  app_metadata?: unknown;
};

type TextosAdminBottomNav = {
  ariaLabel: string;
  rotulo: string;
};

const PAPEIS_ADMIN = new Set(["admin", "moderador", "moderator"]);

const TEXTOS_ADMIN_BOTTOM_NAV: Record<
  HistorietasLanguage,
  TextosAdminBottomNav
> = {
  "pt-BR": {
    ariaLabel: "Administração",
    rotulo: "ADM",
  },
  en: {
    ariaLabel: "Admin",
    rotulo: "ADMIN",
  },
  es: {
    ariaLabel: "Administración",
    rotulo: "ADM",
  },
};

function valorTextoAdmin(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

function valorBooleanoAdmin(valor: unknown) {
  if (valor === true) {
    return true;
  }

  const texto = valorTextoAdmin(valor);

  return (
    texto === "true" ||
    texto === "1" ||
    texto === "sim" ||
    texto === "yes"
  );
}

function valorEhPapelAdmin(valor: unknown) {
  return PAPEIS_ADMIN.has(valorTextoAdmin(valor));
}

function metadataTemAdmin(appMetadata: AppMetadataAdmin | null | undefined) {
  if (!appMetadata || typeof appMetadata !== "object") {
    return false;
  }

  const roles = Array.isArray(appMetadata.roles) ? appMetadata.roles : [];

  return (
    valorEhPapelAdmin(appMetadata.role) ||
    valorEhPapelAdmin(appMetadata.cargo) ||
    valorEhPapelAdmin(appMetadata.tipo_usuario) ||
    roles.some(valorEhPapelAdmin) ||
    valorBooleanoAdmin(appMetadata.admin) ||
    valorBooleanoAdmin(appMetadata.is_admin) ||
    valorBooleanoAdmin(appMetadata.moderator)
  );
}

export default function AdminBottomNavItem() {
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const pathname = usePathname() || "/";
  const verificacaoAtualRef = useRef(0);
  const verificacaoTimerRef = useRef<number | null>(null);
  const { language } = useHistorietasLanguage();
  const textos = TEXTOS_ADMIN_BOTTOM_NAV[language];

  const itemAtivo =
    pathname === "/admin/comunidade" ||
    pathname.startsWith("/admin/comunidade/");

  useEffect(() => {
    let cancelado = false;

    function invalidarVerificacaoAtual() {
      verificacaoAtualRef.current += 1;
    }

    function limparVerificacaoAgendada() {
      if (verificacaoTimerRef.current !== null) {
        window.clearTimeout(verificacaoTimerRef.current);
        verificacaoTimerRef.current = null;
      }
    }

    async function verificarAdmin(
      usuarioRecebido?: UsuarioAdminMinimo | null,
    ) {
      const verificacaoId = verificacaoAtualRef.current + 1;
      verificacaoAtualRef.current = verificacaoId;

      try {
        let usuario = usuarioRecebido;

        if (usuario === undefined) {
          const { data, error } = await supabase.auth.getUser();

          if (cancelado || verificacaoAtualRef.current !== verificacaoId) {
            return;
          }

          if (error || !data.user) {
            setMostrarAdmin(false);
            return;
          }

          usuario = data.user;
        }

        if (cancelado || verificacaoAtualRef.current !== verificacaoId) {
          return;
        }

        if (!usuario) {
          setMostrarAdmin(false);
          return;
        }

        const adminPeloToken = metadataTemAdmin(
          usuario.app_metadata as AppMetadataAdmin | null | undefined,
        );

        const { data: adminLiberado, error: adminError } = await supabase.rpc(
          "usuario_e_admin",
        );

        if (cancelado || verificacaoAtualRef.current !== verificacaoId) {
          return;
        }

        setMostrarAdmin(adminError ? adminPeloToken : adminLiberado === true);
      } catch {
        if (!cancelado && verificacaoAtualRef.current === verificacaoId) {
          setMostrarAdmin(false);
        }
      }
    }

    function agendarVerificacao(usuario: UsuarioAdminMinimo | null) {
      limparVerificacaoAgendada();

      verificacaoTimerRef.current = window.setTimeout(() => {
        verificacaoTimerRef.current = null;

        if (!cancelado) {
          void verificarAdmin(usuario);
        }
      }, 0);
    }

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      invalidarVerificacaoAtual();
      limparVerificacaoAgendada();
      setMostrarAdmin(false);

      if (event !== "SIGNED_OUT" && session?.user) {
        agendarVerificacao(session.user);
      }
    });

    return () => {
      cancelado = true;
      invalidarVerificacaoAtual();
      limparVerificacaoAgendada();
      subscription.unsubscribe();
    };
  }, []);

  if (!mostrarAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin/comunidade"
      className={
        itemAtivo
          ? "historietas-bottom-nav-item historietas-bottom-nav-item-active"
          : "historietas-bottom-nav-item"
      }
      aria-label={textos.ariaLabel}
      aria-current={itemAtivo ? "page" : undefined}
      data-admin-bottom-nav="true"
    >
      <span className="historietas-bottom-nav-icon" aria-hidden="true">
        M
      </span>

      <span className="historietas-bottom-nav-label">{textos.rotulo}</span>
    </Link>
  );
}