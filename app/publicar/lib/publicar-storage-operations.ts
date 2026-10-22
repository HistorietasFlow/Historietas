import { supabase } from "../../../lib/supabase/client";
import { criarId, limparNomeArquivoStorage } from "./publicar-id-utils";
import type { ArquivoStoragePublicar } from "./publicar-models";
import {
  mensagemAmigavelErroUploadStorage,
  obterCacheControlUploadStorage,
  obterTipoMimeUploadStorage,
} from "../../../lib/storageUploads";

export async function enviarArquivoStorage(
  bucket: "capas-obras" | "arquivos-obras",
  userId: string,
  arquivo: File
): Promise<ArquivoStoragePublicar> {
  const contentType = obterTipoMimeUploadStorage(bucket, arquivo);

  if (!contentType) {
    throw new Error(`Tipo de arquivo não permitido para ${bucket}.`);
  }

  const caminho = `${userId}/${Date.now()}-${criarId()}-${limparNomeArquivoStorage(
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

  const publicUrl =
    bucket === "capas-obras"
      ? supabase.storage.from(bucket).getPublicUrl(caminho).data.publicUrl
      : "";

  return {
    bucket,
    caminho,
    publicUrl,
  };
}

export async function removerArquivosStoragePublicar(
  arquivos: ArquivoStoragePublicar[]
) {
  const arquivosUnicos = Array.from(
    new Map(
      arquivos.map((arquivo) => [
        `${arquivo.bucket}:${arquivo.caminho}`,
        arquivo,
      ])
    ).values()
  );

  await Promise.allSettled(
    arquivosUnicos.map(async (arquivo) => {
      try {
        await supabase.storage
          .from(arquivo.bucket)
          .remove([arquivo.caminho]);
      } catch {
        // Limpeza de arquivo órfão é uma proteção extra.
      }
    })
  );
}

export async function desfazerPublicacaoParcialPublicar(
  obraId: string,
  arquivos: ArquivoStoragePublicar[]
) {
  const obraIdLimpo = obraId.trim();
  let obraRemovida = !obraIdLimpo;

  if (obraIdLimpo) {
    try {
      await supabase.from("capitulos").delete().eq("obra_id", obraIdLimpo);

      const { error: erroRemoverObra } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraIdLimpo);

      obraRemovida = !erroRemoverObra;
    } catch {
      obraRemovida = false;
    }
  }

  if (obraRemovida) {
    await removerArquivosStoragePublicar(arquivos);
  }

  return obraRemovida;
}


