"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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

type Gig = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

type Contact = {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string;
  expires_at: string | null;
  gigs: {
    title: string;
  } | null;
};

type Completion = {
  id: string;
  gig_id: string;
  poster_confirmed: boolean;
  admin_confirmed: boolean;
  gigs: {
    title: string;
  } | null;
};

type Payment = {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string | null;
  status: string;
  amount_gbp: number;
  worker_payout_amount_gbp: number;
  gigs: {
    title: string;
  } | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function applicationStage(status: string) {
  switch (status) {
    case "submitted":
      return "Application submitted";
    case "under_review":
      return "Admin review";
    case "recommended":
      return "Recommended to poster";
    case "selected_by_poster":
      return "Selected by poster";
    case "accepted_by_worker":
      return "Worker accepted";
    case "declined_by_worker":
      return "Worker declined";
    case "not_recommended":
      return "Not recommended";
    default:
      return formatStatus(status);
  }
}

function paymentStage(status: string) {
  switch (status) {
    case "held":
      return "Payment held";
    case "pending_admin_confirmation":
      return "Waiting for admin completion review";
    case "pending_worker_verification":
      return "Waiting for worker verification";
    case "ready_for_release":
      return "Ready for payout release";
    case "released":
      return "Released";
    default:
      return formatStatus(status);
  }
}

export default function StatusPage() {
  const [userId, setUserId] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [postedGigs, setPostedGigs] = useState<Gig[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("Loading your status timeline...");

  async function loadStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view your status timeline.");
      return;
    }

    setUserId(user.id);

    const [
      applicationResult,
      gigResult,
      contactResult,
      completionResult,
      paymentResult,
    ] = await Promise.all([
      supabase
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
        .order("created_at", { ascending: false }),
      supabase
        .from("gigs")
        .select("id,title,category,status,created_at")
        .eq("poster_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("masked_contacts")
        .select(
          `
          id,
          gig_id,
          poster_id,
          worker_id,
          expires_at,
          gigs (
            title
          )
        `
        )
        .or(`poster_id.eq.${user.id},worker_id.eq.${user.id}`),
      supabase
        .from("completion_confirmations")
        .select(
          `
          id,
          gig_id,
          poster_confirmed,
          admin_confirmed,
          gigs (
            title
          )
        `
        )
        .or(`poster_id.eq.${user.id},worker_id.eq.${user.id}`),
      supabase
        .from("payments")
        .select(
          `
          id,
          gig_id,
          poster_id,
          worker_id,
          status,
          amount_gbp,
          worker_payout_amount_gbp,
          gigs (
            title
          )
        `
        )
        .or(`poster_id.eq.${user.id},worker_id.eq.${user.id}`),
    ]);

    if (applicationResult.error) {
      setMessage(applicationResult.error.message);
      return;
    }

    if (gigResult.error) {
      setMessage(gigResult.error.message);
      return;
    }

    if (contactResult.error) {
      setMessage(contactResult.error.message);
      return;
    }

    if (completionResult.error) {
      setMessage(completionResult.error.message);
      return;
    }

    if (paymentResult.error) {
      setMessage(paymentResult.error.message);
      return;
    }

    setApplications((applicationResult.data ?? []) as Application[]);
    setPostedGigs((gigResult.data ?? []) as Gig[]);
    setContacts((contactResult.data ?? []) as Contact[]);
    setCompletions((completionResult.data ?? []) as Completion[]);
    setPayments((paymentResult.data ?? []) as Payment[]);
    setMessage("");
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const openApplications = useMemo(() => {
    return applications.filter(
      (application) =>
        !["not_recommended", "declined_by_worker", "cancelled_by_admin"].includes(
          application.status
        )
    );
  }, [applications]);

  const activePayments = useMemo(() => {
    return payments.filter((payment) => payment.status !== "released");
  }, [payments]);

  const timelineItems = [
    {
      title: "Worker applications",
      count: applications.length,
      description: "Gigs you applied to as a worker.",
      href: "/applications",
    },
    {
      title: "Posted gigs",
      count: postedGigs.length,
      description: "Gigs you created as a poster.",
      href: "/posted-gigs",
    },
    {
      title: "Open contacts",
      count: contacts.length,
      description: "Accepted gigs where contact can open.",
      href: "/contacts",
    },
    {
      title: "Completions",
      count: completions.length,
      description: "Completion confirmations linked to you.",
      href: "/completions",
    },
    {
      title: "Payments",
      count: payments.length,
      description: "Held, pending, ready, or released payment records.",
      href: "/payments",
    },
  ];

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
            <a href="/applications" className="rounded-full px-4 py-2 hover:bg-white">
              Applications
            </a>
            <a href="/payments" className="rounded-full px-4 py-2 hover:bg-white">
              Payments
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Status timeline</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              See where everything stands.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Track your worker applications, posted gigs, contact windows,
              completion confirmations, and payment stages in one place.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Quick status</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {openApplications.length}
                </span>
                Open worker applications
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {contacts.length}
                </span>
                Contact records
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {activePayments.length}
                </span>
                Active payments
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

        {userId && !message && (
          <div className="grid gap-8 pb-16">
            <section className="grid gap-5 md:grid-cols-5">
              {timelineItems.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
                >
                  <p className="text-sm font-semibold text-[#42513c]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-3xl font-black">{item.count}</p>
                  <p className="mt-2 text-sm leading-6 text-[#42513c]">
                    {item.description}
                  </p>
                </a>
              ))}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Worker timeline</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {applications.length} application
                  {applications.length === 1 ? "" : "s"}
                </span>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  You have not applied for any gigs yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {applications.map((application) => (
                    <article
                      key={application.id}
                      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              {applicationStage(application.status)}
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                              {application.gigs?.category ?? "Gig"}
                            </span>
                          </div>

                          <h3 className="text-xl font-black">
                            {application.gigs?.title ?? "Unknown gig"}
                          </h3>

                          <p className="mt-2 text-[#42513c]">
                            Current application status:{" "}
                            {formatStatus(application.status)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          <a
                            href="/applications"
                            className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                          >
                            Applications
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Poster timeline</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {postedGigs.length} posted
                </span>
              </div>

              {postedGigs.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  You have not posted any gigs yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {postedGigs.map((gig) => (
                    <article
                      key={gig.id}
                      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              {formatStatus(gig.status)}
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                              {gig.category}
                            </span>
                          </div>

                          <h3 className="text-xl font-black">{gig.title}</h3>

                          <p className="mt-2 text-[#42513c]">
                            Posted on {new Date(gig.created_at).toLocaleDateString()}.
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          <a
                            href="/posted-gigs"
                            className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                          >
                            Posted gigs
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Payment timeline</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {payments.length} payment
                  {payments.length === 1 ? "" : "s"}
                </span>
              </div>

              {payments.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No payment records yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {payments.map((payment) => (
                    <article
                      key={payment.id}
                      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              {paymentStage(payment.status)}
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                              £{payment.worker_payout_amount_gbp} worker payout
                            </span>
                          </div>

                          <h3 className="text-xl font-black">
                            {payment.gigs?.title ?? "Unknown gig"}
                          </h3>

                          <p className="mt-2 text-[#42513c]">
                            Total amount: £{payment.amount_gbp}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          <a
                            href="/payments"
                            className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                          >
                            Payments
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
