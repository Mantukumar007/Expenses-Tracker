import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aitrmuqeahpzbtvfgtoa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_M4GU-92QX2Xt1I5ceUQmAw_aMuyMwCP';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in environment variables.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Transaction = {
  id: string;
  user_id?: string;
  amount: number;
  category: string;
  payment_mode: string;
  type: string;
  created_at: string;
};
