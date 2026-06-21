"use client";

import { useEffect, useMemo, useState } from "react";
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
    description: string;
    location_area: string | null;
    schedule_summary: string | null;
  } | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function paymentInfo(status: string) {
  switch (status) {
    case "held":
      return {
        label: "Held",
        description:
          "Payment is held while the gig moves through selection, contact, and completion.",
        nextStep:
          "Complete the gig flow. Poster completion confirmation is needed later.",
      };
    case "pending_admin_confirmation":
      return {
        label: "Waiting for admin completion review",
        description:
          "The poster has confirmed completion. Admin needs to review before payout can move forward.",
        nextStep:
          "Wait for admin completion review.",
      };
    case "pending_worker_verification":
      return {
        label: "Waiting for worker verification",
        description:
          "Completion has been reviewed. Worker verification is needed before release.",
        nextStep:
          "Worker should complete verification if not already approved.",
      };
    case "ready_for_release":
      return {
        label: "Ready for release",
        description:
          "Completion and verification are approved. Admin can release the payout.",
        nextStep:
          "Wait for admin payout release.",
      };
    case "released":
      return {
        label: "Released",
        description:
          "The payout has been marked as released.",
        nextStep:
          "No further payment action is needed.",
      };
    default:
      return {
        label: formatStatus(status),
        description:
          "This payment has an updated status.",
        nextStep:
          "Check your dashboard or contact Gigtree if unsure.",
      };
  }
}

export default function PaymentsPage() {
  const [userId, setUserId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("Loading payments...");

  async function loadPayments() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view payments.");
      return;
    }

    setUserId(user.id);

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
          description,
          location_area,
          schedule_summary
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

  useEffect(() => {
    loadPayments();
  }, []);

  const workerPayments = useMemo(() => {
    return payments.filter((payment) => payment.worker_id === userId);
  }, [payments, userId]);

  const posterPayments = useMemo(() => {
    return payments.filter((payment) => payment.poster_id === userId);
  }, [payments, userId]);

  const activePayments = useMemo(() => {
    return payments.filter((payment) => payment.status !== "released");
  }, [payments]);

  const releasedPayments = useMemo(() => {
    return payments.filter((payment) => payment.status === "released");
  }, [payments]);

  const totalHeld = activePayments.reduce(
    (sum, payment) => sum + Number(payment.amount_gbp ?? 0),
    0
  );

  const totalWorkerPayout = payments
    .filter((payment) => payment.worker_id === userId)
    .reduce((sum, payment) => sum + Number(payment.worker_payout_amount_gbp ?? 0), 0);

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
            <a href="/completions" className="rounded-full px-4 py-2 hover:bg-white">
              Completions
            </a>
            <a href="/verification" className="rounded-full px-4 py-2 hover:bg-white">
              Verification
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Payments</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Track held payments and payout progress.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Gigtree payments move through a trust flow: held payment,
              completion confirmation, admin review, worker verification, and
              payout release.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Payment summary</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {payments.length}
                </span>
                Total payment records
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  £{totalHeld}
                </span>
                Active held / in-progress value
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  £{totalWorkerPayout}
                </span>
                Worker payout value linked to you
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

        {userId && payments.length === 0 && !message && (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-3xl font-black">No payments yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
              Payment records will appear here after gigs move into the payment
              flow.
            </p>

            <a
              href="/dashboard"
              className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
            >
              Back to dashboard
            </a>
          </div>
        )}

        {userId && payments.length > 0 && (
          <div className="grid gap-8 pb-16">
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">As worker</p>
                <h2 className="mt-2 text-3xl font-black">
                  {workerPayments.length} payment
                  {workerPayments.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  These are payments where you are linked as the worker.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">As poster</p>
                <h2 className="mt-2 text-3xl font-black">
                  {posterPayments.length} payment
                  {posterPayments.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  These are payments linked to gigs you posted.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Active payments</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {activePayments.length} active
                </span>
              </div>

              {activePayments.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No active payments right now.
                </div>
              ) : (
                <div className="grid gap-5">
                  {activePayments.map((payment) => {
                    const info = paymentInfo(payment.status);
                    const isWorker = payment.worker_id === userId;
                    const isPoster = payment.poster_id === userId;

                    return (
                      <article
                        key={payment.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {payment.gigs?.category ?? "Gig"}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                You are: {isWorker ? "Worker" : isPoster ? "Poster" : "Linked user"}
                              </span>
                            </div>

                            <h3 className="text-2xl font-black">
                              {payment.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-3 line-clamp-3 leading-7 text-[#42513c]">
                              {payment.gigs?.description ?? "Gig details unavailable."}
                            </p>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Total amount
                                </span>
                                £{payment.amount_gbp}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Commission
                                </span>
                                £{payment.commission_amount_gbp}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Worker payout
                                </span>
                                £{payment.worker_payout_amount_gbp}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4">
                              <p className="font-semibold text-[#142014]">
                                What this means
                              </p>
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
                            {isPoster && (
                              <a
                                href="/completions"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                Completion
                              </a>
                            )}

                            {isWorker && (
                              <a
                                href="/verification"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                Verification
                              </a>
                            )}

                            <a
                              href={`/gigs/${payment.gig_id}`}
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              View gig
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
                <h2 className="text-3xl font-black">Released payments</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {releasedPayments.length} released
                </span>
              </div>

              {releasedPayments.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No released payments yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {releasedPayments.map((payment) => {
                    const isWorker = payment.worker_id === userId;
                    const isPoster = payment.poster_id === userId;

                    return (
                      <article
                        key={payment.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                Released
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                You are: {isWorker ? "Worker" : isPoster ? "Poster" : "Linked user"}
                              </span>
                            </div>

                            <h3 className="text-xl font-black">
                              {payment.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              Worker payout: £{payment.worker_payout_amount_gbp}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                            <a
                              href={`/gigs/${payment.gig_id}`}
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              View gig
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
