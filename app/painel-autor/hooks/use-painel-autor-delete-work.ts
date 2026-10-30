"use client";

import type {
  Dispatch,
  SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  criarSlugBase,
  idObraSupabaseValido,
} from "../../../lib/utils";
import type { HistorietasLanguage } from "../../../lib/i18n";
import type {
  CapituloLocal,
  ObraLocal,
} from "../lib/painel-autor-types";
import { normalizarIdUsuarioPainel } from "../lib/painel-autor-ownership-utils";
import {
  caminhoStoragePertenceAoUsuarioPainel,
  obterCaminhoStoragePainel,
} from "../lib/painel-autor-file-storage-path-utils";
import { criarLoginHrefPainelAutor } from "../lib/painel-autor-route-utils";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  FOLLOW_STORAGE_KEY,
  STORAGE_KEY,
} from "../lib/painel-autor-storage-keys";
import {
  salvarColecaoAposExcluirPainel,
  salvarJsonStorageUsuarioPainel,
} from "../lib/painel-autor-storage-utils";
import { removerObraDaColecaoPainel } from "../lib/painel-autor-collection-utils";
import { traduzirTextoPainelAutor } from "../lib/painel-autor-translations";
import {
  removerArquivosStorageObraExcluidaPainel,
  type ArquivoStoragePainel,
} from "../lib/painel-autor-deleted-work-storage-cleanup";
import { removerReferenciasSupabaseObraExcluidaPainel } from "../lib/painel-autor-deleted-work-supabase-cleanup";
import { limparReferenciasLocaisObraExcluidaPainel } from "../lib/painel-autor-deleted-work-local-cleanup";

type RouterPainelAutorDeleteWork = {
  replace: (href: string) => void;
};

