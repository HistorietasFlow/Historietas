import type { Dispatch, FormEvent, SetStateAction } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  MotivoDenuncia,
  TipoAlvoDenuncia,
} from "../DenunciaModal";

type MensagensEnvioDenuncia = {
  motivoObrigatorio: string;
  alvoInvalido: string;
  duplicada: string;
  login: string;
  erro: string;
};

type UseDenunciaSubmitActionParams = {
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
  alvoTitulo: string;
  alvoUrl: string;
  motivo: MotivoDenuncia | "";
  descricao: string;
  enviando: boolean;
  enviado: boolean;
  mensagens: MensagensEnvioDenuncia;
  setEnviando: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setEnviado: Dispatch<SetStateAction<boolean>>;
  onEnviada?: (denunciaId: string) => void;
};

function obterCodigoErro(erro: unknown): string {
  if (!erro || typeof erro !== "object") {
    return "";
  }

  return String((erro as { code?: unknown }).code || "");
}

function obterMensagemErro(
  erro: unknown,
  mensagens: MensagensEnvioDenuncia,
): string {
  const codigo = obterCodigoErro(erro);

  if (codigo === "23505") {
    return mensagens.duplicada;
  }

  if (codigo === "42501") {
    return mensagens.login;
  }

  if (codigo === "22023" || codigo === "23502") {
    return mensagens.alvoInvalido;
  }

  return mensagens.erro;
}

export function useDenunciaSubmitAction({
  alvoTipo,
  alvoId,
  alvoTitulo,
  alvoUrl,
  motivo,
  descricao,
  enviando,
  enviado,
  mensagens,
  setEnviando,
  setErro,
  setEnviado,
  onEnviada,
}: UseDenunciaSubmitActionParams) {
  async function enviarDenuncia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (enviando || enviado) {
      return;
    }

    if (!motivo) {
      setErro(mensagens.motivoObrigatorio);
      return;
    }

    const alvoIdLimpo = alvoId.trim();

    if (!alvoIdLimpo) {
      setErro(mensagens.alvoInvalido);
      return;
    }

    setEnviando(true);
    setErro("");

    try {
      const resposta =
        alvoTipo === "perfil"
          ? await supabase.rpc("criar_denuncia_perfil", {
              p_denunciado_id: alvoIdLimpo,
              p_perfil_nome: alvoTitulo.trim(),
              p_perfil_url: alvoUrl.trim(),
              p_motivo: motivo,
              p_descricao: descricao.trim(),
            })
          : await supabase.rpc("criar_denuncia", {
              p_alvo_tipo: alvoTipo,
              p_alvo_id: alvoIdLimpo,
              p_motivo: motivo,
              p_detalhe: descricao.trim(),
            });

      const { data, error } = resposta;

      if (error) {
        setErro(obterMensagemErro(error, mensagens));
        return;
      }

      const primeiroRegistro = Array.isArray(data) ? data[0] : data;
      const denunciaId =
        primeiroRegistro &&
        typeof primeiroRegistro === "object" &&
        "denuncia_id" in primeiroRegistro
          ? String(
              (primeiroRegistro as { denuncia_id?: unknown }).denuncia_id || "",
            )
          : "";

      setEnviado(true);
      onEnviada?.(denunciaId);
    } catch (erroDesconhecido) {
      setErro(obterMensagemErro(erroDesconhecido, mensagens));
    } finally {
      setEnviando(false);
    }
  }

  return { enviarDenuncia };
}
