import { supabase } from "../../../lib/supabase/client";

export type ArquivoStoragePainel = {
  bucket: "capas-obras" | "arquivos-obras";
  caminho: string;
};

export async function removerArquivosStorageObraExcluidaPainel(
  arquivos: ArquivoStoragePainel[]
) {
  const arquivosUnicos = Array.from(
    new Map(
      arquivos
        .filter((arquivo) => Boolean(arquivo.caminho.trim()))
        .map((arquivo) => [
          `${arquivo.bucket}:${arquivo.caminho.trim()}`,
          {
            bucket: arquivo.bucket,
            caminho: arquivo.caminho.trim(),
          },
        ])
    ).values()
  );

  const resultados = await Promise.allSettled(
    arquivosUnicos.map(async (arquivo) => {
      const { error } = await supabase.storage
        .from(arquivo.bucket)
        .remove([arquivo.caminho]);

      if (error) {
        throw new Error(error.message);
      }
    })
  );

  resultados.forEach((resultado, index) => {
    if (resultado.status === "rejected") {
      console.warn(
        `Não consegui remover o arquivo de ${arquivosUnicos[index]?.bucket}:`,
        resultado.reason
      );
    }
  });
}
