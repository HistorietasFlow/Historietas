"use client";

import { useEffect, useRef, useState } from "react";
import { preferenciasPadrao, resumoPadrao } from "../lib/configuracoes-account-models";
import { preferenciasPrivacidadePadrao } from "../lib/configuracoes-privacy-preferences";
import type { IdentidadePreferenciasConfiguracoes } from "../lib/configuracoes-preference-identity";
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
  setSalvando,
  setErroUsername,
  setUsuario,
  setPreferencias,
  setPrivacidade,
  setResumo,
  setUsuariosBloqueados,
}: {
  router: RouterConfiguracoes;
  setVerificandoAcesso: Dispatch<SetStateAction<boolean>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
  setErroUsername: Dispatch<SetStateAction<string>>;
  setUsuario: Dispatch<SetStateAction<UsuarioConfiguracoes | null>>;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setPrivacidade: Dispatch<SetStateAction<PreferenciasPrivacidadeHistorietas>>;
  setResumo: Dispatch<SetStateAction<ResumoLocal>>;
  setUsuariosBloqueados: Dispatch<
    SetStateAction<UsuarioBloqueadoConfiguracoes[]>
  >;
}) {
  const identidadeContaRef = useRef<IdentidadePreferenciasConfiguracoes>({ usuarioId: "", versao: 0 });
  const [erroPreferencias, setErroPreferencias] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let cancelado = false;
    function iniciarCarga(usuarioId = identidadeContaRef.current.usuarioId) {
      const versao = identidadeContaRef.current.versao + 1;
      identidadeContaRef.current = { usuarioId, versao };
      setVerificandoAcesso(true);
      setSalvando(false);
      setErroUsername("");
      setErroPreferencias(false);
      setUsuario(null);
      setPreferencias({ ...preferenciasPadrao });
      setPrivacidade({ ...preferenciasPrivacidadePadrao });
      setResumo({ ...resumoPadrao });
      setUsuariosBloqueados([]);
      return versao;
    }

    async function verificarAcesso(versao: number) {
      const atual = () => !cancelado && identidadeContaRef.current.versao === versao;
      if (!atual()) return;
      let contaConfirmada = false;
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!atual()) {
          return;
        }

        if (error || !data.user) {
          router.replace(criarLoginHrefConfiguracoes());
          return;
        }

        identidadeContaRef.current = { usuarioId: data.user.id, versao };
        contaConfirmada = true;
        const perfilRemoto = await carregarPerfilConfiguracoesSupabase(data.user.id);
        if (!atual()) return;
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
            exigirConfirmacao: true,
            execucaoEstaAtual: atual,
          }),
          carregarResumoContaSupabase(usuarioCarregado.id),
          listarUsuariosBloqueadosConfiguracoes().catch(() => []),
        ]);

        if (!atual()) return;
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
        if (!atual()) return;
        if (!contaConfirmada) {
          router.replace(criarLoginHrefConfiguracoes());
        } else {
          setErroPreferencias(true);
          setVerificandoAcesso(false);
        }
      }
    }

    // Observa a sessão existente apenas para invalidar dados desta interface.
    // Nenhum login, token, senha ou regra de autorização é alterado aqui.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const usuarioId = sessao?.user?.id || "";
      if (cancelado || (usuarioId === identidadeContaRef.current.usuarioId && _evento !== "SIGNED_OUT")) return;
      const versao = iniciarCarga(usuarioId);
      queueMicrotask(() => { if (!cancelado) void verificarAcesso(versao); });
    });
    void verificarAcesso(iniciarCarga());

    return () => {
      cancelado = true;
      identidadeContaRef.current = { usuarioId: "", versao: identidadeContaRef.current.versao + 1 };
      subscription.unsubscribe();
    };
    // Os setters React estáveis são recebidos da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, tentativa]);
  return { identidadeContaRef, erroPreferencias, tentarCarregarPreferencias: () => setTentativa(valor => valor + 1) };
}
