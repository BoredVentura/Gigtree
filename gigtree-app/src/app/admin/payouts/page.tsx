"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createAuditLog } from "@/lib/audit-log";

type Payment = {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string | null;
  amount_gbp: number;
  commission_amount_gbp: number;
  worker_payout_amount_gbp: number;
  status: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
  } | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function payoutInfo(status: string) {
  if (status === "ready_for_release") {
    return {
      label: "Ready for release",
      description:
        "Completion and worker verification have been approved. Admin can mark this payout as released.",
      nextStep:
        "Only release after checking the worker, gig, amount, and audit trail.",
    };
  }

  if (status === "released") {
    return {
      label: "Released",
      description:
        "This payout has already been marked as released in the placeholder payment flow.",
      nextStep:
        "No further payout action needed.",
    };
  }

  return {
    label: formatStatus(status),
    description:
      "This payment is not currently ready for release.",
    nextStep:
      "Check completion and verification status.",
  };
}

export default function AdminPayoutsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("Loading payouts...");
  const [loadingId, setLoadingId] = useState("");

  async function loadPayments() {
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
      .from("payments")
      .select(
        `
        id,
        gig_id,
        poster_id,
        worker_id,
        amount_gbp,
        commission_amount_gbp,
        worker_payout_amount_gbp,
        status,
        created_at,
        gigs (
          title,
          category,
          location_area
        )
      `
      )
      .in("status", ["ready_for_release", "released"])
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPayments((data ?? []) as Payment[]);
    setMessage("");
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function releasePayout(payment: Payment) {
    const confirmed = window.confirm(
      `Release payout of £${payment.worker_payout_amount_gbp}?\n\nOnly continue if completion and worker verification have been checked.`
    );

    if (!confirmed) return;

    setLoadingId(payment.id);
    setMessage("");

    const { error } = await supabase
      .from("payments")
      .update({
        status: "released",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "ready_for_release");

    if (error) {
      setMessage(error.message);
      setLoadingId("");
      return;
    }

    await createAuditLog({
      action: "payout_released",
      entityType: "payment",
      entityId: payment.id,
      notes: `Released payout of £${payment.worker_payout_amount_gbp} for gig ${
        payment.gigs?.title ?? payment.gig_id
      }.`,
    });

    await loadPayments();
    setMessage("Payout released and audit log recorded.");
    setLoadingId("");
  }

  const readyPayments = payments.filter(
    (payment) => payment.status === "ready_for_release"
  );
  const releasedPayments = payments.filter(
    (payment) => payment.status === "released"
  );

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
            <a href="/admin/completions" className="hover:underline">
              Completions
            </a>
            <a href="/admin/verification" className="hover:underline">
              Verification
            </a>
            <a href="/admin/audit" className="hover:underline">
              Audit
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin payouts</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Release worker payouts.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Review payouts that are ready for release. In the current MVP this
            marks a placeholder payment as released. Real Stripe payouts will be
            connected later.
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-[#d28b28]/30 bg-[#fff7e8] p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Release warning</h2>
          <p className="mt-3 leading-7 text-[#42513c]">
            Only release a payout after confirming the gig was completed, admin
            review is complete, and the worker verification has been approved.
            Every release creates an audit log.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">1. Completion approved</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Poster and admin confirmed the job was completed.
              </p>
            </div>

            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">2. Worker verified</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Worker ID verification has been approved.
              </p>
            </div>

            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">3. Audit recorded</p>
              <p className="mt-1 text-sm text-[#42513c]">
                The payout release is saved in audit logs.
              </p>
            </div>
          </div>
        </section>

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

        {isAdmin && !message && payments.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No payouts ready</h2>
            <p className="mt-3 text-[#42513c]">
              Payments appear here after admin completion approval and worker
              verification approval.
            </p>
          </div>
        )}

        {isAdmin && payments.length > 0 && (
          <div className="grid gap-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Ready for release</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {readyPayments.length} ready
                </span>
              </div>

              {readyPayments.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No payouts are currently ready for release.
                </div>
              ) : (
                <div className="grid gap-5">
                  {readyPayments.map((payment) => {
                    const info = payoutInfo(payment.status);

                    return (
                      <article
                        key={payment.id}
                        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                {payment.gigs?.category ?? "Gig"}
                              </span>
                            </div>

                            <h3 className="text-2xl font-bold">
                              {payment.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              {payment.gigs?.location_area ?? "Remote UK"}
                            </p>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                                <p className="text-sm font-semibold text-[#42513c]">
                                  Total held
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                  £{payment.amount_gbp}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                                <p className="text-sm font-semibold text-[#42513c]">
                                  Commission
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                  £{payment.commission_amount_gbp}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                                <p className="text-sm font-semibold text-[#42513c]">
                                  Worker payout
                                </p>
                                <p className="mt-1 text-xl font-bold">
                                  £{payment.worker_payout_amount_gbp}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
                              <p className="font-semibold">What this means</p>
                              <p className="mt-2 text-[#42513c]">
                                {info.description}
                              </p>
                            </div>

                            <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {info.nextStep}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            <button
                              type="button"
                              disabled={loadingId === payment.id}
                              onClick={() => releasePayout(payment)}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              {loadingId === payment.id
                                ? "Releasing..."
                                : "Release payout"}
                            </button>

                            <a
                              href="/admin/audit"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              View audit logs
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Released payouts</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {releasedPayments.length} released
                </span>
              </div>

              {releasedPayments.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No payouts have been released yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {releasedPayments.map((payment) => (
                    <article
                      key={payment.id}
                      className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              Released
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                              {payment.gigs?.category ?? "Gig"}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold">
                            {payment.gigs?.title ?? "Unknown gig"}
                          </h3>

                          <p className="mt-2 text-[#42513c]">
                            Worker payout released: £
                            {payment.worker_payout_amount_gbp}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          <a
                            href="/admin/audit"
                            className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                          >
                            Audit logs
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
