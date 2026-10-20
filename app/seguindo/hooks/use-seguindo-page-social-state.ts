"use client";

import { useSeguindoRequestActionState } from "./use-seguindo-request-action-state";
import { useSeguindoSocialListState } from "./use-seguindo-social-list-state";

export function useSeguindoPageSocialState() {
  return {
    ...useSeguindoSocialListState(),
    ...useSeguindoRequestActionState(),
  };
}
