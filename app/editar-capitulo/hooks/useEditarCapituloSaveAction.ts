import type { Dispatch, FormEvent, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { atualizarNotificacaoCapituloSupabase } from "../actions/atualizar-notificacao-capitulo";
import { carregarNomeProfileEditarCapitulo } from "../actions/carregar-nome-profile-editar-capitulo";
import { registrarDiarioEdicaoCapitulo } from "../actions/registrar-diario-edicao-capitulo";
import {
  carregarBackupArquivosObras,
  restaurarArquivoObraComBackup,
} from "../lib/editar-capitulo-file-backup-utils";
import { aplicarEdicaoCapituloNasObrasLocais } from "../lib/editar-capitulo-local-save-mutation";
import { salvarObrasEditarCapituloStorage } from "../lib/editar-capitulo-local-work-storage";
import { criarLoginHrefEditarCapitulo } from "../lib/editar-capitulo-route-utils";
import { validarCapitulo } from "../lib/editar-capitulo-validation";
import { normalizarObra } from "../lib/editar-capitulo-work-normalizer";

type ObraLocalEditarCapitulo = ReturnType<
  typeof salvarObrasEditarCapituloStorage
>[number];
type CapituloLocalEditarCapitulo =
  ObraLocalEditarCapitulo["capitulos"][number];

type UseEditarCapituloSaveActionProps = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  obraId: string;
  capituloId: string;
  obras: ObraLocalEditarCapitulo[];
  obraAtual: ObraLocalEditarCapitulo | null;
  capituloAtual: CapituloLocalEditarCapitulo | null;
  numeroCapitulo: number;
  titulo: string;
  texto: string;
  processando: boolean;
  excluindo: boolean;
  setObras: Dispatch<SetStateAction<ObraLocalEditarCapitulo[]>>;
  setProcessando: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setTipoErro: Dispatch<SetStateAction<"salvar" | "excluir">>;
  setSalvou: Dispatch<SetStateAction<boolean>>;
};

export function useEditarCapituloSaveAction({
  router,
  obraId,
  capituloId,
  obras,
  obraAtual,
  capituloAtual,
  numeroCapitulo,
  titulo,
  texto,
  processando,
  excluindo,
  setObras,
  setProcessando,
  setErro,
  setTipoErro,
  setSalvou,
}: UseEditarCapituloSaveActionProps) {
  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (processando || excluindo || !obraAtual || !capituloAtual) {
      return;
    }

    const erroValidacao = validarCapitulo(
      titulo,
      texto,
      numeroCapitulo,
    );

    if (erroValidacao) {
      setErro(erroValidacao);
      setSalvou(false);
      return;
    }

    setProcessando(true);
    setErro("");
    setTipoErro("salvar");
    setSalvou(false);

    const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo || 1}`;
    const textoFinal = texto.trim();

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || "";

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefEditarCapitulo(obraId, capituloId));
        throw new Error("Entre na sua conta antes de editar o capítulo.");
      }

      const autorIdObra = obraAtual.autorId?.trim() || "";

      if (autorIdObra && autorIdObra !== userId) {
        throw new Error("Você não tem permissão para editar este capítulo.");
      }

      const nomeProfileAutor = await carregarNomeProfileEditarCapitulo(userId);
      const autorFinalObra = nomeProfileAutor || obraAtual.autor;
      const atualizadoEm = new Date().toISOString();
      const registroSupabase =
        idObraSupabaseValido(obraId) && idObraSupabaseValido(capituloId);
      let numeroCapituloFinal = numeroCapitulo || 1;

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
            `Não consegui confirmar sua permissão para editar o capítulo: ${erroObraAutorizada.message}`,
          );
        }

        if (!obraAutorizada?.id) {
          throw new Error("Você não tem permissão para editar este capítulo.");
        }

        const { data: capituloAtualizado, error: erroAtualizarCapitulo } =
          await supabase
            .from("capitulos")
            .update({
              titulo: tituloFinal,
              texto: textoFinal,
              atualizado_em: atualizadoEm,
            })
            .eq("id", capituloId)
            .eq("obra_id", obraId)
            .eq("user_id", userId)
            .select("id, ordem")
            .maybeSingle();

        if (erroAtualizarCapitulo) {
          throw new Error(
            `Não consegui atualizar o capítulo no Supabase: ${erroAtualizarCapitulo.message}`,
          );
        }

        if (!capituloAtualizado?.id) {
          throw new Error(
            "Não consegui confirmar a atualização do capítulo no Supabase.",
          );
        }

        if (
          typeof capituloAtualizado.ordem === "number" &&
          Number.isInteger(capituloAtualizado.ordem) &&
          capituloAtualizado.ordem > 0
        ) {
          numeroCapituloFinal = capituloAtualizado.ordem;
        }

        if (nomeProfileAutor) {
          const { error: erroAutorObra } = await supabase
            .from("obras")
            .update({
              autor: nomeProfileAutor,
              atualizado_em: atualizadoEm,
            })
            .eq("id", obraId)
            .eq("user_id", userId);

          if (erroAutorObra) {
            console.warn(
              "O capítulo foi salvo, mas o autor da obra não sincronizou no Supabase:",
              erroAutorObra.message,
            );
          }
        }
      }

      const { novasObras, obraAtualizadaParaAcoes } =
        aplicarEdicaoCapituloNasObrasLocais({
          obras,
          obraId,
          capituloId,
          tituloFinal,
          textoFinal,
          numeroCapituloFinal,
          autorFinalObra,
          userId,
        });

      const backupArquivos = carregarBackupArquivosObras(userId);
      const novasObrasComBackup = novasObras.map((obra, index) =>
        restaurarArquivoObraComBackup(
          normalizarObra(obra, index),
          backupArquivos,
        ),
      );
      const novasObrasDoUsuario = salvarObrasEditarCapituloStorage(
        novasObrasComBackup,
        userId,
      );
      const obraAtualizadaFinal =
        novasObrasDoUsuario.find((obra) => obra.id === obraId) ||
        obraAtualizadaParaAcoes || {
          ...obraAtual,
          autor: autorFinalObra,
        };

      setObras(novasObrasDoUsuario);

      if (registroSupabase) {
        await registrarDiarioEdicaoCapitulo({
          userId,
          obra: obraAtualizadaFinal,
          capituloId,
          tituloCapitulo: tituloFinal,
          numeroCapitulo: numeroCapituloFinal,
          atualizadoEm,
        });

        await atualizarNotificacaoCapituloSupabase({
          userId,
          obra: obraAtualizadaFinal,
          capituloId,
          tituloCapitulo: tituloFinal,
          numeroCapitulo: numeroCapituloFinal,
          atualizadoEm,
        });
      }

      setSalvou(true);
    } catch (erroDesconhecido) {
      const mensagem =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar as alterações. Atualize a página e tente novamente.";

      setErro(mensagem);
      setSalvou(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setProcessando(false);
    }
  }

  return { salvarEdicao };
}
