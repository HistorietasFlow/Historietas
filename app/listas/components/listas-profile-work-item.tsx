import type { CSSProperties, ReactNode } from "react";
import { ListasDiaryAnnotationCard } from "./listas-diary-annotation-card";
import { ListasProfileWorkRow } from "./listas-profile-work-row";
import { compactarNumero, formatarNotaListas } from "../lib/listas-format-utils";
import {
  listDiaryCardAnnotationCommentButtonStyle,
  listDiaryCardAnnotationCommentCountStyle,
  listDiaryCardAnnotationCommentIconStyle,
} from "../lib/listas-diary-comments-styles";
import {
  listDiaryCardAnnotationHeaderActionsStyle,
  listDiaryCardAnnotationHeaderStyle,
  listDiaryCardAnnotationLikeButtonStyle,
  listDiaryCardAnnotationLikeCountStyle,
  listDiaryCardAnnotationLikeIconStyle,
  listDiaryCardAnnotationStyle,
  listDiaryCardAnnotationTextStyle,
  listDiaryCardAnnotationTitleGroupStyle,
  listDiaryCardAnnotationTitleStyle,
  listDiaryCardSpoilerButtonStyle,
  listDiaryCardSpoilerStyle,
  listDiaryCardSpoilerTextStyle,
  rowRatingSignalStarStyle,
  rowRatingSignalStyle,
  rowSignalAnnotationToggleStyle,
  rowSignalStyle,
  rowSignalsStyle,
} from "../lib/listas-work-styles";
import {
  moreDotStyle,
  moreOptionsStyle,
  rowDetailStyle,
  rowMetaStyle,
  rowOptionsButtonStyle,
  rowTextStyle,
  rowTitleStyle,
  rowMainLinkStyle,
} from "../lib/listas-layout-styles";

type ListasProfileWorkItemProps = {
  annotation: string;
  annotationId: string;
  annotationOpen: boolean;
  annotationSpoiler: boolean;
  authorName: string;
  autor: string;
  canLikeAnnotation: boolean;
  canSeeComments: boolean;
  className: string;
  commentCount: number;
  detalhe: ReactNode;
  genero: string;
  hasAnnotation: boolean;
  href: string;
  isAnnotationLiked: boolean;
  isSavingAnnotationLike: boolean;
  nota: number;
  onLikeAnnotation: () => void;
  onOpenComments: () => void;
  onOpenOptions: () => void;
  onSetSpoilerRevealed: (revealed: boolean) => void;
  onToggleAnnotation: () => void;
  showRating: boolean;
  spoilerRevealed: boolean;
  totalCurtidasAnnotation: number;
  titulo: string;
  workId: string;
  coverStyle: CSSProperties;
};

export function ListasProfileWorkItem({
  annotation,
  annotationId,
  annotationOpen,
  annotationSpoiler,
  authorName,
  autor,
  canLikeAnnotation,
  canSeeComments,
  className,
  commentCount,
  detalhe,
  genero,
  hasAnnotation,
  href,
  isAnnotationLiked,
  isSavingAnnotationLike,
  nota,
  onLikeAnnotation,
  onOpenComments,
  onOpenOptions,
  onSetSpoilerRevealed,
  onToggleAnnotation,
  showRating,
  spoilerRevealed,
  totalCurtidasAnnotation,
  titulo,
  workId,
  coverStyle,
}: ListasProfileWorkItemProps) {
  return <ListasProfileWorkRow
    annotation={
      annotation && annotationOpen ? <ListasDiaryAnnotationCard
        annotation={annotation}
        annotationId={annotationId}
        authorName={authorName}
        canLike={canLikeAnnotation}
        canSeeComments={canSeeComments}
        commentAriaLabel={`Abrir ${commentCount} ${commentCount === 1 ? "comentário" : "comentários"} da anotação`}
        commentCount={compactarNumero(commentCount)}
        containsSpoiler={annotationSpoiler}
        isLiked={isAnnotationLiked}
        isSavingLike={isSavingAnnotationLike}
        likeAriaLabel={`${isAnnotationLiked ? "Remover curtida da anotação" : "Curtir anotação"}. ${compactarNumero(totalCurtidasAnnotation)} ${totalCurtidasAnnotation === 1 ? "curtida" : "curtidas"}`}
        likeCount={compactarNumero(totalCurtidasAnnotation)}
        onLike={onLikeAnnotation}
        onOpenComments={onOpenComments}
        onSetSpoilerRevealed={onSetSpoilerRevealed}
        spoilerRevealed={spoilerRevealed}
        styles={{
          annotation: listDiaryCardAnnotationStyle,
          annotationCommentButton: listDiaryCardAnnotationCommentButtonStyle,
          annotationCommentCount: listDiaryCardAnnotationCommentCountStyle,
          annotationCommentIcon: listDiaryCardAnnotationCommentIconStyle,
          annotationHeader: listDiaryCardAnnotationHeaderStyle,
          annotationHeaderActions: listDiaryCardAnnotationHeaderActionsStyle,
          annotationLikeButton: listDiaryCardAnnotationLikeButtonStyle,
          annotationLikeCount: listDiaryCardAnnotationLikeCountStyle,
          annotationLikeIcon: listDiaryCardAnnotationLikeIconStyle,
          annotationText: listDiaryCardAnnotationTextStyle,
          annotationTitle: listDiaryCardAnnotationTitleStyle,
          annotationTitleGroup: listDiaryCardAnnotationTitleGroupStyle,
          spoiler: listDiaryCardSpoilerStyle,
          spoilerButton: listDiaryCardSpoilerButtonStyle,
          spoilerText: listDiaryCardSpoilerTextStyle,
        }}
        workId={workId}
      /> : null
    }
    annotationOpen={annotationOpen}
    autor={autor}
    className={className}
    coverStyle={coverStyle}
    detalhe={detalhe}
    genero={genero}
    hasAnnotation={hasAnnotation}
    href={href}
    notaFormatada={formatarNotaListas(nota)}
    onOpenOptions={onOpenOptions}
    onToggleAnnotation={onToggleAnnotation}
    showRating={showRating}
    styles={{
      detail: rowDetailStyle,
      mainLink: rowMainLinkStyle,
      meta: rowMetaStyle,
      moreDot: moreDotStyle,
      moreOptions: moreOptionsStyle,
      optionsButton: rowOptionsButtonStyle,
      ratingSignal: rowRatingSignalStyle,
      ratingSignalStar: rowRatingSignalStarStyle,
      signal: rowSignalStyle,
      signalAnnotationToggle: rowSignalAnnotationToggleStyle,
      signals: rowSignalsStyle,
      text: rowTextStyle,
      title: rowTitleStyle,
    }}
    titulo={titulo}
    workId={workId}
  />;
}
