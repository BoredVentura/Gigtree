"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatText(value: string) {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function actionInfo(action: string) {
  if (action.includes("verification")) {
    return {
      group: "Verification",
      badge: "ID review",
      description: "A worker verification decision was recorded.",
    };
  }

  if (action.includes("payout")) {
    return {
      group: "Payout",
      badge: "Money movement",
      description: "A payout-related admin action was recorded.",
    };
  }

  if (action.includes("completion")) {
    return {
      group: "Completion",
      badge: "Job completion",
      description: "A gig completion decision was recorded.",
    };
  }

  if (action.includes("recommendation")) {
    return {
      group: "Recommendation",
      badge: "Candidate summary",
      description: "An admin recommendation action was recorded.",
    };
  }

  if (action.includes("application")) {
    return {
      group: "Application",
      badge: "Worker application",
      description: "An application review action was recorded.",
    };
  }

  return {
    group: "Other",
    badge: "Admin action",
    description: "An admin action was recorded.",
  };
}

function groupOrder(group: string) {
  const order: Record<string, number> = {
    Verification: 1,
    Payout: 2,
    Completion: 3,
    Recommendation: 4,
    Application: 5,
    Other: 6,
  };

  return order[group] ?? 99;
}

export default function AdminAuditPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("Loading audit logs...");
  const [filter, setFilter] = useState("All");

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

    setIsAdmin(true);

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

  useEffect(() => {
    loadLogs();
  }, []);

  const groupedCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const log of logs) {
      const group = actionInfo(log.action).group;
      counts[group] = (counts[group] ?? 0) + 1;
    }

    return counts;
  }, [logs]);

  const filters = [
    "All",
    ...Object.keys(groupedCounts).sort((a, b) => groupOrder(a) - groupOrder(b)),
  ];

  const visibleLogs =
    filter === "All"
      ? logs
      : logs.filter((log) => actionInfo(log.action).group === filter);

  const recentImportant = logs.filter((log) =>
    ["verification", "payout", "completion"].some((word) =>
      log.action.includes(word)
    )
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/admin" className="hover:underline">
              Admin
            </a>
            <a href="/admin/applications" className="hover:underline">
              Applications
            </a>
            <a href="/admin/verification" className="hover:underline">
              Verification
            </a>
            <a href="/admin/payouts" className="hover:underline">
              Payouts
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin audit logs</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Track important admin decisions.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Audit logs help Gigtree keep a clear record of verification,
            completion, payout, recommendation, and application decisions.
          </p>
        </div>

        {isAdmin && (
          <section className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#42513c]">
                Total logs shown
              </p>
              <p className="mt-2 text-3xl font-black">{logs.length}</p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#42513c]">
                Verification
              </p>
              <p className="mt-2 text-3xl font-black">
                {groupedCounts.Verification ?? 0}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#42513c]">Payouts</p>
              <p className="mt-2 text-3xl font-black">
                {groupedCounts.Payout ?? 0}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#42513c]">
                High-trust actions
              </p>
              <p className="mt-2 text-3xl font-black">{recentImportant}</p>
            </div>
          </section>
        )}

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm">
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

        {isAdmin && logs.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    filter === item
                      ? "bg-[#2f6f3e] text-white"
                      : "bg-[#f6f8f4] text-[#42513c] hover:bg-[#e8f0e4]"
                  }`}
                >
                  {item}
                  {item !== "All" && groupedCounts[item]
                    ? ` (${groupedCounts[item]})`
                    : ""}
                </button>
              ))}
            </div>
          </section>
        )}

        {isAdmin && !message && logs.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No audit logs yet</h2>
            <p className="mt-3 text-[#42513c]">
              Admin decisions such as verification approvals, payout releases,
              and completion reviews will appear here.
            </p>
          </div>
        )}

        {isAdmin && visibleLogs.length > 0 && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {filter === "All" ? "Recent audit activity" : `${filter} logs`}
                </h2>
                <p className="mt-2 text-[#42513c]">
                  Showing the latest {visibleLogs.length} matching log
                  {visibleLogs.length === 1 ? "" : "s"}.
                </p>
              </div>

              <button
                type="button"
                onClick={loadLogs}
                className="rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {visibleLogs.map((log) => {
                const info = actionInfo(log.action);

                return (
                  <article
                    key={log.id}
                    className="rounded-3xl border border-black/10 bg-[#fbfff6] p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                      <div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                            {info.group}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#42513c] ring-1 ring-black/10">
                            {info.badge}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#42513c] ring-1 ring-black/10">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        <h3 className="mt-4 text-xl font-black">
                          {formatText(log.action)}
                        </h3>

                        <p className="mt-2 text-[#42513c]">
                          {info.description}
                        </p>

                        {log.notes && (
                          <div className="mt-4 rounded-2xl bg-white p-4 text-[#42513c] ring-1 ring-black/10">
                            <p className="text-sm font-semibold text-[#172014]">
                              Notes
                            </p>
                            <p className="mt-2 whitespace-pre-wrap">{log.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 rounded-2xl bg-white p-4 text-sm text-[#42513c] ring-1 ring-black/10 md:w-64">
                        <p>
                          <span className="font-semibold text-[#172014]">
                            Entity:
                          </span>{" "}
                          {formatText(log.entity_type)}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-[#172014]">
                            Entity ID:
                          </span>{" "}
                          {log.entity_id ? log.entity_id.slice(0, 8) : "None"}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-[#172014]">
                            Actor ID:
                          </span>{" "}
                          {log.actor_id ? log.actor_id.slice(0, 8) : "System"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
