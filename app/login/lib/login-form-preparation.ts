type PrepararFormularioLoginResultado = {
  emailFinal: string;
  nomeFinal: string;
};

export function prepararFormularioLogin(
  email: string,
  nome: string,
): PrepararFormularioLoginResultado {
  const emailFinal = email.trim().toLowerCase();
  const nomeFinal = nome.trim();

  return {
    emailFinal,
    nomeFinal,
  };
}
