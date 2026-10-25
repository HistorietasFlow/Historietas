import { usuarioPodeEditarObraLocal } from "./editar-obra-ownership-utils";

type ObraLocalSelecionavel = {
  id: string;
  autorId?: string;
};

type ParametrosSelecaoObrasLocais<T extends ObraLocalSelecionavel> = {
  obrasNormalizadas: T[];
  userId: string;
  obraId: string;
};

export function selecionarObrasLocaisAutorizadasEdicaoObra<
  T extends ObraLocalSelecionavel,
>({
  obrasNormalizadas,
  userId,
  obraId,
}: ParametrosSelecaoObrasLocais<T>) {
  const obrasAutorizadas = obrasNormalizadas.filter((obra) =>
    usuarioPodeEditarObraLocal(obra, userId)
  );

  const obraLocal = obrasAutorizadas.find((obra) => obra.id === obraId);

  return { obrasAutorizadas, obraLocal };
}
