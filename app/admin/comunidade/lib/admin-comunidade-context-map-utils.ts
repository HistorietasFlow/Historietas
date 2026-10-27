import {
  criarMapaNomesPerfisModeracao,
  type PerfilModeracao,
} from "./admin-comunidade-profile-utils";

type ItemComId = {
  id: string;
};

type CriarMapasContextoModeracaoParams<
  TPost extends ItemComId,
  TComentario extends ItemComId,
  TComentarioCapitulo extends ItemComId,
  TComentarioObra extends ItemComId,
  TComentarioDiario extends ItemComId,
  TAnotacaoDiario extends ItemComId,
  TCapitulo extends ItemComId,
  TObra extends ItemComId,
> = {
  perfis: PerfilModeracao[];
  posts: TPost[];
  comentarios: TComentario[];
  comentariosCapitulos: TComentarioCapitulo[];
  comentariosObras: TComentarioObra[];
  comentariosDiario: TComentarioDiario[];
  diarioAnotacoes: TAnotacaoDiario[];
  capitulos: TCapitulo[];
  obras: TObra[];
};

export function criarMapasContextoModeracao<
  TPost extends ItemComId,
  TComentario extends ItemComId,
  TComentarioCapitulo extends ItemComId,
  TComentarioObra extends ItemComId,
  TComentarioDiario extends ItemComId,
  TAnotacaoDiario extends ItemComId,
  TCapitulo extends ItemComId,
  TObra extends ItemComId,
>({
  perfis,
  posts,
  comentarios,
  comentariosCapitulos,
  comentariosObras,
  comentariosDiario,
  diarioAnotacoes,
  capitulos,
  obras,
}: CriarMapasContextoModeracaoParams<
  TPost,
  TComentario,
  TComentarioCapitulo,
  TComentarioObra,
  TComentarioDiario,
  TAnotacaoDiario,
  TCapitulo,
  TObra
>) {
  const perfisPorId = criarMapaNomesPerfisModeracao(perfis);
  const postsPorId = new Map(posts.map((post) => [post.id, post]));
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const comentariosCapitulosPorId = new Map(
    comentariosCapitulos.map((comentario) => [comentario.id, comentario])
  );
  const comentariosObrasPorId = new Map(
    comentariosObras.map((comentario) => [comentario.id, comentario])
  );
  const comentariosDiarioPorId = new Map(
    comentariosDiario.map((comentario) => [comentario.id, comentario])
  );
  const diarioAnotacoesPorId = new Map(
    diarioAnotacoes.map((anotacao) => [anotacao.id, anotacao])
  );
  const capitulosPorId = new Map(
    capitulos.map((capitulo) => [capitulo.id, capitulo])
  );
  const obrasPorId = new Map(obras.map((obra) => [obra.id, obra]));

  return {
    perfisPorId,
    postsPorId,
    comentariosPorId,
    comentariosCapitulosPorId,
    comentariosObrasPorId,
    comentariosDiarioPorId,
    diarioAnotacoesPorId,
    capitulosPorId,
    obrasPorId,
  };
}
