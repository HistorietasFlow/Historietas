"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../../../components/HistorietasLanguageProvider";
import { traduzirTextoTop5 } from "../lib/top5-translations";

export function Top5LanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const seletorRaiz = "[data-historietas-top5-root='true']";

    type EstadoTraducaoTop5 = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoTop5> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoTop5>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados: Array<{ elemento: Element; atributo: string }> = [];
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function elementoEstaNaPagina(elemento: Element | null) {
      return Boolean(
        elemento?.matches(seletorRaiz) || elemento?.closest(seletorRaiz)
      );
    }

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento || !elementoEstaNaPagina(elemento)) {
        return true;
      }

      if (elemento.closest("[data-historietas-i18n-ignore='true']")) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return tag === "script" || tag === "style";
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (
        deveIgnorarElemento(elementoPai) ||
        elementoPai?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoTop5(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributos(elemento: Element) {
      if (deveIgnorarElemento(elemento)) {
        return;
      }

      let estadosElemento = estadosAtributos.get(elemento);

      if (!estadosElemento) {
        estadosElemento = new Map();
        estadosAtributos.set(elemento, estadosElemento);
      }

      atributosTraduziveis.forEach((atributo) => {
        const atual = elemento.getAttribute(atributo);

        if (atual === null) {
          return;
        }

        let estado = estadosElemento?.get(atributo);

        if (!estado) {
          estado = { original: atual, traduzido: atual };
          estadosElemento?.set(atributo, estado);
          atributosAlterados.push({ elemento, atributo });
        } else if (atual !== estado.traduzido && atual !== estado.original) {
          estado.original = atual;
        }

        const proximo = traduzirTextoTop5(estado.original, language);
        estado.traduzido = proximo;

        if (atual !== proximo) {
          elemento.setAttribute(atributo, proximo);
        }
      });
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (no.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const elemento = no as Element;

      if (deveIgnorarElemento(elemento)) {
        return;
      }

      aplicarAtributos(elemento);

      elemento.querySelectorAll("*").forEach((filho) => {
        if (!deveIgnorarElemento(filho)) {
          aplicarAtributos(filho);
        }
      });

      const percorrer = document.createTreeWalker(
        elemento,
        NodeFilter.SHOW_TEXT
      );
      let textoAtual = percorrer.nextNode();

      while (textoAtual) {
        aplicarTexto(textoAtual as Text);
        textoAtual = percorrer.nextNode();
      }
    }

    function aplicarPagina() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        document.querySelectorAll(seletorRaiz).forEach(aplicarNo);
      } finally {
        aplicando = false;
      }
    }

    aplicarPagina();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (mutacao.type === "attributes") {
            aplicarAtributos(mutacao.target as Element);
            return;
          }

          mutacao.addedNodes.forEach(aplicarNo);
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.isConnected && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach(({ elemento, atributo }) => {
        const estado = estadosAtributos.get(elemento)?.get(atributo);

        if (
          estado &&
          elemento.isConnected &&
          elemento.getAttribute(atributo) === estado.traduzido
        ) {
          elemento.setAttribute(atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}
