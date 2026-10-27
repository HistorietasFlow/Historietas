import { criarMetadataAceiteTermos } from "../../../lib/aceiteTermos";
import { supabase } from "../../../lib/supabase/client";

type CriarContaLoginParams = {
  emailFinal: string;
  senha: string;
  nomeFinal: string;
};

export function criarContaLogin({
  emailFinal,
  senha,
  nomeFinal,
}: CriarContaLoginParams) {
  const aceiteEm = new Date().toISOString();
  const metadataAceite = criarMetadataAceiteTermos(aceiteEm);

  return supabase.auth.signUp({
    email: emailFinal,
    password: senha,
    options: {
      data: {
        nome: nomeFinal,
        name: nomeFinal,
        full_name: nomeFinal,
        tipo: "leitor",
        ...metadataAceite,
      },
    },
  });
}
