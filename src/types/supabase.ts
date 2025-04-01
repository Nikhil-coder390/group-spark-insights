
import { Database } from "@/integrations/supabase/types";

// Export Supabase table types for easier access
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type GDSessionRow = Database['public']['Tables']['gd_sessions']['Row'];
export type GDParticipantRow = Database['public']['Tables']['gd_participants']['Row'];
export type GDEvaluatorRow = Database['public']['Tables']['gd_evaluators']['Row'];
export type EvaluationRow = Database['public']['Tables']['evaluations']['Row'];

// Export insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type GDSessionInsert = Database['public']['Tables']['gd_sessions']['Insert'];
export type GDParticipantInsert = Database['public']['Tables']['gd_participants']['Insert'];
export type GDEvaluatorInsert = Database['public']['Tables']['gd_evaluators']['Insert'];
export type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert'];

// Export update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type GDSessionUpdate = Database['public']['Tables']['gd_sessions']['Update'];
export type GDParticipantUpdate = Database['public']['Tables']['gd_participants']['Update'];
export type GDEvaluatorUpdate = Database['public']['Tables']['gd_evaluators']['Update'];
export type EvaluationUpdate = Database['public']['Tables']['evaluations']['Update'];

// User role from Supabase enum
export type UserRole = Database['public']['Enums']['user_role'];
