export { cn } from "cn"
// Add this to satisfy the Supabase proxy check
export const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;