export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          end_minute: number
          id: string
          profile_id: string
          start_minute: number
          weekday: number
        }
        Insert: {
          created_at?: string
          end_minute: number
          id?: string
          profile_id: string
          start_minute: number
          weekday: number
        }
        Update: {
          created_at?: string
          end_minute?: number
          id?: string
          profile_id?: string
          start_minute?: number
          weekday?: number
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          expires_at: string
          id: string
          module_code: string
          resolved_at: string | null
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["booking_request_status"]
          student_id: string
          tutor_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          module_code: string
          resolved_at?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["booking_request_status"]
          student_id: string
          tutor_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          module_code?: string
          resolved_at?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["booking_request_status"]
          student_id?: string
          tutor_id?: string
        }
        Relationships: []
      }
      counter_offers: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          expires_at: string
          id: string
          module_code: string
          request_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["counter_offer_status"]
          student_id: string
          tutor_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          module_code: string
          request_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["counter_offer_status"]
          student_id: string
          tutor_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          module_code?: string
          request_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["counter_offer_status"]
          student_id?: string
          tutor_id?: string
        }
        Relationships: []
      }
      counter_offer_slots: {
        Row: {
          id: string
          offer_id: string
          scheduled_end: string
          scheduled_start: string
        }
        Insert: {
          id?: string
          offer_id: string
          scheduled_end: string
          scheduled_start: string
        }
        Update: {
          id?: string
          offer_id?: string
          scheduled_end?: string
          scheduled_start?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          created_at: string
          escrow_state: Database["public"]["Enums"]["escrow_state"]
          id: string
          module_code: string
          price_type: Database["public"]["Enums"]["price_type"]
          report_submitted: boolean
          scheduled_end: string
          scheduled_start: string
          student_id: string
          tutor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_state?: Database["public"]["Enums"]["escrow_state"]
          id?: string
          module_code: string
          price_type: Database["public"]["Enums"]["price_type"]
          report_submitted?: boolean
          scheduled_end: string
          scheduled_start: string
          student_id: string
          tutor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_state?: Database["public"]["Enums"]["escrow_state"]
          id?: string
          module_code?: string
          price_type?: Database["public"]["Enums"]["price_type"]
          report_submitted?: boolean
          scheduled_end?: string
          scheduled_start?: string
          student_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_enrolments: {
        Row: {
          created_at: string
          group_session_id: string
          id: string
          price_charged: number
          student_id: string
        }
        Insert: {
          created_at?: string
          group_session_id: string
          id?: string
          price_charged: number
          student_id: string
        }
        Update: {
          created_at?: string
          group_session_id?: string
          id?: string
          price_charged?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_enrolments_group_session_id_fkey"
            columns: ["group_session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          created_at: string
          floor_per_student: number
          id: string
          max_participants: number
          module_code: string
          scheduled_end: string
          scheduled_start: string
          status: string
          title: string
          total_cost: number
          tutor_id: string
        }
        Insert: {
          created_at?: string
          floor_per_student: number
          id?: string
          max_participants: number
          module_code: string
          scheduled_end: string
          scheduled_start: string
          status?: string
          title: string
          total_cost: number
          tutor_id: string
        }
        Update: {
          created_at?: string
          floor_per_student?: number
          id?: string
          max_participants?: number
          module_code?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          title?: string
          total_cost?: number
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "group_sessions_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_verification_blocks: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          module_code: string
          reason: string | null
          tutor_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          module_code: string
          reason?: string | null
          tutor_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          module_code?: string
          reason?: string | null
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_verification_blocks_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_verification_blocks_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "module_verification_blocks_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string
          avatar_path: string | null
          avg_rating: number
          created_at: string
          faculty: string | null
          full_name: string
          id: string
          is_active: boolean
          is_student: boolean
          is_tutor: boolean
          rate_per_hour: number
          rating_count: number
          sessions_booked: number
          sessions_completed: number
          year: string | null
        }
        Insert: {
          avatar_color?: string
          avatar_path?: string | null
          avg_rating?: number
          created_at?: string
          faculty?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          is_student?: boolean
          is_tutor?: boolean
          rate_per_hour?: number
          rating_count?: number
          sessions_booked?: number
          sessions_completed?: number
          year?: string | null
        }
        Update: {
          avatar_color?: string
          avatar_path?: string | null
          avg_rating?: number
          created_at?: string
          faculty?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_student?: boolean
          is_tutor?: boolean
          rate_per_hour?: number
          rating_count?: number
          sessions_booked?: number
          sessions_completed?: number
          year?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          student_id: string
          tutor_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          student_id: string
          tutor_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          student_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_reports: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          misconceptions: string
          module_code: string
          student_id: string
          summary: string
          tutor_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          misconceptions: string
          module_code: string
          student_id: string
          summary: string
          tutor_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          misconceptions?: string
          module_code?: string
          student_id?: string
          summary?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reports_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "session_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reports_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_bids: {
        Row: {
          created_at: string
          id: string
          rate: number
          request_id: string
          status: Database["public"]["Enums"]["bid_status"]
          tutor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rate: number
          request_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          tutor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rate?: number
          request_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_bids_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sos_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_bids_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          module_code: string
          status: Database["public"]["Enums"]["sos_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          module_code: string
          status?: Database["public"]["Enums"]["sos_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module_code?: string
          status?: Database["public"]["Enums"]["sos_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_requests_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "sos_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          level: Database["public"]["Enums"]["subject_level"]
          module_code: string
          parent_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          level: Database["public"]["Enums"]["subject_level"]
          module_code: string
          parent_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          level?: Database["public"]["Enums"]["subject_level"]
          module_code?: string
          parent_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
        ]
      }
      telegram_accounts: {
        Row: {
          chat_id: number
          linked_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          chat_id: number
          linked_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          linked_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_tokens: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          token: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          token: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_link_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_modules: {
        Row: {
          allow_resubmit: boolean
          completed_at: string
          created_at: string
          grade: Database["public"]["Enums"]["module_grade"]
          id: string
          is_verified: boolean
          module_code: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          transcript_path: string | null
          tutor_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          allow_resubmit?: boolean
          completed_at: string
          created_at?: string
          grade: Database["public"]["Enums"]["module_grade"]
          id?: string
          is_verified?: boolean
          module_code: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          transcript_path?: string | null
          tutor_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          allow_resubmit?: boolean
          completed_at?: string
          created_at?: string
          grade?: Database["public"]["Enums"]["module_grade"]
          id?: string
          is_verified?: boolean
          module_code?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          transcript_path?: string | null
          tutor_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tutor_modules_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "tutor_modules_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_modules_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_topups: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["topup_status"]
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["topup_status"]
          stripe_session_id: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["topup_status"]
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_topups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["wallet_txn_kind"]
          wallet_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["wallet_txn_kind"]
          wallet_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["wallet_txn_kind"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      verified_tutor_modules: {
        Row: {
          avatar_color: string | null
          avatar_path: string | null
          avg_rating: number | null
          completed_at: string | null
          faculty: string | null
          full_name: string | null
          grade: Database["public"]["Enums"]["module_grade"] | null
          is_active: boolean | null
          is_verified: boolean | null
          module_code: string | null
          rate_per_hour: number | null
          rating_count: number | null
          sessions_booked: number | null
          sessions_completed: number | null
          tutor_id: string | null
          year: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutor_modules_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["module_code"]
          },
          {
            foreignKeyName: "tutor_modules_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_booking_request: {
        Args: { p_request: string; p_tutor: string }
        Returns: Database["public"]["Tables"]["bookings"]["Row"]
      }
      accept_counter_offer: {
        Args: { p_end: string; p_offer: string; p_start: string; p_student: string }
        Returns: Database["public"]["Tables"]["bookings"]["Row"]
      }
      cancel_booking_request: {
        Args: { p_request: string; p_student: string }
        Returns: Database["public"]["Tables"]["booking_requests"]["Row"]
      }
      counter_propose: {
        Args: { p_request: string; p_slots: Json; p_tutor: string }
        Returns: Database["public"]["Tables"]["counter_offers"]["Row"]
      }
      decline_booking_request: {
        Args: { p_request: string; p_tutor: string }
        Returns: Database["public"]["Tables"]["booking_requests"]["Row"]
      }
      expire_stale_requests: { Args: never; Returns: number }
      submit_session_report: {
        Args: {
          p_booking: string
          p_misconceptions: string
          p_summary: string
          p_tutor: string
        }
        Returns: Database["public"]["Tables"]["session_reports"]["Row"]
      }
      request_booking: {
        Args: {
          p_end: string
          p_module: string
          p_start: string
          p_student: string
          p_tutor: string
        }
        Returns: Database["public"]["Tables"]["booking_requests"]["Row"]
      }
      accept_sos_bid: {
        Args: { p_bid: string; p_request: string }
        Returns: string
      }
      book_and_pay: {
        Args: {
          p_amount: number
          p_end: string
          p_module: string
          p_price_type: Database["public"]["Enums"]["price_type"]
          p_start: string
          p_student: string
          p_tutor: string
        }
        Returns: Database["public"]["Tables"]["bookings"]["Row"]
      }
      enrol_in_group: { Args: { p_group: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_nus: { Args: never; Returns: boolean }
      review_tutor_module: {
        Args: {
          p_allow_resubmit?: boolean
          p_approve: boolean
          p_module: string
          p_note?: string
        }
        Returns: undefined
      }
      shares_booking: { Args: { a: string; b: string }; Returns: boolean }
      complete_booking: {
        Args: { p_booking: string }
        Returns: Database["public"]["Tables"]["bookings"]["Row"]
      }
      credit_topup: { Args: { p_session_id: string }; Returns: undefined }
      pay_booking: {
        Args: { p_booking: string }
        Returns: Database["public"]["Tables"]["bookings"]["Row"]
      }
      refund_booking: {
        Args: { p_booking: string }
        Returns: Database["public"]["Tables"]["bookings"]["Row"]
      }
    }
    Enums: {
      booking_request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
        | "superseded"
        | "countered"
      counter_offer_status: "pending" | "accepted" | "expired" | "cancelled"
      bid_status: "pending" | "accepted" | "rejected"
      escrow_state:
        | "pending_payment"
        | "held"
        | "completed"
        | "released"
        | "cancelled"
        | "refunded"
      module_grade: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C"
      price_type: "fixed" | "negotiable"
      sos_status: "open" | "matched" | "cancelled"
      subject_level: "o_level" | "a_level" | "nus" | "ntu"
      topup_status: "pending" | "completed"
      verification_status: "pending" | "verified" | "rejected"
      wallet_txn_kind: "topup" | "escrow_hold" | "escrow_release" | "escrow_refund"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_request_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "expired",
        "superseded",
        "countered",
      ],
      counter_offer_status: ["pending", "accepted", "expired", "cancelled"],
      bid_status: ["pending", "accepted", "rejected"],
      escrow_state: [
        "pending_payment",
        "held",
        "completed",
        "released",
        "cancelled",
        "refunded",
      ],
      module_grade: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"],
      price_type: ["fixed", "negotiable"],
      sos_status: ["open", "matched", "cancelled"],
      subject_level: ["o_level", "a_level", "nus", "ntu"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const

