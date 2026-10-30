import type { Dispatch, SetStateAction } from "react";
import {
  ehClassificacao18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/editar-obra-form-config";
import { limparTextoPersonalizado } from "../lib/editar-obra-custom-value-utils";

type UseEditarObraFormChangeActionsProps = {
  salvou: boolean;
  erro: string;
  setSalvou: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setTitulo: Dispatch<SetStateAction<string>>;
  setAutor: Dispatch<SetStateAction<string>>;
  setFormato: Dispatch<SetStateAction<string>>;
  setFormatoPersonalizado: Dispatch<SetStateAction<string>>;
  setGenero: Dispatch<SetStateAction<string>>;
  setGeneroPersonalizado: Dispatch<SetStateAction<string>>;
  setClassificacaoIndicativa: Dispatch<SetStateAction<string>>;
  setAvisosConteudo18: Dispatch<SetStateAction<AvisoConteudo18[]>>;
  setSinopse: Dispatch<SetStateAction<string>>;
};

export function useEditarObraFormChangeActions({
  salvou,
  erro,
  setSalvou,
  setErro,
  setTitulo,
  setAutor,
  setFormato,
  setFormatoPersonalizado,
  setGenero,
  setGeneroPersonalizado,
  setClassificacaoIndicativa,
  setAvisosConteudo18,
  setSinopse,
}: UseEditarObraFormChangeActionsProps) {
  function marcarAlteracao() {
    if (salvou) {
      setSalvou(false);
    }

    if (erro) {
      setErro("");
    }
  }

  function alterarTitulo(novoTitulo: string) {
    setTitulo(novoTitulo);
    marcarAlteracao();
  }

  function alterarAutor(novoAutor: string) {
    setAutor(novoAutor);
    marcarAlteracao();
  }

  function alterarFormato(novoFormato: string) {
    setFormato(novoFormato);

    if (novoFormato !== OUTRO_FORMATO_VALUE) {
      setFormatoPersonalizado("");
    }

    marcarAlteracao();
  }

  function alterarFormatoPersonalizado(novoFormatoPersonalizado: string) {
    setFormatoPersonalizado(
      limparTextoPersonalizado(
        novoFormatoPersonalizado,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
      )
    );
    marcarAlteracao();
  }

  function alterarGenero(novoGenero: string) {
    setGenero(novoGenero);

    if (novoGenero !== OUTRO_GENERO_VALUE) {
      setGeneroPersonalizado("");
    }

    marcarAlteracao();
  }

  function alterarGeneroPersonalizado(novoGeneroPersonalizado: string) {
    setGeneroPersonalizado(
      limparTextoPersonalizado(
        novoGeneroPersonalizado,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
      )
    );
    marcarAlteracao();
  }

  function alterarClassificacaoIndicativa(novaClassificacao: string) {
    setClassificacaoIndicativa(novaClassificacao);

    if (!ehClassificacao18(novaClassificacao)) {
      setAvisosConteudo18([]);
    }

    marcarAlteracao();
  }

  function alternarAvisoConteudo18(aviso: AvisoConteudo18) {
    setAvisosConteudo18((avisosAtuais) =>
      avisosAtuais.includes(aviso)
        ? avisosAtuais.filter((item) => item !== aviso)
        : [...avisosAtuais, aviso],
    );
    marcarAlteracao();
  }

  function alterarSinopse(novaSinopse: string) {
    setSinopse(novaSinopse);
    marcarAlteracao();
  }

  return {
    marcarAlteracao,
    alterarTitulo,
    alterarAutor,
    alterarFormato,
    alterarFormatoPersonalizado,
    alterarGenero,
    alterarGeneroPersonalizado,
    alterarClassificacaoIndicativa,
    alternarAvisoConteudo18,
    alterarSinopse,
  };
}
