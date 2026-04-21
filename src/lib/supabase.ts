import { createClient } from "@supabase/supabase-js";

type LooseSupabaseClient = any;

let cachedClient: LooseSupabaseClient | null = null;
let cachedAdmin: LooseSupabaseClient | null = null;

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

function createLazyClient(getter: () => LooseSupabaseClient): LooseSupabaseClient {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const client = getter();
        const value = Reflect.get(client, prop);
        return typeof value === "function" ? value.bind(client) : value;
      }
    }
  ) as LooseSupabaseClient;
}

export const supabaseClient: LooseSupabaseClient = createLazyClient(getSupabaseClient);
export const supabaseAdmin: LooseSupabaseClient = createLazyClient(getSupabaseAdmin);
