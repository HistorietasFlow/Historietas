import { useMemo } from "react";
import { obterOrdemCapitulo, obterProximaOrdemCapitulo } from "../lib/adicionar-capitulo-chapter-order-utils";
import { criarHrefLeituraCapitulo } from "../lib/adicionar-capitulo-route-utils";

type CapituloDerivavel = {
  id: string;
  ordem?: number;
};

type ObraDerivavel = {
  id: string;
  titulo: string;
  slug: string;
  publicado: boolean;
  capitulos: CapituloDerivavel[];
};

type UseAdicionarCapituloDerivedValuesParams<TObra extends ObraDerivavel> = {
  obras: TObra[];
  obraId: string;
  titulo: string;
  texto: string;
  capituloCriado: CapituloDerivavel | null;
};

export function useAdicionarCapituloDerivedValues<
  TObra extends ObraDerivavel,
>({
  obras,
  obraId,
  titulo,
  texto,
  capituloCriado,
}: UseAdicionarCapituloDerivedValuesParams<TObra>) {
  const obraAtual: TObra | null = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const numeroNovoCapitulo = obraAtual
    ? obterProximaOrdemCapitulo(obraAtual.capitulos)
    : 1;

  const tituloPreview = titulo.trim() || `Capítulo ${numeroNovoCapitulo}`;

  const textoPreview = texto.trim();

  const minhaObraHref = "/painel-autor";
  const capituloCriadoHref = capituloCriado && obraAtual
    ? criarHrefLeituraCapitulo(
        obraAtual,
        capituloCriado,
        obterOrdemCapitulo(
          capituloCriado,
          obraAtual.capitulos.findIndex(
            (capitulo) => capitulo.id === capituloCriado.id
          ) + 1
        )
      )
    : "";

  return {
    obraAtual,
    numeroNovoCapitulo,
    tituloPreview,
    textoPreview,
    minhaObraHref,
    capituloCriadoHref,
  };
}
