import { useRouter } from "next/navigation";
import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import { criarLoginHrefNotificacoes } from "../lib/notificacoes-navigation-utils";
import { notificacaoEhCapitulo } from "../lib/notificacoes-filter-utils";
import {
  mesclarNotificacoes,
} from "../lib/notificacoes-merge-utils";
import type {
  NotificacaoLocal,
  ObraLocal,
} from "../lib/notificacoes-models";
import {
  criarNotificacoesDeCapitulos,
  notificacaoCapituloPertenceAObraSeguida,
} from "../lib/notificacoes-followed-chapters-utils";
import {
  carregarIdsNotificacoesApagadas,
  carregarNotificacoes,
  carregarObras,
  filtrarNotificacoesApagadas,
  prepararNotificacaoTexto,
  salvarNotificacoes,
} from "../lib/notificacoes-local-state-utils";
import {
  mesclarObrasPorIdSlug,
} from "../lib/notificacoes-record-normalizers";
import { carregarEstadoSupabaseNotificacoes } from "../lib/notificacoes-supabase-state-loader";
import { carregarNotificacoesComunidadeSupabase } from "../lib/notificacoes-supabase-community-loader";
import { carregarNotificacoesDiarioSupabase } from "../lib/notificacoes-supabase-diary-loader";
import { carregarNotificacoesDiretasSupabase } from "../lib/notificacoes-supabase-direct-loader";
import { carregarNotificacoesProblemasTecnicosSupabase } from "../lib/notificacoes-supabase-technical-issues-loader";
import {
  carregarObrasDasNotificacoesDiretasSupabase,
  carregarObrasPublicadasSupabase,
} from "../lib/notificacoes-supabase-work-loader";
import {
  CHAVE_OBRAS,
  CHAVE_OBRAS_SEGUIDAS,
  lerIdsLocalStorage,
  salvarJsonStorageUsuarioNotificacoes,
} from "../lib/notificacoes-storage-utils";

type UseNotificacoesInitialLoadProps = {
  definirNotificacoesNaoLidas: (total: number) => void;
  setCarregando: Dispatch<SetStateAction<boolean>>;
  setNotificacoes: Dispatch<SetStateAction<NotificacaoLocal[]>>;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setUsuarioNotificacoesId: Dispatch<SetStateAction<string>>;
};

export function useNotificacoesInitialLoad({
  definirNotificacoesNaoLidas,
  setCarregando,
  setNotificacoes,
  setObras,
  setUsuarioNotificacoesId,
}: UseNotificacoesInitialLoadProps) {
  const router = useRouter();
  // Os setters recebidos são estáveis; as dependências preservam literalmente o efeito original.
  useEffect(() => {
    let componenteAtivo = true;

    async function carregarDados() {
      let manterCarregando = false;
      let usuarioAutenticado = false;
      let usuarioAtualId = "";

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!componenteAtivo) {
          return;
        }

        if (erroUsuario || !dadosUsuario.user) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        usuarioAtualId = dadosUsuario.user.id;
        usuarioAutenticado = true;
        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);
        const obrasSupabase = await carregarObrasPublicadasSupabase();
        const estadoSupabase = await carregarEstadoSupabaseNotificacoes(
          carregarNotificacoesDiretasSupabase
        );
        const notificacoesDiretasSupabase = estadoSupabase?.notificacoesDiretas || [];
        const obrasDiretasSupabase =
          await carregarObrasDasNotificacoesDiretasSupabase(
            notificacoesDiretasSupabase
          );
        const idsNotificacoesApagadas =
          carregarIdsNotificacoesApagadas(usuarioAtualId);
        const obrasMescladas = mesclarObrasPorIdSlug(obrasLocais, [
          ...obrasSupabase,
          ...obrasDiretasSupabase,
        ]);
        const obrasSeguidasLocais = lerIdsLocalStorage(
          CHAVE_OBRAS_SEGUIDAS,
          usuarioAtualId
        );
        const obrasSeguidasIds = Array.from(
          new Set([
            ...obrasSeguidasLocais,
            ...(estadoSupabase?.obrasSeguidasIds || []),
          ])
        );
        const idsSeguidos = new Set(
          obrasSeguidasIds
            .map((id) => id.trim())
            .filter((id) => Boolean(id))
        );
        const obrasPorIdMescladas = new Map(
          obrasMescladas.map((obra) => [obra.id, obra])
        );
        const notificacoesLocaisFiltradas = notificacoesLocais.filter(
          (notificacao) =>
            !notificacaoEhCapitulo(notificacao) ||
            notificacaoCapituloPertenceAObraSeguida(
              notificacao,
              obrasPorIdMescladas,
              idsSeguidos,
              usuarioAtualId
            )
        );
        const notificacoesLidasIds = estadoSupabase?.notificacoesLidasIds || [];
        const notificacoesCapitulosSupabase = criarNotificacoesDeCapitulos(
          obrasMescladas,
          obrasSeguidasIds,
          notificacoesLidasIds,
          usuarioAtualId
        );
        const [
          notificacoesComunidadeSupabase,
          notificacoesDiarioSupabase,
          notificacoesProblemasTecnicosSupabase,
        ] = await Promise.all([
          carregarNotificacoesComunidadeSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesDiarioSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
          carregarNotificacoesProblemasTecnicosSupabase(
            usuarioAtualId,
            notificacoesLidasIds
          ),
        ]);
        const notificacoesMescladas = filtrarNotificacoesApagadas(
          mesclarNotificacoes(notificacoesLocaisFiltradas, [
            ...notificacoesCapitulosSupabase,
            ...notificacoesDiretasSupabase,
            ...notificacoesComunidadeSupabase,
            ...notificacoesDiarioSupabase,
            ...notificacoesProblemasTecnicosSupabase,
          ]),
          idsNotificacoesApagadas
        ).map((notificacao) => prepararNotificacaoTexto(notificacao));

        try {
          salvarJsonStorageUsuarioNotificacoes(
            CHAVE_OBRAS,
            usuarioAtualId,
            obrasMescladas
          );
          salvarNotificacoes(notificacoesMescladas, usuarioAtualId);
        } catch {
          // Se o navegador bloquear localStorage, a página continua com o estado em memória.
        }

        if (!componenteAtivo) {
          return;
        }

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasMescladas);
        setNotificacoes(notificacoesMescladas);
        definirNotificacoesNaoLidas(
          notificacoesMescladas.filter((notificacao) => !notificacao.lida).length
        );
      } catch {
        if (!componenteAtivo) {
          return;
        }

        if (!usuarioAutenticado || !usuarioAtualId) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasLocais);
        setNotificacoes(notificacoesLocais);
        definirNotificacoesNaoLidas(
          notificacoesLocais.filter((notificacao) => !notificacao.lida).length
        );
      } finally {
        if (componenteAtivo && !manterCarregando) {
          setCarregando(false);
        }
      }
    }

    void carregarDados();

    return () => {
      componenteAtivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, definirNotificacoesNaoLidas]);
}
