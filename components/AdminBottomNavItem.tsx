"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

export default function AdminBottomNavItem() {
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const pathname = usePathname() || "/";

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

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void verificarAdmin();
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
      className={
        itemAtivo
          ? "historietas-bottom-nav-item historietas-bottom-nav-item-active"
          : "historietas-bottom-nav-item"
      }
      aria-current={itemAtivo ? "page" : undefined}
    >
      <span className="historietas-bottom-nav-icon">M</span>

      <span className="historietas-bottom-nav-label">Moderação</span>
    </Link>
  );
}
