import type { Dispatch, SetStateAction } from "react";
import {
  restaurarArquivoObraComBackup,
} from "../lib/adicionar-capitulo-file-backup-utils";
import {
  carregarBackupArquivosObras,
} from "../lib/adicionar-capitulo-file-backup-storage";
import {
  carregarObrasLocais,
  salvarObrasAdicionarCapituloStorage,
} from "../lib/adicionar-capitulo-local-work-storage";
import { atualizarObrasLocaisDoUsuario } from "../lib/adicionar-capitulo-ownership-utils";
import { normalizarObra } from "../lib/adicionar-capitulo-work-normalizer";

type ObraLocalAdicionarCapitulo = ReturnType<typeof carregarObrasLocais>[number];

type UseAdicionarCapituloLocalPersistenceProps = {
  usuarioIdLogado: string;
  setObras: Dispatch<SetStateAction<ObraLocalAdicionarCapitulo[]>>;
};

export function useAdicionarCapituloLocalPersistence({
  usuarioIdLogado,
  setObras,
}: UseAdicionarCapituloLocalPersistenceProps) {
  function salvarObras(novasObras: ObraLocalAdicionarCapitulo[]) {
    const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);
    const obrasNormalizadas = novasObras.map((obra, index) =>
      restaurarArquivoObraComBackup(
        normalizarObra(obra, index),
        backupArquivosObras,
      ),
    );

    if (!usuarioIdLogado) {
      setObras(obrasNormalizadas);
      return;
    }

    let todasObrasLocaisAtuais: ObraLocalAdicionarCapitulo[] = [];

    try {
      todasObrasLocaisAtuais = carregarObrasLocais(usuarioIdLogado);
    } catch {
      todasObrasLocaisAtuais = [];
    }

    const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
      todasObrasLocaisAtuais,
      obrasNormalizadas,
      usuarioIdLogado,
    );

    salvarObrasAdicionarCapituloStorage(
      obrasLocaisAtualizadas,
      usuarioIdLogado,
    );
    setObras(obrasNormalizadas);
  }

  return { salvarObras };
}
