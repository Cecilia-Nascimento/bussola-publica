import { createClient } from "@supabase/supabase-js";

// Arquivo reconstruido: o original nao estava versionado no repositorio.
// A URL vem do projeto Supabase referenciado no README
// (https://supabase.com/dashboard/project/cbaakbwnwqnelqtdwley).
// A chave anon (publica) deve ser preenchida no arquivo .env do frontend:
//   VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://cbaakbwnwqnelqtdwley.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseAnonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_ANON_KEY nao definida. Preencha o arquivo frontend/.env " +
      "com a chave anon do painel do Supabase (Settings -> API) para carregar os dados.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
