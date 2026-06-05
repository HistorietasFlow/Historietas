"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../lib/supabase/client";

export default function AdminBottomNavItem() {
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const pathname = usePathname();

  const itemAtivo =
    pathname === "/admin/comunidade" ||
    pathname.startsWith("/admin/comunidade/");

  useEffect(() => {
    let cancelado = false;

    async function verificarAdmin() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user || null;

        if (!user) {
          if (!cancelado) {
            setMostrarAdmin(false);
          }

          return;
        }

        const { data, error } = await supabase.rpc("usuario_e_admin");

        if (error) {
          if (!cancelado) {
            setMostrarAdmin(false);
          }

          return;
        }

        if (!cancelado) {
          setMostrarAdmin(data === true);
        }
      } catch {
        if (!cancelado) {
          setMostrarAdmin(false);
        }
      }
    }

    verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      verificarAdmin();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!mostrarAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin/comunidade"
      className="historietas-bottom-nav-item"
      aria-current={itemAtivo ? "page" : undefined}
      style={itemAtivo ? activeBottomNavItemStyle : undefined}
    >
      <span
        className="historietas-bottom-nav-icon"
        style={itemAtivo ? activeBottomNavIconStyle : undefined}
      >
        M
      </span>

      <span
        className="historietas-bottom-nav-label"
        style={itemAtivo ? activeBottomNavLabelStyle : undefined}
      >
        Moderação
      </span>
    </Link>
  );
}

const activeBottomNavItemStyle: CSSProperties = {
  background:
    "var(--historietas-bottom-nav-hover-bg, rgba(124,58,237,0.18))",
  color: "var(--historietas-bottom-nav-hover-text, #FFFFFF)",
};

const activeBottomNavIconStyle: CSSProperties = {
  background:
    "var(--historietas-bottom-nav-main-bg, linear-gradient(135deg, #F97316 0%, #7C3AED 100%))",
  border:
    "1px solid var(--historietas-bottom-nav-main-border, rgba(249,115,22,0.55))",
  color: "#FFFFFF",
};

const activeBottomNavLabelStyle: CSSProperties = {
  color: "var(--historietas-bottom-nav-hover-text, #FFFFFF)",
};