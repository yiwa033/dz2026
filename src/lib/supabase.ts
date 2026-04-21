import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient> | null = null;
let cachedAdmin: ReturnType<typeof createClient> | null = null;

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function getSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );
  }
  return cachedClient;
}

function getSupabaseAdmin() {
  if (!cachedAdmin) {
    cachedAdmin = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY")
    );
  }
  return cachedAdmin;
}

function createLazyClient(getter: () => ReturnType<typeof createClient>) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const client = getter();
        const value = Reflect.get(client, prop);
        return typeof value === "function" ? value.bind(client) : value;
      }
    }
  ) as ReturnType<typeof createClient>;
}

export const supabaseClient = createLazyClient(getSupabaseClient);
export const supabaseAdmin = createLazyClient(getSupabaseAdmin);
