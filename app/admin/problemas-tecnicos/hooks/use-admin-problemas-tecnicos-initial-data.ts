import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../../lib/supabase/client";
import { criarMensagemErro } from "../lib/admin-problemas-tecnicos-error-utils";
import {
  normalizarCategoria,
  normalizarPrioridade,
  normalizarStatus,
  type ProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";
import { criarLoginHrefAdminProblemasTecnicos } from "../lib/admin-problemas-tecnicos-route-utils";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";
import { buscarPerfisProblemasTecnicosAdmin } from "../loaders/buscar-perfis-problemas-tecnicos-admin";
import { buscarProblemasTecnicosAdmin } from "../loaders/buscar-problemas-tecnicos-admin";
import { verificarAdministradorProblemasTecnicos } from "../loaders/verificar-administrador-problemas-tecnicos";
import { agendarOperacaoChamados, criarExecucaoChamados, execucaoChamadosEstaAtual } from "../lib/admin-problemas-tecnicos-execution";

type UseAdminProblemasTecnicosInitialDataParams = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  t: (texto: TextoTraduzido) => string;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
  setAcaoEmAndamento: Dispatch<SetStateAction<string>>;
};

export function useAdminProblemasTecnicosInitialData({
  router,
  t,
  setErro,
  setSucesso,
  setAcaoEmAndamento,
}: UseAdminProblemasTecnicosInitialDataParams) {
  const contextoRef = useRef(criarExecucaoChamados());
  const capturarExecucao = useCallback(() => {
    const execucao = contextoRef.current;
    return () => execucaoChamadosEstaAtual(contextoRef, execucao);
  }, []);
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [problemas, setProblemas] = useState<ProblemaTecnico[]>([]);
  const [nomesUsuarios, setNomesUsuarios] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

  const carregarNomes = useCallback(async (userIds: string[]) => {
    const ids = Array.from(
      new Set(userIds.map((id) => id.trim()).filter(Boolean)),
    );

    if (ids.length === 0) {
      return {};
    }

    const { porUserId, porId } =
      await buscarPerfisProblemasTecnicosAdmin(ids);

    const perfis = [
      ...(porUserId.error
        ? []
        : (porUserId.data || [])),
      ...(porId.error
        ? []
        : (porId.data || [])),
    ];
    const mapa: Record<string, string> = {};

    perfis.forEach((perfil) => {
      const nome =
        perfil.nome?.trim() ||
        (perfil.username?.trim()
          ? `@${perfil.username.trim().replace(/^@+/, "")}`
          : "") ||
        t({
          pt: "Usuário",
          en: "User",
          es: "Usuario",
        });

      if (perfil.user_id?.trim()) mapa[perfil.user_id.trim()] = nome;
      if (perfil.id?.trim()) mapa[perfil.id.trim()] = nome;
    });

    return mapa;
  }, [t]);

  const carregarProblemas = useCallback(async () => {
    const execucao = contextoRef.current;
    const leitura = ++execucao.leitura;
    const revisao = execucao.revisao;
    const mesmaExecucao = () => execucaoChamadosEstaAtual(contextoRef, execucao) && execucao.ehAdmin;
    const atual = () => mesmaExecucao() && leitura === execucao.leitura && revisao === execucao.revisao;
    return agendarOperacaoChamados(execucao, async () => {
      try {
        if (!atual()) return;
        setErro("");

        const { data, error } = await buscarProblemasTecnicosAdmin();
        if (!atual()) return;

        if (error) {
          throw error;
        }

        const registros = (data || []).map(
          (registro): ProblemaTecnico => ({
            id: String(registro.id || ""),
            userId: String(registro.user_id || ""),
            emailContato: String(registro.email_contato || ""),
            categoria: normalizarCategoria(registro.categoria),
            titulo: String(registro.titulo || ""),
            descricao: String(registro.descricao || ""),
            paginaUrl: String(registro.pagina_url || ""),
            navegador: String(registro.navegador || ""),
            dispositivo: String(registro.dispositivo || ""),
            status: normalizarStatus(registro.status),
            prioridade: normalizarPrioridade(registro.prioridade),
            observacaoAdmin: String(registro.observacao_admin || ""),
            analisadoPor: String(registro.analisado_por || ""),
            analisadoEm: String(registro.analisado_em || ""),
            criadoEm: String(registro.criado_em || ""),
            atualizadoEm: String(registro.atualizado_em || ""),
          }),
        );

        if (!atual()) return;
        const mapa = await carregarNomes(registros.map((problema) => problema.userId));
        if (!atual()) return;
        execucao.registros = new Map(registros.map(problema => [problema.id, problema]));
        setNomesUsuarios(mapa);
        setProblemas(atuais => mesmaExecucao() ? registros : atuais);
        setObservacoes(
          registros.reduce<Record<string, string>>((estado, problema) => {
            estado[problema.id] = problema.observacaoAdmin;
            return estado;
          }, {}),
        );
      } catch (error) {
        if (atual()) throw error;
      }
    });
  }, [carregarNomes, setErro]);

  useLayoutEffect(() => {
    let cancelado = false;
    function invalidar() {
      contextoRef.current.ativo = false;
      const execucao = criarExecucaoChamados();
      contextoRef.current = execucao;
      setUsuarioId("");
      setEhAdmin(false);
      setProblemas([]);
      setNomesUsuarios({});
      setObservacoes({});
      setAcaoEmAndamento("");
      setCarregando(true);
      setErro("");
      setSucesso("");
      return execucao;
    }
    async function iniciar(execucao: ReturnType<typeof criarExecucaoChamados>, identidadeEsperada?: string) {
      const atual = () => !cancelado && execucaoChamadosEstaAtual(contextoRef, execucao);
      try {
        if (!atual()) return;
        const { data: usuarioResposta, error: usuarioErro } = await supabase.auth.getUser();
        if (!atual()) return;
        if (usuarioErro) {
          throw usuarioErro;
        }
        const usuario = usuarioResposta.user || null;
        if (identidadeEsperada !== undefined && (usuario?.id || "") !== identidadeEsperada) return;
        if (!usuario) {
          router.replace(criarLoginHrefAdminProblemasTecnicos());
          return;
        }
        const adminConfirmado = await verificarAdministradorProblemasTecnicos();
        if (!atual()) return;
        execucao.usuarioId = usuario.id;
        execucao.ehAdmin = adminConfirmado;
        setUsuarioId(usuario.id);
        setEhAdmin(adminConfirmado);
        if (adminConfirmado) {
          await carregarProblemas();
        }
      } catch (error) {
        if (atual()) setErro(criarMensagemErro("Erro ao carregar problemas técnicos", error));
      } finally {
        if (atual()) setCarregando(false);
      }
    }
    const inicial = invalidar();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (cancelado) return;
      const id = sessao?.user.id || "";
      if (id === contextoRef.current.usuarioId && (id || evento === "INITIAL_SESSION")) return;
      const execucao = invalidar();
      // Não execute consultas assíncronas dentro do callback de autenticação.
      queueMicrotask(() => { void iniciar(execucao, id); });
    });
    void iniciar(inicial);
    return () => {
      cancelado = true;
      contextoRef.current.ativo = false;
      subscription.unsubscribe();
    };
  }, [carregarProblemas, router, setErro, setSucesso, setAcaoEmAndamento]);

  return {
    contextoRef,
    capturarExecucao,
    carregando,
    usuarioId,
    ehAdmin,
    problemas,
    setProblemas,
    nomesUsuarios,
    observacoes,
    setObservacoes,
    carregarProblemas,
  };
}
