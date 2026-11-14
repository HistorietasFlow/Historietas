import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import type { TextoTraduzido } from "../lib/ajuda-content";
import type {
  CategoriaProblemaTecnico,
  ProblemaTecnicoResumo,
} from "../lib/ajuda-technical-support";
import { traduzirTexto } from "../lib/ajuda-display-utils";
import {
  normalizarCategoriaProblemaTecnico,
  normalizarProblemasTecnicos,
} from "../lib/ajuda-technical-support-normalizers";

import { criacaoConfirmada, criacaoRejeitada, lerChamadosConfirmados } from "../lib/ajuda-support-responses";

type IdentidadeSuporte = { id: string | undefined; versao: number; confirmada: boolean; evento: boolean };
const chaveRelato = (categoria: string, titulo: string, descricao: string, pagina: string) =>
  JSON.stringify([categoria, titulo.trim(), descricao.trim(), pagina.trim()]);

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
  const [carregandoChamados, setCarregandoChamados] = useState(true);
  const [chamadosTecnicos, setChamadosTecnicos] = useState<
    ProblemaTecnicoResumo[]
  >([]);

  const [erroChamados, setErroChamados] = useState("");
  const [chamadosCarregados, setChamadosCarregados] = useState(false);
  const [sessaoConfirmada, setSessaoConfirmada] = useState(false);
  const [tentativaIncerta, setTentativaIncerta] = useState("");
  const [versaoVisivel, setVersaoVisivel] = useState(0);
  const [revisaoSessao, setRevisaoSessao] = useState(0);
  const identidade = useRef<IdentidadeSuporte>({ id: undefined, versao: 0, confirmada: false, evento: false });
  const montado = useRef(false);
  const consulta = useRef(0);
  const envio = useRef<symbol | null>(null);
  const tentativas = useRef(new Map<string, "pendente" | "incerto" | "confirmado">());
  const idioma = useRef(language);
  useEffect(() => { idioma.current = language; }, [language]);
  const t = useCallback((texto: TextoTraduzido) => traduzirTexto(texto, idioma.current), []);
  const atual = useCallback((versao: number) => montado.current && identidade.current.versao === versao, []);

  const trocarIdentidade = useCallback((id: string, evento = false) => {
    consulta.current += 1;
    identidade.current = { id, versao: identidade.current.versao + 1, confirmada: false, evento };
    envio.current = null;
    setVersaoVisivel(identidade.current.versao);
    setUsuarioAutenticado(id ? null : false);
    setSessaoConfirmada(false);
    setChamadosTecnicos([]);
    setChamadosCarregados(false);
    setCarregandoChamados(false);
    setErroChamados("");
    setMensagemProblema("");
    setErroProblema("");
    setTentativaIncerta("");
    setEnviandoProblema(false);
    setCategoriaProblema("outro");
    setTituloProblema("");
    setDescricaoProblema("");
    if (typeof window !== "undefined") setPaginaProblema(window.location.href);
  }, []);

  const carregarChamadosTecnicos = useCallback(async () => {
    let versao = identidade.current.versao;
    let numero = ++consulta.current;
    const vigente = () => atual(versao) && consulta.current === numero;
    await Promise.resolve();
    if (!vigente()) return;
    setCarregandoChamados(true);
    setErroChamados("");
    setSessaoConfirmada(false);
    identidade.current.confirmada = false;
    let sessaoValidada = false;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!vigente()) return;
      if (error && error.name !== "AuthSessionMissingError") throw error;
      const id = data.user?.id || "";
      if (identidade.current.id !== id) {
        if (identidade.current.evento) throw new Error("Identidade divergente");
        trocarIdentidade(id);
        versao = identidade.current.versao;
        numero = ++consulta.current;
        setCarregandoChamados(true);
      }
      identidade.current = { id, versao, confirmada: true, evento: false };
      setVersaoVisivel(versao);
      setUsuarioAutenticado(Boolean(id));
      setSessaoConfirmada(true);
      sessaoValidada = true;
      if (!id) return;
      const { data: registros, error: erroLeitura } = await supabase.rpc(
        "listar_meus_problemas_tecnicos", { p_limite: 20 },
      );
      if (!vigente()) return;
      if (erroLeitura) throw erroLeitura;
      const chamados = normalizarProblemasTecnicos(lerChamadosConfirmados(registros));
      setChamadosTecnicos(chamados);
      setChamadosCarregados(true);
    } catch {
      if (!vigente()) return;
      setErroChamados(sessaoValidada ? t({
        pt: "Não foi possível atualizar os chamados. Os dados anteriores, se disponíveis, são da última consulta confirmada.",
        en: "Could not refresh tickets. Previous data, if available, is from the last confirmed query.",
        es: "No se pudieron actualizar los casos. Los datos anteriores, si están disponibles, son de la última consulta confirmada.",
      }) : t({
        pt: "Não foi possível confirmar sua sessão. Tente atualizar os chamados novamente.",
        en: "Could not verify your session. Try refreshing tickets again.",
        es: "No se pudo verificar tu sesión. Intenta actualizar los casos de nuevo.",
      }));
    } finally {
      if (vigente()) setCarregandoChamados(false);
    }
  }, [atual, t, trocarIdentidade]);

  useEffect(() => {
    montado.current = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!montado.current || evento === "INITIAL_SESSION") return;
      const id = session?.user.id || "";
      if (identidade.current.id === id) return;
      trocarIdentidade(id, true);
      // Revalidation runs in an effect, outside the synchronous Auth callback.
      setRevisaoSessao(value => value + 1);
    });
    return () => {
      montado.current = false;
      identidade.current.versao += 1;
      consulta.current += 1;
      envio.current = null;
      subscription.unsubscribe();
    };
  }, [trocarIdentidade]);

  useEffect(() => {
    let cancelado = false;
    void Promise.resolve().then(() => {
      if (!cancelado) void carregarChamadosTecnicos();
    });
    return () => { cancelado = true; };
  }, [revisaoSessao, carregarChamadosTecnicos]);

  async function enviarProblemaTecnico(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (envio.current || !atual(versaoVisivel)) return;
    const titulo = tituloProblema.trim();
    const descricao = descricaoProblema.trim();
    const chave = chaveRelato(categoriaProblema, titulo, descricao, paginaProblema);
    setMensagemProblema("");
    setErroProblema("");
    if (titulo.length < 8) {
      setErroProblema(t({ pt: "O título precisa ter pelo menos 8 caracteres.", en: "The title must have at least 8 characters.", es: "El título debe tener al menos 8 caracteres." }));
      return;
    }
    if (descricao.length < 20) {
      setErroProblema(t({ pt: "Explique o problema com pelo menos 20 caracteres.", en: "Describe the problem using at least 20 characters.", es: "Describe el problema usando al menos 20 caracteres." }));
      return;
    }
    const id = identidade.current.id;
    if (!id || !identidade.current.confirmada) {
      setErroProblema(t({ pt: "Confirme sua sessão atualizando os chamados antes de enviar.", en: "Verify your session by refreshing tickets before submitting.", es: "Verifica tu sesión actualizando los casos antes de enviar." }));
      return;
    }
    const tentativa = JSON.stringify([id, chave]);
    if (tentativas.current.has(tentativa)) {
      setTentativaIncerta(chave);
      setErroProblema(t({ pt: "Este relato já foi enviado ou aguarda confirmação. Atualize os chamados e não repita o envio.", en: "This report was submitted or is awaiting confirmation. Refresh tickets and do not submit it again.", es: "Este informe ya se envió o espera confirmación. Actualiza los casos y no repitas el envío." }));
      return;
    }
    const operacao = Symbol();
    envio.current = operacao;
    setEnviandoProblema(true);
    let enviado = false;
    let rejeitado = false;
    try {
      const { data: usuarioResposta, error } = await supabase.auth.getUser();
      if (!atual(versaoVisivel)) return;
      if (error && error.name !== "AuthSessionMissingError") {
        identidade.current.confirmada = false;
        setSessaoConfirmada(false);
        throw error;
      }
      if (usuarioResposta.user?.id !== id) {
        trocarIdentidade(usuarioResposta.user?.id || "");
        setRevisaoSessao(value => value + 1);
        return;
      }
      const navegador = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const dispositivo = typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight} · ${navigator.language || ""}` : "";
      tentativas.current.set(tentativa, "pendente");
      enviado = true;
      const { data, error: erroCriacao } = await supabase.rpc("criar_problema_tecnico", {
        p_categoria: categoriaProblema,
        p_titulo: titulo,
        p_descricao: descricao,
        p_pagina_url: paginaProblema.trim(),
        p_navegador: navegador,
        p_dispositivo: dispositivo,
      });
      rejeitado = criacaoRejeitada(erroCriacao);
      if (erroCriacao || !criacaoConfirmada(data)) throw erroCriacao || new Error("Recibo ausente");
      tentativas.current.set(tentativa, "confirmado");
      if (!atual(versaoVisivel)) return;
      setTituloProblema("");
      setDescricaoProblema("");
      setTentativaIncerta("");
      setMensagemProblema(t({
        pt: "Problema técnico enviado. A equipe poderá acompanhar o chamado pelo painel administrativo.",
        en: "Technical issue submitted. The team can now review the ticket in the admin dashboard.",
        es: "Problema técnico enviado. El equipo podrá revisar el caso en el panel administrativo.",
      }));
      await carregarChamadosTecnicos();
    } catch {
      if (enviado) {
        if (rejeitado) tentativas.current.delete(tentativa);
        else tentativas.current.set(tentativa, "incerto");
      }
      if (!atual(versaoVisivel)) return;
      if (enviado && !rejeitado) {
        setTentativaIncerta(chave);
        setErroProblema(t({
          pt: "O envio não foi confirmado. Atualize os chamados para conferir. Não reenvie este relato: ele pode ter sido recebido.",
          en: "Submission was not confirmed. Refresh tickets to check. Do not resubmit this report: it may have been received.",
          es: "El envío no se confirmó. Actualiza los casos para comprobarlo. No reenvíes este informe: puede haberse recibido.",
        }));
      } else {
        if (!enviado) {
          identidade.current.confirmada = false;
          setSessaoConfirmada(false);
        }
        setErroProblema(t({
          pt: "Não foi possível enviar o problema técnico agora.",
          en: "The technical issue could not be submitted right now.",
          es: "No se pudo enviar el problema técnico ahora.",
        }));
      }
    } finally {
      if (atual(versaoVisivel) && envio.current === operacao) {
        envio.current = null;
        setEnviandoProblema(false);
      }
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
    erroChamados,
    chamadosCarregados,
    sessaoConfirmada,
    envioIncerto: tentativaIncerta === chaveRelato(categoriaProblema, tituloProblema, descricaoProblema, paginaProblema),
    recarregarChamados: carregarChamadosTecnicos,
    atualizarCategoriaProblema,
    setPaginaProblema,
    setTituloProblema,
    setDescricaoProblema,
    enviarProblemaTecnico,
  };
}
