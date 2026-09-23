export type AlvoDenunciaComunidade = "post" | "comentario";

export type DenunciaAlvoComunidade = {
  alvoTipo: AlvoDenunciaComunidade;
  alvoId: string;
  alvoTitulo: string;
};
