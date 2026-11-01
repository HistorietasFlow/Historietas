import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  MotivoDenuncia,
  TipoAlvoDenuncia,
} from "../DenunciaModal";

type UseDenunciaModalLifecycleParams = {
  aberto: boolean;
  alvoId: string;
  alvoTipo: TipoAlvoDenuncia;
  enviando: boolean;
  onFechar: () => void;
  setMotivo: Dispatch<SetStateAction<MotivoDenuncia | "">>;
  setDescricao: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setEnviado: Dispatch<SetStateAction<boolean>>;
  setEnviando: Dispatch<SetStateAction<boolean>>;
};

type UseDenunciaModalLifecycleResult = {
  montado: boolean;
  painelRef: RefObject<HTMLDivElement | null>;
  botaoFecharRef: RefObject<HTMLButtonElement | null>;
};

export function useDenunciaModalLifecycle({
  aberto,
  alvoId,
  alvoTipo,
  enviando,
  onFechar,
  setMotivo,
  setDescricao,
  setErro,
  setEnviado,
  setEnviando,
}: UseDenunciaModalLifecycleParams): UseDenunciaModalLifecycleResult {
  const [montado, setMontado] = useState(false);
  const painelRef = useRef<HTMLDivElement | null>(null);
  const botaoFecharRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const montarTimer = window.setTimeout(() => {
      setMontado(true);
    }, 0);

    return () => {
      window.clearTimeout(montarTimer);
    };
  }, []);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focarTimer = window.setTimeout(() => {
      setMotivo("");
      setDescricao("");
      setErro("");
      setEnviado(false);
      setEnviando(false);
      botaoFecharRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focarTimer);
      document.body.style.overflow = overflowAnterior;
    };
  }, [
    aberto,
    alvoId,
    alvoTipo,
    setDescricao,
    setEnviado,
    setEnviando,
    setErro,
    setMotivo,
  ]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !enviando) {
        onFechar();
        return;
      }

      if (evento.key !== "Tab" || !painelRef.current) {
        return;
      }

      const focaveis = Array.from(
        painelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focaveis.length === 0) {
        return;
      }

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto, enviando, onFechar]);

  return {
    montado,
    painelRef,
    botaoFecharRef,
  };
}
