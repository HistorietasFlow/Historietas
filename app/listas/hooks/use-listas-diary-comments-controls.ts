import { useRef, type Dispatch, type SetStateAction, type TouchEvent } from "react";

type ItemComAnotacaoListas = {
  anotacaoId?: string;
};

type InteracaoComentarioListas = {
  novoComentario: string;
};

type UseListasDiaryCommentsControlsParams<TItem extends ItemComAnotacaoListas> = {
  comentariosDiarioExpandido: boolean;
  comentariosDiarioItem: TItem | null;
  criarInteracaoVazia: () => InteracaoComentarioListas;
  interacoesAnotacoes: Record<string, InteracaoComentarioListas | undefined>;
  isDesktop: boolean;
  obterPermissoes: (item: TItem) => { podeVerComentarios: boolean };
  setComentariosDiarioExpandido: Dispatch<SetStateAction<boolean>>;
  setComentariosDiarioItem: Dispatch<SetStateAction<TItem | null>>;
  setMenuOrdenacaoComentariosDiarioAberto: Dispatch<SetStateAction<boolean>>;
  setMensagemAcao: (mensagem: string) => void;
  setRespostasVisiveisComentariosDiario: Dispatch<SetStateAction<Record<string, number>>>;
  atualizarComentario: (anotacaoId: string, texto: string) => void;
};

export function useListasDiaryCommentsControls<TItem extends ItemComAnotacaoListas>({
  comentariosDiarioExpandido,
  comentariosDiarioItem,
  criarInteracaoVazia,
  interacoesAnotacoes,
  isDesktop,
  obterPermissoes,
  setComentariosDiarioExpandido,
  setComentariosDiarioItem,
  setMenuOrdenacaoComentariosDiarioAberto,
  setMensagemAcao,
  setRespostasVisiveisComentariosDiario,
  atualizarComentario,
}: UseListasDiaryCommentsControlsParams<TItem>) {
  const comentariosSheetRef = useRef<HTMLElement | null>(null);
  const comentariosDragStartYRef = useRef(0);
  const comentariosDragOffsetYRef = useRef(0);
  const comentariosDragIgnorarCliqueRef = useRef(false);
  const comentariosDragResetTimerRef = useRef<number | null>(null);

  function fecharComentariosDiario() {
    setComentariosDiarioItem(null);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    comentariosDragOffsetYRef.current = 0;
  }

  function abrirComentariosDiario(item: TItem) {
    const anotacaoId = item.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const permissoes = obterPermissoes(item);

    if (!permissoes.podeVerComentarios) {
      setMensagemAcao("Os comentários desta anotação não estão disponíveis.");
      return;
    }

    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;
    setComentariosDiarioItem(item);
    setComentariosDiarioExpandido(false);
    setMenuOrdenacaoComentariosDiarioAberto(false);
    setRespostasVisiveisComentariosDiario({});
  }

  function iniciarArrasteComentariosDiario(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    comentariosDragStartYRef.current = event.touches[0]?.clientY || 0;
    comentariosDragOffsetYRef.current = 0;
    comentariosDragIgnorarCliqueRef.current = false;

    if (comentariosDragResetTimerRef.current !== null) {
      window.clearTimeout(comentariosDragResetTimerRef.current);
      comentariosDragResetTimerRef.current = null;
    }

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "none";
    }
  }

  function moverArrasteComentariosDiario(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual =
      event.touches[0]?.clientY || comentariosDragStartYRef.current;
    const limiteSuperior = comentariosDiarioExpandido ? -46 : -58;
    const limiteInferior = comentariosDiarioExpandido ? 112 : 132;
    const deslocamento = Math.max(
      limiteSuperior,
      Math.min(limiteInferior, posicaoAtual - comentariosDragStartYRef.current),
    );

    comentariosDragOffsetYRef.current = deslocamento;

    if (Math.abs(deslocamento) > 6) {
      comentariosDragIgnorarCliqueRef.current = true;
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
    }
  }

  function finalizarArrasteComentariosDiario() {
    if (isDesktop) {
      return;
    }

    const deslocamento = comentariosDragOffsetYRef.current;

    if (comentariosSheetRef.current) {
      comentariosSheetRef.current.style.transition = "height 220ms ease";
    }

    const handle = comentariosSheetRef.current?.querySelector(
      "[data-comments-sheet-handle='true']",
    ) as HTMLElement | null;

    if (handle) {
      handle.style.transition = "transform 160ms ease";
      handle.style.transform = "";
    }

    if (comentariosDragIgnorarCliqueRef.current) {
      comentariosDragResetTimerRef.current = window.setTimeout(() => {
        comentariosDragIgnorarCliqueRef.current = false;
        comentariosDragResetTimerRef.current = null;
      }, 350);
    }

    if (deslocamento < -34) {
      setComentariosDiarioExpandido(true);
      return;
    }

    if (deslocamento > 52 && comentariosDiarioExpandido) {
      setComentariosDiarioExpandido(false);
      return;
    }

    if (deslocamento > 118 && !comentariosDiarioExpandido) {
      fecharComentariosDiario();
    }
  }

  function alternarExpansaoComentariosDiario() {
    if (isDesktop || comentariosDragIgnorarCliqueRef.current) {
      return;
    }

    setComentariosDiarioExpandido((expandido) => !expandido);
  }

  function inserirNoComentarioDiario(texto: string) {
    const anotacaoId = comentariosDiarioItem?.anotacaoId?.trim() || "";

    if (!anotacaoId) {
      return;
    }

    const interacao = interacoesAnotacoes[anotacaoId] || criarInteracaoVazia();
    const separador = interacao.novoComentario && texto !== "@" ? " " : "";

    atualizarComentario(
      anotacaoId,
      `${interacao.novoComentario}${separador}${texto}`,
    );
  }

  return {
    abrirComentariosDiario,
    alternarExpansaoComentariosDiario,
    comentariosSheetRef,
    fecharComentariosDiario,
    finalizarArrasteComentariosDiario,
    iniciarArrasteComentariosDiario,
    inserirNoComentarioDiario,
    moverArrasteComentariosDiario,
  };
}
