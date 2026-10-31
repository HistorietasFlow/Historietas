import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import type { TextoTraduzido } from "../lib/ajuda-content";
import type {
  CategoriaProblemaTecnico,
  ProblemaTecnicoResumo,
  ProblemaTecnicoRpcRow,
} from "../lib/ajuda-technical-support";
import { traduzirTexto } from "../lib/ajuda-display-utils";
import {
  normalizarCategoriaProblemaTecnico,
  normalizarProblemasTecnicos,
} from "../lib/ajuda-technical-support-normalizers";

export function useAjudaTechnicalSupport(
  language: HistorietasLanguage,
) {
  const [categoriaProblema, setCategoriaProblema] =
    useState<CategoriaProblemaTecnico>("outro");
  const [tituloProblema, setTituloProblema] = useState("");
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [paginaProblema, setPaginaProblema] = useState("");
  const [enviandoProblema, setEnviandoProblema] = useState(false);
  const [mensagemProblema, setMensagemProblema] = useState("");
  const [erroProblema, setErroProblema] = useState("");
  const [usuarioAutenticado, setUsuarioAutenticado] =
    useState<boolean | null>(null);
  const [carregandoChamados, setCarregandoChamados] = useState(false);
  const [chamadosTecnicos, setChamadosTecnicos] = useState<
    ProblemaTecnicoResumo[]
  >([]);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  async function carregarChamadosTecnicos() {
    setCarregandoChamados(true);

    try {
      const { data, error } = await supabase.rpc(
        "listar_meus_problemas_tecnicos",
        { p_limite: 20 },
      );

      if (error) {
        throw error;
      }

      const registros: ProblemaTecnicoRpcRow[] = Array.isArray(data) ? data : [];

      const chamados =
        normalizarProblemasTecnicos(
          registros,
        );

      setChamadosTecnicos(chamados);
    } catch {
      setChamadosTecnicos([]);
    } finally {
      setCarregandoChamados(false);
    }
  }

  useEffect(() => {
    let cancelado = false;

    async function prepararSuporteTecnico() {
      if (typeof window !== "undefined") {
        setPaginaProblema(window.location.href);
      }

      try {
        const { data } = await supabase.auth.getUser();
        const autenticado = Boolean(data.user?.id);

        if (cancelado) {
          return;
        }

        setUsuarioAutenticado(autenticado);

        if (autenticado) {
          await carregarChamadosTecnicos();
        }
      } catch {
        if (!cancelado) {
          setUsuarioAutenticado(false);
        }
      }
    }

    void prepararSuporteTecnico();

    return () => {
      cancelado = true;
    };
  }, []);

  async function enviarProblemaTecnico(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (enviandoProblema) {
      return;
    }

    const titulo = tituloProblema.trim();
    const descricao = descricaoProblema.trim();

    setMensagemProblema("");
    setErroProblema("");

    if (titulo.length < 8) {
      setErroProblema(
        t({
          pt: "O título precisa ter pelo menos 8 caracteres.",
          en: "The title must have at least 8 characters.",
          es: "El título debe tener al menos 8 caracteres.",
        }),
      );
      return;
    }

    if (descricao.length < 20) {
      setErroProblema(
        t({
          pt: "Explique o problema com pelo menos 20 caracteres.",
          en: "Describe the problem using at least 20 characters.",
          es: "Describe el problema usando al menos 20 caracteres.",
        }),
      );
      return;
    }

    setEnviandoProblema(true);

    try {
      const { data: usuarioResposta } = await supabase.auth.getUser();

      if (!usuarioResposta.user?.id) {
        setUsuarioAutenticado(false);
        throw new Error(
          t({
            pt: "Entre na sua conta para enviar um chamado técnico.",
            en: "Sign in to submit a technical support ticket.",
            es: "Inicia sesión para enviar un caso de soporte técnico.",
          }),
        );
      }

      setUsuarioAutenticado(true);

      const navegador =
        typeof navigator !== "undefined" ? navigator.userAgent : "";
      const dispositivo =
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight} · ${navigator.language || ""}`
          : "";

      const { error } = await supabase.rpc("criar_problema_tecnico", {
        p_categoria: categoriaProblema,
        p_titulo: titulo,
        p_descricao: descricao,
        p_pagina_url: paginaProblema.trim(),
        p_navegador: navegador,
        p_dispositivo: dispositivo,
      });

      if (error) {
        throw error;
      }

      setTituloProblema("");
      setDescricaoProblema("");
      setMensagemProblema(
        t({
          pt: "Problema técnico enviado. A equipe poderá acompanhar o chamado pelo painel administrativo.",
          en: "Technical issue submitted. The team can now review the ticket in the admin dashboard.",
          es: "Problema técnico enviado. El equipo podrá revisar el caso en el panel administrativo.",
        }),
      );
      await carregarChamadosTecnicos();
    } catch (error) {
      setErroProblema(
        error instanceof Error && error.message.trim()
          ? error.message
          : t({
              pt: "Não foi possível enviar o problema técnico agora.",
              en: "The technical issue could not be submitted right now.",
              es: "No se pudo enviar el problema técnico ahora.",
            }),
      );
    } finally {
      setEnviandoProblema(false);
    }
  }

  function atualizarCategoriaProblema(valor: unknown) {
    setCategoriaProblema(
      normalizarCategoriaProblemaTecnico(
        valor,
      ),
    );
  }

  return {
    categoriaProblema,
    tituloProblema,
    descricaoProblema,
    paginaProblema,
    enviandoProblema,
    mensagemProblema,
    erroProblema,
    usuarioAutenticado,
    carregandoChamados,
    chamadosTecnicos,
    atualizarCategoriaProblema,
    setPaginaProblema,
    setTituloProblema,
    setDescricaoProblema,
    enviarProblemaTecnico,
  };
}
