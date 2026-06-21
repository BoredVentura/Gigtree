"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PostedGig = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

type Application = {
  id: string;
  gig_id: string;
  status: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
  } | null;
};

type Payment = {
  id: string;
  gig_id: string;
  amount_gbp: number;
  worker_payout_amount_gbp: number;
  status: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
  } | null;
};

type Completion = {
  id: string;
  gig_id: string;
  poster_confirmed: boolean;
  admin_confirmed: boolean;
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

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 text-sm font-semibold text-[#2f6f3e]">
      {label}
    </span>
  );
}

export default function StatusPage() {
  const [postedGigs, setPostedGigs] = useState<PostedGig[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [message, setMessage] = useState("Loading status overview...");

  useEffect(() => {
    async function loadStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view your status overview.");
        return;
      }

      const { data: gigData, error: gigError } = await supabase
        .from("gigs")
        .select("id,title,category,status,created_at")
        .eq("poster_id", user.id)
        .order("created_at", { ascending: false });

      if (gigError) {
        setMessage(gigError.message);
        return;
      }

      const { data: applicationData, error: applicationError } = await supabase
        .from("gig_applications")
        .select(
          `
          id,
          gig_id,
          status,
          created_at,
          gigs (
            title,
            category
          )
        `
        )
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationError) {
        setMessage(applicationError.message);
        return;
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select(
          `
          id,
          gig_id,
          amount_gbp,
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

      if (paymentError) {
        setMessage(paymentError.message);
        return;
      }

      const { data: completionData, error: completionError } = await supabase
        .from("completion_confirmations")
        .select(
          `
          id,
          gig_id,
          poster_confirmed,
          admin_confirmed,
          gigs (
            title,
            category
          )
        `
        )
        .or(`poster_id.eq.${user.id},worker_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (completionError) {
        setMessage(completionError.message);
        return;
      }

      setPostedGigs((gigData ?? []) as PostedGig[]);
      setApplications((applicationData ?? []) as Application[]);
      setPayments((paymentData ?? []) as Payment[]);
      setCompletions((completionData ?? []) as Completion[]);
      setMessage("");
    }

    loadStatus();
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
            <a href="/payments" className="hidden sm:inline hover:underline">
              Payments
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Status overview</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            See where everything stands.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Track your posted gigs, applications, completion confirmations, and
            payment statuses from one place.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
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

        {!message && (
          <div className="grid gap-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Posted gigs</h2>
                <a href="/posted-gigs" className="text-sm font-semibold text-[#2f6f3e]">
                  View posted gigs
                </a>
              </div>

              {postedGigs.length === 0 ? (
                <p className="mt-4 text-[#42513c]">No posted gigs yet.</p>
              ) : (
                <div className="mt-5 grid gap-3">
                  {postedGigs.map((gig) => (
                    <div
                      key={gig.id}
                      className="rounded-2xl border border-black/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{gig.title}</h3>
                          <p className="text-sm text-[#42513c]">{gig.category}</p>
                        </div>
                        <StatusPill label={formatStatus(gig.status)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Applications</h2>
                <a href="/applications" className="text-sm font-semibold text-[#2f6f3e]">
                  View applications
                </a>
              </div>

              {applications.length === 0 ? (
                <p className="mt-4 text-[#42513c]">No applications yet.</p>
              ) : (
                <div className="mt-5 grid gap-3">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-2xl border border-black/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold">
                            {application.gigs?.title ?? "Unknown gig"}
                          </h3>
                          <p className="text-sm text-[#42513c]">
                            {application.gigs?.category ?? "Gig"}
                          </p>
                        </div>
                        <StatusPill label={formatStatus(application.status)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Completion</h2>
                <a href="/completions" className="text-sm font-semibold text-[#2f6f3e]">
                  View completions
                </a>
              </div>

              {completions.length === 0 ? (
                <p className="mt-4 text-[#42513c]">
                  No completion confirmations yet.
                </p>
              ) : (
                <div className="mt-5 grid gap-3">
                  {completions.map((completion) => (
                    <div
                      key={completion.id}
                      className="rounded-2xl border border-black/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold">
                            {completion.gigs?.title ?? "Unknown gig"}
                          </h3>
                          <p className="text-sm text-[#42513c]">
                            Poster:{" "}
                            {completion.poster_confirmed ? "confirmed" : "waiting"} ·
                            Admin:{" "}
                            {completion.admin_confirmed ? "confirmed" : "waiting"}
                          </p>
                        </div>
                        <StatusPill
                          label={
                            completion.admin_confirmed
                              ? "Admin Confirmed"
                              : completion.poster_confirmed
                                ? "Waiting Admin"
                                : "Waiting Poster"
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Payments</h2>
                <a href="/payments" className="text-sm font-semibold text-[#2f6f3e]">
                  View payments
                </a>
              </div>

              {payments.length === 0 ? (
                <p className="mt-4 text-[#42513c]">No payments yet.</p>
              ) : (
                <div className="mt-5 grid gap-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-black/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold">
                            {payment.gigs?.title ?? "Unknown gig"}
                          </h3>
                          <p className="text-sm text-[#42513c]">
                            Held £{payment.amount_gbp} · Worker payout £
                            {payment.worker_payout_amount_gbp}
                          </p>
                        </div>
                        <StatusPill label={formatStatus(payment.status)} />
                      </div>
                    </div>
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
