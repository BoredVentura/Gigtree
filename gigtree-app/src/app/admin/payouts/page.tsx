"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SiteHeader } from "@/components/site-header";
import { createAuditLog } from "@/lib/audit-log";

type GigLookup = {
  id: string;
  title: string;
  category: string;
};

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

export default function AdminPayoutsPage() {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setMessage("You do not have admin access.");
      return;
    }

    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,gig_id,poster_id,worker_id,amount_gbp,commission_amount_gbp,worker_payout_amount_gbp,status,created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const paymentRows = (data ?? []) as Payment[];
    const gigIds = Array.from(new Set(paymentRows.map((payment) => payment.gig_id)));

    const { data: gigsData } = await supabase
      .from("gigs")
      .select("id,title,category")
      .in("id", gigIds);

    const gigMap = new Map(
      ((gigsData ?? []) as GigLookup[]).map((gig) => [gig.id, gig])
    );

    const enrichedPayments = paymentRows.map((payment) => ({
      ...payment,
      gigs: gigMap.get(payment.gig_id) ?? null,
    }));

    setPayments(enrichedPayments as Payment[]);
    setMessage("");
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const readyPayments = useMemo(() => {
    return payments.filter((payment) => payment.status === "ready_for_release");
  }, [payments]);

  const releasedPayments = useMemo(() => {
    return payments.filter((payment) => payment.status === "released");
  }, [payments]);

  const otherPayments = useMemo(() => {
    return payments.filter(
      (payment) =>
        payment.status !== "ready_for_release" && payment.status !== "released"
    );
  }, [payments]);

  async function releasePayment(payment: Payment) {
    setLoadingId(payment.id);
    setMessage("");

    const { error } = await supabase
      .from("payments")
      .update({ status: "released" })
      .eq("id", payment.id);

    if (error) {
      setMessage(error.message);
      setLoadingId("");
      return;
    }

    try {
      await createAuditLog({
        action: "payout_released",
        entityType: "payment",
        entityId: payment.id,
        notes: `Worker payout released: £${payment.worker_payout_amount_gbp}`,
      });
    } catch (auditError) {
      console.error(auditError);
    }

    setMessage("Payout marked as released.");
    setLoadingId("");
    await loadPayments();
  }

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader active="admin" />

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin payouts</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
            Review ready and released payouts.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Payouts should only be released after poster completion, admin
            completion review, and worker verification are approved.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm ring-1 ring-black/10">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-[2rem] bg-[#fff7e8] p-6 shadow-sm ring-1 ring-black/10">
          <h2 className="text-2xl font-black">Release warning</h2>
          <p className="mt-3 leading-7 text-[#42513c]">
            Only release payouts after completion and verification checks are
            complete. This MVP marks payouts as released; real Stripe payouts
            will be connected later.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#42513c]">
              <span className="block font-bold text-[#142014]">
                1. Completion approved
              </span>
              Poster and admin confirmed the gig was completed.
            </p>

            <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#42513c]">
              <span className="block font-bold text-[#142014]">
                2. Worker verified
              </span>
              Worker ID verification has been approved.
            </p>

            <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-[#42513c]">
              <span className="block font-bold text-[#142014]">
                3. Audit recorded
              </span>
              Payout release should be saved in audit logs.
            </p>
          </div>
        </section>

        <div className="grid gap-8 pb-16">
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-black">Ready for release</h2>
              <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                {readyPayments.length} ready
              </span>
            </div>

            {readyPayments.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                No payouts are currently ready for release.
              </div>
            ) : (
              <div className="grid gap-5">
                {readyPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                            {formatStatus(payment.status)}
                          </span>
                          <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                            {payment.gigs?.category ?? "Gig"}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black">
                          {payment.gigs?.title ?? "Unknown gig"}
                        </h3>

                        <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                          <p className="rounded-2xl bg-[#f6f8f4] p-4">
                            <span className="block font-semibold text-[#142014]">
                              Total
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
                      </div>

                      <div className="flex shrink-0 flex-col justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => releasePayment(payment)}
                          disabled={loadingId === payment.id}
                          className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
                        >
                          {loadingId === payment.id
                            ? "Releasing..."
                            : "Mark released"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-black">Other payment records</h2>
              <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                {otherPayments.length} other
              </span>
            </div>

            {otherPayments.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                No held or pending payments.
              </div>
            ) : (
              <div className="grid gap-5">
                {otherPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                  >
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#fff7e8] px-3 py-1 font-semibold text-[#8a5a00]">
                        {formatStatus(payment.status)}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                        Payment record
                      </span>
                    </div>

                    <h3 className="text-2xl font-black">
                      {payment.gigs?.title ?? `Gig ${payment.gig_id.slice(0, 8)}`}
                    </h3>

                    <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                      <p className="rounded-2xl bg-[#f6f8f4] p-4">
                        <span className="block font-semibold text-[#142014]">
                          Total
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
                  </article>
                ))}
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
              <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                No payouts have been released yet.
              </div>
            ) : (
              <div className="grid gap-5">
                {releasedPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                            Released
                          </span>
                          <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                            {payment.gigs?.category ?? "Gig"}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black">
                          {payment.gigs?.title ?? "Unknown gig"}
                        </h3>

                        <p className="mt-3 text-[#42513c]">
                          Worker payout released: £
                          {payment.worker_payout_amount_gbp}
                        </p>
                      </div>

                      <a
                        href="/admin/audit"
                        className="h-fit rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                      >
                        Audit logs
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
