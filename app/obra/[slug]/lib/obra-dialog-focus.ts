import type { KeyboardEvent } from "react";

const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function obterElementosFocaveisDialogo(dialogo: HTMLElement) {
  return Array.from(
    dialogo.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR),
  ).filter(
    (elemento) =>
      elemento.getAttribute("aria-hidden") !== "true" &&
      elemento.getClientRects().length > 0,
  );
}

export function focarInicioDialogo(dialogo: HTMLElement | null) {
  if (!dialogo) {
    return;
  }

  const focoPreferido = dialogo.querySelector<HTMLElement>(
    '[data-dialog-initial-focus="true"]',
  );
  const primeiroFocavel = obterElementosFocaveisDialogo(dialogo)[0];

  (focoPreferido || primeiroFocavel || dialogo).focus();
}

export function obterElementoComFocoAtual() {
  return document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}

export function restaurarFocoAnterior(elemento: HTMLElement | null) {
  if (!elemento) {
    return;
  }

  window.setTimeout(() => {
    if (elemento.isConnected) {
      elemento.focus();
    }
  }, 0);
}

export function manterFocoNoDialogo(
  event: KeyboardEvent<HTMLElement>,
  fecharDialogo: () => void,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    fecharDialogo();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const dialogo = event.currentTarget;
  const focaveis = obterElementosFocaveisDialogo(dialogo);

  if (focaveis.length === 0) {
    event.preventDefault();
    dialogo.focus();
    return;
  }

  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  const elementoAtivo = document.activeElement;

  if (elementoAtivo === dialogo) {
    event.preventDefault();
    (event.shiftKey ? ultimo : primeiro).focus();
    return;
  }

  if (event.shiftKey && elementoAtivo === primeiro) {
    event.preventDefault();
    ultimo.focus();
    return;
  }

  if (!event.shiftKey && elementoAtivo === ultimo) {
    event.preventDefault();
    primeiro.focus();
  }
}
