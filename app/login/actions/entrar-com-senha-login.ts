import { supabase } from "../../../lib/supabase/client";

type EntrarComSenhaLoginParams = {
  emailFinal: string;
  senha: string;
};

export function entrarComSenhaLogin({
  emailFinal,
  senha,
}: EntrarComSenhaLoginParams) {
  return supabase.auth.signInWithPassword({
    email: emailFinal,
    password: senha,
  });
}
