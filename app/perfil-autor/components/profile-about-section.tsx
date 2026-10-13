import type { ChangeEventHandler, MouseEventHandler } from "react";
import type { DiarioPerfilItem } from "../types";
import { profileAboutBoxStyle } from "../styles";
import { ProfileAboutContent } from "./profile-about-content";
import { ProfileAboutFooter } from "./profile-about-footer";
import { ProfileAboutHero } from "./profile-about-hero";

type ProfileAboutSectionProps = {
  heroTitle: string;
  heroText: string;
  heroUserContent?: "true";
  heroCanEdit: boolean;
  onToggleHeroEditor: MouseEventHandler<HTMLButtonElement>;
  heroEditorVisible: boolean;
  heroEditorValue: string;
  onHeroEditorChange: ChangeEventHandler<HTMLTextAreaElement>;
  heroEditorPlaceholder: string;
  heroEditorMaxLength: number;
  heroEditorRemainingCharacters: number;
  generosEspecialidadesPerfil: string[];
  totalPublicadas: string;
  totalCapitulos: string;
  totalCurtidas: string;
  totalVisualizacoes: string;
  totalObras: number;
  totalRascunhos: number;
  totalComentarios: number;
  totalConcluidas: number;
  mostrarObrasSemCapitulos: boolean;
  totalObrasSemCapitulos: number;
  memberSince: string;
  showRecentActivity: boolean;
  recentActivityExpanded: boolean;
  recentActivityLoading: boolean;
  recentActivityItems: DiarioPerfilItem[];
  onToggleRecentActivity: () => void;
};

export function ProfileAboutSection({
  heroTitle,
  heroText,
  heroUserContent,
  heroCanEdit,
  onToggleHeroEditor,
  heroEditorVisible,
  heroEditorValue,
  onHeroEditorChange,
  heroEditorPlaceholder,
  heroEditorMaxLength,
  heroEditorRemainingCharacters,
  generosEspecialidadesPerfil,
  totalPublicadas,
  totalCapitulos,
  totalCurtidas,
  totalVisualizacoes,
  totalObras,
  totalRascunhos,
  totalComentarios,
  totalConcluidas,
  mostrarObrasSemCapitulos,
  totalObrasSemCapitulos,
  memberSince,
  showRecentActivity,
  recentActivityExpanded,
  recentActivityLoading,
  recentActivityItems,
  onToggleRecentActivity,
}: ProfileAboutSectionProps) {
  return (
    <section style={profileAboutBoxStyle}>
      <ProfileAboutHero
        title={heroTitle}
        text={heroText}
        userContent={heroUserContent}
        canEdit={heroCanEdit}
        onToggleEditor={onToggleHeroEditor}
        editorVisible={heroEditorVisible}
        editorValue={heroEditorValue}
        onEditorChange={onHeroEditorChange}
        editorPlaceholder={heroEditorPlaceholder}
        editorMaxLength={heroEditorMaxLength}
        editorRemainingCharacters={heroEditorRemainingCharacters}
      />

      <ProfileAboutContent
        generosEspecialidadesPerfil={generosEspecialidadesPerfil}
        totalPublicadas={totalPublicadas}
        totalCapitulos={totalCapitulos}
        totalCurtidas={totalCurtidas}
        totalVisualizacoes={totalVisualizacoes}
        totalObras={totalObras}
        totalRascunhos={totalRascunhos}
        totalComentarios={totalComentarios}
        totalConcluidas={totalConcluidas}
        mostrarObrasSemCapitulos={mostrarObrasSemCapitulos}
        totalObrasSemCapitulos={totalObrasSemCapitulos}
      />

      <ProfileAboutFooter
        memberSince={memberSince}
        showRecentActivity={showRecentActivity}
        expanded={recentActivityExpanded}
        loading={recentActivityLoading}
        items={recentActivityItems}
        onToggle={onToggleRecentActivity}
      />
    </section>
  );
}
