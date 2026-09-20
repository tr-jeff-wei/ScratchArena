/* ScratchArena — Supabase connection config.
 *
 * Fill in your project's URL and anon (public) key below. Both come from
 * your Supabase dashboard: Settings → API.
 *
 *   SUPABASE_URL      e.g. "https://xxxxxxxxxxxx.supabase.co"
 *   SUPABASE_ANON_KEY the "anon public" key (NOT the "service_role" key)
 *
 * The anon key is safe to ship in client-side code — it can only do what
 * your Row Level Security policies allow, which for `game_sessions` is
 * public SELECT and public INSERT (see the CREATE POLICY statements in the
 * schema). NEVER put your service_role key here or in any client code: it
 * bypasses RLS entirely and must stay server-side only.
 */
const SUPABASE_URL = "https://vhqzsxfvxlqaztnusbwp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_S2Wl-Yi-QygZQzrKFsbY6A_QutlrfCq";

function saIsSupabaseConfigured() {
  return (
    typeof SUPABASE_URL === "string" &&
    typeof SUPABASE_ANON_KEY === "string" &&
    /^https?:\/\//.test(SUPABASE_URL) &&
    SUPABASE_ANON_KEY.length > 20
  );
}

/** Lazily creates (and caches) the Supabase client. Returns null if not configured yet. */
function saGetSupabaseClient() {
  if (!saIsSupabaseConfigured()) return null;
  if (!window.supabase || !window.supabase.createClient) return null;
  if (!saGetSupabaseClient._client) {
    saGetSupabaseClient._client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return saGetSupabaseClient._client;
}
