import { useEffect, useRef, useState } from "react";
import type {
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { carregarNomeProfileAdicionarCapitulo } from "../actions/carregar-nome-profile-adicionar-capitulo";
import { registrarDiarioNovoCapitulo } from "../actions/registrar-diario-novo-capitulo";
import { registrarNotificacoesNovoCapituloSupabase } from "../actions/registrar-notificacoes-novo-capitulo-supabase";
import { obterProximaOrdemCapitulo } from "../lib/adicionar-capitulo-chapter-order-utils";
import { criarId } from "../lib/adicionar-capitulo-id-utils";
import { aplicarNovoCapituloNasObrasLocais } from "../lib/adicionar-capitulo-local-create-mutation";
import { carregarObrasLocais } from "../lib/adicionar-capitulo-local-work-storage";
import { criarNotificacaoNovoCapitulo } from "../lib/adicionar-capitulo-notification-utils";
import { criarLoginHrefAdicionarCapitulo } from "../lib/adicionar-capitulo-route-utils";
import { validarCapitulo } from "../lib/adicionar-capitulo-validation";
import { sincronizarAutorObraProfileAdicionarCapitulo } from "../actions/sincronizar-autor-obra-profile-adicionar-capitulo";

import {
  AVISO_CONTEXTO_ALTERADO, AVISO_CRIACAO_INCERTA, CAMPOS_CONFIRMACAO_CAPITULO,
  confirmarCapituloCriado, lerTentativaCriacao, lerTentativaPorId, listarTentativasCriacao,
  compactarTentativasEncerradas, rejeicaoInsertComprovada,
  salvarTentativaCriacao, tentativaBloqueiaInsert,
} from "../lib/adicionar-capitulo-create-recovery";
import type { TentativaCriacaoCapitulo } from "../lib/adicionar-capitulo-create-recovery";

type RouterAdicionarCapitulo = {
  replace: (href: string) => void;
};

type ObraLocalAdicionarCapitulo = ReturnType<typeof carregarObrasLocais>[number];
type CapituloLocalAdicionarCapitulo =
  ObraLocalAdicionarCapitulo["capitulos"][number];
type NotificacaoLocalAdicionarCapitulo = ReturnType<
  typeof criarNotificacaoNovoCapitulo
>;

type UseAdicionarCapituloCreateActionProps = {
  router: RouterAdicionarCapitulo;
  obraAtual: ObraLocalAdicionarCapitulo | null;
  obraId: string;
  obras: ObraLocalAdicionarCapitulo[];
  usuarioIdLogado: string;
  titulo: string;
  texto: string;
  numeroNovoCapitulo: number;
  processando: boolean;
  criandoCapituloRef: MutableRefObject<boolean>;
  edicaoRascunhoRef: MutableRefObject<number>;
  salvarObras: (novasObras: ObraLocalAdicionarCapitulo[]) => void;
  setProcessando: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setCapituloCriado: (
    capitulo: CapituloLocalAdicionarCapitulo | null,
  ) => void;
  setNotificacaoCriada: Dispatch<
    SetStateAction<NotificacaoLocalAdicionarCapitulo | null>
  >;
  setTitulo: Dispatch<SetStateAction<string>>;
  setTexto: Dispatch<SetStateAction<string>>;
  setArquivoImportadoNome: Dispatch<SetStateAction<string>>;
  setArquivoImportadoErro: Dispatch<SetStateAction<string>>;
};

type ContextoCriacao = { ativo: boolean; userId: string; obraId: string; leituraFalhou: boolean };

export function useAdicionarCapituloCreateAction({
  router, obraAtual, obraId, obras, usuarioIdLogado, titulo, texto,
  numeroNovoCapitulo, processando, criandoCapituloRef, edicaoRascunhoRef,
  salvarObras, setProcessando, setErro, setCapituloCriado, setNotificacaoCriada,
  setTitulo, setTexto, setArquivoImportadoNome, setArquivoImportadoErro,
}: UseAdicionarCapituloCreateActionProps) {
  const contextoRef = useRef<ContextoCriacao | null>(null);
  const tentativaRef = useRef<TentativaCriacaoCapitulo | null>(null);
  const edicaoSalvaRef = useRef(0);
  const confirmacaoRef = useRef("");
  const [recuperacaoPendente, setRecuperacaoPendente] = useState(false);
  const [contaAlterada, setContaAlterada] = useState(false);
  const obraContextoId = obraAtual?.id || obraId;

  useEffect(() => {
    const anterior = contextoRef.current;
    const mudou = Boolean(anterior?.userId && (anterior.userId !== usuarioIdLogado || anterior.obraId !== obraContextoId));
    const contexto = { ativo: Boolean(usuarioIdLogado && obraContextoId) && !mudou,
      userId: usuarioIdLogado, obraId: obraContextoId, leituraFalhou: false };
    contextoRef.current = contexto;
    tentativaRef.current = null;
    confirmacaoRef.current = "";
    criandoCapituloRef.current = false;
    let erroLeitura = "";
    if (contexto.ativo) {
      try { tentativaRef.current = lerTentativaCriacao(usuarioIdLogado, obraContextoId); }
      catch { contexto.leituraFalhou = true; erroLeitura = "Não foi possível ler o registro da tentativa. Preserve o texto e confira o Painel do Autor."; }
    }
    const tentativaInicial = tentativaRef.current;
    queueMicrotask(() => {
      if (contextoRef.current !== contexto || (!contexto.ativo && !mudou)) return;
      setContaAlterada(mudou);
      const tentativa = tentativaRef.current;
      setRecuperacaoPendente(contexto.leituraFalhou || tentativaBloqueiaInsert(tentativa));
      if (erroLeitura) setErro(erroLeitura);
      if (tentativaInicial && tentativa?.id === tentativaInicial.id && edicaoRascunhoRef.current === 0) {
        ++edicaoRascunhoRef.current;
        setTitulo(tentativaInicial.tituloRascunho);
        setTexto(tentativaInicial.textoRascunho);
      }
    });
    if (!contexto.ativo) return () => { contexto.ativo = false; };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!contexto.ativo || (sessao?.user?.id || "") === contexto.userId) return;
      contexto.ativo = false;
      setContaAlterada(true);
      setProcessando(false);
    });
    return () => { contexto.ativo = false; subscription.unsubscribe(); };
    // Setters React e refs são estáveis; a tentativa pertence à conta/obra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado, obraContextoId]);

  useEffect(() => {
    const contexto = contextoRef.current, tentativa = tentativaRef.current;
    const edicao = edicaoRascunhoRef.current;
    if (!contexto?.ativo || !tentativa || edicao === edicaoSalvaRef.current) return;
    try {
      const atualizada = { ...tentativa, tituloRascunho: titulo, textoRascunho: texto };
      salvarTentativaCriacao(atualizada);
      tentativaRef.current = atualizada;
      edicaoSalvaRef.current = edicao;
    } catch {
      queueMicrotask(() => {
        if (contexto.ativo && contextoRef.current === contexto) {
          setErro("Não foi possível guardar as alterações do rascunho neste navegador. Copie o texto antes de sair da página.");
        }
      });
    }
  }, [titulo, texto, edicaoRascunhoRef, setErro]);

  const vigente = (contexto: ContextoCriacao) => contexto.ativo && contextoRef.current === contexto;
  function guardar(tentativa: TentativaCriacaoCapitulo) {
    const anterior = lerTentativaPorId(tentativa.userId, tentativa.obraId, tentativa.id);
    const registro = anterior?.id === tentativa.id && tentativa.fase !== "liberada"
      ? { ...tentativa, tituloRascunho: anterior.tituloRascunho, textoRascunho: anterior.textoRascunho }
      : tentativa;
    salvarTentativaCriacao(registro);
    tentativaRef.current = registro;
    edicaoSalvaRef.current = edicaoRascunhoRef.current;
  }
  async function autenticar(contexto: ContextoCriacao) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!vigente(contexto)) return null;
    if (error || !user) {
      router.replace(criarLoginHrefAdicionarCapitulo(contexto.obraId)); return null;
    }
    if (user.id !== contexto.userId) {
      contexto.ativo = false; setContaAlterada(true); return null;
    }
    if (obraAtual?.autorId && obraAtual.autorId !== user.id) {
      throw new Error("Você não tem permissão para adicionar capítulo nesta obra.");
    }
    if (idObraSupabaseValido(contexto.obraId)) {
      const { data, error: erroObra } = await supabase.from("obras").select("id")
        .eq("id", contexto.obraId).eq("user_id", user.id).maybeSingle();
      if (!vigente(contexto)) return null;
      if (erroObra) throw new Error(`Não consegui confirmar a autoria da obra: ${erroObra.message}`);
      if (data?.id !== contexto.obraId) throw new Error("Você não tem permissão para adicionar capítulo nesta obra.");
    }
    return user;
  }
  function aplicarLocal(capitulo: CapituloLocalAdicionarCapitulo, nomeProfileAutor: string, contexto: ContextoCriacao) {
    const recentes = carregarObrasLocais(contexto.userId);
    const porId = new Map(obras.map(obra => [obra.id, obra]));
    recentes.forEach(obra => porId.set(obra.id, obra));
    salvarObras(aplicarNovoCapituloNasObrasLocais({
      obras: Array.from(porId.values()), obraId: contexto.obraId, novoCapitulo: capitulo,
      nomeProfileAutor, usuarioIdLogado: contexto.userId, userId: contexto.userId,
    }));
    setCapituloCriado(capitulo);
  }
  function mostrarErro(erro: unknown, contexto: ContextoCriacao) {
    if (!vigente(contexto)) return;
    const tentativa = tentativaRef.current;
    const pendente = tentativaBloqueiaInsert(tentativa);
    setRecuperacaoPendente(pendente);
    setErro(pendente
      ? confirmacaoRef.current === tentativa?.id
        ? "O capítulo já foi confirmado. Não envie novamente. Use Verificar criação para recuperar a atualização local; seu texto foi mantido."
        : AVISO_CRIACAO_INCERTA
      : erro instanceof Error ? erro.message : "Não consegui salvar esse capítulo. Seu texto foi preservado.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function criarCapitulo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contexto = contextoRef.current;
    if (!obraAtual || !contexto || !vigente(contexto) || processando || criandoCapituloRef.current) return;
    if (contexto.leituraFalhou || tentativaBloqueiaInsert(tentativaRef.current)) {
      if (tentativaRef.current?.fase === "concluida" && confirmacaoRef.current === tentativaRef.current.id) return;
      setErro(AVISO_CRIACAO_INCERTA); return;
    }
    const erroValidacao = validarCapitulo(titulo, texto, numeroNovoCapitulo);
    if (erroValidacao) { setErro(erroValidacao); return; }
    criandoCapituloRef.current = true;
    setProcessando(true); setErro("");
    const edicao = edicaoRascunhoRef.current;
    let tentativa: TentativaCriacaoCapitulo | null = null;
    try {
      // O rascunho já fica recuperável se a sessão expirar durante o preflight.
      const ordemLocal = obterProximaOrdemCapitulo(obraAtual.capitulos);
      tentativa = { versao: 1, id: criarId(), userId: contexto.userId, obraId: contexto.obraId,
        titulo: titulo.trim() || `Capítulo ${ordemLocal}`, texto: texto.trim(),
        tituloRascunho: titulo, textoRascunho: texto, ordem: ordemLocal,
        criadoEm: new Date().toISOString(), fase: "rascunho" };
      guardar(tentativa);
      const user = await autenticar(contexto);
      if (!user || !vigente(contexto)) return;
      const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);
      if (!vigente(contexto)) return;
      let ordemNovoCapitulo = obterProximaOrdemCapitulo(obraAtual.capitulos);
      const remota = idObraSupabaseValido(contexto.obraId);
      if (remota) {
        const { data: ultimo, error } = await supabase.from("capitulos").select("ordem")
          .eq("obra_id", contexto.obraId).order("ordem", { ascending: false }).limit(1).maybeSingle();
        if (!vigente(contexto)) return;
        if (error) throw new Error(`Não consegui calcular a ordem do novo capítulo: ${error.message}`);
        const ordemBanco = typeof ultimo?.ordem === "number" && Number.isInteger(ultimo.ordem) && ultimo.ordem >= 1 ? ultimo.ordem : 0;
        ordemNovoCapitulo = Math.max(ordemNovoCapitulo, ordemBanco + 1);
      }
      tentativa = { ...tentativa, titulo: titulo.trim() || `Capítulo ${ordemNovoCapitulo}`,
        ordem: ordemNovoCapitulo, fase: "incerta" };
      // Sem registro durável não enviamos um INSERT que ficaria irrecuperável.
      const registrada = lerTentativaCriacao(contexto.userId, contexto.obraId);
      if (tentativaBloqueiaInsert(registrada)) {
        tentativaRef.current = registrada; setRecuperacaoPendente(true); setErro(AVISO_CRIACAO_INCERTA); return;
      }
      guardar(tentativa);
      try { compactarTentativasEncerradas(contexto.userId, contexto.obraId, tentativa.id); }
      catch { /* A tentativa atual já está durável; as anteriores continuam preservadas. */ }
      let confirmado = confirmarCapituloCriado({ id: tentativa.id, obra_id: tentativa.obraId,
        user_id: user.id, titulo: tentativa.titulo, texto: tentativa.texto, ordem: tentativa.ordem,
        publicado: true, tipo_conteudo: "texto", criado_em: tentativa.criadoEm }, tentativa)!;
      if (remota) {
        const { data, error } = await supabase.from("capitulos").insert({
          id: tentativa.id, obra_id: contexto.obraId, user_id: user.id,
          titulo: tentativa.titulo, texto: tentativa.texto, ordem: tentativa.ordem,
          // O schema existente aplica tipo_conteudo = 'texto' por padrão.
          publicado: true,
        }).select(CAMPOS_CONFIRMACAO_CAPITULO).single().retry(false);
        if (!vigente(contexto)) {
          // Uma rejeição SQL tardia pode liberar a tentativa da conta original,
          // sem tocar na UI nem em uma tentativa mais nova de outra conta.
          if (rejeicaoInsertComprovada(error) && error?.code !== "23505") {
            try {
              const armazenada = lerTentativaPorId(tentativa.userId, tentativa.obraId, tentativa.id);
              if (armazenada?.id === tentativa.id && armazenada.fase === "incerta") {
                salvarTentativaCriacao({ ...armazenada, fase: "rejeitada" });
              }
            } catch { /* Mantém o bloqueio se o registro não puder ser atualizado. */ }
          }
          return;
        }
        if (error) {
          if (error.code === "23505") {
            // A colisão também pode ser o UUID de uma criação já confirmada.
            // Nunca a interprete como autorização para inserir outro capítulo.
            const { data: gravado, error: erroLeitura } = await supabase.from("capitulos")
              .select(CAMPOS_CONFIRMACAO_CAPITULO).eq("id", tentativa.id)
              .eq("obra_id", contexto.obraId).eq("user_id", contexto.userId).maybeSingle();
            if (!vigente(contexto)) return;
            if (erroLeitura) throw new Error(AVISO_CRIACAO_INCERTA);
            if (gravado) {
              const recuperado = confirmarCapituloCriado(gravado, tentativa);
              if (!recuperado) throw new Error(AVISO_CRIACAO_INCERTA);
              confirmacaoRef.current = tentativa.id;
              guardar({ ...tentativa, fase: "concluida" });
              aplicarLocal(recuperado, nomeProfileAutor, contexto);
              setRecuperacaoPendente(false);
              setErro("Capítulo confirmado. O rascunho foi mantido. Diário e notificações não são reenviados na recuperação.");
              return;
            }
            // Ausência na leitura não desfaz uma colisão do próprio UUID.
            // Só o conflito conhecido de ordem admite nova ação explícita.
            if (!error.message.includes("capitulos_obra_id_ordem_key") || error.message.includes("capitulos_pkey")) {
              throw new Error(AVISO_CRIACAO_INCERTA);
            }
          }
          if (rejeicaoInsertComprovada(error)) {
            guardar({ ...tentativa, fase: "rejeitada" });
            throw new Error(error.code === "23505"
              ? "Outra criação ocupou esta ordem. Seu texto foi preservado. Uma nova tentativa explícita recalculará a posição."
              : `Não consegui salvar capítulo no Supabase: ${error.message}`);
          }
          throw new Error(AVISO_CRIACAO_INCERTA);
        }
        const row = confirmarCapituloCriado(data, tentativa);
        if (!row) throw new Error(AVISO_CRIACAO_INCERTA);
        confirmado = row;
        confirmacaoRef.current = tentativa.id;
      }
      guardar({ ...tentativa, fase: "confirmada" });
      const obraComAutor = { ...obraAtual, autor: nomeProfileAutor || obraAtual.autor, autorId: user.id };
      void sincronizarAutorObraProfileAdicionarCapitulo(contexto.obraId, user.id, nomeProfileAutor);
      // Estes efeitos só pertencem à resposta direta confirmada. Recuperação
      // nunca os reenvia: o fluxo legado não tem recibo transacional conjunto.
      void registrarDiarioNovoCapitulo({ userId: user.id, obra: obraComAutor, capitulo: confirmado,
        numeroCapitulo: confirmado.ordem, criadoEm: confirmado.criadoEm });
      void registrarNotificacoesNovoCapituloSupabase({ userId: user.id, obra: obraComAutor, capitulo: confirmado,
        numeroCapitulo: confirmado.ordem, criadoEm: confirmado.criadoEm });
      guardar({ ...tentativa, fase: "concluida" });
      aplicarLocal(confirmado, nomeProfileAutor, contexto);
      setNotificacaoCriada(criarNotificacaoNovoCapitulo(obraComAutor, confirmado, confirmado.ordem, confirmado.criadoEm));
      setRecuperacaoPendente(false);
      if (edicaoRascunhoRef.current === edicao) {
        setTitulo(""); setTexto(""); setArquivoImportadoNome(""); setArquivoImportadoErro("");
      }
    } catch (erro) {
      // O registro em memória anterior ao envio também protege contra falhas
      // de persistência/cache depois da confirmação remota.
      mostrarErro(erro, contexto);
    } finally {
      if (vigente(contexto)) { criandoCapituloRef.current = false; setProcessando(false); }
    }
  }

  async function verificarCriacao() {
    const contexto = contextoRef.current, tentativa = tentativaRef.current;
    if (!contexto || !vigente(contexto) || !tentativa || criandoCapituloRef.current) return;
    criandoCapituloRef.current = true; setProcessando(true); setErro("");
    try {
      if (!await autenticar(contexto) || !vigente(contexto)) return;
      const registradas = listarTentativasCriacao(contexto.userId, contexto.obraId)
        .filter(tentativaBloqueiaInsert);
      let encontrou = false;
      for (const registro of registradas) {
        let dados: unknown;
        if (idObraSupabaseValido(contexto.obraId)) {
          const { data, error } = await supabase.from("capitulos").select(CAMPOS_CONFIRMACAO_CAPITULO)
            .eq("id", registro.id).eq("obra_id", contexto.obraId).eq("user_id", contexto.userId).maybeSingle();
          if (!vigente(contexto)) return;
          if (error) continue;
          dados = data;
        } else {
          dados = { id: registro.id, obra_id: registro.obraId, user_id: registro.userId,
            titulo: registro.titulo, texto: registro.texto, ordem: registro.ordem,
            publicado: true, tipo_conteudo: "texto", criado_em: registro.criadoEm };
        }
        const confirmado = confirmarCapituloCriado(dados, registro);
        if (!confirmado) continue;
        if (idObraSupabaseValido(contexto.obraId)) confirmacaoRef.current = registro.id;
        guardar({ ...registro, fase: "concluida" });
        aplicarLocal(confirmado, obraAtual?.autor || "", contexto);
        encontrou = true;
      }
      if (!encontrou) throw new Error(AVISO_CRIACAO_INCERTA);
      const pendente = listarTentativasCriacao(contexto.userId, contexto.obraId)
        .some(item => item.fase === "incerta" || item.fase === "confirmada");
      setRecuperacaoPendente(pendente);
      setErro(pendente ? AVISO_CRIACAO_INCERTA : "Capítulo confirmado. O rascunho foi mantido. Diário e notificações não são reenviados na recuperação.");
    } catch (erro) { mostrarErro(erro, contexto); }
    finally { if (vigente(contexto)) { criandoCapituloRef.current = false; setProcessando(false); } }
  }

  function iniciarNovoCapitulo() {
    const contexto = contextoRef.current, tentativa = tentativaRef.current;
    if (!contexto || !vigente(contexto) || !tentativa || tentativa.fase !== "concluida" || criandoCapituloRef.current) return;
    try {
      guardar({ ...tentativa, fase: "liberada", texto: "", tituloRascunho: titulo, textoRascunho: texto });
      const proxima = lerTentativaCriacao(contexto.userId, contexto.obraId);
      tentativaRef.current = proxima;
      setCapituloCriado(null); setNotificacaoCriada(null);
      setRecuperacaoPendente(tentativaBloqueiaInsert(proxima)); setErro("");
    } catch (erro) { mostrarErro(erro, contexto); }
  }
  return { criarCapitulo, verificarCriacao, iniciarNovoCapitulo, recuperacaoPendente, contaAlterada,
    avisoContaAlterada: AVISO_CONTEXTO_ALTERADO };
}
