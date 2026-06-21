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
  } | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("Loading payments...");

  useEffect(() => {
    async function loadPayments() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view payments.");
        return;
      }

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
            category
          )
        `
        )
        .or(`poster_id.eq.${user.id},worker_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      setPayments((data ?? []) as Payment[]);
      setMessage("");
    }

    loadPayments();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a href="/contacts" className="hidden sm:inline hover:underline">
              Contacts
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Payments</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Track held payments and payout status.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            This is the placeholder payment flow before Stripe is connected.
            Gigtree will later hold funds and release payouts after completion
            and verification.
          </p>
        </div>

        {message && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-[#42513c]">{message}</p>
            {message.includes("sign in") && (
              <a
                href="/login"
                className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
              >
                Sign in
              </a>
            )}
          </div>
        )}

        {!message && payments.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No payments yet</h2>
            <p className="mt-3 text-[#42513c]">
              Payment records will appear after an accepted gig creates a held
              payment.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {payments.map((payment) => (
            <article
              key={payment.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
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
                    Gigtree commission
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
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
