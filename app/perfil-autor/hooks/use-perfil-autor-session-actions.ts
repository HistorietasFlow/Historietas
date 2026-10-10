import { supabase } from "../../../lib/supabase/client";
import { criarLoginHrefPerfilAutor } from "../lib/profile-login-route-utils";

export function usePerfilAutorSessionActions({
  router,
  setMensagemAcao,
  setMenuPerfilAberto,
}: {
  router: { push: (href: string) => void };
  setMensagemAcao: (mensagem: string) => void;
  setMenuPerfilAberto: (aberto: boolean) => void;
}) {
  function avisarLoginNecessario(mensagem: string) {
    setMensagemAcao(mensagem);
    router.push(criarLoginHrefPerfilAutor());
  }

  async function sairDaConta() {
    setMenuPerfilAberto(false);
  
    try {
      const { error } = await supabase.auth.signOut();
  
      if (error) {
        setMensagemAcao("N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.");
        return;
      }
  
      router.push("/login");
    } catch {
      setMensagemAcao("N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.");
    }
  }

  return {
    avisarLoginNecessario,
    sairDaConta,
  };
}
