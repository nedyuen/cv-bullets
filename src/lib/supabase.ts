import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project values.",
  );
}

// Not using createClient<Database>() — our hand-written Database type doesn't
// satisfy supabase-js's generic constraints closely enough to infer per-table
// Insert/Update types, which cascaded into `never` errors everywhere. Every
// query result in this codebase is explicitly cast to its Row type instead
// (see src/types/database.ts), so this is a deliberate simplification, not
// an oversight.
export const supabase = createClient(url, anonKey);
