"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  erroExigeLimpezaSessaoLocal,
  obterNomesCookiesSessaoSupabase,
} from "@/lib/supabase/session-recovery.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";

function removerCookiesAuthInvalidos() {
  if (typeof document === "undefined" || !supabaseUrl) {
    return;
  }

  const nomes = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=", 1)[0]?.trim() || "")
    .filter(Boolean);

  obterNomesCookiesSessaoSupabase(nomes, supabaseUrl).forEach((nome) => {
    document.cookie = `${nome}=; Path=/; Max-Age=0; SameSite=Lax`;
  });
}

export default function SupabaseSessionRecovery() {
  const router = useRouter();

  useEffect(() => {
    let ativo = true;

    async function validarSessao() {
      try {
        const { error } = await supabase.auth.getUser();

        if (!ativo || !erroExigeLimpezaSessaoLocal(error)) {
          return;
        }

        removerCookiesAuthInvalidos();

        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // Os cookies já foram removidos. A saída local é apenas a limpeza
          // complementar do estado em memória do cliente Supabase.
        }

        removerCookiesAuthInvalidos();

        if (ativo) {
          router.refresh();
        }
      } catch (error) {
        if (!ativo || !erroExigeLimpezaSessaoLocal(error)) {
          return;
        }

        removerCookiesAuthInvalidos();

        if (ativo) {
          router.refresh();
        }
      }
    }

    void validarSessao();

    return () => {
      ativo = false;
    };
  }, [router]);

  return null;
}
