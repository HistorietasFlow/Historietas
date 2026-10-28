"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { EmBreveEmptyState } from "./components/em-breve-empty-state";
import { EmBreveHeader } from "./components/em-breve-header";
import { EmBreveWaterFade } from "./components/em-breve-water-fade";
import { EmBreveWorksSection } from "./components/em-breve-works-section";
import { useEmBreveDesktopLayout } from "./hooks/use-em-breve-desktop-layout";
import { useEmBreveLancamentosSalvosNormalizados } from "./hooks/use-em-breve-lancamentos-salvos-normalizados";
import { useEmBreveObrasReais } from "./hooks/use-em-breve-obras-reais";
import { useEmBrevePersistenciaLancamentosSalvos } from "./hooks/use-em-breve-persistencia-lancamentos-salvos";
import {
  pageStyle,
  containerStyle,
  desktopContainerStyle,
} from "./lib/em-breve-styles";
import { emBrevePageCss } from "./lib/em-breve-page-css";
import { EmBreveLanguageBridge } from "./components/em-breve-language-bridge";
import { sincronizarAvisoLancamentoSupabaseEmBreve } from "./actions/sincronizar-aviso-lancamento-supabase-em-breve";
import { encontrarLinkObraComConteudoEmBreve } from "./loaders/encontrar-link-obra-com-conteudo-em-breve";
import {
  criarLoginHrefEmBreve,
  pegarParametro,
} from "./lib/em-breve-route-utils";
import {
  SAVED_RELEASES_STORAGE_KEY,
  carregarJsonUsuarioEmBreve,
  salvarJsonUsuarioEmBreve,
} from "./lib/em-breve-storage-utils";
import { type ObraEmBreveCard } from "./lib/em-breve-work-normalizers";
import {
  adicionarObraNaListaEmBreve,
  listaTemObraEmBreve,
  normalizarLancamentosSalvosComObrasEmBreve,
  normalizarListaIdsEmBreve,
  obterIdentificadoresObraEmBreve,
  removerObrasDuplicadasEmBreve,
  removerObraDaListaEmBreve,
} from "./lib/em-breve-work-list-utils";
import { carregarLancamentosSalvosSupabaseEmBreve } from "./loaders/carregar-lancamentos-salvos-supabase-em-breve";
import { selecionarObrasExibidasEmBreve } from "./lib/em-breve-work-selection-utils";



