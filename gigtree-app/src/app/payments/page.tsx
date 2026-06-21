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

function paymentStatusInfo(status: string) {
  switch (status) {
    case "held":
      return {
        label: "Payment held",
        description:
          "A placeholder payment record has been created and funds are treated as held.",
        nextStep:
          "Complete the gig, then the poster should confirm completion.",
      };
    case "pending_admin_confirmation":
      return {
        label: "Waiting for admin completion review",
        description:
          "The poster has confirmed the job is complete. Gigtree admin now needs to review completion.",
        nextStep:
          "Wait for admin confirmation.",
      };
    case "pending_worker_verification":
      return {
        label: "Waiting for worker verification",
        description:
          "Admin has confirmed completion. Worker verification must be approved before payout can be released.",
        nextStep:
          "Submit or wait for verification approval.",
      };
    case "ready_for_release":
      return {
        label: "Ready for payout release",
        description:
          "Completion and verification are approved. The payout is ready for admin release.",
        nextStep:
          "Admin can release the payout.",
      };
    case "released":
      return {
        label: "Payout released",
        description:
          "The worker payout has been marked as released in the placeholder payment flow.",
        nextStep:
          "No further payment action is needed.",
      };
    default:
      return {
        label: formatStatus(status),
        description:
          "This payment has an updated status.",
        nextStep:
          "Check your status overview or contact Gigtree admin.",
      };
  }
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
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/dashboard" className="hover:underline">
              Dashboard
            </a>
            <a href="/status" className="hover:underline">
              Status
            </a>
            <a href="/contacts" className="hover:underline">
              Contacts
            </a>
            <a href="/verification" className="hover:underline">
              Verification
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Payments</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Track held payments and payouts.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            This is the placeholder payment flow before Stripe is connected.
            Gigtree will later hold funds and release payouts after completion
            and verification checks.
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-[#2f6f3e]/20 bg-[#e8f0e4] p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Payment status guide</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">Held</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Payment has been created and is treated as held.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">Pending admin confirmation</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Poster says the job is complete. Admin needs to review.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">Pending worker verification</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Completion is confirmed, but worker verification is still needed.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">Ready / released</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Payout is ready for admin release, or has already been released.
              </p>
            </div>
          </div>
        </section>

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
              Payment records appear after an accepted gig creates a held
              payment.
            </p>
            <a
              href="/status"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              View status
            </a>
          </div>
        )}

        <div className="grid gap-5">
          {payments.map((payment) => {
            const info = paymentStatusInfo(payment.status);

            return (
              <article
                key={payment.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                    {info.label}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                    {payment.gigs?.category ?? "Gig"}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                    Created {new Date(payment.created_at).toLocaleDateString()}
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

                <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">What this means</p>
                  <p className="mt-2 text-[#42513c]">{info.description}</p>
                </div>

                <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                  <p className="font-semibold text-[#2f6f3e]">Next step</p>
                  <p className="mt-2 text-[#42513c]">{info.nextStep}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="/status"
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
                  >
                    View status
                  </a>
                  <a
                    href="/verification"
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
                  >
                    Verification
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
