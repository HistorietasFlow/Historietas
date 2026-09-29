type ReviewPendenteComunidade = {
  id: string;
};

type SincronizarReviewsPendentesSequencialmenteComunidadeParams<
  TReview extends ReviewPendenteComunidade,
> = {
  reviewsPendentes: readonly TReview[];
  reviewsSincronizadas: Set<string>;
  cancelamentoSolicitado: () => boolean;
  sincronizarReview: (post: TReview) => Promise<boolean>;
};

export async function sincronizarReviewsPendentesSequencialmenteComunidade<
  TReview extends ReviewPendenteComunidade,
>({
  reviewsPendentes,
  reviewsSincronizadas,
  cancelamentoSolicitado,
  sincronizarReview,
}: SincronizarReviewsPendentesSequencialmenteComunidadeParams<TReview>): Promise<void> {
  for (const post of reviewsPendentes) {
    if (cancelamentoSolicitado()) {
      return;
    }

    reviewsSincronizadas.add(post.id);

    const sincronizou = await sincronizarReview(post);

    if (!sincronizou) {
      reviewsSincronizadas.delete(post.id);
    }
  }
}
