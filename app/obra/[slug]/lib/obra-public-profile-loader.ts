import { idObraSupabaseValido } from "../../../../lib/utils";
import { consultarPerfisPublicosObraPorCampo } from "./obra-public-profile-query";
import {
  normalizarPerfilPublicoObra,
  obterTextoPerfilObra,
  type PerfilPublicoObra,
} from "./obra-text-utils";

export async function carregarPerfisPublicosObra(userIds: string[]) {
  const ids = Array.from(
    new Set(
      userIds
        .map((userId) => userId.trim())
        .filter((userId) => idObraSupabaseValido(userId))
    )
  );
  const perfis = new Map<string, PerfilPublicoObra>();

  if (ids.length === 0) {
    return perfis;
  }

  const perfisPorUsuario = await consultarPerfisPublicosObraPorCampo(
    ids,
    "user_id",
  );

  perfisPorUsuario.forEach((profile) => {
    const userId =
      obterTextoPerfilObra(profile, "user_id") ||
      obterTextoPerfilObra(profile, "id");

    if (userId) {
      perfis.set(
        userId,
        normalizarPerfilPublicoObra(profile, userId, "Usuário")
      );
    }
  });

  const idsFaltantes = ids.filter((userId) => !perfis.has(userId));

  if (idsFaltantes.length > 0) {
    const perfisPorId = await consultarPerfisPublicosObraPorCampo(
      idsFaltantes,
      "id",
    );

    perfisPorId.forEach((profile) => {
      const userId =
        obterTextoPerfilObra(profile, "user_id") ||
        obterTextoPerfilObra(profile, "id");

      if (userId) {
        perfis.set(
          userId,
          normalizarPerfilPublicoObra(profile, userId, "Usuário")
        );
      }
    });
  }

  return perfis;
}
