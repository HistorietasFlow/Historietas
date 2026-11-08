import "server-only";

/** Inconsistencia nao e ausencia. Retry limitado; nenhuma versao antiga e fallback. */
export class ProjecaoPublicaAlterada extends Error {
  constructor() { super("A projeção pública mudou durante a leitura. Tente novamente."); }
}

export async function lerComBarreiraPublica<TVersao, TDados>({
  lerVersao, chave, carregar,
}: {
  lerVersao: () => Promise<TVersao>;
  chave: (versao: TVersao) => string;
  carregar: (versao: TVersao) => Promise<TDados>;
}): Promise<TDados> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const antes = await lerVersao();
    try {
      const dados = await carregar(antes);
      // NAO memoizar: POST/no-store novo inclusive dentro do mesmo render.
      const depois = await lerVersao();
      if (chave(antes) === chave(depois)) return dados;
    } catch (erro) {
      if (!(erro instanceof ProjecaoPublicaAlterada)) throw erro;
    }
  }
  throw new ProjecaoPublicaAlterada();
}
