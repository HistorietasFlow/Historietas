import { carregarObrasLocaisTop5 } from "./top5-local-works-loader";
import { mesclarObrasTop5 } from "./top5-work-merge";
import type { ObraTop5 } from "./top5-types";

export function carregarObrasIniciaisTop5(
  userId: string,
  obrasSupabase: ObraTop5[],
) {
  return mesclarObrasTop5([
    ...carregarObrasLocaisTop5(userId),
    ...obrasSupabase,
  ]);
}
