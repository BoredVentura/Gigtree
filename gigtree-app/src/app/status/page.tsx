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

function applicationStep(status: string) {
  if (status === "submitted") return "Application submitted";
  if (status === "under_review") return "Admin reviewing";
  if (status === "recommended") return "Recommended to poster";
  if (status === "selected_by_poster") return "Selected by poster";
  if (status === "accepted_by_worker") return "Worker accepted";
  if (status === "declined_by_worker") return "Worker declined";
  if (status === "not_recommended") return "Not recommended";
  return formatStatus(status);
}

function paymentStep(status: string) {
  if (status === "held") return "Payment held";
  if (status === "pending_admin_confirmation") return "Waiting admin completion review";
  if (status === "pending_worker_verification") return "Waiting worker verification";
  if (status === "ready_for_release") return "Ready for release";
  if (status === "released") return "Released";
  return formatStatus(status);
}

function TimelineItem({
  title,
  subtitle,
  status,
  href,
  action,
}: {
  title: string;
  subtitle: string;
  status: string;
  href: string;
  action: string;
}) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-5 md:flex-row">
        <div>
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
              {status}
            </span>
          </div>
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="mt-3 text-[#42513c]">{subtitle}</p>
        </div>

        <div className="flex shrink-0 flex-col justify-center">
          <a
            href={href}
            className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
          >
            {action}
          </a>
        </div>
      </div>
    </article>
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

  const totalItems =
    postedGigs.length + applications.length + payments.length + completions.length;

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
            <a href="/applications" className="hover:underline">
              Applications
            </a>
            <a href="/posted-gigs" className="hover:underline">
              Posted gigs
            </a>
            <a href="/payments" className="hover:underline">
              Payments
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Status overview</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Your Gigtree timeline.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            See posted gigs, applications, completions, and payments in one
            simple timeline.
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

        {!message && totalItems === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No activity yet</h2>
            <p className="mt-3 text-[#42513c]">
              Your timeline will show applications, posted gigs, completion
              confirmations, and payments once you start using Gigtree.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/gigs"
                className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
              >
                Browse gigs
              </a>
              <a
                href="/post-gig"
                className="rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
              >
                Post a gig
              </a>
            </div>
          </div>
        )}

        {!message && totalItems > 0 && (
          <div className="grid gap-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Worker timeline</h2>
                <a href="/applications" className="font-semibold text-[#2f6f3e] hover:underline">
                  View applications
                </a>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  You have not applied for any gigs yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {applications.map((application) => (
                    <TimelineItem
                      key={application.id}
                      title={application.gigs?.title ?? "Unknown gig"}
                      subtitle={`Worker application · ${application.gigs?.category ?? "Gig"} · Applied ${new Date(application.created_at).toLocaleDateString()}`}
                      status={applicationStep(application.status)}
                      href={
                        application.status === "selected_by_poster"
                          ? "/confirmations"
                          : application.status === "accepted_by_worker"
                            ? "/contacts"
                            : `/gigs/${application.gig_id}`
                      }
                      action={
                        application.status === "selected_by_poster"
                          ? "Confirm selection"
                          : application.status === "accepted_by_worker"
                            ? "View contacts"
                            : "View gig"
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Poster timeline</h2>
                <a href="/posted-gigs" className="font-semibold text-[#2f6f3e] hover:underline">
                  View posted gigs
                </a>
              </div>

              {postedGigs.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  You have not posted any gigs yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {postedGigs.map((gig) => (
                    <TimelineItem
                      key={gig.id}
                      title={gig.title}
                      subtitle={`Posted gig · ${gig.category} · Posted ${new Date(gig.created_at).toLocaleDateString()}`}
                      status={`Gig ${formatStatus(gig.status)}`}
                      href={`/posted-gigs/${gig.id}/recommendations`}
                      action="View recommendations"
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Completion timeline</h2>
                <a href="/completions" className="font-semibold text-[#2f6f3e] hover:underline">
                  View completions
                </a>
              </div>

              {completions.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No completion confirmations yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {completions.map((completion) => (
                    <TimelineItem
                      key={completion.id}
                      title={completion.gigs?.title ?? "Unknown gig"}
                      subtitle={`Completion · ${completion.gigs?.category ?? "Gig"}`}
                      status={
                        completion.admin_confirmed
                          ? "Admin confirmed"
                          : completion.poster_confirmed
                            ? "Waiting admin review"
                            : "Waiting poster confirmation"
                      }
                      href="/completions"
                      action="View completion"
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Payment timeline</h2>
                <a href="/payments" className="font-semibold text-[#2f6f3e] hover:underline">
                  View payments
                </a>
              </div>

              {payments.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No payments yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {payments.map((payment) => (
                    <TimelineItem
                      key={payment.id}
                      title={payment.gigs?.title ?? "Unknown gig"}
                      subtitle={`Held £${payment.amount_gbp} · Worker payout £${payment.worker_payout_amount_gbp}`}
                      status={paymentStep(payment.status)}
                      href="/payments"
                      action="View payment"
                    />
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
