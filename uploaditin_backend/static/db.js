// Client-side Supabase config must only use publishable values.
// Inject these at build/runtime (for example on window.__APP_CONFIG__).
// Never place SUPABASE_SECRET_KEY or service-role keys in static JS.
const runtimeConfig = window.__APP_CONFIG__ || {};
const supabaseUrl = runtimeConfig.SUPABASE_URL || "";
const supabasePublishableKey = runtimeConfig.SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing client Supabase runtime config: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.");
}

export const supabase = window.supabase.createClient(supabaseUrl, supabasePublishableKey);
