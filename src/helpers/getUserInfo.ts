import type { Session } from "@supabase/supabase-js";

export function getUserInfo(session: Session | null) {
  const u = session?.user;
  if (!u) return null;

  const md = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (md.full_name as string) ||
    (md.name as string) ||
    (md.user_name as string) ||
    u.email?.split("@")[0] ||
    "Usuário";
  const email = u.email ?? "";
  const avatar =
    (md.avatar_url as string) ||
    (md.picture as string) ||
    (md.avatar as string) ||
    "";

  return { name, email, avatar };
}
