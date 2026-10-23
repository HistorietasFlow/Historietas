import type { Dispatch, SetStateAction } from "react";
import { obterTituloDenunciaComunidade } from "./community-report-title";
import type {
  AlvoDenunciaComunidade,
  DenunciaAlvoComunidade,
} from "./community-report-target";
import type { PostComunidade } from "./community-post-model";
import type { UsuarioComunidade } from "./community-user";

type Params = {
  alvoTipo: AlvoDenunciaComunidade;
  alvoId: string;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  posts: PostComunidade[];
  setErro: Dispatch<SetStateAction<string>>;
  setPostMenuAbertoId: Dispatch<SetStateAction<string | null>>;
  setDenunciaAlvo: Dispatch<SetStateAction<DenunciaAlvoComunidade | null>>;
};

export function denunciarConteudoComunidade({ alvoTipo, alvoId, exigirLogin, usuario, posts, setErro, setPostMenuAbertoId, setDenunciaAlvo }: Params) {
  if (!exigirLogin() || !usuario) return;
  const alvoIdLimpo = alvoId.trim();
  if (!alvoIdLimpo) { setErro("O conteúdo que você tentou denunciar é inválido."); return; }
  const alvoTitulo = obterTituloDenunciaComunidade(alvoTipo, alvoIdLimpo, posts);
  setErro("");
  setPostMenuAbertoId(null);
  setDenunciaAlvo({ alvoTipo, alvoId: alvoIdLimpo, alvoTitulo });
}
