// Permissive schema types for the external Supabase project.
// The generated types file belongs to the built-in backend, which is unused here.
type AnyRow = Record<string, any>;

export type Database = {
  public: {
    Tables: Record<string, { Row: AnyRow; Insert: AnyRow; Update: AnyRow }>;
    Views: Record<string, { Row: AnyRow }>;
    Functions: Record<string, any>;
    Enums: Record<string, string>;
  };
};
