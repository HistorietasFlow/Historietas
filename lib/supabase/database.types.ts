export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      autor_avaliacoes: {
        Row: {
          atualizado_em: string
          autor_id: string
          criado_em: string
          id: string
          nota: number
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          autor_id: string
          criado_em?: string
          id?: string
          nota: number
          user_id: string
        }
        Update: {
          atualizado_em?: string
          autor_id?: string
          criado_em?: string
          id?: string
          nota?: number
          user_id?: string
        }
        Relationships: []
      }
      capitulo_visualizacoes_unicas: {
        Row: {
          capitulo_id: string
          chave_visitante: string
          criada_em: string
          dia: string
        }
        Insert: {
          capitulo_id: string
          chave_visitante: string
          criada_em?: string
          dia?: string
        }
        Update: {
          capitulo_id?: string
          chave_visitante?: string
          criada_em?: string
          dia?: string
        }
        Relationships: [
          {
            foreignKeyName: "capitulo_visualizacoes_unicas_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
        ]
      }
      capitulos: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          obra_id: string
          ordem: number
          publicado: boolean
          texto: string
          titulo: string
          user_id: string
          visualizacoes: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          obra_id: string
          ordem?: number
          publicado?: boolean
          texto?: string
          titulo?: string
          user_id: string
          visualizacoes?: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          obra_id?: string
          ordem?: number
          publicado?: boolean
          texto?: string
          titulo?: string
          user_id?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "capitulos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_capitulos: {
        Row: {
          atualizado_em: string
          capitulo_id: string
          comentario: string
          comentario_pai_id: string | null
          criado_em: string
          id: string
          obra_id: string | null
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          capitulo_id: string
          comentario?: string
          comentario_pai_id?: string | null
          criado_em?: string
          id?: string
          obra_id?: string | null
          user_id: string
        }
        Update: {
          atualizado_em?: string
          capitulo_id?: string
          comentario?: string
          comentario_pai_id?: string | null
          criado_em?: string
          id?: string
          obra_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_capitulos_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_capitulos_comentario_pai_id_fkey"
            columns: ["comentario_pai_id"]
            isOneToOne: false
            referencedRelation: "comentarios_capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_capitulos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_capitulos_curtidas: {
        Row: {
          comentario_id: string
          criado_em: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_capitulos_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios_capitulos"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_obras: {
        Row: {
          comentario: string
          comentario_pai_id: string | null
          criado_em: string
          id: string
          obra_id: string
          user_id: string
        }
        Insert: {
          comentario: string
          comentario_pai_id?: string | null
          criado_em?: string
          id?: string
          obra_id: string
          user_id: string
        }
        Update: {
          comentario?: string
          comentario_pai_id?: string | null
          criado_em?: string
          id?: string
          obra_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_obras_comentario_pai_id_fkey"
            columns: ["comentario_pai_id"]
            isOneToOne: false
            referencedRelation: "comentarios_obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_obras_curtidas: {
        Row: {
          comentario_id: string
          criado_em: string
          id: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          id?: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_obras_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios_obras"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_comentario_curtidas: {
        Row: {
          comentario_id: string
          criado_em: string
          id: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          id?: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_comentario_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comunidade_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_comentarios: {
        Row: {
          autor_id: string
          autor_nome: string
          comentario_pai_id: string | null
          criado_em: string
          id: string
          post_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          autor_nome: string
          comentario_pai_id?: string | null
          criado_em?: string
          id?: string
          post_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          autor_nome?: string
          comentario_pai_id?: string | null
          criado_em?: string
          id?: string
          post_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_comentarios_comentario_pai_id_fkey"
            columns: ["comentario_pai_id"]
            isOneToOne: false
            referencedRelation: "comunidade_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidade_comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comunidade_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_comentarios_salvos: {
        Row: {
          comentario_id: string
          criado_em: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_comentarios_salvos_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comunidade_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_curtidas: {
        Row: {
          criado_em: string
          id: string
          post_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          post_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          post_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_curtidas_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comunidade_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_denuncias: {
        Row: {
          alvo_autor_id: string | null
          alvo_id: string
          alvo_tipo: string
          analisado_em: string | null
          analisado_por: string | null
          arquivada: boolean
          atualizado_em: string
          criado_em: string
          denunciante_id: string
          detalhe: string
          id: string
          motivo: string
          observacao_admin: string
          status: string
        }
        Insert: {
          alvo_autor_id?: string | null
          alvo_id: string
          alvo_tipo: string
          analisado_em?: string | null
          analisado_por?: string | null
          arquivada?: boolean
          atualizado_em?: string
          criado_em?: string
          denunciante_id: string
          detalhe?: string
          id?: string
          motivo?: string
          observacao_admin?: string
          status?: string
        }
        Update: {
          alvo_autor_id?: string | null
          alvo_id?: string
          alvo_tipo?: string
          analisado_em?: string | null
          analisado_por?: string | null
          arquivada?: boolean
          atualizado_em?: string
          criado_em?: string
          denunciante_id?: string
          detalhe?: string
          id?: string
          motivo?: string
          observacao_admin?: string
          status?: string
        }
        Relationships: []
      }
      comunidade_enquete_votos: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          opcao: string
          post_id: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          opcao: string
          post_id: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          opcao?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_enquete_votos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comunidade_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_post_salvos: {
        Row: {
          criado_em: string
          post_id: string
          user_id: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          post_id: string
          user_id?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          post_id?: string
          user_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_post_salvos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comunidade_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidade_posts: {
        Row: {
          autor_id: string
          autor_nome: string
          categoria: string
          criado_em: string
          fixado: boolean
          fixado_em: string | null
          fixado_por: string | null
          id: string
          obra_relacionada: string
          tem_spoiler: boolean
          texto: string
          tipo_publicacao: string
          visibilidade: string
        }
        Insert: {
          autor_id: string
          autor_nome: string
          categoria?: string
          criado_em?: string
          fixado?: boolean
          fixado_em?: string | null
          fixado_por?: string | null
          id?: string
          obra_relacionada?: string
          tem_spoiler?: boolean
          texto: string
          tipo_publicacao?: string
          visibilidade?: string
        }
        Update: {
          autor_id?: string
          autor_nome?: string
          categoria?: string
          criado_em?: string
          fixado?: boolean
          fixado_em?: string | null
          fixado_por?: string | null
          id?: string
          obra_relacionada?: string
          tem_spoiler?: boolean
          texto?: string
          tipo_publicacao?: string
          visibilidade?: string
        }
        Relationships: []
      }
      comunidade_salvos: {
        Row: {
          criado_em: string
          post_id: string
          user_id: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          post_id: string
          user_id?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          post_id?: string
          user_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidade_salvos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comunidade_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      concluidas: {
        Row: {
          criado_em: string
          id: string
          obra_id: string
          user_id: string
          visibilidade: string
        }
        Insert: {
          criado_em?: string
          id?: string
          obra_id: string
          user_id: string
          visibilidade?: string
        }
        Update: {
          criado_em?: string
          id?: string
          obra_id?: string
          user_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "concluidas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      curtidas_capitulos: {
        Row: {
          capitulo_id: string
          criado_em: string
          id: string
          obra_id: string | null
          user_id: string
        }
        Insert: {
          capitulo_id: string
          criado_em?: string
          id?: string
          obra_id?: string | null
          user_id: string
        }
        Update: {
          capitulo_id?: string
          criado_em?: string
          id?: string
          obra_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curtidas_capitulos_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curtidas_capitulos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      denuncias_perfis: {
        Row: {
          atualizado_em: string
          criado_em: string
          denunciado_id: string
          denunciante_id: string
          descricao: string
          id: string
          motivo: string
          perfil_nome: string
          perfil_url: string
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          denunciado_id: string
          denunciante_id: string
          descricao?: string
          id?: string
          motivo?: string
          perfil_nome?: string
          perfil_url?: string
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          denunciado_id?: string
          denunciante_id?: string
          descricao?: string
          id?: string
          motivo?: string
          perfil_nome?: string
          perfil_url?: string
          status?: string
        }
        Relationships: []
      }
      diario_anotacao_comentarios: {
        Row: {
          anotacao_id: string
          atualizado_em: string
          criado_em: string
          id: string
          parent_id: string | null
          texto: string
          user_id: string
        }
        Insert: {
          anotacao_id: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          parent_id?: string | null
          texto: string
          user_id: string
        }
        Update: {
          anotacao_id?: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          parent_id?: string | null
          texto?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_anotacao_comentarios_anotacao_id_fkey"
            columns: ["anotacao_id"]
            isOneToOne: false
            referencedRelation: "diario_anotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_anotacao_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "diario_anotacao_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_anotacao_curtidas: {
        Row: {
          anotacao_id: string
          criado_em: string
          id: string
          user_id: string
        }
        Insert: {
          anotacao_id: string
          criado_em?: string
          id?: string
          user_id: string
        }
        Update: {
          anotacao_id?: string
          criado_em?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_anotacao_curtidas_anotacao_id_fkey"
            columns: ["anotacao_id"]
            isOneToOne: false
            referencedRelation: "diario_anotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_anotacoes: {
        Row: {
          atualizado_em: string
          contem_spoiler: boolean
          criado_em: string
          id: string
          obra_id: string
          permitir_curtidas: boolean
          quem_pode_comentar: string
          texto: string
          tipo: string
          user_id: string
          visibilidade: string
          visibilidade_comentarios: string
        }
        Insert: {
          atualizado_em?: string
          contem_spoiler?: boolean
          criado_em?: string
          id?: string
          obra_id: string
          permitir_curtidas?: boolean
          quem_pode_comentar?: string
          texto: string
          tipo: string
          user_id: string
          visibilidade?: string
          visibilidade_comentarios?: string
        }
        Update: {
          atualizado_em?: string
          contem_spoiler?: boolean
          criado_em?: string
          id?: string
          obra_id?: string
          permitir_curtidas?: boolean
          quem_pode_comentar?: string
          texto?: string
          tipo?: string
          user_id?: string
          visibilidade?: string
          visibilidade_comentarios?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_anotacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_atividades: {
        Row: {
          atualizado_em: string | null
          capitulo_id: string | null
          criado_em: string
          id: string
          metadata: Json
          nota: number | null
          obra_id: string | null
          texto: string | null
          tipo: string
          user_id: string
          visibilidade: string
        }
        Insert: {
          atualizado_em?: string | null
          capitulo_id?: string | null
          criado_em?: string
          id?: string
          metadata?: Json
          nota?: number | null
          obra_id?: string | null
          texto?: string | null
          tipo: string
          user_id: string
          visibilidade?: string
        }
        Update: {
          atualizado_em?: string | null
          capitulo_id?: string | null
          criado_em?: string
          id?: string
          metadata?: Json
          nota?: number | null
          obra_id?: string | null
          texto?: string | null
          tipo?: string
          user_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_atividades_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_atividades_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_avaliacoes: {
        Row: {
          atualizado_em: string
          avaliador_id: string
          criado_em: string
          diario_user_id: string
          id: string
          nota: number
        }
        Insert: {
          atualizado_em?: string
          avaliador_id: string
          criado_em?: string
          diario_user_id: string
          id?: string
          nota: number
        }
        Update: {
          atualizado_em?: string
          avaliador_id?: string
          criado_em?: string
          diario_user_id?: string
          id?: string
          nota?: number
        }
        Relationships: []
      }
      diario_comentario_curtidas: {
        Row: {
          comentario_id: string
          criado_em: string
          id: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          id?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_comentario_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "diario_anotacao_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_configuracoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          modo: string
          mostrar_avaliacoes: boolean
          mostrar_concluidas: boolean
          mostrar_favoritas: boolean
          mostrar_lendo_agora: boolean
          mostrar_quero_ler: boolean
          mostrar_reviews: boolean
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          modo?: string
          mostrar_avaliacoes?: boolean
          mostrar_concluidas?: boolean
          mostrar_favoritas?: boolean
          mostrar_lendo_agora?: boolean
          mostrar_quero_ler?: boolean
          mostrar_reviews?: boolean
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          modo?: string
          mostrar_avaliacoes?: boolean
          mostrar_concluidas?: boolean
          mostrar_favoritas?: boolean
          mostrar_lendo_agora?: boolean
          mostrar_quero_ler?: boolean
          mostrar_reviews?: boolean
          user_id?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          criado_em: string
          id: string
          obra_id: string
          user_id: string
          visibilidade: string
        }
        Insert: {
          criado_em?: string
          id?: string
          obra_id: string
          user_id: string
          visibilidade?: string
        }
        Update: {
          criado_em?: string
          id?: string
          obra_id?: string
          user_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      moderacao_historico: {
        Row: {
          acao: string
          alvo_autor_id: string | null
          alvo_id: string | null
          alvo_tipo: string | null
          criado_em: string
          denuncia_criada_em: string | null
          denuncia_id: string
          denunciado_id: string | null
          denunciante_id: string | null
          id: string
          moderador_id: string | null
          observacao_admin: string
          origem: string
          snapshot: Json
          status_anterior: string | null
          status_novo: string | null
        }
        Insert: {
          acao: string
          alvo_autor_id?: string | null
          alvo_id?: string | null
          alvo_tipo?: string | null
          criado_em?: string
          denuncia_criada_em?: string | null
          denuncia_id: string
          denunciado_id?: string | null
          denunciante_id?: string | null
          id?: string
          moderador_id?: string | null
          observacao_admin?: string
          origem: string
          snapshot?: Json
          status_anterior?: string | null
          status_novo?: string | null
        }
        Update: {
          acao?: string
          alvo_autor_id?: string | null
          alvo_id?: string | null
          alvo_tipo?: string | null
          criado_em?: string
          denuncia_criada_em?: string | null
          denuncia_id?: string
          denunciado_id?: string | null
          denunciante_id?: string | null
          id?: string
          moderador_id?: string | null
          observacao_admin?: string
          origem?: string
          snapshot?: Json
          status_anterior?: string | null
          status_novo?: string | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          autor_avatar: string
          autor_id: string | null
          autor_nome: string
          capitulo_id: string | null
          created_at: string
          criada_em: string
          id: string
          lida: boolean
          link: string
          mensagem: string
          notificacao_id: string
          obra_id: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          autor_avatar?: string
          autor_id?: string | null
          autor_nome?: string
          capitulo_id?: string | null
          created_at?: string
          criada_em?: string
          id?: string
          lida?: boolean
          link?: string
          mensagem?: string
          notificacao_id: string
          obra_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          autor_avatar?: string
          autor_id?: string | null
          autor_nome?: string
          capitulo_id?: string | null
          created_at?: string
          criada_em?: string
          id?: string
          lida?: boolean
          link?: string
          mensagem?: string
          notificacao_id?: string
          obra_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_avaliacoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          nota: number
          obra_id: string
          user_id: string
          visibilidade: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nota: number
          obra_id: string
          user_id: string
          visibilidade?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          nota?: number
          obra_id?: string
          user_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_avaliacoes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_comentario_curtidas: {
        Row: {
          comentario_id: string
          criado_em: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_comentario_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "obra_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_comentarios: {
        Row: {
          autor_id: string
          autor_nome: string | null
          criado_em: string
          id: string
          obra_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          autor_nome?: string | null
          criado_em?: string
          id?: string
          obra_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          autor_nome?: string | null
          criado_em?: string
          id?: string
          obra_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_comentarios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_curtidas: {
        Row: {
          criado_em: string
          id: string
          obra_id: string
          user_id: string
          visibilidade: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          obra_id: string
          user_id: string
          visibilidade?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          obra_id?: string
          user_id?: string
          visibilidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_curtidas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_visualizacoes_unicas: {
        Row: {
          chave_visitante: string
          criada_em: string
          dia: string
          obra_id: string
        }
        Insert: {
          chave_visitante: string
          criada_em?: string
          dia?: string
          obra_id: string
        }
        Update: {
          chave_visitante?: string
          criada_em?: string
          dia?: string
          obra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_visualizacoes_unicas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          arquivo_categoria: string
          arquivo_nome: string
          arquivo_tamanho: number
          arquivo_tipo: string
          arquivo_url: string
          atualizado_em: string
          autor: string
          avisos_conteudo: string[]
          capa_nome: string
          capa_url: string
          classificacao_indicativa: string
          criada_em: string
          formato: string
          genero: string
          id: string
          link: string
          publicado: boolean
          sinopse: string
          slug: string
          tags: string[]
          titulo: string
          user_id: string
          visualizacoes: number
        }
        Insert: {
          arquivo_categoria?: string
          arquivo_nome?: string
          arquivo_tamanho?: number
          arquivo_tipo?: string
          arquivo_url?: string
          atualizado_em?: string
          autor?: string
          avisos_conteudo?: string[]
          capa_nome?: string
          capa_url?: string
          classificacao_indicativa?: string
          criada_em?: string
          formato?: string
          genero?: string
          id?: string
          link?: string
          publicado?: boolean
          sinopse?: string
          slug: string
          tags?: string[]
          titulo?: string
          user_id: string
          visualizacoes?: number
        }
        Update: {
          arquivo_categoria?: string
          arquivo_nome?: string
          arquivo_tamanho?: number
          arquivo_tipo?: string
          arquivo_url?: string
          atualizado_em?: string
          autor?: string
          avisos_conteudo?: string[]
          capa_nome?: string
          capa_url?: string
          classificacao_indicativa?: string
          criada_em?: string
          formato?: string
          genero?: string
          id?: string
          link?: string
          publicado?: boolean
          sinopse?: string
          slug?: string
          tags?: string[]
          titulo?: string
          user_id?: string
          visualizacoes?: number
        }
        Relationships: []
      }
      operacoes_exclusao_conta: {
        Row: {
          arquivos_removidos_por_bucket: Json
          atualizada_em: string
          auth_excluido_em: string | null
          buckets_concluidos: string[]
          buckets_pendentes: string[]
          concluida_em: string | null
          criada_em: string
          id: string
          iniciada_em: string | null
          lock_expira_em: string | null
          lock_token: string | null
          status: string
          storage_limpo_em: string | null
          subject_user_id: string
          tentativas_auth: number
          tentativas_storage: number
          ultima_falha_em: string | null
          ultimo_erro_codigo: string | null
          ultimo_erro_mensagem: string | null
        }
        Insert: {
          arquivos_removidos_por_bucket?: Json
          atualizada_em?: string
          auth_excluido_em?: string | null
          buckets_concluidos?: string[]
          buckets_pendentes?: string[]
          concluida_em?: string | null
          criada_em?: string
          id?: string
          iniciada_em?: string | null
          lock_expira_em?: string | null
          lock_token?: string | null
          status?: string
          storage_limpo_em?: string | null
          subject_user_id: string
          tentativas_auth?: number
          tentativas_storage?: number
          ultima_falha_em?: string | null
          ultimo_erro_codigo?: string | null
          ultimo_erro_mensagem?: string | null
        }
        Update: {
          arquivos_removidos_por_bucket?: Json
          atualizada_em?: string
          auth_excluido_em?: string | null
          buckets_concluidos?: string[]
          buckets_pendentes?: string[]
          concluida_em?: string | null
          criada_em?: string
          id?: string
          iniciada_em?: string | null
          lock_expira_em?: string | null
          lock_token?: string | null
          status?: string
          storage_limpo_em?: string | null
          subject_user_id?: string
          tentativas_auth?: number
          tentativas_storage?: number
          ultima_falha_em?: string | null
          ultimo_erro_codigo?: string | null
          ultimo_erro_mensagem?: string | null
        }
        Relationships: []
      }
      preferencias_privacidade: {
        Row: {
          anotacoes_privadas_padrao: boolean
          aprovar_novos_seguidores: boolean
          atualizado_em: string
          criado_em: string
          mostrar_atividades_leitura: boolean
          mostrar_avaliacao_diario: boolean
          mostrar_avaliacoes: boolean
          mostrar_concluidas: boolean
          mostrar_diario_perfil: boolean
          mostrar_favoritos: boolean
          mostrar_historico_leitura: boolean
          mostrar_obras_para_todos: boolean
          mostrar_progresso_leitura: boolean
          mostrar_quero_ler: boolean
          mostrar_sobre_para_todos: boolean
          perfil_privado: boolean
          permitir_avaliacao_diario: boolean
          quem_pode_avaliar_diario: string
          quem_pode_comentar_diario: string
          user_id: string
          visibilidade_atividades: string
          visibilidade_avaliacao_diario: string
          visibilidade_biblioteca: string
          visibilidade_comunidade: string
          visibilidade_diario: string
          visibilidade_obras: string
          visibilidade_sobre: string
        }
        Insert: {
          anotacoes_privadas_padrao?: boolean
          aprovar_novos_seguidores?: boolean
          atualizado_em?: string
          criado_em?: string
          mostrar_atividades_leitura?: boolean
          mostrar_avaliacao_diario?: boolean
          mostrar_avaliacoes?: boolean
          mostrar_concluidas?: boolean
          mostrar_diario_perfil?: boolean
          mostrar_favoritos?: boolean
          mostrar_historico_leitura?: boolean
          mostrar_obras_para_todos?: boolean
          mostrar_progresso_leitura?: boolean
          mostrar_quero_ler?: boolean
          mostrar_sobre_para_todos?: boolean
          perfil_privado?: boolean
          permitir_avaliacao_diario?: boolean
          quem_pode_avaliar_diario?: string
          quem_pode_comentar_diario?: string
          user_id: string
          visibilidade_atividades?: string
          visibilidade_avaliacao_diario?: string
          visibilidade_biblioteca?: string
          visibilidade_comunidade?: string
          visibilidade_diario?: string
          visibilidade_obras?: string
          visibilidade_sobre?: string
        }
        Update: {
          anotacoes_privadas_padrao?: boolean
          aprovar_novos_seguidores?: boolean
          atualizado_em?: string
          criado_em?: string
          mostrar_atividades_leitura?: boolean
          mostrar_avaliacao_diario?: boolean
          mostrar_avaliacoes?: boolean
          mostrar_concluidas?: boolean
          mostrar_diario_perfil?: boolean
          mostrar_favoritos?: boolean
          mostrar_historico_leitura?: boolean
          mostrar_obras_para_todos?: boolean
          mostrar_progresso_leitura?: boolean
          mostrar_quero_ler?: boolean
          mostrar_sobre_para_todos?: boolean
          perfil_privado?: boolean
          permitir_avaliacao_diario?: boolean
          quem_pode_avaliar_diario?: string
          quem_pode_comentar_diario?: string
          user_id?: string
          visibilidade_atividades?: string
          visibilidade_avaliacao_diario?: string
          visibilidade_biblioteca?: string
          visibilidade_comunidade?: string
          visibilidade_diario?: string
          visibilidade_obras?: string
          visibilidade_sobre?: string
        }
        Relationships: []
      }
      problemas_tecnicos: {
        Row: {
          analisado_em: string | null
          analisado_por: string | null
          atualizado_em: string
          categoria: string
          criado_em: string
          descricao: string
          dispositivo: string
          email_contato: string
          id: string
          navegador: string
          observacao_admin: string
          pagina_url: string
          prioridade: string
          status: string
          titulo: string
          user_id: string
        }
        Insert: {
          analisado_em?: string | null
          analisado_por?: string | null
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          descricao: string
          dispositivo?: string
          email_contato?: string
          id?: string
          navegador?: string
          observacao_admin?: string
          pagina_url?: string
          prioridade?: string
          status?: string
          titulo: string
          user_id: string
        }
        Update: {
          analisado_em?: string | null
          analisado_por?: string | null
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          descricao?: string
          dispositivo?: string
          email_contato?: string
          id?: string
          navegador?: string
          observacao_admin?: string
          pagina_url?: string
          prioridade?: string
          status?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atualizado_em: string
          avatar_url: string
          bio: string
          criado_em: string
          diretrizes_comunidade_aceitas_em: string | null
          diretrizes_comunidade_versao: string | null
          id: string
          is_admin: boolean
          nome: string
          politica_privacidade_ciente_em: string | null
          politica_privacidade_versao: string | null
          sobre_bio: string | null
          termos_uso_aceitos_em: string | null
          termos_uso_versao: string | null
          tipo: string
          user_id: string
          username: string | null
        }
        Insert: {
          atualizado_em?: string
          avatar_url?: string
          bio?: string
          criado_em?: string
          diretrizes_comunidade_aceitas_em?: string | null
          diretrizes_comunidade_versao?: string | null
          id?: string
          is_admin?: boolean
          nome?: string
          politica_privacidade_ciente_em?: string | null
          politica_privacidade_versao?: string | null
          sobre_bio?: string | null
          termos_uso_aceitos_em?: string | null
          termos_uso_versao?: string | null
          tipo?: string
          user_id: string
          username?: string | null
        }
        Update: {
          atualizado_em?: string
          avatar_url?: string
          bio?: string
          criado_em?: string
          diretrizes_comunidade_aceitas_em?: string | null
          diretrizes_comunidade_versao?: string | null
          id?: string
          is_admin?: boolean
          nome?: string
          politica_privacidade_ciente_em?: string | null
          politica_privacidade_versao?: string | null
          sobre_bio?: string | null
          termos_uso_aceitos_em?: string | null
          termos_uso_versao?: string | null
          tipo?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      progresso_leitura: {
        Row: {
          atualizado_em: string
          capitulo_id: string | null
          criado_em: string
          id: string
          lido: boolean
          obra_id: string
          progresso: number
          user_id: string
          visibilidade: string
        }
        Insert: {
          atualizado_em?: string
          capitulo_id?: string | null
          criado_em?: string
          id?: string
          lido?: boolean
          obra_id: string
          progresso?: number
          user_id: string
          visibilidade?: string
        }
        Update: {
          atualizado_em?: string
          capitulo_id?: string | null
          criado_em?: string
          id?: string
          lido?: boolean
          obra_id?: string
          progresso?: number
          user_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_leitura_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_leitura_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      salvos_capitulos: {
        Row: {
          capitulo_id: string
          criado_em: string
          id: string
          obra_id: string | null
          user_id: string
        }
        Insert: {
          capitulo_id: string
          criado_em?: string
          id?: string
          obra_id?: string | null
          user_id: string
        }
        Update: {
          capitulo_id?: string
          criado_em?: string
          id?: string
          obra_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salvos_capitulos_capitulo_id_fkey"
            columns: ["capitulo_id"]
            isOneToOne: false
            referencedRelation: "capitulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salvos_capitulos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      seguindo_autores: {
        Row: {
          autor_nome: string
          criado_em: string
          id: string
          user_id: string
        }
        Insert: {
          autor_nome: string
          criado_em?: string
          id?: string
          user_id: string
        }
        Update: {
          autor_nome?: string
          criado_em?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      seguindo_obras: {
        Row: {
          criado_em: string
          id: string
          obra_id: string
          user_id: string
          visibilidade: string
        }
        Insert: {
          criado_em?: string
          id?: string
          obra_id: string
          user_id: string
          visibilidade?: string
        }
        Update: {
          criado_em?: string
          id?: string
          obra_id?: string
          user_id?: string
          visibilidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguindo_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      seguindo_usuarios: {
        Row: {
          criado_em: string
          id: string
          seguido_id: string
          seguidor_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          seguido_id: string
          seguidor_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          seguido_id?: string
          seguidor_id?: string
        }
        Relationships: []
      }
      solicitacoes_exclusao_conta: {
        Row: {
          atualizada_em: string
          criada_em: string
          email: string
          id: string
          motivo: string | null
          observacao_interna: string | null
          origem: string
          processada_em: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          atualizada_em?: string
          criada_em?: string
          email: string
          id?: string
          motivo?: string | null
          observacao_interna?: string | null
          origem?: string
          processada_em?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          atualizada_em?: string
          criada_em?: string
          email?: string
          id?: string
          motivo?: string | null
          observacao_interna?: string | null
          origem?: string
          processada_em?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      solicitacoes_seguidores: {
        Row: {
          atualizado_em: string
          criado_em: string
          destinatario_id: string
          id: string
          solicitante_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          destinatario_id: string
          id?: string
          solicitante_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          destinatario_id?: string
          id?: string
          solicitante_id?: string
        }
        Relationships: []
      }
      top5_curtidas: {
        Row: {
          criado_em: string
          id: string
          perfil_user_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          perfil_user_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          perfil_user_id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      usuarios_bloqueados: {
        Row: {
          bloqueado_id: string
          bloqueador_id: string
          criado_em: string
          id: string
        }
        Insert: {
          bloqueado_id: string
          bloqueador_id: string
          criado_em?: string
          id?: string
        }
        Update: {
          bloqueado_id?: string
          bloqueador_id?: string
          criado_em?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_termos_publicacao: {
        Args: {
          p_diretrizes_versao: string
          p_politica_versao: string
          p_termos_versao: string
        }
        Returns: boolean
      }
      bloquear_usuario: { Args: { p_bloqueado_id: string }; Returns: boolean }
      cancelar_solicitacao_seguidor: {
        Args: { p_seguido_id: string }
        Returns: boolean
      }
      carregar_avaliacao_diario: {
        Args: { p_diario_user_id: string }
        Returns: Json
      }
      carregar_estado_bloqueio_usuario: {
        Args: { p_outro_user_id: string }
        Returns: Json
      }
      carregar_permissoes_abas_perfil: {
        Args: { p_user_id: string }
        Returns: Json
      }
      comunidade_enquete_resultados: {
        Args: { p_post_ids: string[] }
        Returns: {
          meu_voto: boolean
          opcao: string
          post_id: string
          total: number
        }[]
      }
      comunidade_motivo_denuncia_valido: {
        Args: { p_motivo: string }
        Returns: boolean
      }
      comunidade_pode_ver_comentario: {
        Args: { p_comentario_id: string }
        Returns: boolean
      }
      comunidade_pode_ver_post: {
        Args: { p_post_id: string }
        Returns: boolean
      }
      comunidade_usuario_e_admin: { Args: never; Returns: boolean }
      criar_denuncia: {
        Args: {
          p_alvo_id: string
          p_alvo_tipo: string
          p_detalhe?: string
          p_motivo?: string
        }
        Returns: {
          denuncia_criado_em: string
          denuncia_id: string
          denuncia_status: string
        }[]
      }
      criar_denuncia_perfil: {
        Args: {
          p_denunciado_id: string
          p_descricao?: string
          p_motivo?: string
          p_perfil_nome?: string
          p_perfil_url?: string
        }
        Returns: {
          denuncia_criado_em: string
          denuncia_id: string
          denuncia_status: string
        }[]
      }
      criar_notificacao_comunidade_interna: {
        Args: {
          p_ator_id: string
          p_link: string
          p_mensagem: string
          p_notificacao_id: string
          p_tipo: string
          p_titulo: string
          p_user_id: string
        }
        Returns: undefined
      }
      criar_notificacao_interacao_capitulo: {
        Args: {
          p_capitulo_id: string
          p_comentario_id: string
          p_link: string
          p_mensagem: string
          p_tipo: string
          p_titulo: string
        }
        Returns: number
      }
      criar_notificacao_social: {
        Args: {
          p_capitulo_id?: string
          p_link?: string
          p_mensagem?: string
          p_notificacao_id?: string
          p_obra_id?: string
          p_tipo: string
          p_titulo?: string
          p_user_id: string
        }
        Returns: number
      }
      criar_notificacoes_capitulo: {
        Args: {
          p_capitulo_id: string
          p_criado_em?: string
          p_href: string
          p_mensagem: string
          p_obra_id: string
          p_tipo?: string
          p_titulo: string
        }
        Returns: number
      }
      criar_problema_tecnico: {
        Args: {
          p_categoria: string
          p_descricao: string
          p_dispositivo?: string
          p_navegador?: string
          p_pagina_url?: string
          p_titulo: string
        }
        Returns: {
          problema_criado_em: string
          problema_id: string
          problema_status: string
        }[]
      }
      deixar_de_seguir_usuario: {
        Args: { p_seguido_id: string }
        Returns: boolean
      }
      desbloquear_usuario: {
        Args: { p_bloqueado_id: string }
        Returns: boolean
      }
      diario_pode_avaliar: {
        Args: { p_avaliador_id?: string; p_diario_user_id: string }
        Returns: boolean
      }
      diario_pode_comentar: {
        Args: { p_anotacao_id: string }
        Returns: boolean
      }
      diario_pode_ver_anotacao: {
        Args: { p_anotacao_id: string }
        Returns: boolean
      }
      diario_pode_ver_comentarios: {
        Args: { p_anotacao_id: string }
        Returns: boolean
      }
      diario_sem_bloqueio_com_usuario_atual: {
        Args: { p_outro_user_id: string }
        Returns: boolean
      }
      diario_usuario_e_seguidor: {
        Args: { p_seguido_id: string; p_seguidor_id: string }
        Returns: boolean
      }
      diario_usuarios_sem_bloqueio: {
        Args: { p_usuario_a: string; p_usuario_b: string }
        Returns: boolean
      }
      excluir_notificacoes_lidas: { Args: never; Returns: number }
      historietas_nome_publico_usuario: {
        Args: { p_user_id: string }
        Returns: string
      }
      incrementar_visualizacao_capitulo: {
        Args: { capitulo_id_param: string }
        Returns: number
      }
      incrementar_visualizacao_obra: {
        Args: { obra_id_param: string }
        Returns: number
      }
      listar_meus_problemas_tecnicos: {
        Args: { p_limite?: number }
        Returns: {
          atualizado_em: string
          categoria: string
          criado_em: string
          descricao: string
          observacao_admin: string
          pagina_url: string
          prioridade: string
          problema_id: string
          status: string
          titulo: string
        }[]
      }
      listar_minhas_denuncias: {
        Args: { p_limite?: number }
        Returns: {
          alvo_id: string
          alvo_tipo: string
          analisado_em: string
          atualizado_em: string
          criado_em: string
          denuncia_id: string
          status: string
        }[]
      }
      listar_reincidencias_moderacao: {
        Args: never
        Returns: {
          em_analise: number
          pendentes: number
          rejeitadas: number
          resolvidas: number
          total_denuncias: number
          ultima_denuncia: string
          user_id: string
        }[]
      }
      listar_usuarios_bloqueados: {
        Args: { p_limite?: number }
        Returns: {
          avatar_url: string
          bloqueado_em: string
          nome: string
          user_id: string
          username: string
        }[]
      }
      marcar_notificacoes_lidas: {
        Args: { notificacao_ids?: string[]; novo_estado?: boolean }
        Returns: number
      }
      obter_nome_usuario_notificacao: {
        Args: { p_user_id: string }
        Returns: string
      }
      perfil_motivo_denuncia_valido: {
        Args: { p_motivo: string }
        Returns: boolean
      }
      reivindicar_operacao_exclusao_conta: {
        Args: {
          p_lock_duracao_segundos?: number
          p_lock_token: string
          p_subject_user_id: string
        }
        Returns: {
          arquivos_removidos_por_bucket: Json
          atualizada_em: string
          auth_excluido_em: string | null
          buckets_concluidos: string[]
          buckets_pendentes: string[]
          concluida_em: string | null
          criada_em: string
          id: string
          iniciada_em: string | null
          lock_expira_em: string | null
          lock_token: string | null
          status: string
          storage_limpo_em: string | null
          subject_user_id: string
          tentativas_auth: number
          tentativas_storage: number
          ultima_falha_em: string | null
          ultimo_erro_codigo: string | null
          ultimo_erro_mensagem: string | null
        }
        SetofOptions: {
          from: "*"
          to: "operacoes_exclusao_conta"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remover_avaliacao_diario: {
        Args: { p_diario_user_id: string }
        Returns: Json
      }
      remover_conteudo_denunciado_transacional: {
        Args: {
          p_alvo_id: string
          p_alvo_tipo: string
          p_observacao_admin?: string
        }
        Returns: Json
      }
      remover_notificacoes_seguimento: {
        Args: {
          p_destinatario_id: string
          p_incluir_novo_seguidor: boolean
          p_solicitante_id: string
        }
        Returns: undefined
      }
      remover_seguidor: { Args: { p_seguidor_id: string }; Returns: boolean }
      responder_solicitacao_seguidor: {
        Args: { p_aceitar: boolean; p_solicitacao_id: string }
        Returns: string
      }
      salvar_avaliacao_diario: {
        Args: { p_diario_user_id: string; p_nota: number }
        Returns: Json
      }
      solicitar_ou_seguir_usuario: {
        Args: { p_seguido_id: string }
        Returns: string
      }
      status_aceite_termos_publicacao: { Args: never; Returns: boolean }
      suporte_usuario_e_admin: { Args: never; Returns: boolean }
      usuario_aceitou_termos_publicacao: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      usuario_e_admin: { Args: never; Returns: boolean }
      usuario_pode_ver_aba_perfil: {
        Args: { p_user_id: string; p_visibilidade: string }
        Returns: boolean
      }
      usuario_pode_ver_perfil: { Args: { p_user_id: string }; Returns: boolean }
      usuarios_possuem_bloqueio: {
        Args: { p_usuario_a: string; p_usuario_b: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

