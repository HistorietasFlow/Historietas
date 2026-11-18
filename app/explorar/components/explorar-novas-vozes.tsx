"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import ObraPublicadaCard from "./explorar-obra-publicada-card";
import { ExplorarCarouselRow, SectionHeader, type TemaCategoriaExplorar } from "./explorar-section-components";
import { desktopExplorarObraCarouselItemStyle, desktopSectionStyle, explorarObraCarouselItemStyle, sectionStyle } from "../lib/explorar-content-styles";
import { normalizarObraSupabase, type ObraLocal, type SupabaseObraRow } from "../lib/explorar-work-normalizers";

type Resultado = { leitor: string; obras: ObraLocal[] };
const ID_TITULO = "explorar-novas-vozes-titulo";
const HABILITADO = process.env.NEXT_PUBLIC_HISTORIETAS_NOVAS_VOZES_LOCAL === "1";

export function ExplorarNovasVozes({ isDesktop, tema, leitor }: {
  isDesktop: boolean;
  tema: TemaCategoriaExplorar;
  leitor: string;
}) {
  const [resultado, definirResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!HABILITADO) return;
    let vigente = true;
    let consulta = 0;
    const controller = new AbortController();

    async function carregar() {
      const numeroDaConsulta = ++consulta;
      try {
        const { data, error } = await supabase.rpc("listar_novas_vozes").abortSignal(controller.signal);
        if (!vigente || numeroDaConsulta !== consulta) return;
        const obras = error ? [] : (data ?? []).map((linha, i) => ({
          ...normalizarObraSupabase({
            ...linha,
            arquivo_url: null,
            arquivo_nome: null,
            arquivo_tipo: null,
            arquivo_tamanho: null,
            arquivo_categoria: null,
          } satisfies SupabaseObraRow, [], undefined, i),
          slugPrevia: linha.possui_previa ? linha.slug : undefined,
        }));
        definirResultado({ leitor, obras });
      } catch {
        if (vigente && numeroDaConsulta === consulta) definirResultado({ leitor, obras: [] });
      }
    }

    function revalidar() {
      if (document.visibilityState !== "visible") return;
      // Não deixe candidatos antigos expostos durante revalidação após tab suspensa.
      definirResultado(null);
      void carregar();
    }

    void carregar();
    document.addEventListener("visibilitychange", revalidar);
    return () => {
      vigente = false;
      controller.abort();
      document.removeEventListener("visibilitychange", revalidar);
    };
  }, [leitor]);

  if (!HABILITADO || resultado?.leitor !== leitor || !resultado.obras.length) return null;

  return (
    <section aria-labelledby={ID_TITULO} style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <SectionHeader title="Novas vozes" titleId={ID_TITULO} tema={tema} isDesktop={isDesktop} />
      <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
        {resultado.obras.map((obra) => (
          <div key={obra.id} style={isDesktop ? desktopExplorarObraCarouselItemStyle : explorarObraCarouselItemStyle}>
            <ObraPublicadaCard obra={obra} isDesktop={isDesktop} somenteVisualizacoes />
          </div>
        ))}
      </ExplorarCarouselRow>
    </section>
  );
}
