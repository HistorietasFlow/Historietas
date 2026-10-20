"use client";

import { useSeguindoContentTabState } from "./use-seguindo-content-tab-state";
import { useSeguindoFilterSortState } from "./use-seguindo-filter-sort-state";
import { useSeguindoSearchState } from "./use-seguindo-search-state";
import { useSeguindoSortingPanelState } from "./use-seguindo-sorting-panel-state";
import { useSeguindoSuggestionState } from "./use-seguindo-suggestion-state";

export function useSeguindoPageDiscoveryState() {
  return {
    ...useSeguindoSearchState(),
    ...useSeguindoSuggestionState(),
    ...useSeguindoFilterSortState(),
    ...useSeguindoContentTabState(),
    ...useSeguindoSortingPanelState(),
  };
}
