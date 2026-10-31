import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  OperacaoRecuperavel,
  SolicitacaoExclusao,
  StatusSolicitacaoExclusao,
} from "../lib/admin-exclusoes-conta-normalization-utils";
import {
  normalizarOperacaoRecuperavel,
  normalizarSolicitacao,
} from "../lib/admin-exclusoes-conta-normalization-utils";
import { criarLoginHrefAdminExclusoesConta } from "../lib/admin-exclusoes-conta-route-utils";
import type { TextoTraduzido } from "../lib/admin-exclusoes-conta-text-utils";
import { buscarOperacoesRecuperaveisAdmin } from "../loaders/buscar-operacoes-recuperaveis-admin";
import { buscarSolicitacoesExclusaoAdmin } from "../loaders/buscar-solicitacoes-exclusao-admin";

type UseAdminExclusoesContaInitialDataParams = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  t: (texto: TextoTraduzido) => string;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
};

export function useAdminExclusoesContaInitialData({
  router,
  t,
  setErro,
  setSucesso,
}: UseAdminExclusoesContaInitialDataParams) {
  const [carregando, setCarregando] = useState(true);
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoExclusao[]>([]);
  const [operacoesRecuperaveis, setOperacoesRecuperaveis] = useState<
    OperacaoRecuperavel[]
  >([]);
  const [statusRascunho, setStatusRascunho] = useState<
    Record<string, StatusSolicitacaoExclusao>
  >({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  const carregarSolicitacoes = useCallback(async () => {
    setErro("");

    const { response, data } = await buscarSolicitacoesExclusaoAdmin();

    if (response.status === 401) {
      router.replace(criarLoginHrefAdminExclusoesConta());
      return;
    }

    if (response.status === 403) {
      setAcessoNegado(true);
      setSolicitacoes([]);
      return;
    }

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.mensagem ||
          t({
            pt: "Não foi possível carregar as solicitações de exclusão.",
            en: "Deletion requests could not be loaded.",
            es: "No se pudieron cargar las solicitudes de eliminación.",
          }),
      );
    }

    const registros = (data.solicitacoes || [])
      .map(normalizarSolicitacao)
      .filter((item): item is SolicitacaoExclusao => Boolean(item));

    setAcessoNegado(false);
    setSolicitacoes(registros);
    setStatusRascunho(
      registros.reduce<Record<string, StatusSolicitacaoExclusao>>(
        (estado, item) => {
          estado[item.id] = item.status;
          return estado;
        },
        {},
      ),
    );
    setObservacoes(
      registros.reduce<Record<string, string>>((estado, item) => {
        estado[item.id] = item.observacaoInterna;
        return estado;
      }, {}),
    );
  }, [router, t, setErro]);

  const carregarOperacoesRecuperaveis = useCallback(async () => {
    const { response, data } = await buscarOperacoesRecuperaveisAdmin();

    if (response.status === 401) {
      router.replace(criarLoginHrefAdminExclusoesConta());
      return;
    }

    if (response.status === 403) {
      setAcessoNegado(true);
      setOperacoesRecuperaveis([]);
      return;
    }

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.mensagem ||
          t({
            pt: "Não foi possível carregar as recuperações pendentes.",
            en: "Pending recoveries could not be loaded.",
            es: "No se pudieron cargar las recuperaciones pendientes.",
          }),
      );
    }

    setOperacoesRecuperaveis(
      (data.operacoes || [])
        .map(normalizarOperacaoRecuperavel)
        .filter((item): item is OperacaoRecuperavel => Boolean(item)),
    );
  }, [router, t]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        await Promise.all([
          carregarSolicitacoes(),
          carregarOperacoesRecuperaveis(),
        ]);
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : t({
                  pt: "Não foi possível carregar as solicitações de exclusão.",
                  en: "Deletion requests could not be loaded.",
                  es: "No se pudieron cargar las solicitudes de eliminación.",
                }),
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
    };
  }, [carregarOperacoesRecuperaveis, carregarSolicitacoes, t, setErro, setSucesso]);

  return {
    carregando,
    acessoNegado,
    setAcessoNegado,
    solicitacoes,
    setSolicitacoes,
    operacoesRecuperaveis,
    statusRascunho,
    setStatusRascunho,
    observacoes,
    setObservacoes,
    carregarSolicitacoes,
    carregarOperacoesRecuperaveis,
  };
}
