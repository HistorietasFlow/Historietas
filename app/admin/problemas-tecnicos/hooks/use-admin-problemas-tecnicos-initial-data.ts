import { useCallback, useEffect, useState } from "react";
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

type UseAdminProblemasTecnicosInitialDataParams = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  t: (texto: TextoTraduzido) => string;
  setErro: Dispatch<SetStateAction<string>>;
  setSucesso: Dispatch<SetStateAction<string>>;
};

export function useAdminProblemasTecnicosInitialData({
  router,
  t,
  setErro,
  setSucesso,
}: UseAdminProblemasTecnicosInitialDataParams) {
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
      setNomesUsuarios({});
      return;
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

    setNomesUsuarios(mapa);
  }, [t]);

  const carregarProblemas = useCallback(async () => {
    setErro("");

    const { data, error } = await buscarProblemasTecnicosAdmin();

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

    setProblemas(registros);
    setObservacoes(
      registros.reduce<Record<string, string>>((estado, problema) => {
        estado[problema.id] = problema.observacaoAdmin;
        return estado;
      }, {}),
    );
    await carregarNomes(registros.map((problema) => problema.userId));
  }, [carregarNomes, setErro]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { data: usuarioResposta, error: usuarioErro } =
          await supabase.auth.getUser();

        if (usuarioErro) {
          throw usuarioErro;
        }

        const usuario = usuarioResposta.user || null;

        if (!usuario) {
          if (!cancelado) {
            setUsuarioId("");
            setEhAdmin(false);
            router.replace(criarLoginHrefAdminProblemasTecnicos());
          }
          return;
        }

        const adminConfirmado =
          await verificarAdministradorProblemasTecnicos();

        if (cancelado) return;

        setUsuarioId(usuario.id);
        setEhAdmin(adminConfirmado);

        if (adminConfirmado) {
          await carregarProblemas();
        }
      } catch (error) {
        if (!cancelado) {
          setErro(criarMensagemErro("Erro ao carregar problemas técnicos", error));
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
  }, [carregarProblemas, router, setErro, setSucesso]);

  return {
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
