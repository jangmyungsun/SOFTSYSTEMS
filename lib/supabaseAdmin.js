import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

const supabaseSecretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "placeholder-secret";

const serviceKeySource = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? "SUPABASE_SERVICE_ROLE_KEY"
  : process.env.SUPABASE_SECRET_KEY
    ? "SUPABASE_SECRET_KEY"
    : "placeholder-secret";

export const supabaseAdminEnvInfo = {
  supabaseUrl,
  serviceKeySource,
};

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
