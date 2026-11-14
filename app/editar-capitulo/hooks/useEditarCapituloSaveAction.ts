import { useLayoutEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { atualizarNotificacaoCapituloSupabase } from "../actions/atualizar-notificacao-capitulo";
import { carregarNomeProfileEditarCapitulo } from "../actions/carregar-nome-profile-editar-capitulo";
import { registrarDiarioEdicaoCapitulo } from "../actions/registrar-diario-edicao-capitulo";
import {
  carregarBackupArquivosObras,
  restaurarArquivoObraComBackup,
} from "../lib/editar-capitulo-file-backup-utils";
import { aplicarEdicaoCapituloNasObrasLocais } from "../lib/editar-capitulo-local-save-mutation";
import { salvarObrasEditarCapituloStorage } from "../lib/editar-capitulo-local-work-storage";
import { criarLoginHrefEditarCapitulo } from "../lib/editar-capitulo-route-utils";
import { lerStorageUsuarioEditarCapitulo } from "../lib/editar-capitulo-storage-utils";
import { salvarTextoCapituloRemoto } from "../lib/editar-capitulo-remote-save";
import { guardarRecuperacaoTexto, lerRecuperacaoTexto, type ReferenciaTextoCapitulo, type RecuperacaoTextoCapitulo } from "../lib/editar-capitulo-save-recovery";
import { validarCapitulo } from "../lib/editar-capitulo-validation";
import { normalizarObra } from "../lib/editar-capitulo-work-normalizer";

type ObraLocalEditarCapitulo = ReturnType<typeof salvarObrasEditarCapituloStorage>[number];
type CapituloLocalEditarCapitulo = ObraLocalEditarCapitulo["capitulos"][number];
type UseEditarCapituloSaveActionProps = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  obraId: string;
  capituloId: string;
  usuarioEdicaoId: string;
  referenciaRemota: ReferenciaTextoCapitulo | null;
  obras: ObraLocalEditarCapitulo[];
  obraAtual: ObraLocalEditarCapitulo | null;
  capituloAtual: CapituloLocalEditarCapitulo | null;
  numeroCapitulo: number;
  titulo: string;
  texto: string;
  processando: boolean;
  excluindo: boolean;
  setObras: Dispatch<SetStateAction<ObraLocalEditarCapitulo[]>>;
  setProcessando: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setTipoErro: Dispatch<SetStateAction<"salvar" | "excluir">>;
  setSalvou: Dispatch<SetStateAction<boolean>>;
};
type Contexto = {
  ativo: boolean;
  identidadeValida: boolean;
  emCurso: boolean;
  bloqueio: string;
  base: ReferenciaTextoCapitulo | null;
  localEsperado: RecuperacaoTextoCapitulo["local"] | null;
  concluido: string;
  efeitosPendentes: boolean;
  remotoConfirmado: string;
};
const mensagemIncerta = "Não consegui confirmar o resultado da escrita. Seu texto foi preservado nesta aba. Confira o capítulo antes de reenviar; nenhum novo envio será feito automaticamente.";

