import { obterIniciais } from "../lib/configuracoes-account-utils";
import {
  avatarStyle,
  profileCardStyle,
  profileEmailStyle,
  profileNameStyle,
  profileTextStyle,
  profileUsernameStyle,
} from "../lib/configuracoes-shell-styles";
import type { TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";

type ConfiguracoesProfileCardProps = {
  nomeExibicao: string;
  username: string;
  emailContato: string;
  usuarioNome: string | undefined;
  usuarioEmail: string | undefined;
  traduzirTexto: TraduzirTextoConfiguracoes;
};

export function ConfiguracoesProfileCard({
  nomeExibicao,
  username,
  emailContato,
  usuarioNome,
  usuarioEmail,
  traduzirTexto,
}: ConfiguracoesProfileCardProps) {
  return (
    <section style={profileCardStyle}>
      <div style={avatarStyle}>
        {obterIniciais(nomeExibicao, emailContato)}
      </div>

      <div style={profileTextStyle}>
        <strong style={profileNameStyle}>
          {nomeExibicao ||
            usuarioNome ||
            traduzirTexto(
              "Conta Historietas",
              "Historietas account",
              "Cuenta de Historietas",
            )}
        </strong>
        <span style={profileUsernameStyle}>
          {username
            ? `@${username}`
            : traduzirTexto(
                "@username não definido",
                "@username not set",
                "@username no definido",
              )}
        </span>
        <span style={profileEmailStyle}>
          {emailContato ||
            usuarioEmail ||
            traduzirTexto(
              "E-mail não informado",
              "Email not provided",
              "Correo no informado",
            )}
        </span>
      </div>
    </section>
  );
}
