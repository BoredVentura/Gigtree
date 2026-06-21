"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  notes: string | null;
  created_at: string;
};

function formatAction(action: string) {
  return action
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("Loading audit logs...");

  useEffect(() => {
    async function loadLogs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in as an admin.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setMessage("You do not have admin access.");
        return;
      }

      const { data, error } = await supabase
        .from("audit_logs")
        .select("id,actor_id,action,entity_type,entity_id,notes,created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        setMessage(error.message);
        return;
      }

      setLogs((data ?? []) as AuditLog[]);
      setMessage("");
    }

    loadLogs();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/admin" className="hover:underline">
              Admin
            </a>
            <a href="/admin/payouts" className="hidden sm:inline hover:underline">
              Payouts
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Audit logs</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Platform action history.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Track important admin actions such as approvals, verification
            reviews, completion confirmations, and payout releases.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
            {message}
            {message.includes("sign in") && (
              <a
                href="/login"
                className="mt-4 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
              >
                Sign in
              </a>
            )}
          </div>
        )}

        {!message && logs.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No audit logs yet</h2>
            <p className="mt-3 text-[#42513c]">
              Logs will appear after admin actions are recorded.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                  {formatAction(log.action)}
                </span>
                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                  {log.entity_type}
                </span>
                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              {log.notes && (
                <p className="mt-4 whitespace-pre-wrap text-[#42513c]">
                  {log.notes}
                </p>
              )}

              <div className="mt-4 grid gap-2 text-sm text-[#42513c] md:grid-cols-2">
                <p>
                  <span className="font-semibold text-[#172014]">Actor:</span>{" "}
                  {log.actor_id ? log.actor_id.slice(0, 8) : "System"}
                </p>
                <p>
                  <span className="font-semibold text-[#172014]">Entity:</span>{" "}
                  {log.entity_id ? log.entity_id.slice(0, 8) : "None"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
