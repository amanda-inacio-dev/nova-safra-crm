// Sobrescrever com o seguinte comando após conectar o projeto Supabase (issue-02):
// npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
