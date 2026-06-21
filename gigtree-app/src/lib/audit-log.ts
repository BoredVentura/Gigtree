import { supabase } from "@/lib/supabase";

export async function createAuditLog({
  action,
  entityType,
  entityId,
  notes,
}: {
  action: string;
  entityType: string;
  entityId?: string | null;
  notes?: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    notes: notes ?? null,
  });
}