export function useEditarCapituloSaveAction({
  router, obraId, capituloId, usuarioEdicaoId, referenciaRemota, obras, obraAtual, capituloAtual,
  numeroCapitulo, titulo, texto, processando, excluindo, setObras, setProcessando, setErro, setTipoErro, setSalvou,
}: UseEditarCapituloSaveActionProps) {
  const contextoRef = useRef<Contexto | null>(null);
  const ultimosRef = useRef({titulo, texto, obras});

  useLayoutEffect(() => {
    let recuperacao: RecuperacaoTextoCapitulo | null = null;
    let bloqueio = "";
    try { recuperacao = usuarioEdicaoId ? lerRecuperacaoTexto(usuarioEdicaoId, obraId, capituloId) : null; }
    catch { bloqueio = "Não consegui ler a cópia de recuperação. Preserve seu texto antes de continuar."; }
    const contexto: Contexto = {ativo: true, identidadeValida: true, emCurso: false,
      bloqueio: bloqueio || (recuperacao?.estado === "incerto" ? mensagemIncerta : ""),
      base: recuperacao?.referencia || referenciaRemota, localEsperado: recuperacao?.local || null, concluido: "", efeitosPendentes: false,
      remotoConfirmado: recuperacao?.estado === "confirmado" && referenciaRemota &&
        referenciaRemota.atualizado_em === recuperacao.referencia?.atualizado_em
        ? JSON.stringify([referenciaRemota.titulo, referenciaRemota.texto]) : ""};
    contextoRef.current = contexto;
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (usuarioEdicaoId && (sessao?.user.id || "") !== usuarioEdicaoId) {
        contexto.identidadeValida = false;
        contexto.bloqueio = "A conta mudou durante a edição. Seu texto foi preservado na aba da conta original.";
        if (contexto.ativo) { setErro(contexto.bloqueio); setSalvou(false); setProcessando(false); }
      }
    });
    return () => { contexto.ativo = false; subscription.unsubscribe(); };
  }, [obraId, capituloId, usuarioEdicaoId, referenciaRemota, setErro, setSalvou, setProcessando]);

  // Refletir o texto já commitado antes de uma resposta assíncrona ou navegação
  // poder marcar a versão anterior como salva ou desmontar este editor.
  useLayoutEffect(() => {
    ultimosRef.current = {titulo, texto, obras};
    const contexto = contextoRef.current;
    if (!contexto?.ativo || !contexto.identidadeValida || !usuarioEdicaoId || !capituloAtual) return;
    try {
      const anterior = lerRecuperacaoTexto(usuarioEdicaoId, obraId, capituloId);
      if (anterior || titulo !== capituloAtual.titulo || texto !== capituloAtual.texto) {
        contexto.localEsperado ||= anterior?.local || capituloAtual;
        guardarRecuperacaoTexto(usuarioEdicaoId, obraId, capituloId, {
          titulo, texto, estado: anterior?.estado || "pronto", referencia: contexto.base,
          local: anterior?.local || contexto.localEsperado || capituloAtual,
        });
      }
    } catch { /* O envio exige uma cópia confirmada antes de qualquer escrita. */ }
  }, [titulo, texto, obras, capituloAtual, usuarioEdicaoId, obraId, capituloId]);

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contexto = contextoRef.current;
    if (!contexto?.ativo || contexto.emCurso || processando || excluindo || !obraAtual || !capituloAtual) return;
    if (contexto.bloqueio) { setErro(contexto.bloqueio); setSalvou(false); return; }
    const erroValidacao = validarCapitulo(
      titulo,
      texto,
      numeroCapitulo,
    );
    if (erroValidacao) { setErro(erroValidacao); setSalvou(false); return; }
    contexto.emCurso = true;
    setProcessando(true); setErro(""); setTipoErro("salvar"); setSalvou(false);
    const vigente = () => contexto.ativo && contexto.identidadeValida;
    const tituloFinal = titulo.trim() || `Capítulo ${numeroCapitulo || 1}`;
    const textoFinal = texto.trim();
    const intencao = JSON.stringify([tituloFinal, textoFinal]);
    const referenciaAnterior = contexto.base;
    const guardar = (estado: RecuperacaoTextoCapitulo["estado"]) => guardarRecuperacaoTexto(usuarioEdicaoId, obraId, capituloId, {
      titulo: ultimosRef.current.titulo, texto: ultimosRef.current.texto, estado, referencia: contexto.base,
      local: contexto.localEsperado || capituloAtual || undefined,
    });
    let confirmadoRemotamente = false;
    try {
      if (!usuarioEdicaoId || obraAtual.id !== obraId || capituloAtual.id !== capituloId) {
        throw new Error("Não consegui confirmar o contexto da edição. Seu texto foi mantido.");
      }
      guardar(contexto.concluido === intencao || contexto.remotoConfirmado === intencao ? "confirmado" : "pronto");
      const {data: dadosUsuario, error: erroUsuario} = await supabase.auth.getUser();
      if (!vigente()) return;
      const userId = dadosUsuario.user?.id || "";
      if (erroUsuario || !userId) {
        router.replace(criarLoginHrefEditarCapitulo(obraId, capituloId));
        throw new Error("Entre na sua conta antes de editar o capítulo.");
      }
      const autorIdObra = obraAtual.autorId?.trim() || "";
      if (userId !== usuarioEdicaoId || (autorIdObra && autorIdObra !== userId)) {
        throw new Error("Você não tem permissão para editar este capítulo.");
      }
      if (contexto.concluido === intencao) {
        setSalvou(ultimosRef.current.titulo === titulo && ultimosRef.current.texto === texto);
        return;
      }
      const nomeProfileAutor = await carregarNomeProfileEditarCapitulo(userId);
      if (!vigente()) return;
      const autorFinalObra = nomeProfileAutor || obraAtual.autor;
      const registroSupabase = idObraSupabaseValido(obraId) && idObraSupabaseValido(capituloId);
      let numeroCapituloFinal = numeroCapitulo || 1;
      let atualizadoEm = new Date().toISOString();
      if (registroSupabase) {
        const base = contexto.base;
        if (!base || base.id !== capituloId || base.obra_id !== obraId || base.user_id !== userId) {
          throw new Error("Não consegui confirmar a versão de texto carregada. Preserve seu texto antes de reabrir o capítulo.");
        }
        const {data: obraAutorizada, error: erroObraAutorizada} = await supabase.from("obras")
          .select("id").eq("id", obraId).eq("user_id", userId).limit(1).maybeSingle();
        if (!vigente()) return;
        if (erroObraAutorizada || obraAutorizada?.id !== obraId) {
          throw new Error("Não consegui confirmar sua permissão para editar o capítulo.");
        }
        if (contexto.remotoConfirmado !== intencao) {
          guardar("incerto");
          const resultado = await salvarTextoCapituloRemoto(base, tituloFinal, textoFinal);
          if (!vigente()) return;
          if (resultado.estado !== "confirmado") {
            if (resultado.estado === "incerto") contexto.bloqueio = mensagemIncerta;
            else {
              guardar("pronto");
              if (resultado.estado === "conflito") contexto.bloqueio = "O capítulo foi alterado em outra versão. Seu texto foi preservado; compare as versões antes de salvar.";
            }
            throw new Error(contexto.bloqueio || resultado.mensagem || "Não consegui salvar o capítulo agora.");
          }
          contexto.base = resultado.referencia;
          contexto.remotoConfirmado = intencao;
          contexto.efeitosPendentes = true;
          confirmadoRemotamente = true;
          guardar("confirmado");
          if (nomeProfileAutor) {
            try {
              const {error} = await supabase.from("obras").update({autor: nomeProfileAutor, atualizado_em: resultado.referencia.atualizado_em})
                .eq("id", obraId).eq("user_id", userId);
              if (error) console.warn("O capítulo foi salvo, mas o autor da obra não sincronizou no Supabase:", error.message);
            } catch { /* Sincronização complementar não desfaz a edição confirmada. */ }
            if (!vigente()) return;
          }
        }
        confirmadoRemotamente = true;
        numeroCapituloFinal = contexto.base!.ordem;
        atualizadoEm = contexto.base!.atualizado_em;
        guardar("confirmado");
      }
      // Revalidar a conta antes de alterar cache e iniciar efeitos posteriores.
      const identidade = await supabase.auth.getUser();
      if (!vigente()) return;
      if (identidade.error || identidade.data.user?.id !== userId) throw new Error("A conta mudou. Seu texto foi preservado sem atualizar os dados locais.");
      const textoStorage = lerStorageUsuarioEditarCapitulo("historietas-obras", userId);
      const baseLocal: unknown = textoStorage === null ? ultimosRef.current.obras : JSON.parse(textoStorage);
      if (!Array.isArray(baseLocal)) throw new Error("Não consegui ler as obras locais. A cópia de recuperação foi preservada.");
      const {novasObras, obraAtualizadaParaAcoes} = aplicarEdicaoCapituloNasObrasLocais({
        obras: baseLocal, obraId, capituloId, tituloFinal, textoFinal, numeroCapituloFinal, autorFinalObra, userId,
        capituloEsperado: contexto.localEsperado || capituloAtual,
        capituloRemotoEsperado: registroSupabase ? referenciaAnterior : null,
      });
      if (!obraAtualizadaParaAcoes) throw new Error("A cópia local foi alterada ou removida. Preserve seu texto e compare as versões antes de salvar.");
      const backupArquivos = carregarBackupArquivosObras(userId);
      const novasObrasComBackup = novasObras.map((obra, index) => restaurarArquivoObraComBackup(normalizarObra(obra, index), backupArquivos));
      const novasObrasDoUsuario = salvarObrasEditarCapituloStorage(novasObrasComBackup, userId, true);
      contexto.localEsperado = novasObrasDoUsuario.find(obra => obra.id === obraId)!.capitulos.find(capitulo => capitulo.id === capituloId)!;
      setObras(novasObrasDoUsuario);
      guardar("confirmado");
      if (registroSupabase && contexto.efeitosPendentes) {
        contexto.efeitosPendentes = false;
        const parametros = {userId, obra: obraAtualizadaParaAcoes, capituloId, tituloCapitulo: tituloFinal, numeroCapitulo: numeroCapituloFinal, atualizadoEm};
        await registrarDiarioEdicaoCapitulo(parametros);
        if (!vigente()) return;
        await atualizarNotificacaoCapituloSupabase(parametros);
        if (!vigente()) return;
      }
      contexto.concluido = intencao;
      setSalvou(ultimosRef.current.titulo === titulo && ultimosRef.current.texto === texto);
    } catch (erroDesconhecido) {
      if (!vigente()) return;
      const mensagem = erroDesconhecido instanceof Error && erroDesconhecido.name === "QuotaExceededError"
        ? "O navegador recusou guardar a recuperação. Preserve seu texto nesta aba antes de tentar novamente."
        : erroDesconhecido instanceof Error ? erroDesconhecido.message : "Não consegui salvar as alterações. Seu texto foi preservado.";
      setErro(confirmadoRemotamente ? `O capítulo foi salvo no servidor, mas uma etapa posterior falhou. ${mensagem}` : mensagem);
      setSalvou(false);
      window.scrollTo({top: 0, behavior: "smooth"});
    } finally {
      contexto.emCurso = false;
      if (contexto.ativo) setProcessando(false);
    }
  }
  return {salvarEdicao};
}
