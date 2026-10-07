import { useEffect } from "react";
import type { RefObject } from "react";
import { focarInicioDialogo } from "../lib/obra-dialog-focus";

export function useObraDialogInitialFocus(
  aberto: boolean,
  dialogRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!aberto) {
      return;
    }

    const focoTimer = window.setTimeout(() => {
      focarInicioDialogo(dialogRef.current);
    }, 0);

    return () => {
      window.clearTimeout(focoTimer);
    };
  }, [aberto, dialogRef]);
}
