import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { criarLoginHrefPerfilAutor } from "../lib/profile-login-route-utils";

export function usePerfilAutorLoginRedirect({
  redirecionandoParaLogin,
}: {
  redirecionandoParaLogin: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!redirecionandoParaLogin) {
      return;
    }

    router.replace(criarLoginHrefPerfilAutor());
  }, [redirecionandoParaLogin, router]);
}
