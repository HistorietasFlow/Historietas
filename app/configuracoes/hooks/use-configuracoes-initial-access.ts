"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  normalizarUsernameConfiguracoes,
  pegarTexto,
} from "../lib/configuracoes-account-utils";
import { carregarPreferencias } from "../lib/configuracoes-account-preferences";
import { carregarResumoContaSupabase } from "../lib/configuracoes-account-summary-supabase";
import { listarUsuariosBloqueadosConfiguracoes } from "../lib/configuracoes-blocked-users-loader";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioBloqueadoConfiguracoes,
  UsuarioConfiguracoes,
} from "../lib/configuracoes-account-models";
import { carregarPerfilConfiguracoesSupabase } from "../lib/configuracoes-profile-supabase-loader";
import {
  carregarPreferenciasPrivacidade,
} from "../lib/configuracoes-privacy-preferences";
import type { PreferenciasPrivacidadeHistorietas } from "../lib/configuracoes-privacy-preferences";
import { criarLoginHrefConfiguracoes } from "../lib/configuracoes-route-utils";
import type { RouterConfiguracoes } from "../lib/configuracoes-navigation-types";

export function useConfiguracoesInitialAccess({
  router,
  setVerificandoAcesso,
  setUsuario,
  setPreferencias,
  setPrivacidade,
  setResumo,
  setUsuariosBloqueados,
}: {
  router: RouterConfiguracoes;
  setVerificandoAcesso: Dispatch<SetStateAction<boolean>>;
  setUsuario: Dispatch<SetStateAction<UsuarioConfiguracoes | null>>;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setPrivacidade: Dispatch<SetStateAction<PreferenciasPrivacidadeHistorietas>>;
  setResumo: Dispatch<SetStateAction<ResumoLocal>>;
  setUsuariosBloqueados: Dispatch<
    SetStateAction<UsuarioBloqueadoConfiguracoes[]>
  >;
}) {
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
        const [
          privacidadeCarregada,
          resumoCarregado,
          usuariosBloqueadosCarregados,
        ] = await Promise.all([
          carregarPreferenciasPrivacidade(usuarioCarregado.id, {
            usarFallbackLocal: true,
          }),
          carregarResumoContaSupabase(usuarioCarregado.id),
          listarUsuariosBloqueadosConfiguracoes().catch(() => []),
        ]);

        setUsuario(usuarioCarregado);
        setPrivacidade(privacidadeCarregada);
        setUsuariosBloqueados(usuariosBloqueadosCarregados);
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
    // Os setters React estáveis são recebidos da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
}
