import { supabase } from "../../../lib/supabase/client";
import type { ArquivoStorageEdicaoObra } from "./editar-obra-remote-storage";
import { criarPayloadAtualizacaoObra } from "./editar-obra-update-payload";
import { escreverMetadadosObra } from "./editar-obra-editorial-write";

type AtualizarObraRemotaEdicaoObraParams = Parameters<typeof criarPayloadAtualizacaoObra>[0] & {
  obraId: string;
  userId: string;
  arquivosNovosEnviados: ArquivoStorageEdicaoObra[];
  editorial?: Parameters<typeof escreverMetadadosObra>[1]["editorial"];
  vigente?: () => boolean;
};

export async function atualizarObraRemotaEdicaoObra({
  obraId, userId, arquivosNovosEnviados: _arquivosNovosEnviados, editorial, vigente, ...dadosAtualizacao
}: AtualizarObraRemotaEdicaoObraParams) {
  // Resultado incerto nunca autoriza compensação. Preservar uploads em TODOS
  // os resultados não confirmados; não há recibo/reconciliador físico aqui.
  void _arquivosNovosEnviados;
  return escreverMetadadosObra(supabase, {
    id: obraId, userId, payload: criarPayloadAtualizacaoObra(dadosAtualizacao), editorial, vigente,
  });
}
