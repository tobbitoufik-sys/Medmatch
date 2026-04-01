import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function createServerSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  return createServerClient(url!, key!, {
    cookies: {
      async getAll() {
        return (await cookies()).getAll();
      },
      async setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        } catch {
          // Server Components can read cookies but cannot write them.
          // Middleware refreshes the session when cookie writes are needed.
        }
      }
    }
  });
}
