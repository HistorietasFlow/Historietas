import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { idObraSupabaseValido } from "../../../lib/utils";
import { criarMensagemConfirmacaoExclusaoCapitulo } from "../lib/editar-capitulo-delete-message";
import { removerCapituloDasObrasLocais } from "../lib/editar-capitulo-local-delete-mutation";
import { salvarObrasEditarCapituloStorage } from "../lib/editar-capitulo-local-work-storage";
import { criarLoginHrefEditarCapitulo } from "../lib/editar-capitulo-route-utils";

type ObraLocalEditarCapitulo = ReturnType<
  typeof salvarObrasEditarCapituloStorage
>[number];
type CapituloLocalEditarCapitulo =
  ObraLocalEditarCapitulo["capitulos"][number];

type UseEditarCapituloDeleteActionProps = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  language: HistorietasLanguage;
  obraId: string;
  capituloId: string;
  obras: ObraLocalEditarCapitulo[];
  obraAtual: ObraLocalEditarCapitulo | null;
  capituloAtual: CapituloLocalEditarCapitulo | null;
  processando: boolean;
  excluindo: boolean;
  setObras: Dispatch<SetStateAction<ObraLocalEditarCapitulo[]>>;
  setExcluindo: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setTipoErro: Dispatch<SetStateAction<"salvar" | "excluir">>;
  setSalvou: Dispatch<SetStateAction<boolean>>;
};

export function useEditarCapituloDeleteAction({
  router,
  language,
  obraId,
  capituloId,
  obras,
  obraAtual,
  capituloAtual,
  processando,
  excluindo,
  setObras,
  setExcluindo,
  setErro,
  setTipoErro,
  setSalvou,
}: UseEditarCapituloDeleteActionProps) {
  async function excluirCapitulo() {
    if (processando || excluindo || !obraAtual || !capituloAtual) {
      return;
    }

    const confirmou = window.confirm(
      criarMensagemConfirmacaoExclusaoCapitulo(
        capituloAtual.titulo,
        language,
      ),
    );

    if (!confirmou) {
      return;
    }

    setExcluindo(true);
    setErro("");
    setTipoErro("excluir");
    setSalvou(false);

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || "";

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefEditarCapitulo(obraId, capituloId));
        throw new Error("Entre na sua conta antes de excluir o capítulo.");
      }

      const autorIdObra = obraAtual.autorId?.trim() || "";

      if (autorIdObra && autorIdObra !== userId) {
        throw new Error("Você não tem permissão para excluir este capítulo.");
      }

      const registroSupabase =
        idObraSupabaseValido(obraId) && idObraSupabaseValido(capituloId);

      if (registroSupabase) {
        const { data: obraAutorizada, error: erroObraAutorizada } =
          await supabase
            .from("obras")
            .select("id")
            .eq("id", obraId)
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        if (erroObraAutorizada) {
          throw new Error(
            `Não consegui confirmar sua permissão para excluir o capítulo: ${erroObraAutorizada.message}`,
          );
        }

        if (!obraAutorizada?.id) {
          throw new Error("Você não tem permissão para excluir este capítulo.");
        }

        const { data: capituloExcluido, error: erroExcluirCapitulo } =
          await supabase
            .from("capitulos")
            .delete()
            .eq("id", capituloId)
            .eq("obra_id", obraId)
            .eq("user_id", userId)
            .select("id")
            .maybeSingle();

        if (erroExcluirCapitulo) {
          throw new Error(
            `Não consegui excluir o capítulo no Supabase: ${erroExcluirCapitulo.message}`,
          );
        }

        if (!capituloExcluido?.id) {
          throw new Error(
            "Não consegui confirmar a exclusão do capítulo no Supabase.",
          );
        }
      }

      const novasObras = removerCapituloDasObrasLocais({
        obras,
        obraId,
        capituloId,
      });

      const novasObrasDoUsuario = salvarObrasEditarCapituloStorage(
        novasObras,
        userId,
      );

      setObras(novasObrasDoUsuario);
      router.replace("/painel-autor");
      router.refresh();
    } catch (erroDesconhecido) {
      const mensagem =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui excluir o capítulo. Atualize a página e tente novamente.";

      setErro(mensagem);
      setTipoErro("excluir");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setExcluindo(false);
    }
  }

  return { excluirCapitulo };
}
