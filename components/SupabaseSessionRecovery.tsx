"use client";

import { useEffect } from "react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  erroExigeLimpezaSessaoLocal,
  obterNomesCookiesSessaoSupabase,
} from "@/lib/supabase/session-recovery.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";

function listarCookiesDaSessao() {
  if (!supabaseUrl) return [];

  const nomes = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=", 1)[0]?.trim() || "")
    .filter(Boolean);

  return obterNomesCookiesSessaoSupabase(nomes, supabaseUrl);
}

function removerCookiesAuthInvalidos() {
  listarCookiesDaSessao().forEach((nome) => {
    document.cookie = `${nome}=; Path=/; Max-Age=0; SameSite=Lax`;
  });
}

export default function SupabaseSessionRecovery() {
  const router = useRouter();

  useEffect(() => {
    let ativo = true;
    const haviaCookiesDaSessao = listarCookiesDaSessao().length > 0;

    function atualizarRotaAposLimpeza(error: unknown) {
      // Um visitante já anônimo não mudou de sessão. Revalidar uma URL 404
      // nesse caso faria o roteador carregar o mesmo documento de novo.
      if (ativo && (haviaCookiesDaSessao || !isAuthSessionMissingError(error))) {
        router.refresh();
      }
    }

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

        atualizarRotaAposLimpeza(error);
      } catch (error) {
        if (!ativo || !erroExigeLimpezaSessaoLocal(error)) {
          return;
        }

        removerCookiesAuthInvalidos();

        atualizarRotaAposLimpeza(error);
      }
    }

    void validarSessao();

    return () => {
      ativo = false;
    };
  }, [router]);

  return null;
}
