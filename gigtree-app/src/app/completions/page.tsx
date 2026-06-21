"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contact = {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string;
  expires_at: string | null;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
    schedule_summary: string | null;
  } | null;
};

type Completion = {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string;
  payment_id: string | null;
  poster_confirmed: boolean;
  poster_confirmed_at: string | null;
  admin_confirmed: boolean;
  admin_confirmed_at: string | null;
  admin_notes: string | null;
};

type Payment = {
  id: string;
  gig_id: string;
  status: string;
  amount_gbp: number;
  worker_payout_amount_gbp: number;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function completionInfo(completion?: Completion) {
  if (!completion) {
    return {
      label: "Not confirmed",
      description: "You have not confirmed this gig as complete yet.",
      nextStep: "Only confirm once the agreed work has been completed.",
    };
  }

  if (completion.admin_confirmed) {
    return {
      label: "Admin confirmed",
      description: "Admin has reviewed and confirmed this completion.",
      nextStep: "Payment can continue through worker verification and payout release.",
    };
  }

  if (completion.poster_confirmed) {
    return {
      label: "Waiting for admin",
      description: "You confirmed completion. Admin now needs to review it.",
      nextStep: "No further poster action is needed unless admin contacts you.",
    };
  }

  return {
    label: "Not confirmed",
    description: "You have not confirmed this gig as complete yet.",
    nextStep: "Only confirm once the agreed work has been completed.",
  };
}

export default function CompletionsPage() {
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("Loading completion confirmations...");
  const [loadingId, setLoadingId] = useState("");

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to confirm completed gigs.");
      return;
    }

    setUserId(user.id);

    const { data: contactData, error: contactError } = await supabase
      .from("masked_contacts")
      .select(
        `
        id,
        gig_id,
        poster_id,
        worker_id,
        expires_at,
        created_at,
        gigs (
          title,
          category,
          location_area,
          schedule_summary
        )
      `
      )
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false });

    if (contactError) {
      setMessage(contactError.message);
      return;
    }

    const { data: completionData, error: completionError } = await supabase
      .from("completion_confirmations")
      .select(
        "id,gig_id,poster_id,worker_id,payment_id,poster_confirmed,poster_confirmed_at,admin_confirmed,admin_confirmed_at,admin_notes"
      )
      .eq("poster_id", user.id);

    if (completionError) {
      setMessage(completionError.message);
      return;
    }

    const gigIds = (contactData ?? []).map((contact) => contact.gig_id);

    let paymentData: Payment[] = [];

    if (gigIds.length > 0) {
      const { data: loadedPayments, error: paymentError } = await supabase
        .from("payments")
        .select("id,gig_id,status,amount_gbp,worker_payout_amount_gbp")
        .in("gig_id", gigIds);

      if (paymentError) {
        setMessage(paymentError.message);
        return;
      }

      paymentData = (loadedPayments ?? []) as Payment[];
    }

    setContacts((contactData ?? []) as Contact[]);
    setCompletions((completionData ?? []) as Completion[]);
    setPayments(paymentData);
    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  const completionByGig = useMemo(() => {
    const map = new Map<string, Completion>();

    for (const completion of completions) {
      map.set(completion.gig_id, completion);
    }

    return map;
  }, [completions]);

  const paymentByGig = useMemo(() => {
    const map = new Map<string, Payment>();

    for (const payment of payments) {
      map.set(payment.gig_id, payment);
    }

    return map;
  }, [payments]);

  async function confirmCompletion(contact: Contact) {
    const confirmed = window.confirm(
      "Confirm this gig is complete?\n\nOnly continue if the agreed work has been completed."
    );

    if (!confirmed) return;

    setLoadingId(contact.id);
    setMessage("");

    const payment = paymentByGig.get(contact.gig_id);
    const existingCompletion = completionByGig.get(contact.gig_id);

    if (existingCompletion) {
      const { error } = await supabase
        .from("completion_confirmations")
        .update({
          poster_confirmed: true,
          poster_confirmed_at: new Date().toISOString(),
          payment_id: payment?.id ?? existingCompletion.payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCompletion.id);

      if (error) {
        setMessage(error.message);
        setLoadingId("");
        return;
      }
    } else {
      const { error } = await supabase.from("completion_confirmations").insert({
        gig_id: contact.gig_id,
        poster_id: userId,
        worker_id: contact.worker_id,
        payment_id: payment?.id ?? null,
        poster_confirmed: true,
        poster_confirmed_at: new Date().toISOString(),
        admin_confirmed: false,
      });

      if (error) {
        setMessage(error.message);
        setLoadingId("");
        return;
      }
    }

    if (payment?.id) {
      await supabase
        .from("payments")
        .update({
          status: "pending_admin_confirmation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("status", "held");
    }

    await loadData();
    setMessage("Completion confirmed. Admin will review it next.");
    setLoadingId("");
  }

  const pendingContacts = contacts.filter((contact) => {
    const completion = completionByGig.get(contact.gig_id);
    return !completion?.poster_confirmed;
  });

  const confirmedContacts = contacts.filter((contact) => {
    const completion = completionByGig.get(contact.gig_id);
    return completion?.poster_confirmed;
  });

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
            <a href="/contacts" className="rounded-full px-4 py-2 hover:bg-white">
              Contacts
            </a>
            <a href="/payments" className="rounded-full px-4 py-2 hover:bg-white">
              Payments
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Completion confirmation</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Confirm completed gigs.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              When the agreed work is finished, confirm completion so admin can
              review it and move the payment toward worker verification and
              payout release.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">How it works</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                1. Confirm only after the work is complete.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                2. Admin reviews the completion.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                3. Payment moves through verification and payout release.
              </p>
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

        {userId && contacts.length === 0 && !message && (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">No gigs to confirm yet</h2>
            <p className="mt-3 text-[#42513c]">
              Completion confirmations appear here after a worker has accepted
              and contact has been opened.
            </p>
            <a
              href="/posted-gigs"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              View posted gigs
            </a>
          </div>
        )}

        {userId && contacts.length > 0 && (
          <div className="grid gap-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Ready for poster confirmation</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {pendingContacts.length} pending
                </span>
              </div>

              {pendingContacts.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No gigs currently need poster completion confirmation.
                </div>
              ) : (
                <div className="grid gap-5">
                  {pendingContacts.map((contact) => {
                    const payment = paymentByGig.get(contact.gig_id);
                    const completion = completionByGig.get(contact.gig_id);
                    const info = completionInfo(completion);

                    return (
                      <article
                        key={contact.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {contact.gigs?.category ?? "Gig"}
                              </span>
                              {payment?.status && (
                                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                  Payment: {formatStatus(payment.status)}
                                </span>
                              )}
                            </div>

                            <h3 className="text-2xl font-black">
                              {contact.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Location
                                </span>
                                {contact.gigs?.location_area ?? "Remote UK"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Timing
                                </span>
                                {contact.gigs?.schedule_summary ?? "Flexible"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Worker payout
                                </span>
                                £{payment?.worker_payout_amount_gbp ?? "0"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {info.nextStep}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            <button
                              type="button"
                              disabled={loadingId === contact.id}
                              onClick={() => confirmCompletion(contact)}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              {loadingId === contact.id
                                ? "Confirming..."
                                : "Confirm complete"}
                            </button>

                            <a
                              href="/contacts"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              View contact
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
                <h2 className="text-3xl font-black">Already confirmed</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {confirmedContacts.length} confirmed
                </span>
              </div>

              {confirmedContacts.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No confirmed completions yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {confirmedContacts.map((contact) => {
                    const completion = completionByGig.get(contact.gig_id);
                    const payment = paymentByGig.get(contact.gig_id);
                    const info = completionInfo(completion);

                    return (
                      <article
                        key={contact.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              {payment?.status && (
                                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                  Payment: {formatStatus(payment.status)}
                                </span>
                              )}
                            </div>

                            <h3 className="text-xl font-black">
                              {contact.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              {info.description}
                            </p>

                            {completion?.admin_notes && (
                              <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4 text-[#42513c]">
                                <p className="font-semibold text-[#142014]">
                                  Admin notes
                                </p>
                                <p className="mt-2 whitespace-pre-wrap">
                                  {completion.admin_notes}
                                </p>
                              </div>
                            )}
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
