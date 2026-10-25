import {
  carregarBackupArquivosObras,
  restaurarArquivoObraComBackup,
  sincronizarBackupArquivosObras,
} from "./editar-capitulo-file-backup-utils";
import {
  lerStorageUsuarioEditarCapitulo,
  salvarJsonStorageUsuarioEditarCapitulo,
} from "./editar-capitulo-storage-utils";
import { normalizarObra } from "./editar-capitulo-work-normalizer";

type ObraNormalizada = ReturnType<typeof normalizarObra>;
type ObraParaNormalizar = Parameters<typeof normalizarObra>[0];
type ObraComAutorId = {
  autorId?: string;
};

const STORAGE_KEY = "historietas-obras";

export function obraPertenceAoUsuarioEditarCapitulo(
  obra: ObraComAutorId,
  userId: string,
) {
  const usuarioId = userId.trim();
  const autorId = obra.autorId?.trim() || "";

  return Boolean(usuarioId && autorId === usuarioId);
}

export function carregarObrasLocaisNormalizadas(userId = "") {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [] as ObraNormalizada[];
  }

  const obrasSalvasTexto = lerStorageUsuarioEditarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
  );
  let obrasSalvasJson: unknown = [];

  try {
    obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
  } catch {
    obrasSalvasJson = [];
  }

  const backupArquivos = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadasBase: ObraNormalizada[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        normalizarObra(obra as ObraParaNormalizar, index),
      )
    : [];

  const obrasNormalizadas: ObraNormalizada[] = obrasNormalizadasBase
    .map((obra) => restaurarArquivoObraComBackup(obra, backupArquivos))
    .map((obra) =>
      userIdLimpo
        ? {
            ...obra,
            autorId: obra.autorId?.trim() || userIdLimpo,
          }
        : obra,
    )
    .filter((obra) =>
      userIdLimpo ? obraPertenceAoUsuarioEditarCapitulo(obra, userIdLimpo) : true,
    );

  sincronizarBackupArquivosObras(obrasNormalizadas, userIdLimpo);
  salvarJsonStorageUsuarioEditarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
    obrasNormalizadas,
  );

  return obrasNormalizadas;
}

export function salvarObrasEditarCapituloStorage(
  obrasDoUsuario: (ObraParaNormalizar & ObraComAutorId)[],
  userId: string,
) {
  const usuarioId = userId.trim();

  if (!usuarioId) {
    return [] as ObraNormalizada[];
  }

  const obrasDoUsuarioNormalizadas = obrasDoUsuario
    .map((obra, index) =>
      normalizarObra(
        {
          ...obra,
          autorId: obra.autorId?.trim() || usuarioId,
        },
        index,
      ),
    )
    .filter((obra) => obraPertenceAoUsuarioEditarCapitulo(obra, usuarioId));

  sincronizarBackupArquivosObras(obrasDoUsuarioNormalizadas, usuarioId);
  salvarJsonStorageUsuarioEditarCapitulo(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuarioNormalizadas,
  );

  return obrasDoUsuarioNormalizadas;
}
