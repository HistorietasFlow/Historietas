import type { Dispatch, FormEvent, SetStateAction } from "react";

type TraduzirExcluirConta = (
  pt: string,
  en: string,
  es: string,
) => string;

type UseExcluirContaRequestActionParams = {
  email: string;
  motivo: string;
  confirmacao: boolean;
  website: string;
  enviando: boolean;
  t: TraduzirExcluirConta;
  setEmail: Dispatch<SetStateAction<string>>;
  setMotivo: Dispatch<SetStateAction<string>>;
  setConfirmacao: Dispatch<SetStateAction<boolean>>;
  setWebsite: Dispatch<SetStateAction<string>>;
  setEnviando: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setEnviado: Dispatch<SetStateAction<boolean>>;
};

export function useExcluirContaRequestAction({
  email,
  motivo,
  confirmacao,
  website,
  enviando,
  t,
  setEmail,
  setMotivo,
  setConfirmacao,
  setWebsite,
  setEnviando,
  setErro,
  setEnviado,
}: UseExcluirContaRequestActionParams) {
  async function enviarSolicitacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setErro("");
    setEnviando(true);

    try {
      const response = await fetch("/api/conta/solicitar-exclusao", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          motivo,
          confirmacao,
          website,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; mensagem?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setErro(
          data?.mensagem ||
            t(
              "Não foi possível registrar sua solicitação agora.",
              "Your request could not be registered right now.",
              "No se pudo registrar tu solicitud ahora.",
            ),
        );
        return;
      }

      setEnviado(true);
      setEmail("");
      setMotivo("");
      setConfirmacao(false);
      setWebsite("");
    } catch {
      setErro(
        t(
          "Não foi possível registrar sua solicitação agora.",
          "Your request could not be registered right now.",
          "No se pudo registrar tu solicitud ahora.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  return { enviarSolicitacao };
}
