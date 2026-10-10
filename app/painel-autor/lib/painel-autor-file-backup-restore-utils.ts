import { obterChavesBackupArquivoPainel } from "./painel-autor-file-backup-key-utils";
import { normalizarArquivoObra } from "./painel-autor-file-normalizer";

type ArquivoObraPainel = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraComArquivoPainel = {
  id: string;
  slug: string;
  titulo: string;
  link?: string;
  arquivoObra?: ArquivoObraPainel | null;
};

export function restaurarArquivoObraComBackup<T extends ObraComArquivoPainel>(
  obra: T,
  backup: Record<string, unknown>
): T {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupArquivoPainel(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraPainel => Boolean(arquivo));

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}
