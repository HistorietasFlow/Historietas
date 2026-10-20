"use client";

import { useSeguindoPageDataState } from "./use-seguindo-page-data-state";
import { useSeguindoPageDiscoveryState } from "./use-seguindo-page-discovery-state";
import { useSeguindoPageSocialState } from "./use-seguindo-page-social-state";

export function useSeguindoPageState() {
  return {
    ...useSeguindoPageDataState(),
    ...useSeguindoPageSocialState(),
    ...useSeguindoPageDiscoveryState(),
  };
}
