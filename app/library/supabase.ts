import { createClient } from '@supabase/supabase-js';

// The "!" at the end tells TypeScript: "Don't worry, I've added these to .env.local"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This creates the connection to your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);