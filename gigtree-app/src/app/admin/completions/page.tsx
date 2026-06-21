"use client";
import { SiteHeader } from "@/components/site-header";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createAuditLog } from "@/lib/audit-log";

type Completion = {
  id: string;
  gig_id: string;
  worker_id: string;
  poster_id: string;
  payment_id: string | null;
  poster_confirmed: boolean;
  poster_confirmed_at: string | null;
  admin_confirmed: boolean;
  admin_confirmed_at: string | null;
  admin_notes: string | null;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
  } | null;
  payments: {
    id: string;
    amount_gbp: number;
    worker_payout_amount_gbp: number;
    status: string;
  } | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function reviewInfo(completion: Completion) {
  if (completion.admin_confirmed) {
    return {
      label: "Admin confirmed",
      description:
        "Admin has confirmed this completion. Payment should now be moving through verification and payout release.",
      nextStep: "Check payments or payout release status.",
    };
  }

  if (completion.poster_confirmed) {
    return {
      label: "Needs admin review",
      description:
        "The poster has confirmed the job is complete. Admin should review before the payment moves to worker verification.",
      nextStep:
        "Check the gig details and admin notes, then confirm if completion is valid.",
    };
  }

  return {
    label: "Waiting for poster",
    description:
      "The poster has not confirmed completion yet.",
    nextStep: "No admin action needed yet.",
  };
}

export default function AdminCompletionsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [message, setMessage] = useState("Loading admin completion reviews...");
  const [loadingId, setLoadingId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function loadData() {
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
      .from("completion_confirmations")
      .select(
        `
        id,
        gig_id,
        worker_id,
        poster_id,
        payment_id,
        poster_confirmed,
        poster_confirmed_at,
        admin_confirmed,
        admin_confirmed_at,
        admin_notes,
        gigs (
          title,
          category,
          location_area
        ),
        payments (
          id,
          amount_gbp,
          worker_payout_amount_gbp,
          status
        )
      `
      )
      .eq("poster_confirmed", true)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const loaded = (data ?? []) as Completion[];
    setCompletions(loaded);

    const startingNotes: Record<string, string> = {};
    for (const completion of loaded) {
      startingNotes[completion.id] = completion.admin_notes ?? "";
    }
    setNotes(startingNotes);

    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  async function confirmAsAdmin(completion: Completion) {
    setLoadingId(completion.id);
    setMessage("");

    const note = notes[completion.id] ?? "";

    const { error: completionError } = await supabase
      .from("completion_confirmations")
      .update({
        admin_confirmed: true,
        admin_confirmed_at: new Date().toISOString(),
        admin_notes: note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", completion.id);

    if (completionError) {
      setMessage(completionError.message);
      setLoadingId("");
      return;
    }

    if (completion.payment_id) {
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "pending_worker_verification",
          updated_at: new Date().toISOString(),
        })
        .eq("id", completion.payment_id);

      if (paymentError) {
        setMessage(paymentError.message);
        setLoadingId("");
        return;
      }
    }

    await createAuditLog({
      action: "completion_admin_confirmed",
      entityType: "completion_confirmation",
      entityId: completion.id,
      notes:
        note ||
        "Admin confirmed gig completion and moved payment to pending worker verification.",
    });

    await loadData();
    setMessage(
      "Admin confirmed completion. Payment moved to pending worker verification."
    );
    setLoadingId("");
  }

  const needsReview = completions.filter(
    (completion) => completion.poster_confirmed && !completion.admin_confirmed
  );
  const reviewed = completions.filter((completion) => completion.admin_confirmed);

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="admin" />

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin completion review</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Confirm completed gigs before payout.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            After a poster confirms the job is complete, admin reviews it. Once
            confirmed, the payment moves to worker verification before payout
            release.
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-[#2f6f3e]/20 bg-[#e8f0e4] p-6 shadow-sm">
          <h2 className="text-2xl font-bold">What admin confirmation does</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">1. Confirms completion</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Admin records that the poster-confirmed completion has been
                reviewed.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">2. Updates payment</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Payment moves to pending worker verification.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">3. Creates audit log</p>
              <p className="mt-1 text-sm text-[#42513c]">
                The decision is recorded in the admin audit trail.
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

        {isAdmin && !message && completions.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No completion reviews yet</h2>
            <p className="mt-3 text-[#42513c]">
              Poster-confirmed completed gigs will appear here.
            </p>
          </div>
        )}

        {isAdmin && completions.length > 0 && (
          <div className="grid gap-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Needs admin review</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {needsReview.length} pending
                </span>
              </div>

              {needsReview.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No completions currently need admin review.
                </div>
              ) : (
                <div className="grid gap-5">
                  {needsReview.map((completion) => {
                    const info = reviewInfo(completion);

                    return (
                      <article
                        key={completion.id}
                        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                {completion.gigs?.category ?? "Gig"}
                              </span>
                              {completion.payments?.status && (
                                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                  Payment: {formatStatus(completion.payments.status)}
                                </span>
                              )}
                            </div>

                            <h3 className="text-2xl font-bold">
                              {completion.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Location
                                </span>
                                {completion.gigs?.location_area ?? "Remote UK"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Total held
                                </span>
                                £{completion.payments?.amount_gbp ?? "0"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Worker payout
                                </span>
                                £{completion.payments?.worker_payout_amount_gbp ?? "0"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4">
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

                          <div className="flex shrink-0 flex-col gap-3 lg:w-80 lg:justify-center">
                            <label>
                              <span className="text-sm font-semibold text-[#42513c]">
                                Admin notes
                              </span>
                              <textarea
                                value={notes[completion.id] ?? ""}
                                onChange={(event) =>
                                  setNotes((current) => ({
                                    ...current,
                                    [completion.id]: event.target.value,
                                  }))
                                }
                                className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 bg-white p-4 outline-none focus:border-[#2f6f3e]"
                                placeholder="Optional notes about completion, risk, or payout."
                              />
                            </label>

                            <button
                              type="button"
                              disabled={loadingId === completion.id}
                              onClick={() => confirmAsAdmin(completion)}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              {loadingId === completion.id
                                ? "Confirming..."
                                : "Admin confirm completion"}
                            </button>
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
                <h2 className="text-3xl font-black">Reviewed completions</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {reviewed.length} reviewed
                </span>
              </div>

              {reviewed.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No reviewed completions yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {reviewed.map((completion) => (
                    <article
                      key={completion.id}
                      className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              Admin confirmed
                            </span>
                            {completion.payments?.status && (
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                Payment: {formatStatus(completion.payments.status)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold">
                            {completion.gigs?.title ?? "Unknown gig"}
                          </h3>

                          {completion.admin_notes && (
                            <p className="mt-3 whitespace-pre-wrap text-[#42513c]">
                              {completion.admin_notes}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          <a
                            href="/admin/verification"
                            className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                          >
                            Verification
                          </a>
                          <a
                            href="/admin/payouts"
                            className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                          >
                            Payouts
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
