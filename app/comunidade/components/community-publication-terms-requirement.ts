import {
  criarHrefAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../../lib/aceiteTermos";
import type { UsuarioComunidade } from "./community-user";

type GarantirAceiteAntesDePublicarComunidadeParams = {
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  router: {
    push: (href: string) => void;
  };
};

export async function garantirAceiteAntesDePublicarComunidade({
  exigirLogin,
  usuario,
  router,
}: GarantirAceiteAntesDePublicarComunidadeParams): Promise<boolean> {
  if (!exigirLogin() || !usuario) {
    return false;
  }

  const statusAceite = await verificarAceiteTermosPublicacao();

  if (statusAceite.aceito) {
    return true;
  }

  router.push(criarHrefAceiteTermos("/comunidade"));
  return false;
}
