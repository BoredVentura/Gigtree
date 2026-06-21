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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("No signed-in user for audit log.");
  }

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    notes: notes ?? null,
  });

  if (error) {
    throw new Error(`Audit log failed: ${error.message}`);
  }
}
