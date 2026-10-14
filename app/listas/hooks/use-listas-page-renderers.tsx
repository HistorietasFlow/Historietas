"use client";

import type { CSSProperties } from "react";
import { ListasAuthorRow } from "../components/listas-author-row";
import { ListasPublicWorkRow } from "../components/listas-public-work-row";

type Obra = { id: string; capa: string; genero: string; link: string; titulo: string };
type Autor = { id: string; nome: string; avatar: string; totalObras: number; username: string };

export function useListasPageRenderers({ abrirMenuObra, criarAvatarStyle, criarCapaStyle, idUsuarioValido, styles }: {
  abrirMenuObra: (obra: any, item: null, categoria: "tudo") => void;
  criarAvatarStyle: (avatar: string) => CSSProperties;
  criarCapaStyle: (capa: string) => CSSProperties;
  idUsuarioValido: (id: string) => boolean;
  styles: { rowAuthorLinkStyle: CSSProperties; rowMainLinkStyle: CSSProperties; rowMetaStyle: CSSProperties; moreDotStyle: CSSProperties; moreOptionsStyle: CSSProperties; rowOptionsButtonStyle: CSSProperties; rowTextStyle: CSSProperties; rowTitleStyle: CSSProperties };
}) {
  function renderizarObraPublica(obra: Obra) {
    return <ListasPublicWorkRow key={obra.id} coverStyle={criarCapaStyle(obra.capa)} genero={obra.genero} href={obra.link} onOpenOptions={() => void abrirMenuObra(obra, null, "tudo")} styles={{ mainLink: styles.rowMainLinkStyle, meta: styles.rowMetaStyle, moreDot: styles.moreDotStyle, moreOptions: styles.moreOptionsStyle, optionsButton: styles.rowOptionsButtonStyle, text: styles.rowTextStyle, title: styles.rowTitleStyle }} titulo={obra.titulo} />;
  }
  function renderizarAutor(autor: Autor) {
    const href = idUsuarioValido(autor.id) ? `/perfil-autor?autorId=${encodeURIComponent(autor.id)}` : `/perfil-autor?autor=${encodeURIComponent(autor.nome)}`;
    return <ListasAuthorRow key={autor.id || autor.nome} avatar={autor.avatar} avatarStyle={criarAvatarStyle(autor.avatar)} href={href} nome={autor.nome} styles={{ authorLink: styles.rowAuthorLinkStyle, meta: styles.rowMetaStyle, text: styles.rowTextStyle, title: styles.rowTitleStyle }} totalObras={autor.totalObras} username={autor.username} />;
  }
  return { renderizarAutor, renderizarObraPublica };
}