type UsePainelAutorDeleteWorkProps = {
  router: RouterPainelAutorDeleteWork;
  language: HistorietasLanguage;
  usuarioIdLogado: string;
  obras: ObraLocal[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setObrasFavoritas: Dispatch<SetStateAction<string[]>>;
  setObrasConcluidas: Dispatch<SetStateAction<string[]>>;
};

export function usePainelAutorDeleteWork({
  router,
  language,
  usuarioIdLogado,
  obras,
  obrasFavoritas,
  obrasConcluidas,
  setObras,
  setObrasFavoritas,
  setObrasConcluidas,
}: UsePainelAutorDeleteWorkProps) {
  async function excluirObra(obraId: string, tituloObra: string) {
    const confirmar = window.confirm(
      traduzirTextoPainelAutor(
        `Tem certeza que deseja excluir a obra "${tituloObra}"? Todos os capítulos e registros dessa obra serão removidos. Essa ação não pode ser desfeita.`,
        language,
      ),
    );

    if (!confirmar) {
      return;
    }

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();
      const userId = dadosUsuario.user?.id || usuarioIdLogado;

      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefPainelAutor());
        return;
      }

      const obraExcluida = obras.find((obra) => obra.id === obraId) || {
        id: obraId,
        slug: criarSlugBase(tituloObra),
        titulo: tituloObra,
        link: `/obra/${criarSlugBase(tituloObra)}`,
        capa: "",
        arquivoObra: null,
        capitulos: [] as CapituloLocal[],
      };

      if (idObraSupabaseValido(obraId)) {
        const { data: obraEncontrada, error: erroAutorizacao } = await supabase
          .from("obras")
          .select("id,user_id,capa_url,arquivo_url")
          .eq("id", obraId)
          .limit(1)
          .maybeSingle();

        if (erroAutorizacao) {
          throw new Error(
            `Não consegui confirmar sua permissão para excluir esta obra: ${erroAutorizacao.message}`
          );
        }

        const obraStorage =
          obraEncontrada;

        /*
         * Uma obra local também pode possuir um ID no formato UUID.
         * Nesse caso, ela não existe em public.obras e deve ser removida
         * apenas do armazenamento local, sem gerar erro de permissão.
         */
        if (obraStorage?.id) {
          const donoObraId = normalizarIdUsuarioPainel(
            obraStorage.user_id || ""
          );
          const usuarioAtualId = normalizarIdUsuarioPainel(userId);

          if (!donoObraId || donoObraId !== usuarioAtualId) {
            window.alert(
              traduzirTextoPainelAutor(
                "Você não tem permissão para excluir esta obra.",
                language
              )
            );
            return;
          }

          const caminhoCapa = obterCaminhoStoragePainel(
            "capas-obras",
            obraStorage.capa_url?.trim() || obraExcluida.capa || ""
          );
          const caminhoArquivoObra = obterCaminhoStoragePainel(
            "arquivos-obras",
            obraStorage.arquivo_url?.trim() ||
              obraExcluida.arquivoObra?.conteudo ||
              ""
          );
          const arquivosStorageParaRemover: ArquivoStoragePainel[] = [
            {
              bucket: "capas-obras",
              caminho: caminhoStoragePertenceAoUsuarioPainel(
                caminhoCapa,
                userId
              )
                ? caminhoCapa
                : "",
            },
            {
              bucket: "arquivos-obras",
              caminho: caminhoStoragePertenceAoUsuarioPainel(
                caminhoArquivoObra,
                userId
              )
                ? caminhoArquivoObra
                : "",
            },
          ];

          await removerReferenciasSupabaseObraExcluidaPainel(
            userId,
            obraId,
            obraExcluida.capitulos.map((capitulo) => capitulo.id)
          );

          const { error: erroCapitulos } = await supabase
            .from("capitulos")
            .delete()
            .eq("obra_id", obraId)
            .eq("user_id", userId);

          if (erroCapitulos) {
            throw new Error(
              `Não consegui excluir os capítulos da obra: ${erroCapitulos.message}`
            );
          }

          const { data: obraRemovida, error: erroObra } = await supabase
            .from("obras")
            .delete()
            .eq("id", obraId)
            .eq("user_id", userId)
            .select("id")
            .maybeSingle();

          if (erroObra) {
            throw new Error(
              `Não consegui concluir a exclusão da obra: ${erroObra.message}`
            );
          }

          if (!obraRemovida?.id) {
            throw new Error(
              "A exclusão da obra não foi confirmada pelo banco de dados."
            );
          }

          await removerArquivosStorageObraExcluidaPainel(
            arquivosStorageParaRemover
          );
        }
      }

      const novasObras = obras.filter((obra) => obra.id !== obraId);
      const novasObrasFavoritas = removerObraDaColecaoPainel(
        obrasFavoritas,
        obraExcluida
      );
      const novasObrasConcluidas = removerObraDaColecaoPainel(
        obrasConcluidas,
        obraExcluida
      );

      limparReferenciasLocaisObraExcluidaPainel(obraExcluida, userId, {
        chavesColecoes: [
          FOLLOW_STORAGE_KEY,
          FAVORITES_STORAGE_KEY,
          COMPLETED_STORAGE_KEY,
        ],
      });
      salvarJsonStorageUsuarioPainel(STORAGE_KEY, userId, novasObras);
      salvarColecaoAposExcluirPainel(
        FAVORITES_STORAGE_KEY,
        userId,
        novasObrasFavoritas
      );
      salvarColecaoAposExcluirPainel(
        COMPLETED_STORAGE_KEY,
        userId,
        novasObrasConcluidas
      );

      setObras(novasObras);
      setObrasFavoritas(novasObrasFavoritas);
      setObrasConcluidas(novasObrasConcluidas);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não consegui excluir a obra agora.";

      console.warn(
        `Não consegui excluir a obra no Estúdio: ${mensagem}`
      );
      window.alert(traduzirTextoPainelAutor(mensagem, language));
    }
  }

  return { excluirObra };
}
