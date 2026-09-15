import {
  privateProfileLockStyle,
  privateProfileNoticeStyle,
  privateProfileNoticeTextBlockStyle,
  privateProfileNoticeTextStyle,
  privateProfileNoticeTitleStyle,
} from "../styles";

type PrivateProfileNoticeProps = {
  perfilBloqueadoEntreUsuarios: boolean;
};

export function PrivateProfileNotice({
  perfilBloqueadoEntreUsuarios,
}: PrivateProfileNoticeProps) {
  return (
    <section style={privateProfileNoticeStyle} aria-label="Conteúdo privado">
      <span style={privateProfileLockStyle} aria-hidden="true">
        🔒
      </span>
      <div style={privateProfileNoticeTextBlockStyle}>
        <strong style={privateProfileNoticeTitleStyle}>
          {perfilBloqueadoEntreUsuarios
            ? "Perfil bloqueado"
            : "Conteúdo privado"}
        </strong>
        <p style={privateProfileNoticeTextStyle}>
          {perfilBloqueadoEntreUsuarios
            ? "O conteúdo deste perfil está oculto porque existe um bloqueio entre vocês."
            : "Este autor manteve todas as seções do perfil privadas."}
        </p>
      </div>
    </section>
  );
}
