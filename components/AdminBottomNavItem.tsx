"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase/client";

type AppMetadataAdmin = {
  role?: unknown;
  cargo?: unknown;
  tipo_usuario?: unknown;
  admin?: unknown;
  is_admin?: unknown;
};

function valorTextoAdmin(valor: unknown) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

function valorBooleanoAdmin(valor: unknown) {
  if (valor === true) {
    return true;
  }

  const texto = valorTextoAdmin(valor);

  return texto === "true" || texto === "1" || texto === "sim" || texto === "yes";
}

function metadataTemAdmin(appMetadata: AppMetadataAdmin | null | undefined) {
  if (!appMetadata || typeof appMetadata !== "object") {
    return false;
  }

  const role = valorTextoAdmin(appMetadata.role);
  const cargo = valorTextoAdmin(appMetadata.cargo);
  const tipoUsuario = valorTextoAdmin(appMetadata.tipo_usuario);

  return (
    role === "admin" ||
    role === "moderador" ||
    role === "moderator" ||
    cargo === "admin" ||
    cargo === "moderador" ||
    cargo === "moderator" ||
    tipoUsuario === "admin" ||
    tipoUsuario === "moderador" ||
    tipoUsuario === "moderator" ||
    valorBooleanoAdmin(appMetadata.admin) ||
    valorBooleanoAdmin(appMetadata.is_admin)
  );
}

export default function AdminBottomNavItem() {
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const pathname = usePathname() || "/";
  const verificacaoAtualRef = useRef(0);

  const itemAtivo =
    pathname === "/admin/comunidade" ||
    pathname.startsWith("/admin/comunidade/");

  useEffect(() => {
    let cancelado = false;

    function invalidarVerificacaoAtual() {
      verificacaoAtualRef.current += 1;
    }

    async function verificarAdmin() {
      const verificacaoId = verificacaoAtualRef.current + 1;
      verificacaoAtualRef.current = verificacaoId;

      try {
        const { data, error } = await supabase.auth.getUser();
        const user = data.user || null;

        if (cancelado || verificacaoAtualRef.current !== verificacaoId) {
          return;
        }

        if (error || !user) {
          setMostrarAdmin(false);
          return;
        }

        const adminPeloToken = metadataTemAdmin(
          user.app_metadata as AppMetadataAdmin | null | undefined,
        );

        const { data: adminLiberado, error: adminError } = await supabase.rpc(
          "usuario_e_admin",
        );

        if (cancelado || verificacaoAtualRef.current !== verificacaoId) {
          return;
        }

        setMostrarAdmin(
          adminError ? adminPeloToken : adminLiberado === true,
        );
      } catch {
        if (!cancelado && verificacaoAtualRef.current === verificacaoId) {
          setMostrarAdmin(false);
        }
      }
    }

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      invalidarVerificacaoAtual();
      setMostrarAdmin(false);

      if (event !== "SIGNED_OUT") {
        void verificarAdmin();
      }
    });

    return () => {
      cancelado = true;
      invalidarVerificacaoAtual();
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
      aria-label="Admin"
      aria-current={itemAtivo ? "page" : undefined}
      data-admin-bottom-nav="true"
    >
      <span className="historietas-bottom-nav-icon" aria-hidden="true">
        M
      </span>

      <span className="historietas-bottom-nav-label">ADM</span>
    </Link>
  );
}