"use client";

import { useSeguindoPageLoadState } from "./use-seguindo-page-load-state";
import { useSeguindoReadingStatusState } from "./use-seguindo-reading-status-state";
import { useSeguindoWorkFollowState } from "./use-seguindo-work-follow-state";

export function useSeguindoPageDataState() {
  return {
    ...useSeguindoWorkFollowState(),
    ...useSeguindoReadingStatusState(),
    ...useSeguindoPageLoadState(),
  };
}
