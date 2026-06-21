"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

    await loadPayments();
    setMessage("Payout released.");
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
          <p className="font-semibold text-[#2f6f3e]">Admin payouts</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Release worker payouts.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            After completion and worker verification are approved, admin can
            release the placeholder payout. Stripe payout automation will come
            later.
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

        {isAdmin && !message && payments.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No payouts ready</h2>
            <p className="mt-3 text-[#42513c]">
              Payments will appear here after admin completion approval and
              worker verification approval.
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="grid gap-5">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                        {formatStatus(payment.status)}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                        {payment.gigs?.category ?? "Gig"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold">
                      {payment.gigs?.title ?? "Unknown gig"}
                    </h2>

                    <p className="mt-2 text-[#42513c]">
                      {payment.gigs?.location_area ?? "Remote UK"}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
                  </div>

                  <div className="flex shrink-0 flex-col justify-center">
                    {payment.status === "released" ? (
                      <div className="rounded-2xl bg-[#e8f0e4] p-4 text-sm font-semibold text-[#2f6f3e]">
                        Payout released
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
