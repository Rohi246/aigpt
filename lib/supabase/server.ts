import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY!;

export function supabaseClient() {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export function supabaseAdmin() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
