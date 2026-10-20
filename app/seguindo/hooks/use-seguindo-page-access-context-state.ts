"use client";

import { useSeguindoAccessState } from "./use-seguindo-access-state";
import { useSeguindoFollowTabState } from "./use-seguindo-follow-tab-state";
import { useSeguindoProfileContextState } from "./use-seguindo-profile-context-state";

export function useSeguindoPageAccessContextState() {
  return {
    ...useSeguindoAccessState(),
    ...useSeguindoFollowTabState(),
    ...useSeguindoProfileContextState(),
  };
}
