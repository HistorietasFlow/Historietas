"use client";

import { useRouter } from "next/navigation";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { EmBreveEmptyState } from "./components/em-breve-empty-state";
import { EmBreveAboutNotice } from "./components/em-breve-about-notice";
import { EmBreveHeader } from "./components/em-breve-header";
import { EmBreveWaterFade } from "./components/em-breve-water-fade";
import { EmBreveWorksSection } from "./components/em-breve-works-section";
import { useEmBreveDesktopLayout } from "./hooks/use-em-breve-desktop-layout";
import { useEmBreveLancamentosSalvosIniciais } from "./hooks/use-em-breve-lancamentos-salvos-iniciais";
import { useEmBreveLancamentosSalvosNormalizados } from "./hooks/use-em-breve-lancamentos-salvos-normalizados";
import { useEmBreveObrasReais } from "./hooks/use-em-breve-obras-reais";
import { useEmBrevePersistenciaLancamentosSalvos } from "./hooks/use-em-breve-persistencia-lancamentos-salvos";
import { useEmBreveSalvarLancamento } from "./hooks/use-em-breve-salvar-lancamento";
import {
  pageStyle,
  containerStyle,
  desktopContainerStyle,
} from "./lib/em-breve-styles";
import { emBrevePageCss } from "./lib/em-breve-page-css";
import { EmBreveLanguageBridge } from "./components/em-breve-language-bridge";
import { removerObrasDuplicadasEmBreve } from "./lib/em-breve-work-list-utils";
import { selecionarObrasExibidasEmBreve } from "./lib/em-breve-work-selection-utils";



export default function EmBrevePage() {
  const router = useRouter();
  const {
    nomeObra,
    obraIdConsultada,
    obrasSalvas,
    setObrasSalvas,
    usuarioIdLogado,
    setUsuarioIdLogado,
  } = useEmBreveLancamentosSalvosIniciais(router);
  const obrasReaisEmBreve = useEmBreveObrasReais();
  const desktopLayout = useEmBreveDesktopLayout();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  const obrasEmBreve = removerObrasDuplicadasEmBreve(obrasReaisEmBreve);

  const obrasSalvasNormalizadas =
    useEmBreveLancamentosSalvosNormalizados(
      usuarioIdLogado,
      obrasReaisEmBreve,
      obrasSalvas
    );

  const {
    avisoAcesso,
    obraProcessandoId,
    salvarLancamento,
  } = useEmBreveSalvarLancamento({
    router,
    obrasSalvasNormalizadas,
    obrasReaisEmBreve,
    setUsuarioIdLogado,
    setObrasSalvas,
  });

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

        <EmBreveAboutNotice
          visivel={outrasObrasEmBreve.length > 0}
        />
      </section>
    </main>
  );
}
