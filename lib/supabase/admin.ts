import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/config";

export function createAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service-role environment variables are not fully configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
