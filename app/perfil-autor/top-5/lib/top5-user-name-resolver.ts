import { carregarNomePerfilTop5 } from "./top5-profile-name-loader";
import { obterNomeInicialUsuarioTop5 } from "./top5-user-name";

export async function resolverNomeUsuarioTop5(
  userId: string,
  nomeMetadata: unknown,
  nameMetadata: unknown,
  email: unknown,
) {
  let nomeUsuario = obterNomeInicialUsuarioTop5(
    nomeMetadata,
    nameMetadata,
    email,
  );

  if (userId) {
    nomeUsuario = await carregarNomePerfilTop5(
      userId,
      nomeUsuario,
    );
  }

  return nomeUsuario;
}
