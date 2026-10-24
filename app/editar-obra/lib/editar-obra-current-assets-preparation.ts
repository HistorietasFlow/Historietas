import {
  ehDataUrlEdicaoObra,
  normalizarArquivoObraPersistivel,
} from "./editar-obra-file-normalization";
import { obterChavesBackupArquivoEdicaoObra } from "./editar-obra-file-backup-key-utils";
import { obterCaminhoStorageEdicaoObra } from "./editar-obra-storage-path-utils";
import { criarArquivoRemotoEdicaoObra } from "./editar-obra-supabase-file-converter";

type ArquivoObraPersistivel = NonNullable<
  ReturnType<typeof normalizarArquivoObraPersistivel>
>;

type ObraRemotaAtualEdicaoObra = {
  capa_url?: string | null;
  capa_nome?: string | null;
  arquivo_url?: string | null;
  arquivo_nome?: string | null;
  arquivo_tipo?: string | null;
  arquivo_tamanho?: number | null;
  arquivo_categoria?: string | null;
  criada_em?: string | null;
};

type ObraLocalAtualEdicaoObra = {
  id: string;
  slug: string;
  titulo: string;
  link: string;
  arquivoObra?: unknown;
};

type PrepararAssetsAtuaisEdicaoObraParams = {
  capa: string;
  capaNome: string;
  arquivoObra: unknown;
  obraRemotaAtual: ObraRemotaAtualEdicaoObra;
  obraLocalAtual: ObraLocalAtualEdicaoObra | null;
  backupArquivosObras: Record<string, unknown>;
  capaRemovidaManualmente: boolean;
  arquivoObraRemovidoManualmente: boolean;
};

export function prepararAssetsAtuaisEdicaoObra({
  capa,
  capaNome,
  arquivoObra,
  obraRemotaAtual,
  obraLocalAtual,
  backupArquivosObras,
  capaRemovidaManualmente,
  arquivoObraRemovidoManualmente,
}: PrepararAssetsAtuaisEdicaoObraParams) {
  const capaLocalPersistivel =
    capa && !ehDataUrlEdicaoObra(capa) ? capa.trim() : "";
  const capaRemotaAtual = obraRemotaAtual.capa_url?.trim() || "";
  const capaNomeRemotoAtual = obraRemotaAtual.capa_nome?.trim() || "";
  const arquivoRemotoAtual = criarArquivoRemotoEdicaoObra(obraRemotaAtual);
  const arquivoBackupAtual = obraLocalAtual
    ? obterChavesBackupArquivoEdicaoObra(obraLocalAtual)
        .map((chave) =>
          normalizarArquivoObraPersistivel(backupArquivosObras[chave])
        )
        .find((arquivo): arquivo is ArquivoObraPersistivel => Boolean(arquivo)) ||
      null
    : null;
  const arquivoLocalPersistivel =
    normalizarArquivoObraPersistivel(arquivoObra) ||
    normalizarArquivoObraPersistivel(obraLocalAtual?.arquivoObra) ||
    null;
  const capaFinalInicial = capaRemovidaManualmente
    ? ""
    : capaRemotaAtual || capaLocalPersistivel;
  const capaNomeFinalInicial = capaRemovidaManualmente
    ? ""
    : capaNomeRemotoAtual || capaNome.trim();
  const arquivoObraFinalInicial = arquivoObraRemovidoManualmente
    ? null
    : arquivoRemotoAtual || arquivoLocalPersistivel || arquivoBackupAtual;
  const caminhoCapaRemotaAtual = obterCaminhoStorageEdicaoObra(
    "capas-obras",
    capaRemotaAtual,
  );
  const caminhoArquivoRemotoAtual = obterCaminhoStorageEdicaoObra(
    "arquivos-obras",
    arquivoRemotoAtual?.conteudo || "",
  );

  return {
    capaLocalPersistivel,
    capaRemotaAtual,
    capaNomeRemotoAtual,
    arquivoRemotoAtual,
    arquivoBackupAtual,
    arquivoLocalPersistivel,
    capaFinalInicial,
    capaNomeFinalInicial,
    arquivoObraFinalInicial,
    caminhoCapaRemotaAtual,
    caminhoArquivoRemotoAtual,
  };
}
