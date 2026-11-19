"use client";

import { useEffect, useState } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { carregarRecomendacoesLocais } from "../../../lib/recomendacoes-locais";
import { supabase } from "../../../lib/supabase/client";
import { normalizarObraSupabase, type ObraLocal } from "../lib/explorar-work-normalizers";
import {
  desktopExplorarObraCarouselItemStyle,
  desktopSectionStyle,
  explorarObraCarouselItemStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import ObraPublicadaCard from "./explorar-obra-publicada-card";
import { ExplorarCarouselRow, SectionHeader, type TemaCategoriaExplorar } from "./explorar-section-components";

type Estado =
  | { leitor: string; tipo: "pronto"; obras: ObraLocal[] }
  | { leitor: string; tipo: "erro" };

const titulo = "Recomendações para você";
const tituloId = "explorar-recomendacoes-locais";
const mensagens = {
  "pt-BR": ["Carregando recomendações…", "Não foi possível carregar as recomendações agora.", "Nenhuma recomendação encontrada."],
  en: ["Loading recommendations…", "Couldn't load recommendations right now.", "No recommendations found."],
  es: ["Cargando recomendaciones…", "No se pudieron cargar las recomendaciones.", "No se encontraron recomendaciones."],
};

export function ExplorarRecomendacoesLocais({ leitor, isDesktop, tema }: {
  leitor: string;
  isDesktop: boolean;
  tema: TemaCategoriaExplorar;
}) {
  const { language } = useHistorietasLanguage();
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    let atual: AbortController | undefined;

    function limpar() {
      atual?.abort();
      setEstado(null);
    }

    function carregar() {
      limpar();
      const controller = new AbortController();
      atual = controller;
      void carregarRecomendacoesLocais(leitor, controller.signal)
        .then((linhas) => {
          if (controller.signal.aborted) return;
          const obras = linhas.map((linha, index) => normalizarObraSupabase({
            ...linha,
            capa_url: null,
            capa_nome: null,
            arquivo_url: null,
            arquivo_nome: null,
            arquivo_tipo: null,
            arquivo_tamanho: null,
            arquivo_categoria: null,
            link: null,
            atualizado_em: null,
          }, [], undefined, index));
          setEstado({ leitor, tipo: "pronto", obras });
        })
        .catch(() => {
          if (!controller.signal.aborted) setEstado({ leitor, tipo: "erro" });
        });
    }

    function revalidar() {
      if (document.visibilityState === "visible") carregar();
      else limpar();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "SIGNED_OUT" || (sessao?.user.id ?? "") !== leitor) {
        limpar();
      }
    });
    carregar();
    document.addEventListener("visibilitychange", revalidar);
    return () => {
      atual?.abort();
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", revalidar);
    };
  }, [leitor]);

  const resultado = estado?.leitor === leitor ? estado : null;
  const [carregando, erro, vazio] = mensagens[language];
  const obras = resultado?.tipo === "pronto" ? resultado.obras : [];
  return (
    <section aria-labelledby={tituloId} aria-busy={!resultado} style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <SectionHeader title={titulo} titleId={tituloId} tema={tema} isDesktop={isDesktop}
        href={obras.length > 0 ? "/listas?modo=obras&secao=recomendacoes" : undefined} />
      {obras.length > 0 ? (
        <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
          {obras.slice(0, 12).map((obra) => (
            <div key={obra.id} style={isDesktop ? desktopExplorarObraCarouselItemStyle : explorarObraCarouselItemStyle}>
              <ObraPublicadaCard obra={obra} isDesktop={isDesktop} somenteVisualizacoes />
            </div>
          ))}
        </ExplorarCarouselRow>
      ) : (
        <p role={resultado?.tipo === "erro" ? "alert" : "status"} style={{ textAlign: "center" }}>
          {!resultado ? carregando : resultado.tipo === "erro" ? erro : vazio}
        </p>
      )}
    </section>
  );
}
