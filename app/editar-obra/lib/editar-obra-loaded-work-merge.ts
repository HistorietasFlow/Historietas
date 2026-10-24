import { normalizarObra } from "./editar-obra-work-normalizer";

type ObraNormalizadaEdicaoObra = ReturnType<typeof normalizarObra>;
type ObraEditavelEdicaoObra = Parameters<typeof normalizarObra>[0];

type PrepararObrasCarregadasEdicaoObraParams<
  T extends ObraEditavelEdicaoObra,
> = {
  obraNormalizadaSupabase: ObraNormalizadaEdicaoObra;
  nomeProfileUsuario: string;
  userId: string;
  obrasAutorizadas: T[];
  obraIdParam: string;
};

export function prepararObrasCarregadasEdicaoObra<
  T extends ObraEditavelEdicaoObra,
>({
  obraNormalizadaSupabase,
  nomeProfileUsuario,
  userId,
  obrasAutorizadas,
  obraIdParam,
}: PrepararObrasCarregadasEdicaoObraParams<T>) {
  const obraSupabaseComAutorProfile = nomeProfileUsuario
    ? normalizarObra(
        {
          ...obraNormalizadaSupabase,
          autor: nomeProfileUsuario,
          autorId: obraNormalizadaSupabase.autorId || userId,
        },
        0,
      )
    : obraNormalizadaSupabase;

  const obrasAtualizadas = [
    obraSupabaseComAutorProfile,
    ...obrasAutorizadas.filter((obra) => obra.id !== obraIdParam),
  ];

  return { obraSupabaseComAutorProfile, obrasAtualizadas };
}
