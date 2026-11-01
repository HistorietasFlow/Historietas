import { supabase } from "../../../lib/supabase/client";
import {
  removerArquivosStorageEdicaoObra,
  type ArquivoStorageEdicaoObra,
} from "./editar-obra-remote-storage";
import { criarPayloadAtualizacaoObra } from "./editar-obra-update-payload";

type AtualizarObraRemotaEdicaoObraParams = Parameters<
  typeof criarPayloadAtualizacaoObra
>[0] & {
  obraId: string;
  userId: string;
  arquivosNovosEnviados: ArquivoStorageEdicaoObra[];
};

export async function atualizarObraRemotaEdicaoObra({
  obraId,
  userId,
  arquivosNovosEnviados,
  ...dadosAtualizacao
}: AtualizarObraRemotaEdicaoObraParams) {
  try {
    const { data: obraAtualizadaSupabase, error: erroAtualizarObra } =
      await supabase
        .from("obras")
        .update(criarPayloadAtualizacaoObra(dadosAtualizacao))
        .eq("id", obraId)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

    if (erroAtualizarObra) {
      throw new Error(
        `Não consegui atualizar a obra no Supabase: ${erroAtualizarObra.message}`,
      );
    }

    if (!obraAtualizadaSupabase?.id) {
      throw new Error(
        "Não consegui confirmar a atualização da obra no Supabase.",
      );
    }
  } catch (erroSupabase) {
    await removerArquivosStorageEdicaoObra(
      arquivosNovosEnviados.map((arquivo) => ({
        bucket: arquivo.bucket,
        caminho: arquivo.caminho,
      })),
    );

    const mensagemSupabase =
      erroSupabase instanceof Error
        ? erroSupabase.message
        : "Não consegui atualizar a obra no Supabase.";

    throw new Error(mensagemSupabase);
  }
}
