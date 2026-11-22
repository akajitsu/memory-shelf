/**
 * Database types for the Supabase client.
 * Mirrors supabase/migrations/*. Keep in sync when the schema changes
 * (or regenerate with `npx supabase gen types typescript --project-id <ref>`).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        // Rows are created only by the on_auth_user_created trigger; clients lack INSERT.
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cover_image_path: string | null;
          cover_color: string;
          created_at: string;
          updated_at: string;
        };
        // Column-level INSERT grant: id and user_id come from database defaults.
        // cover_image_path is set by update after the cover is uploaded into the album's folder.
        Insert: {
          title: string;
          description?: string | null;
          cover_color?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          cover_image_path?: string | null;
          cover_color?: string;
        };
        Relationships: [];
      };
      album_photos: {
        Row: {
          id: string;
          album_id: string;
          user_id: string;
          image_path: string;
          image_name: string | null;
          caption: string | null;
          display_order: number;
          created_at: string;
        };
        // Column-level INSERT grant: id and user_id come from database defaults.
        Insert: {
          album_id: string;
          image_path: string;
          image_name?: string | null;
          caption?: string | null;
          display_order?: number;
          // user_id intentionally omitted: it defaults to auth.uid() in the database.
        };
        Update: {
          caption?: string | null;
          display_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "album_photos_album_owner_fkey";
            columns: ["album_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      reorder_album_photos: {
        Args: { p_album_id: string; p_photo_ids: string[] };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];

export type Profile = PublicTables["profiles"]["Row"];
export type Album = PublicTables["albums"]["Row"];
export type AlbumPhoto = PublicTables["album_photos"]["Row"];
