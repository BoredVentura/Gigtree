"use client";

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

    setCompletions((data ?? []) as Completion[]);

    const startingNotes: Record<string, string> = {};
    for (const completion of (data ?? []) as Completion[]) {
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
      notes: note || "Admin confirmed gig completion.",
    });

    await loadData();
    setMessage(
      "Admin confirmed completion. Payment moved to pending worker verification."
    );
    setLoadingId("");
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/admin" className="hidden sm:inline hover:underline">
              Admin
            </a>
            <a href="/payments" className="hidden sm:inline hover:underline">
              Payments
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin completion review</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Review completed gigs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            After a poster confirms the gig is complete, admin reviews it before
            payment moves toward worker verification and payout release.
          </p>
        </div>

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

        {isAdmin && (
          <div className="grid gap-5">
            {completions.map((completion) => (
              <article
                key={completion.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                    {completion.gigs?.category ?? "Gig"}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                    Poster confirmed
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                    {completion.admin_confirmed
                      ? "Admin confirmed"
                      : "Awaiting admin"}
                  </span>
                  {completion.payments?.status && (
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      Payment: {formatStatus(completion.payments.status)}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold">
                  {completion.gigs?.title ?? "Unknown gig"}
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Location
                    </p>
                    <p className="mt-1 font-bold">
                      {completion.gigs?.location_area ?? "Remote UK"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Total held
                    </p>
                    <p className="mt-1 font-bold">
                      £{completion.payments?.amount_gbp ?? "0"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Worker payout
                    </p>
                    <p className="mt-1 font-bold">
                      £{completion.payments?.worker_payout_amount_gbp ?? "0"}
                    </p>
                  </div>
                </div>

                <label className="mt-5 block">
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
                    className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-white p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Optional notes about completion, verification, or payout risk."
                  />
                </label>

                <div className="mt-5 flex flex-wrap gap-3">
                  {completion.admin_confirmed ? (
                    <div className="rounded-2xl bg-[#e8f0e4] p-4 text-sm font-semibold text-[#2f6f3e]">
                      Admin has confirmed this completion.
                    </div>
                  ) : (
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
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
