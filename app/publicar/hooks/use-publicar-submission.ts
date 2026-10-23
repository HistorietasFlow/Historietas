"use client";

import { type FormEvent, useRef } from "react";
import {
  salvarObraPublicar,
  type SalvarObraPublicarParams,
} from "../lib/publicar-submission-action";

type UsePublicarSubmissionParams = Omit<
  SalvarObraPublicarParams,
  "jaSalvouRef"
>;

export function usePublicarSubmission(params: UsePublicarSubmissionParams) {
  const jaSalvouRef = useRef(false);

  async function salvarObra(event: FormEvent<HTMLFormElement>) {
    return salvarObraPublicar(
      {
        ...params,
        jaSalvouRef,
      },
      event,
    );
  }

  return { salvarObra };
}
