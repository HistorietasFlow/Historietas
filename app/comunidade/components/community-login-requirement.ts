import type { Dispatch, SetStateAction } from "react";
import { criarLoginHrefComunidade } from "./community-login-link";
import type { UsuarioComunidade } from "./community-user";

type ExigirLoginParams = {
  usuario: UsuarioComunidade | null;
  setErro: Dispatch<SetStateAction<string>>;
  router: {
    push: (href: string) => void;
  };
};

export function exigirLogin({
  usuario,
  setErro,
  router,
}: ExigirLoginParams): boolean {
  if (usuario) {
    return true;
  }

  setErro("Entre na sua conta para participar da Comunidade.");
  router.push(criarLoginHrefComunidade());
  return false;
}
