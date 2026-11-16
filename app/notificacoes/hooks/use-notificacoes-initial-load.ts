import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import { criarLoginHrefNotificacoes } from "../lib/notificacoes-navigation-utils";
import { notificacaoEhCapitulo } from "../lib/notificacoes-filter-utils";
import {
  mesclarNotificacoes,
  preservarLeituraAlteradaDuranteCarga,
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
  setSolicitacaoRespondendoId: Dispatch<SetStateAction<string>>;
};

export function useNotificacoesInitialLoad({
  definirNotificacoesNaoLidas,
  setCarregando,
  setNotificacoes,
  setObras,
  setUsuarioNotificacoesId,
  setSolicitacaoRespondendoId,
}: UseNotificacoesInitialLoadProps) {
  const router = useRouter();
  const contextoUsuario = useRef<{ usuarioId: string } | null>(null);
  // Setters React são estáveis. Cada efeito/carga e troca de identidade invalida
  // resultados e callbacks antigos, inclusive em uma sequência A → B → A.
  useEffect(() => {
    let componenteAtivo = true;
    let versaoCarga = 0;
    let identidadeObservada: string | null = null;
    let recargaAgendada: number | undefined;
    contextoUsuario.current = null;

    async function carregarDados() {
      const versao = ++versaoCarga;
      const cargaVigente = () => componenteAtivo && versao === versaoCarga;
      let manterCarregando = false;
      let usuarioAutenticado = false;
      let usuarioAtualId = "";

      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (!cargaVigente()) {
          return;
        }

        if (erroUsuario || !dadosUsuario.user) {
          identidadeObservada ??= "";
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        usuarioAtualId = dadosUsuario.user.id;
        if (identidadeObservada !== null && identidadeObservada !== usuarioAtualId) {
          manterCarregando = true;
          return;
        }
        identidadeObservada = usuarioAtualId;
        contextoUsuario.current = { usuarioId: usuarioAtualId };
        usuarioAutenticado = true;
        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = carregarNotificacoes(usuarioAtualId);
        const obrasSupabase = await carregarObrasPublicadasSupabase();
        if (!cargaVigente()) return;
        const estadoSupabase = await carregarEstadoSupabaseNotificacoes(
          carregarNotificacoesDiretasSupabase,
          usuarioAtualId
        );
        if (!cargaVigente()) return;
        if (estadoSupabase && estadoSupabase.userId !== usuarioAtualId) {
          throw new Error("Estado de notificações pertence a outra conta.");
        }
        const notificacoesDiretasSupabase = estadoSupabase?.notificacoesDiretas || [];
        const obrasDiretasSupabase =
          await carregarObrasDasNotificacoesDiretasSupabase(
            notificacoesDiretasSupabase
          );
        if (!cargaVigente()) return;
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
        ] = await Promise.allSettled([
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
        if (!cargaVigente()) return;
        // Releia após a última espera: ações locais e exclusões podem ter
        // acontecido enquanto as fontes remotas respondiam.
        const notificacoesAtuais = carregarNotificacoes(usuarioAtualId);
        const notificacoesLocaisFiltradas = notificacoesAtuais.filter(
          (notificacao) =>
            !notificacaoEhCapitulo(notificacao) ||
            notificacaoCapituloPertenceAObraSeguida(
              notificacao,
              obrasPorIdMescladas,
              idsSeguidos,
              usuarioAtualId
            )
        );
        const notificacoesMescladas = filtrarNotificacoesApagadas(
          preservarLeituraAlteradaDuranteCarga(
            mesclarNotificacoes(notificacoesLocaisFiltradas, [
              ...notificacoesCapitulosSupabase,
              ...notificacoesDiretasSupabase,
              ...(notificacoesComunidadeSupabase.status === "fulfilled"
                ? notificacoesComunidadeSupabase.value
                : []),
              ...(notificacoesDiarioSupabase.status === "fulfilled"
                ? notificacoesDiarioSupabase.value
                : []),
              ...(notificacoesProblemasTecnicosSupabase.status === "fulfilled"
                ? notificacoesProblemasTecnicosSupabase.value
                : []),
            ]),
            notificacoesLocais,
            notificacoesAtuais
          ),
          carregarIdsNotificacoesApagadas(usuarioAtualId)
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

        if (!cargaVigente()) {
          return;
        }

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasMescladas);
        setNotificacoes(notificacoesMescladas);
        definirNotificacoesNaoLidas(
          notificacoesMescladas.filter((notificacao) => !notificacao.lida).length
        );
      } catch {
        if (!cargaVigente()) {
          return;
        }

        if (!usuarioAutenticado || !usuarioAtualId) {
          manterCarregando = true;
          router.replace(criarLoginHrefNotificacoes());
          return;
        }

        const obrasLocais = carregarObras(usuarioAtualId);
        const notificacoesLocais = filtrarNotificacoesApagadas(
          carregarNotificacoes(usuarioAtualId),
          carregarIdsNotificacoesApagadas(usuarioAtualId)
        );

        setUsuarioNotificacoesId(usuarioAtualId);
        setObras(obrasLocais);
        setNotificacoes(notificacoesLocais);
        definirNotificacoesNaoLidas(
          notificacoesLocais.filter((notificacao) => !notificacao.lida).length
        );
      } finally {
        if (cargaVigente() && !manterCarregando) {
          setCarregando(false);
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const usuarioId = sessao?.user?.id || "";
      if (!componenteAtivo || usuarioId === identidadeObservada) return;
      identidadeObservada = usuarioId;
      ++versaoCarga;
      contextoUsuario.current = null;
      setUsuarioNotificacoesId("");
      setNotificacoes([]);
      setObras([]);
      setSolicitacaoRespondendoId("");
      definirNotificacoesNaoLidas(0);
      setCarregando(true);
      if (recargaAgendada !== undefined) window.clearTimeout(recargaAgendada);
      // Não execute consultas Supabase dentro do callback de Auth.
      recargaAgendada = window.setTimeout(() => {
        recargaAgendada = undefined;
        if (componenteAtivo) void carregarDados();
      }, 0);
    });
    if (recargaAgendada === undefined) void carregarDados();

    return () => {
      componenteAtivo = false;
      ++versaoCarga;
      contextoUsuario.current = null;
      subscription.unsubscribe();
      if (recargaAgendada !== undefined) window.clearTimeout(recargaAgendada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, definirNotificacoesNaoLidas]);

  return function criarVerificadorUsuarioVigente(usuarioId: string) {
    const contexto = contextoUsuario.current;
    return () => Boolean(
      contexto && contexto.usuarioId === usuarioId && contextoUsuario.current === contexto
    );
  };
}
