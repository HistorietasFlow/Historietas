import type {
  ChangeEventHandler,
  FormEventHandler,
  RefObject,
} from "react";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import type { HistorietasLanguage } from "../../../lib/i18n";
import type { ArquivoObraLocal } from "../lib/publicar-models";
import type { ChaveTextoPublicar } from "../lib/publicar-translations";
import {
  desktopFormPanelStyle,
  formPanelStyle,
} from "../lib/publicar-form-upload-styles";
import { PublicarBasicFields } from "./PublicarBasicFields";
import { PublicarContentFileUpload } from "./PublicarContentFileUpload";
import { PublicarCoverUpload } from "./PublicarCoverUpload";
import { PublicarFormActions } from "./PublicarFormActions";
import { PublicarFormError } from "./PublicarFormError";
import { PublicarFormatGenreFields } from "./PublicarFormatGenreFields";
import { PublicarSynopsisField } from "./PublicarSynopsisField";
import { PublicarTagClassificationFields } from "./PublicarTagClassificationFields";

type PublicarPublicationFormProps = {
  arquivoCapituloErro: string;
  arquivoCapituloMinutos: number;
  arquivoCapituloNome: string;
  arquivoCapituloPalavras: number;
  arquivoCapituloTitulo: string;
  arquivoConteudoInputRef: RefObject<HTMLInputElement | null>;
  arquivoObra: ArquivoObraLocal | null;
  arquivoObraErro: string;
  arquivoObraTamanhoTexto: string;
  arquivoObraTipoTexto: string;
  arquivoTextoPendente: File | null;
  arquivoTextoPendenteTamanhoTexto: string;
  autor: string;
  avisosConteudo18: AvisoConteudo18[];
  capa: string;
  capaErro: string;
  capaInputRef: RefObject<HTMLInputElement | null>;
  capaNome: string;
  caracteresValidos: number;
  classificacao18Selecionada: boolean;
  classificacaoIndicativa: string;
  erro: string;
  formato: string;
  formatoEhPersonalizado: boolean;
  formatoPersonalizado: string;
  genero: string;
  generoEhPersonalizado: boolean;
  generoPersonalizado: string;
  idioma: HistorietasLanguage;
  isDesktop: boolean;
  onAlternarAviso: (aviso: AvisoConteudo18) => void;
  onAnexarArquivoCompleto: (arquivo: File) => void;
  onAutorChange: (valor: string) => void;
  onCancelarEscolhaArquivoTexto: () => void;
  onClassificacaoChange: (valor: string) => void;
  onFormatoChange: (valor: string) => void;
  onFormatoPersonalizadoChange: (valor: string) => void;
  onGeneroChange: (valor: string) => void;
  onGeneroPersonalizadoChange: (valor: string) => void;
  onLimparSelecaoConteudoArquivo: () => void;
  onRemoverCapa: () => void;
  onSelecionarCapa: ChangeEventHandler<HTMLInputElement>;
  onSelecionarConteudoArquivo: ChangeEventHandler<HTMLInputElement>;
  onSinopseChange: (valor: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onTagChange: (valor: string) => void;
  onTagPersonalizadaChange: (valor: string) => void;
  onTituloChange: (valor: string) => void;
  onTransformarArquivoTextoEmCapitulo: (arquivo: File) => void;
  palavras: number;
  processando: boolean;
  progresso: number;
  sinopse: string;
  sinopseValida: boolean;
  t: (chave: ChaveTextoPublicar) => string;
  tagPersonalizada: string;
  tagsDaObra: string[];
  temCapituloImportado: boolean;
  temConteudoPorArquivo: boolean;
  titulo: string;
  traduzirMensagem: (mensagem: string) => string;
  usarTagPersonalizada: boolean;
};

export function PublicarPublicationForm({
  arquivoCapituloErro,
  arquivoCapituloMinutos,
  arquivoCapituloNome,
  arquivoCapituloPalavras,
  arquivoCapituloTitulo,
  arquivoConteudoInputRef,
  arquivoObra,
  arquivoObraErro,
  arquivoObraTamanhoTexto,
  arquivoObraTipoTexto,
  arquivoTextoPendente,
  arquivoTextoPendenteTamanhoTexto,
  autor,
  avisosConteudo18,
  capa,
  capaErro,
  capaInputRef,
  capaNome,
  caracteresValidos,
  classificacao18Selecionada,
  classificacaoIndicativa,
  erro,
  formato,
  formatoEhPersonalizado,
  formatoPersonalizado,
  genero,
  generoEhPersonalizado,
  generoPersonalizado,
  idioma,
  isDesktop,
  onAlternarAviso,
  onAnexarArquivoCompleto,
  onAutorChange,
  onCancelarEscolhaArquivoTexto,
  onClassificacaoChange,
  onFormatoChange,
  onFormatoPersonalizadoChange,
  onGeneroChange,
  onGeneroPersonalizadoChange,
  onLimparSelecaoConteudoArquivo,
  onRemoverCapa,
  onSelecionarCapa,
  onSelecionarConteudoArquivo,
  onSinopseChange,
  onSubmit,
  onTagChange,
  onTagPersonalizadaChange,
  onTituloChange,
  onTransformarArquivoTextoEmCapitulo,
  palavras,
  processando,
  progresso,
  sinopse,
  sinopseValida,
  t,
  tagPersonalizada,
  tagsDaObra,
  temCapituloImportado,
  temConteudoPorArquivo,
  titulo,
  traduzirMensagem,
  usarTagPersonalizada,
}: PublicarPublicationFormProps) {
  return (
    <form onSubmit={onSubmit} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
      {erro && (
        <PublicarFormError
          isDesktop={isDesktop}
          mensagem={traduzirMensagem(erro)}
          titulo={t("ajusteNecessario")}
        />
      )}

      <PublicarCoverUpload
        capa={capa}
        capaErro={capaErro}
        capaInputRef={capaInputRef}
        capaNome={capaNome}
        isDesktop={isDesktop}
        onRemoverCapa={onRemoverCapa}
        onSelecionarCapa={onSelecionarCapa}
        t={t}
        traduzirMensagem={traduzirMensagem}
      />

      <PublicarBasicFields
        autor={autor}
        isDesktop={isDesktop}
        onAutorChange={onAutorChange}
        onTituloChange={onTituloChange}
        t={t}
        titulo={titulo}
      />

      <PublicarFormatGenreFields
        formato={formato}
        formatoEhPersonalizado={formatoEhPersonalizado}
        formatoPersonalizado={formatoPersonalizado}
        genero={genero}
        generoEhPersonalizado={generoEhPersonalizado}
        generoPersonalizado={generoPersonalizado}
        idioma={idioma}
        isDesktop={isDesktop}
        onFormatoChange={onFormatoChange}
        onFormatoPersonalizadoChange={onFormatoPersonalizadoChange}
        onGeneroChange={onGeneroChange}
        onGeneroPersonalizadoChange={onGeneroPersonalizadoChange}
        t={t}
      />

      <PublicarTagClassificationFields
        avisosConteudo18={avisosConteudo18}
        classificacao18Selecionada={classificacao18Selecionada}
        classificacaoIndicativa={classificacaoIndicativa}
        idioma={idioma}
        isDesktop={isDesktop}
        onAlternarAviso={onAlternarAviso}
        onClassificacaoChange={onClassificacaoChange}
        onTagChange={onTagChange}
        onTagPersonalizadaChange={onTagPersonalizadaChange}
        t={t}
        tagPersonalizada={tagPersonalizada}
        tagsDaObra={tagsDaObra}
        usarTagPersonalizada={usarTagPersonalizada}
      />

      <PublicarSynopsisField
        caracteresValidos={caracteresValidos}
        isDesktop={isDesktop}
        onSinopseChange={onSinopseChange}
        palavras={palavras}
        sinopse={sinopse}
        sinopseValida={sinopseValida}
        t={t}
      />

      <PublicarContentFileUpload
        arquivoCapituloErro={arquivoCapituloErro}
        arquivoCapituloMinutos={arquivoCapituloMinutos}
        arquivoCapituloNome={arquivoCapituloNome}
        arquivoCapituloPalavras={arquivoCapituloPalavras}
        arquivoCapituloTitulo={arquivoCapituloTitulo}
        arquivoConteudoInputRef={arquivoConteudoInputRef}
        arquivoObra={arquivoObra}
        arquivoObraErro={arquivoObraErro}
        arquivoObraTamanhoTexto={arquivoObraTamanhoTexto}
        arquivoObraTipoTexto={arquivoObraTipoTexto}
        arquivoTextoPendente={arquivoTextoPendente}
        arquivoTextoPendenteTamanhoTexto={arquivoTextoPendenteTamanhoTexto}
        isDesktop={isDesktop}
        onAnexarArquivoCompleto={onAnexarArquivoCompleto}
        onCancelarEscolhaArquivoTexto={onCancelarEscolhaArquivoTexto}
        onLimparSelecaoConteudoArquivo={onLimparSelecaoConteudoArquivo}
        onSelecionarConteudoArquivo={onSelecionarConteudoArquivo}
        onTransformarArquivoTextoEmCapitulo={onTransformarArquivoTextoEmCapitulo}
        t={t}
        temCapituloImportado={temCapituloImportado}
        temConteudoPorArquivo={temConteudoPorArquivo}
        traduzirMensagem={traduzirMensagem}
      />

      <PublicarFormActions
        cancelar={t("cancelar")}
        criarObra={t("criarObra")}
        isDesktop={isDesktop}
        processando={processando}
        progresso={progresso}
        progressoRotulo={t("progresso")}
        salvando={t("salvando")}
      />
    </form>
  );
}
