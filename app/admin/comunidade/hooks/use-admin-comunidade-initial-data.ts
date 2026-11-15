import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../../lib/supabase/client";
import { criarLoginHrefAdminModeracao } from "../lib/admin-comunidade-route-utils";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import type { ContextoModeracao, ControleModeracao } from "../lib/admin-comunidade-action-control";
import { substituirContextoModeracao } from "../lib/admin-comunidade-action-control";
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
  controleModeracao: ControleModeracao;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
  setMenuDenunciaAbertoId: Dispatch<SetStateAction<string>>;
};

export function useAdminComunidadeInitialData({
  router,
  controleModeracao,
  setErro,
  setSucesso,
  setAcaoEmAndamento,
  setMenuDenunciaAbertoId,
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

  useEffect(() => {
    let cancelado = false;
    let identidadeObservada: string | undefined;
    let contexto: ContextoModeracao | null = null;
    const vigente = (ctx: ContextoModeracao, leitura: number) =>
      !cancelado && ctx.ativo && controleModeracao.current === ctx && ctx.leitura === leitura;

    async function iniciarModeracao() {
      const ctx = substituirContextoModeracao(controleModeracao);
      contexto = ctx;
      const leitura = ctx.leitura;
      setCarregando(true);
      setErro("");
      setSucesso("");
      setUsuarioId("");
      setEhAdmin(false);
      setDenuncias([]);
      setDenunciasPerfis([]);
      setReincidenciasPorUsuario({});
      setObservacoes({});
      setAcaoEmAndamento("");
      setMenuDenunciaAbertoId("");

      // Toda leitura pertence à identidade e à geração que a iniciaram.
      async function carregarDenuncias() {
        const denunciasComContexto = await carregarDenunciasComContextoModeracao();
        if (!vigente(ctx, leitura)) return;
        setDenuncias(denunciasComContexto);
        setObservacoes((observacoesAtuais) =>
          vigente(ctx, leitura)
            ? sincronizarObservacoesModeracao(observacoesAtuais, denunciasComContexto)
            : observacoesAtuais
        );
      }
      async function carregarReincidenciasModeracao() {
        const proximoMapa = await buscarReincidenciasModeracao();
        if (vigente(ctx, leitura)) setReincidenciasPorUsuario(proximoMapa);
      }
      async function carregarDenunciasPerfis() {
        const denunciasComContexto = await buscarDenunciasPerfisModeracao();
        if (vigente(ctx, leitura)) setDenunciasPerfis(denunciasComContexto);
      }

      try {
        const { user, adminConfirmado } = await verificarAcessoModeracao();
        if (!vigente(ctx, leitura)) return;
        if (identidadeObservada !== undefined && identidadeObservada !== (user?.id || "")) return;
        identidadeObservada = user?.id || "";
        if (!user) {
          router.replace(criarLoginHrefAdminModeracao());
          return;
        }
        ctx.usuarioId = user.id;
        ctx.ehAdmin = adminConfirmado;
        setUsuarioId(user.id);
        setEhAdmin(adminConfirmado);
        if (adminConfirmado) {
          await Promise.all([
            carregarDenuncias(),
            carregarDenunciasPerfis(),
            carregarReincidenciasModeracao(),
          ]);
        }
      } catch (error) {
        if (vigente(ctx, leitura)) {
          setErro(criarMensagemErro("Erro ao carregar moderação", error));
        }
      } finally {
        // Uma ação invalida leituras, mas não deve prender o indicador inicial.
        if (!cancelado && ctx.ativo && controleModeracao.current === ctx) {
          setCarregando(false);
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      const id = sessao?.user.id || "";
      if (identidadeObservada === id) return;
      identidadeObservada = id;
      if (contexto) contexto.ativo = false;
      void iniciarModeracao();
    });
    void iniciarModeracao();

    return () => {
      cancelado = true;
      if (contexto) contexto.ativo = false;
      subscription.unsubscribe();
    };
  }, [router, controleModeracao, setErro, setSucesso, setAcaoEmAndamento, setMenuDenunciaAbertoId]);

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
