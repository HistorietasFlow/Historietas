import { supabase } from "../../../lib/supabase/client";
import { criarId, limparNomeArquivoStorage } from "./publicar-id-utils";
import type { ArquivoStoragePublicar } from "./publicar-models";
import {
  mensagemAmigavelErroUploadStorage,
  obterCacheControlUploadStorage,
  obterTipoMimeUploadStorage,
} from "../../../lib/storageUploads";

// Depois do envio, uma falha de transporte/Storage não comprova que o objeto
// deixou de ser gravado. Não autoriza compensação nem repetição do upload.
export class UploadPublicarIncertoError extends Error {}

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

  try {
    const { data, error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
      cacheControl: obterCacheControlUploadStorage(bucket),
      contentType,
      upsert: false,
    });

    if (error) {
      throw new Error(
        `Erro ao enviar ${arquivo.name}: ${mensagemAmigavelErroUploadStorage(error.message)}`,
      );
    }
    if (data?.path !== caminho) {
      throw new Error(`O envio de ${arquivo.name} não foi confirmado.`);
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
  } catch (erro) {
    throw new UploadPublicarIncertoError(
      erro instanceof Error ? erro.message : "O envio do arquivo não foi confirmado.",
    );
  }
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

  const resultados = await Promise.allSettled(
    arquivosUnicos.map(async (arquivo) => {
      const { data, error } = await supabase.storage
        .from(arquivo.bucket)
        .remove([arquivo.caminho]);
      return !error && Array.isArray(data) && data.length === 1 &&
        data[0]?.name === arquivo.caminho;
    })
  );
  return resultados.every(resultado => resultado.status === "fulfilled" && resultado.value);
}

export async function desfazerPublicacaoParcialPublicar(
  obraId: string,
  arquivos: ArquivoStoragePublicar[],
  userId: string,
) {
  const obraIdLimpo = obraId.trim();
  let obraRemovida = !obraIdLimpo;

  if (obraIdLimpo) {
    if (!userId.trim()) return false;
    try {
      // O FK existente remove os capítulos na mesma transação. Nunca apagar
      // filhos antes de confirmar a remoção da obra preparada deste usuário.
      const { data: obrasRemovidas, error: erroRemoverObra } = await supabase
        .from("obras")
        .delete()
        .eq("id", obraIdLimpo)
        .eq("user_id", userId)
        .eq("publicado", false)
        .select("id");

      obraRemovida = !erroRemoverObra && Array.isArray(obrasRemovidas) &&
        obrasRemovidas.length === 1 && obrasRemovidas[0]?.id === obraIdLimpo;
    } catch {
      obraRemovida = false;
    }
  }

  if (obraRemovida) {
    return removerArquivosStoragePublicar(arquivos);
  }

  return obraRemovida;
}


