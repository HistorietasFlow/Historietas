import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import {
  normalizarArquivoObra,
  type ArquivoObraAdicionarCapitulo,
} from "./adicionar-capitulo-file-normalizer";

type ObraParaBackupAdicionarCapitulo = {
  id: string;
  slug: string;
  titulo: string;
  link: string;
};

type ObraComArquivoBackupAdicionarCapitulo =
  ObraParaBackupAdicionarCapitulo & {
    arquivoObra?: unknown;
  };

type BackupArquivosAdicionarCapitulo = Record<string, unknown>;

export function obterChavesBackupArquivoAdicionarCapitulo(
  obra: ObraParaBackupAdicionarCapitulo,
) {
  return Array.from(
    new Set(
      [
        `id:${obra.id}`,
        obra.id,
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ].filter((chave) => Boolean(chave.trim())),
    ),
  );
}

export function restaurarArquivoObraComBackup<
  T extends ObraComArquivoBackupAdicionarCapitulo,
>(obra: T, backup: BackupArquivosAdicionarCapitulo): T {
  if (obra.arquivoObra) {
    return obra;
  }

  const arquivoBackup = obterChavesBackupArquivoAdicionarCapitulo(obra)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraAdicionarCapitulo => Boolean(arquivo));

  if (!arquivoBackup) {
    return obra;
  }

  return {
    ...obra,
    arquivoObra: arquivoBackup,
  };
}
