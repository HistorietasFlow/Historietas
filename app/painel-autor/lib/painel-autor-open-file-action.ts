import type { HistorietasLanguage } from "../../../lib/i18n";
import { solicitarUrlTemporariaArquivoObra } from "../../../lib/arquivosObras";
import { obterCaminhoStoragePainel } from "./painel-autor-file-storage-path-utils";
import { traduzirTextoPainelAutor } from "./painel-autor-translations";

type ObraComArquivoPainel = {
  id: string;
  arquivoObra?: {
    conteudo?: string;
  } | null;
};

export async function criarUrlAssinadaArquivoObraPainel(
  obraId: string,
  referencia: string,
) {
  const referenciaLimpa = referencia.trim();

  if (!referenciaLimpa) {
    throw new Error("Esta obra não possui arquivo disponível.");
  }

  const caminho = obterCaminhoStoragePainel(
    "arquivos-obras",
    referenciaLimpa,
  );

  if (!caminho) {
    return referenciaLimpa;
  }

  return solicitarUrlTemporariaArquivoObra(obraId);
}

export async function abrirArquivoObraPainel(
  obra: ObraComArquivoPainel,
  language: HistorietasLanguage,
) {
  const referencia = obra.arquivoObra?.conteudo?.trim() || "";

  if (!referencia) {
    window.alert(
      traduzirTextoPainelAutor(
        "Esta obra não possui arquivo disponível.",
        language,
      ),
    );
    return;
  }

  try {
    const urlArquivo = await criarUrlAssinadaArquivoObraPainel(
      obra.id,
      referencia,
    );
    const linkArquivo = document.createElement("a");

    linkArquivo.href = urlArquivo;
    linkArquivo.target = "_blank";
    linkArquivo.rel = "noopener noreferrer";
    document.body.appendChild(linkArquivo);
    linkArquivo.click();
    linkArquivo.remove();
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Não consegui abrir o arquivo da obra agora.";

    console.warn("Não consegui abrir o arquivo da obra:", error);
    window.alert(traduzirTextoPainelAutor(mensagem, language));
  }
}
