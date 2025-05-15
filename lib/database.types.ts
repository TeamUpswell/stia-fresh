export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      checklists: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          checklist_id: string;
          description: string;
          item_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          checklist_id: string;
          description: string;
          item_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          checklist_id?: string;
          description?: string;
          item_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          name: string;
          category: string;
          quantity: number;
          threshold: number;
          last_updated_by: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          quantity: number;
          threshold: number;
          last_updated_by?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          threshold?: number;
          last_updated_by?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      manual_items: {
        Row: {
          id: string;
          section_id: string;
          title: string;
          content: string;
          media_urls: string[];
          order_index: number;
          important: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          title: string;
          content: string;
          media_urls?: string[];
          order_index?: number;
          important?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          title?: string;
          content?: string;
          media_urls?: string[];
          order_index?: number;
          important?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      manual_sections: {
        Row: {
          id: string;
          title: string;
          description: string;
          icon: string;
          order_index: number;
          property_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          icon: string;
          order_index?: number;
          property_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          icon?: string;
          order_index?: number;
          property_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          email: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number?: string;
          email: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          email?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      recommendations: {
        Row: {
          id: string;
          name: string;
          category: string;
          address: string;
          coordinates: Json;
          description: string;
          rating: number;
          website: string;
          phone_number: string;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          address: string;
          coordinates: Json;
          description: string;
          rating?: number;
          website?: string;
          phone_number?: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          address?: string;
          coordinates?: Json;
          description?: string;
          rating?: number;
          website?: string;
          phone_number?: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          title: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          title: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      role_permissions: {
        Row: {
          id: number;
          role: string;
          feature: string;
          allowed: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          role: string;
          feature: string;
          allowed: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          role?: string;
          feature?: string;
          allowed?: boolean;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: string;
          priority: string;
          assigned_to: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          due_date: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: string;
          priority?: string;
          assigned_to?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          due_date?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          assigned_to?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          due_date?: string;
        };
      };
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
