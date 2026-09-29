import assert from "node:assert/strict";
import test from "node:test";
import { sincronizarReviewsPendentesSequencialmenteComunidade } from "../../app/comunidade/components/community-pending-reviews-sync.ts";

function criarPromessaControlada() {
  let resolver;
  const promessa = new Promise((resolve) => {
    resolver = resolve;
  });

  return { promessa, resolver };
}

test("mantém Review não iniciada elegível após cancelamento parcial", async () => {
  const reviewA = { id: "review-a" };
  const reviewB = { id: "review-b" };
  const reviewsPendentes = [reviewA, reviewB];
  const reviewsSincronizadas = new Set();
  const reviewAControlada = criarPromessaControlada();
  const reviewAIniciada = criarPromessaControlada();
  const reviewsIniciadas = [];
  let cancelado = false;

  const primeiraExecucao =
    sincronizarReviewsPendentesSequencialmenteComunidade({
      reviewsPendentes,
      reviewsSincronizadas,
      cancelamentoSolicitado: () => cancelado,
      sincronizarReview: async (post) => {
        reviewsIniciadas.push(post.id);

        if (post.id === reviewA.id) {
          reviewAIniciada.resolver();
          return reviewAControlada.promessa;
        }

        return true;
      },
    });

  await reviewAIniciada.promessa;

  assert.deepEqual(reviewsIniciadas, [reviewA.id]);
  assert.equal(reviewsSincronizadas.has(reviewA.id), true);
  assert.equal(reviewsSincronizadas.has(reviewB.id), false);

  cancelado = true;
  reviewAControlada.resolver(true);
  await primeiraExecucao;

  assert.deepEqual(reviewsIniciadas, [reviewA.id]);
  assert.equal(reviewsSincronizadas.has(reviewA.id), true);
  assert.equal(reviewsSincronizadas.has(reviewB.id), false);

  const reviewsElegiveisNaReentrada = reviewsPendentes.filter(
    (post) => !reviewsSincronizadas.has(post.id),
  );

  assert.deepEqual(reviewsElegiveisNaReentrada, [reviewB]);

  cancelado = false;
  await sincronizarReviewsPendentesSequencialmenteComunidade({
    reviewsPendentes: reviewsElegiveisNaReentrada,
    reviewsSincronizadas,
    cancelamentoSolicitado: () => cancelado,
    sincronizarReview: async (post) => {
      reviewsIniciadas.push(post.id);
      return true;
    },
  });

  assert.deepEqual(reviewsIniciadas, [reviewA.id, reviewB.id]);
  assert.equal(reviewsSincronizadas.has(reviewB.id), true);
});

test("remove a marcação quando a sincronização falha e permite retry", async () => {
  const review = { id: "review-com-falha" };
  const reviewsSincronizadas = new Set();

  await sincronizarReviewsPendentesSequencialmenteComunidade({
    reviewsPendentes: [review],
    reviewsSincronizadas,
    cancelamentoSolicitado: () => false,
    sincronizarReview: async () => false,
  });

  assert.equal(reviewsSincronizadas.has(review.id), false);

  const reviewsElegiveisNoRetry = [review].filter(
    (post) => !reviewsSincronizadas.has(post.id),
  );

  assert.deepEqual(reviewsElegiveisNoRetry, [review]);

  await sincronizarReviewsPendentesSequencialmenteComunidade({
    reviewsPendentes: reviewsElegiveisNoRetry,
    reviewsSincronizadas,
    cancelamentoSolicitado: () => false,
    sincronizarReview: async () => true,
  });

  assert.equal(reviewsSincronizadas.has(review.id), true);
});
