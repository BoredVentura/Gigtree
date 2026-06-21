"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  is_admin: boolean;
};

type CountState = {
  posterRequests: number;
  applications: number;
  recommendations: number;
  completions: number;
  verification: number;
  payouts: number;
  auditLogs: number;
};

type AdminCard = {
  title: string;
  description: string;
  href: string;
  count: number;
  action: string;
  priority: "high" | "medium" | "normal";
};

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<CountState>({
    posterRequests: 0,
    applications: 0,
    recommendations: 0,
    completions: 0,
    verification: 0,
    payouts: 0,
    auditLogs: 0,
  });
  const [message, setMessage] = useState("Loading admin centre...");

  async function loadAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to access the admin centre.");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,is_admin")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    const currentProfile = profileData as Profile;
    setProfile(currentProfile);

    if (!currentProfile.is_admin) {
      setMessage("You do not have admin access.");
      return;
    }

    const [
      posterRequestsResult,
      applicationsResult,
      recommendationsResult,
      completionsResult,
      verificationResult,
      payoutsResult,
      auditResult,
    ] = await Promise.all([
      supabase
        .from("poster_access_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("gig_applications")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("admin_recommendations")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("completion_confirmations")
        .select("id", { count: "exact", head: true })
        .eq("poster_confirmed", true)
        .eq("admin_confirmed", false),
      supabase
        .from("verification_records")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "ready_for_release"),
      supabase
        .from("audit_logs")
        .select("id", { count: "exact", head: true }),
    ]);

    setCounts({
      posterRequests: posterRequestsResult.count ?? 0,
      applications: applicationsResult.count ?? 0,
      recommendations: recommendationsResult.count ?? 0,
      completions: completionsResult.count ?? 0,
      verification: verificationResult.count ?? 0,
      payouts: payoutsResult.count ?? 0,
      auditLogs: auditResult.count ?? 0,
    });

    setMessage("");
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  const adminCards = useMemo<AdminCard[]>(
    () => [
      {
        title: "Poster access",
        description:
          "Review people asking for permission to post gigs on Gigtree.",
        href: "/post-request",
        count: counts.posterRequests,
        action: "Review requests",
        priority: counts.posterRequests > 0 ? "high" : "normal",
      },
      {
        title: "Applications",
        description:
          "Review worker applications and decide who should be considered.",
        href: "/admin/applications",
        count: counts.applications,
        action: "Review applications",
        priority: counts.applications > 0 ? "medium" : "normal",
      },
      {
        title: "Recommendations",
        description:
          "Create and manage anonymous candidate summaries for posters.",
        href: "/admin/recommendations",
        count: counts.recommendations,
        action: "Manage recommendations",
        priority: counts.recommendations > 0 ? "medium" : "normal",
      },
      {
        title: "Completions",
        description:
          "Confirm completed gigs after the poster says the work is done.",
        href: "/admin/completions",
        count: counts.completions,
        action: "Review completions",
        priority: counts.completions > 0 ? "high" : "normal",
      },
      {
        title: "Verification",
        description:
          "Review worker identity and payout-readiness checks.",
        href: "/admin/verification",
        count: counts.verification,
        action: "Review verification",
        priority: counts.verification > 0 ? "high" : "normal",
      },
      {
        title: "Payouts",
        description:
          "Release payouts only after completion and verification checks pass.",
        href: "/admin/payouts",
        count: counts.payouts,
        action: "Review payouts",
        priority: counts.payouts > 0 ? "high" : "normal",
      },
      {
        title: "Audit logs",
        description:
          "See important admin actions recorded for trust and accountability.",
        href: "/admin/audit",
        count: counts.auditLogs,
        action: "View audit logs",
        priority: "normal",
      },
    ],
    [counts]
  );

  const highPriorityCount = adminCards.filter(
    (card) => card.priority === "high" && card.count > 0
  ).length;

  const mediumPriorityCount = adminCards.filter(
    (card) => card.priority === "medium" && card.count > 0
  ).length;

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f6f3e] text-xl text-white shadow-lg shadow-[#2f6f3e]/20">
              ✦
            </span>
            <span className="text-2xl font-black tracking-tight">Gigtree</span>
          </a>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <a href="/dashboard" className="rounded-full px-4 py-2 hover:bg-white">
              Dashboard
            </a>
            <a href="/admin/audit" className="rounded-full px-4 py-2 hover:bg-white">
              Audit logs
            </a>
            <a href="/admin/payouts" className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]">
              Payouts
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Admin centre</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Keep Gigtree safe, reviewed, and moving.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Review poster access, worker applications, anonymous
              recommendations, completion confirmations, verification, payouts,
              and audit history from one admin hub.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Admin summary</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {profile?.full_name ?? "Admin"}
                </span>
                Signed-in admin
              </div>

              <div className="rounded-2xl bg-[#fff7e8] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {highPriorityCount}
                </span>
                High-priority queues
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {mediumPriorityCount}
                </span>
                Medium-priority queues
              </div>
            </div>
          </aside>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm ring-1 ring-black/10">
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

        {profile?.is_admin && !message && (
          <div className="grid gap-8 pb-16">
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">Trust first</p>
                <h2 className="mt-2 text-3xl font-black">
                  Review before revealing.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Posters do not immediately see worker identity, CVs, or
                  contact details. Admin review protects the flow.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Completion control</p>
                <h2 className="mt-2 text-3xl font-black">
                  Confirm before payout.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  Poster confirmation is not enough by itself. Admin review and
                  worker verification keep release controlled.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Audit trail</p>
                <h2 className="mt-2 text-3xl font-black">
                  Actions are recorded.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  Important admin decisions should leave a record for later
                  review and accountability.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Admin workflow</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {adminCards.length} tools
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {adminCards.map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 font-semibold ${
                              card.priority === "high" && card.count > 0
                                ? "bg-[#fff7e8] text-[#8a5a00]"
                                : card.priority === "medium" && card.count > 0
                                  ? "bg-[#e8f0e4] text-[#2f6f3e]"
                                  : "bg-[#f6f8f4] text-[#42513c]"
                            }`}
                          >
                            {card.priority === "high" && card.count > 0
                              ? "Needs attention"
                              : card.priority === "medium" && card.count > 0
                                ? "Review queue"
                                : "Admin tool"}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black">{card.title}</h3>
                        <p className="mt-3 leading-7 text-[#42513c]">
                          {card.description}
                        </p>
                      </div>

                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f6f8f4] text-2xl font-black text-[#2f6f3e]">
                        {card.count}
                      </div>
                    </div>

                    <div className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 text-sm font-semibold text-white">
                      {card.action}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
