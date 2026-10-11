import { SOBRE_BIO_MAX_LENGTH } from "../constants";
import type { PerfilAutorSalvo } from "../types";

export function usePerfilAutorAboutActions({
  avatarAutor,
  perfilSalvoAutor,
  bioAutorPersonalizada,
  bioSobrePersonalizada,
  salvarPerfilAutor,
}: {
  avatarAutor: string;
  perfilSalvoAutor: PerfilAutorSalvo;
  bioAutorPersonalizada: string;
  bioSobrePersonalizada: string;
  salvarPerfilAutor: (novoPerfil: PerfilAutorSalvo) => void;
}) {
  function atualizarBioSobreAutor(novaBioSobre: string) {
    salvarPerfilAutor({
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: bioAutorPersonalizada,
      sobreBio: novaBioSobre.slice(0, SOBRE_BIO_MAX_LENGTH),
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    });
  }

  function alternarDestaquesPerfil() {
    salvarPerfilAutor({
      avatar: avatarAutor,
      avatarNome: perfilSalvoAutor.avatarNome,
      bio: bioAutorPersonalizada,
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: !perfilSalvoAutor.mostrarDestaques,
    });
  }

  return {
    atualizarBioSobreAutor,
    alternarDestaquesPerfil,
  };
}
