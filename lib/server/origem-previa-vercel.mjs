// O ambiente do deployment determina o projeto, a assinatura e a visibilidade do botão.
export function configuracaoPreviaVercel(env) {
  if (env.VERCEL !== "1" || env.NODE_ENV !== "production") return null;
  const producao = env.VERCEL_ENV === "production";
  if (!producao && env.VERCEL_ENV !== "preview") return null;

  const projeto = producao ? env.HISTORIETAS_PREVIA_PROJETO_PRODUCAO : env.HISTORIETAS_PREVIA_PROJETO_PREVIEW;
  const chaveProva = producao ? env.HISTORIETAS_PREVIA_CHAVE_PRODUCAO : env.HISTORIETAS_PREVIA_CHAVE_PREVIEW;
  const interfaceAtiva = producao ? env.HISTORIETAS_PREVIA_INTERFACE_PRODUCAO : env.HISTORIETAS_PREVIA_INTERFACE;
  if (!projeto || !/^[a-z0-9]{20}$/.test(projeto) || !chaveProva || !/^[a-f0-9]{64}$/.test(chaveProva)) return null;
  const origem = "https://" + projeto + ".supabase.co";
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (url !== origem && url !== origem + "/") return null;
  return { origem, chaveProva, mostrarInterface: interfaceAtiva === "1" };
}
