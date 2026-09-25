import type { Dispatch, SetStateAction } from "react";

type FecharComentariosParams = {
  setComentariosPostId: Dispatch<SetStateAction<string | null>>;
};

export function fecharComentarios({
  setComentariosPostId,
}: FecharComentariosParams): void {
  setComentariosPostId(null);
}
