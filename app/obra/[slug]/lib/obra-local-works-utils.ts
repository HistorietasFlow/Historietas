import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
} from "../../../../lib/historietasAdultContent";
import {
  carregarBackupArquivosObras,
  sincronizarBackupArquivosObras,
} from "./obra-file-backup-utils";
import {
  normalizarObraLocal,
  restaurarArquivoObraComBackup,
  type ObraLocal,
} from "./obra-data-utils";
import { lerStorageUsuarioObraPublica } from "./obra-user-storage";

const LOCAL_WORKS_STORAGE_KEY = "historietas-obras";

export function carregarObrasLocaisComBackup(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  const obrasLocaisTexto = lerStorageUsuarioObraPublica(
    LOCAL_WORKS_STORAGE_KEY,
    userIdLimpo
  );
  const obrasLocaisJson: unknown = obrasLocaisTexto
    ? JSON.parse(obrasLocaisTexto)
    : [];

  const backupArquivosObras = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadas = Array.isArray(obrasLocaisJson)
    ? obrasLocaisJson
        .map((obra, index) =>
          normalizarObraLocal(
            obra as Partial<ObraLocal> & Record<string, unknown>,
            index
          )
        )
        .map((obraLocal) =>
          restaurarArquivoObraComBackup(obraLocal, backupArquivosObras)
        )
    : [];

  const obrasPublicasLocais = obrasNormalizadas.filter((obraLocal) => {
    if (
      ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
      ehClassificacao18(obraLocal.classificacaoIndicativa)
    ) {
      return false;
    }

    return obraLocal.publicado && obraLocal.capitulos.length > 0;
  });

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);

  return obrasPublicasLocais;
}