export default function EmBrevePage() {
  const router = useRouter();
  const [nomeObra, setNomeObra] = useState("");
  const [obraIdConsultada, setObraIdConsultada] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const obrasReaisEmBreve = useEmBreveObrasReais();
  const [avisoAcesso, setAvisoAcesso] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [obraProcessandoId, setObraProcessandoId] = useState("");
  const desktopLayout = useEmBreveDesktopLayout();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarLancamentosSalvos() {
      const parametros = new URLSearchParams(window.location.search);
      const obraIdParam = pegarParametro(parametros.get("obraId"));
      const nomeObraParam = pegarParametro(parametros.get("obra"));

      window.setTimeout(() => {
        if (componenteAtivo) {
          setObraIdConsultada(obraIdParam);
          setNomeObra(nomeObraParam);
        }
      }, 0);

      if (obraIdParam || nomeObraParam) {
        const linkObraComConteudo = await encontrarLinkObraComConteudoEmBreve(
          obraIdParam,
          nomeObraParam
        );

        if (componenteAtivo && linkObraComConteudo) {
          router.replace(linkObraComConteudo);
          return;
        }
      }

      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          window.setTimeout(() => {
            if (componenteAtivo) {
              setUsuarioIdLogado("");
              setObrasSalvas([]);
            }
          }, 0);

          return;
        }

        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado(data.user.id);
          }
        }, 0);

        const salvasJson: unknown =
          carregarJsonUsuarioEmBreve(SAVED_RELEASES_STORAGE_KEY, data.user.id) ||
          [];
        const salvasLocaisNormalizadas = normalizarListaIdsEmBreve(salvasJson);
        const salvasSupabase = await carregarLancamentosSalvosSupabaseEmBreve(
          data.user.id
        );
        const salvasNormalizadas = normalizarListaIdsEmBreve([
          ...salvasLocaisNormalizadas,
          ...salvasSupabase,
        ]);

        salvarJsonUsuarioEmBreve(
          SAVED_RELEASES_STORAGE_KEY,
          data.user.id,
          salvasNormalizadas
        );

        window.setTimeout(() => {
          if (componenteAtivo) {
            setObrasSalvas(salvasNormalizadas);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado("");
            setObrasSalvas([]);
          }
        }, 0);
      }
    }

    void carregarLancamentosSalvos();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  const obrasEmBreve = removerObrasDuplicadasEmBreve(obrasReaisEmBreve);

  const obrasSalvasNormalizadas =
    useEmBreveLancamentosSalvosNormalizados(
      usuarioIdLogado,
      obrasReaisEmBreve,
      obrasSalvas
    );

  useEmBrevePersistenciaLancamentosSalvos(
    usuarioIdLogado,
    obrasReaisEmBreve,
    obrasSalvasNormalizadas
  );

  const outrasObrasEmBreve = selecionarObrasExibidasEmBreve(
    obrasEmBreve,
    obraIdConsultada,
    nomeObra
  );

  async function salvarLancamento(obra: ObraEmBreveCard) {
    const identificadoresObra = obterIdentificadoresObraEmBreve(obra);

    if (identificadoresObra.length === 0 || obraProcessandoId) {
      return;
    }

    setAvisoAcesso("");
    setObraProcessandoId(obra.id);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setAvisoAcesso("Entre na sua conta para ativar aviso de lançamento.");
        router.push(criarLoginHrefEmBreve());
        return;
      }

      const avisoAtivo = listaTemObraEmBreve(obra, obrasSalvasNormalizadas);
      const deveAtivar = !avisoAtivo;
      const sincronizou = await sincronizarAvisoLancamentoSupabaseEmBreve(
        data.user.id,
        obra.id,
        deveAtivar
      );

      if (!sincronizou) {
        setAvisoAcesso(
          "Não consegui salvar o aviso agora. Tente novamente em instantes."
        );
        return;
      }

      const novasObrasSalvas = deveAtivar
        ? adicionarObraNaListaEmBreve(obra, obrasSalvasNormalizadas)
        : removerObraDaListaEmBreve(obra, obrasSalvasNormalizadas);
      const obrasNormalizadas = normalizarLancamentosSalvosComObrasEmBreve(
        novasObrasSalvas,
        obrasReaisEmBreve
      );

      setUsuarioIdLogado(data.user.id);
      salvarJsonUsuarioEmBreve(
        SAVED_RELEASES_STORAGE_KEY,
        data.user.id,
        obrasNormalizadas
      );
      setObrasSalvas(obrasNormalizadas);
    } catch {
      setAvisoAcesso("Não consegui confirmar sua conta agora. Tente novamente.");
    } finally {
      setObraProcessandoId("");
    }
  }


  return (
    <main
      data-historietas-em-breve-root="true"
      style={pageThemeStyle}
    >
      <style>{`${historietasThemeCss}${emBrevePageCss}`}</style>
      <EmBreveLanguageBridge />

      <EmBreveWaterFade desktopLayout={desktopLayout} />

      <section style={desktopLayout ? desktopContainerStyle : containerStyle}>
        <EmBreveHeader
          desktopLayout={desktopLayout}
          notificacoesNaoLidas={notificacoesNaoLidas}
        />

        {outrasObrasEmBreve.length > 0 ? (
          <EmBreveWorksSection
            obras={outrasObrasEmBreve}
            obrasSalvasNormalizadas={obrasSalvasNormalizadas}
            desktopLayout={desktopLayout}
            avisoAcesso={avisoAcesso}
            obraProcessandoId={obraProcessandoId}
            salvarLancamento={salvarLancamento}
          />
        ) : (
          <EmBreveEmptyState
            avisoAcesso={avisoAcesso}
            nomeObra={nomeObra}
          />
        )}

        {outrasObrasEmBreve.length > 0 && (
          <p
            style={{
              margin: "12px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Sobre o aviso
          </p>
        )}
      </section>
    </main>
  );
}
