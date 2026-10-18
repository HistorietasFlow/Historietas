"use client";

import { useState } from "react";
import type { AbaSeguimentoPagina } from "../lib/seguindo-page-types";

export function useSeguindoFollowTabState() {
  const [, setAbaSeguimento] =
    useState<AbaSeguimentoPagina>("seguindo");

  return { setAbaSeguimento };
}
