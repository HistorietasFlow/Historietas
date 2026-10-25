import { useMemo } from "react";
import { criarHrefLeituraCapitulo } from "../lib/editar-capitulo-route-utils";

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

type UseEditarCapituloDerivedValuesParams<TObra extends ObraDerivavel> = {
  obras: TObra[];
  obraId: string;
  capituloId: string;
  titulo: string;
  texto: string;
};

export function useEditarCapituloDerivedValues<
  TObra extends ObraDerivavel,
>({
  obras,
  obraId,
  capituloId,
  titulo,
  texto,
}: UseEditarCapituloDerivedValuesParams<TObra>) {
  const obraAtual: TObra | null = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const capituloAtual: TObra["capitulos"][number] | null = useMemo(() => {
    if (!obraAtual) {
      return null;
    }

    return (
      obraAtual.capitulos.find((capitulo) => capitulo.id === capituloId) || null
    );
  }, [obraAtual, capituloId]);

  const numeroCapitulo = useMemo(() => {
    if (!obraAtual || !capituloAtual) {
      return 0;
    }

    if (
      typeof capituloAtual.ordem === "number" &&
      Number.isInteger(capituloAtual.ordem) &&
      capituloAtual.ordem > 0
    ) {
      return capituloAtual.ordem;
    }

    return (
      obraAtual.capitulos.findIndex(
        (capitulo) => capitulo.id === capituloAtual.id
      ) + 1
    );
  }, [obraAtual, capituloAtual]);

  const capituloLabel = `Capítulo ${String(numeroCapitulo || 1).padStart(2, "0")}`;

  const minhaObraHref = obraAtual
    ? `/editar-obra?obraId=${obraAtual.id}`
    : "/painel-autor";

  const lerCapituloHref =
    obraAtual && capituloAtual
      ? criarHrefLeituraCapitulo(
          obraAtual,
          capituloAtual.id,
          numeroCapitulo || 1
        )
      : "/painel-autor";

  const tituloPreview =
    titulo.trim() || `Capítulo ${numeroCapitulo || ""}`.trim();

  const textoPreview =
    texto.trim() || "O texto do capítulo vai aparecer aqui enquanto você edita.";

  return {
    obraAtual,
    capituloAtual,
    numeroCapitulo,
    capituloLabel,
    minhaObraHref,
    lerCapituloHref,
    tituloPreview,
    textoPreview,
  };
}
