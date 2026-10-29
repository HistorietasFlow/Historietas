import { pegarTexto } from "./top5-work-normalizers";

export function obterNomeInicialUsuarioTop5(
  nome: unknown,
  name: unknown,
  email: unknown,
) {
  return (
    pegarTexto(nome) ||
    pegarTexto(name) ||
    pegarTexto(email) ||
    "Usuário"
  );
}
