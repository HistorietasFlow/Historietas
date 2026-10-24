import { supabase } from "../../../lib/supabase/client";
import {
  mensagemAmigavelErroUploadStorage,
  obterCacheControlUploadStorage,
  obterTipoMimeUploadStorage,
} from "../../../lib/storageUploads";
import { limparNomeArquivoStorage } from "./editar-obra-storage-path-utils";

export type ArquivoStorageEdicaoObra = {
  bucket: "capas-obras" | "arquivos-obras";
  caminho: string;
  referencia: string;
};

export async function enviarArquivoStorage(
  bucket: "capas-obras" | "arquivos-obras",
  userId: string,
  arquivo: File
): Promise<ArquivoStorageEdicaoObra> {
  const contentType = obterTipoMimeUploadStorage(bucket, arquivo);

  if (!contentType) {
    throw new Error(`Tipo de arquivo não permitido para ${bucket}.`);
  }

  const idSeguro =
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const caminho = `${userId}/${Date.now()}-${idSeguro}-${limparNomeArquivoStorage(
    arquivo.name
  )}`;

  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
    cacheControl: obterCacheControlUploadStorage(bucket),
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(
      `Erro ao enviar ${arquivo.name}: ${mensagemAmigavelErroUploadStorage(error.message)}`,
    );
  }

  const referencia =
    bucket === "capas-obras"
      ? supabase.storage.from(bucket).getPublicUrl(caminho).data.publicUrl
      : caminho;

  return {
    bucket,
    caminho,
    referencia,
  };
}

export async function removerArquivosStorageEdicaoObra(
  arquivos: Array<Pick<ArquivoStorageEdicaoObra, "bucket" | "caminho">>
) {
  const arquivosUnicos = Array.from(
    new Map(
      arquivos
        .filter((arquivo) => Boolean(arquivo.caminho.trim()))
        .map((arquivo) => [
          `${arquivo.bucket}:${arquivo.caminho}`,
          {
            bucket: arquivo.bucket,
            caminho: arquivo.caminho.trim(),
          },
        ])
    ).values()
  );

  await Promise.allSettled(
    arquivosUnicos.map(async (arquivo) => {
      const { error } = await supabase.storage
        .from(arquivo.bucket)
        .remove([arquivo.caminho]);

      if (error) {
        console.warn(
          `Não consegui remover o arquivo antigo de ${arquivo.bucket}:`,
          error.message
        );
      }
    })
  );
}
