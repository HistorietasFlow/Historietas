import { criarAlvoBackupArquivoEdicaoObra } from "./editar-obra-backup-target";
import {
  salvarArquivoObraNoBackup,
  sincronizarBackupArquivosObras,
} from "./editar-obra-file-backup-storage";
import { atualizarObraNaListaLocalEdicao } from "./editar-obra-local-update";
import { salvarObrasDoUsuarioPreservandoOutrasContas } from "./editar-obra-local-work-storage";
import type { ObraLocal } from "../types";

type PersistirObraLocalEBackupEdicaoObraParams = Omit<
  Parameters<typeof atualizarObraNaListaLocalEdicao>[0],
  "titulo"
> & {
  userId: string;
  arquivoObraRemovidoManualmente: boolean;
  obraLocalAtual: ObraLocal | null;
  tituloFinal: string;
};

export function persistirObraLocalEBackupEdicaoObra({
  userId,
  arquivoObraRemovidoManualmente,
  obraLocalAtual,
  tituloFinal,
  ...dadosAtualizacao
}: PersistirObraLocalEBackupEdicaoObraParams) {
  const novasObras = atualizarObraNaListaLocalEdicao({
    ...dadosAtualizacao,
    titulo: tituloFinal,
  });
  const novasObrasDoUsuario =
    salvarObrasDoUsuarioPreservandoOutrasContas(novasObras, userId);

  if (arquivoObraRemovidoManualmente) {
    salvarArquivoObraNoBackup(
      criarAlvoBackupArquivoEdicaoObra({
        obraId: dadosAtualizacao.obraId,
        obraLocalAtual,
        tituloFinal,
      }),
      null,
      userId,
    );
  } else {
    sincronizarBackupArquivosObras(novasObrasDoUsuario, userId);
  }

  return novasObrasDoUsuario;
}
