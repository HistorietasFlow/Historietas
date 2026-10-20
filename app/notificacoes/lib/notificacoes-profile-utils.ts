import { pegarTexto } from "./notificacoes-data-normalizers";

export type PerfilNotificacao = {
  userId: string;
  nome: string;
  avatar: string;
};

export function normalizarPerfilNotificacao(
  row: Record<string, unknown>,
  userIdFallback: string,
  nomeFallback: string
): PerfilNotificacao {
  const userId =
    pegarTexto(row.user_id) || pegarTexto(row.id) || userIdFallback.trim();
  const nome =
    pegarTexto(row.nome) ||
    pegarTexto(row.nome_usuario) ||
    pegarTexto(row.username) ||
    pegarTexto(row.display_name) ||
    pegarTexto(row.apelido) ||
    nomeFallback.trim() ||
    "Usuário";
  const avatar =
    pegarTexto(row.avatar_url) ||
    pegarTexto(row.avatar) ||
    pegarTexto(row.foto_url) ||
    pegarTexto(row.imagem_url) ||
    pegarTexto(row.photo_url);

  return {
    userId,
    nome: nome.slice(0, 80),
    avatar,
  };
}

export function obterPerfilNotificacao(
  perfis: Map<string, PerfilNotificacao>,
  userId: string,
  nomeFallback: string
) {
  const userIdLimpo = userId.trim();
  const perfil = userIdLimpo ? perfis.get(userIdLimpo) : null;

  return (
    perfil || {
      userId: userIdLimpo,
      nome: nomeFallback.trim() || "Usuário",
      avatar: "",
    }
  );
}
