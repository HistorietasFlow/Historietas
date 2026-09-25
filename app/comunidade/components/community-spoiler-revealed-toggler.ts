import type { Dispatch, SetStateAction } from "react";

type AlternarSpoilerReveladoParams = {
  postId: string;
  setSpoilersReveladosIds: Dispatch<SetStateAction<string[]>>;
};

export function alternarSpoilerRevelado({
  postId,
  setSpoilersReveladosIds,
}: AlternarSpoilerReveladoParams) {
  setSpoilersReveladosIds((idsAtuais) =>
    idsAtuais.includes(postId)
      ? idsAtuais.filter((id) => id !== postId)
      : [...idsAtuais, postId]
  );
}
