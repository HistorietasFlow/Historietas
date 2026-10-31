import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { criarLoginHrefAdminModeracao } from "../lib/admin-comunidade-route-utils";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import type { DenunciaComContexto } from "../lib/admin-comunidade-report-context-utils";
import { sincronizarObservacoesModeracao } from "../lib/admin-comunidade-observation-utils";
import {
  buscarDenunciasPerfisModeracao,
  type DenunciaPerfilComContexto,
} from "../loaders/carregar-denuncias-perfis-moderacao";
import { carregarDenunciasComContextoModeracao } from "../loaders/carregar-denuncias-contexto-moderacao";
import { buscarReincidenciasModeracao } from "../loaders/carregar-reincidencias-moderacao";
import { verificarAcessoModeracao } from "../loaders/verificar-acesso-moderacao";

type UseAdminComunidadeInitialDataParams = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
};

export function useAdminComunidadeInitialData({
  router,
  setErro,
  setSucesso,
}: UseAdminComunidadeInitialDataParams) {
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [denuncias, setDenuncias] = useState<DenunciaComContexto[]>([]);
  const [denunciasPerfis, setDenunciasPerfis] = useState<
    DenunciaPerfilComContexto[]
  >([]);
  const [reincidenciasPorUsuario, setReincidenciasPorUsuario] = useState<
    Record<string, number>
  >({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  async function carregarDenuncias() {
    setErro("");

    const denunciasComContexto =
      await carregarDenunciasComContextoModeracao();

    setDenuncias(denunciasComContexto);
    setObservacoes((observacoesAtuais) =>
      sincronizarObservacoesModeracao(
        observacoesAtuais,
        denunciasComContexto,
      )
    );
  }

  async function carregarReincidenciasModeracao() {
    const proximoMapa = await buscarReincidenciasModeracao();
    setReincidenciasPorUsuario(proximoMapa);
  }

  async function carregarDenunciasPerfis() {
    const denunciasComContexto = await buscarDenunciasPerfisModeracao();
    setDenunciasPerfis(denunciasComContexto);
  }

  useEffect(() => {
    let cancelado = false;

    async function iniciarModeracao() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { user, adminConfirmado } =
          await verificarAcessoModeracao();

        if (!user) {
          if (!cancelado) {
            setUsuarioId("");
            setEhAdmin(false);
            setDenuncias([]);
            setDenunciasPerfis([]);
            setReincidenciasPorUsuario({});
            router.replace(criarLoginHrefAdminModeracao());
          }

          return;
        }

        if (!cancelado) {
          setUsuarioId(user.id);
          setEhAdmin(adminConfirmado);
        }

        if (adminConfirmado) {
          await Promise.all([
            carregarDenuncias(),
            carregarDenunciasPerfis(),
            carregarReincidenciasModeracao(),
          ]);
        }
      } catch (error) {
        if (!cancelado) {
          setErro(criarMensagemErro("Erro ao carregar moderação", error));
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    iniciarModeracao();

    return () => {
      cancelado = true;
    };
  // Os setters recebidos são estáveis; manter apenas router preserva o lifecycle original.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return {
    carregando,
    usuarioId,
    ehAdmin,
    denuncias,
    setDenuncias,
    denunciasPerfis,
    setDenunciasPerfis,
    reincidenciasPorUsuario,
    observacoes,
    setObservacoes,
  };
}
