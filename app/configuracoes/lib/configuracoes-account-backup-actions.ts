import { criarBackupLocal } from "./configuracoes-account-backup";
import { baixarBackupConfiguracoes } from "./configuracoes-account-backup-download";
import { copiarTextoConfiguracoes } from "./configuracoes-copy-utils";
import type {
  MostrarMensagemAcaoConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "./configuracoes-callback-types";

type AcoesBackupConfiguracoes = {
  usuarioIdLogado: string;
  setMensagemAcao: (mensagem: null) => void;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};

export async function copiarBackupConfiguracoes({
  usuarioIdLogado,
  setMensagemAcao,
  mostrarMensagemAcao,
  traduzirTexto,
}: AcoesBackupConfiguracoes) {
  setMensagemAcao(null);

  try {
    await copiarTextoConfiguracoes(criarBackupLocal(usuarioIdLogado));
    mostrarMensagemAcao(
      "sucesso",
      traduzirTexto(
        "Dados copiados para a área de transferência.",
        "Data copied to the clipboard.",
        "Datos copiados al portapapeles.",
      ),
    );
  } catch {
    mostrarMensagemAcao(
      "erro",
      traduzirTexto(
        "Não foi possível copiar os dados.",
        "The data could not be copied.",
        "No se pudieron copiar los datos.",
      ),
    );
  }
}

export function baixarBackupContaConfiguracoes({
  usuarioIdLogado,
  setMensagemAcao,
  mostrarMensagemAcao,
  traduzirTexto,
}: AcoesBackupConfiguracoes) {
  setMensagemAcao(null);

  try {
    const backup = criarBackupLocal(usuarioIdLogado);
    baixarBackupConfiguracoes(backup);

    mostrarMensagemAcao(
      "sucesso",
      traduzirTexto(
        "Backup preparado e download iniciado.",
        "Backup prepared and download started.",
        "Copia preparada y descarga iniciada.",
      ),
    );
  } catch {
    mostrarMensagemAcao(
      "erro",
      traduzirTexto(
        "Não foi possível baixar o backup.",
        "The backup could not be downloaded.",
        "No se pudo descargar la copia.",
      ),
    );
  }
}
