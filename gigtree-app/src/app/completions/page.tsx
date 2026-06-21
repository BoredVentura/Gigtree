"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contact = {
  id: string;
  gig_id: string;
  worker_id: string;
  poster_id: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
  } | null;
};

type Completion = {
  id: string;
  gig_id: string;
  worker_id: string;
  poster_confirmed: boolean;
  admin_confirmed: boolean;
};

export default function CompletionsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
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

    const { data: contactData, error: contactError } = await supabase
      .from("masked_contacts")
      .select(
        `
        id,
        gig_id,
        worker_id,
        poster_id,
        gigs (
          title,
          category,
          location_area
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
      .select("id,gig_id,worker_id,poster_confirmed,admin_confirmed")
      .eq("poster_id", user.id);

    if (completionError) {
      setMessage(completionError.message);
      return;
    }

    setContacts((contactData ?? []) as Contact[]);
    setCompletions((completionData ?? []) as Completion[]);
    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  function findCompletion(contact: Contact) {
    return completions.find(
      (completion) =>
        completion.gig_id === contact.gig_id &&
        completion.worker_id === contact.worker_id
    );
  }

  async function confirmComplete(contact: Contact) {
    setLoadingId(contact.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in.");
      setLoadingId("");
      return;
    }

    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("gig_id", contact.gig_id)
      .eq("poster_id", contact.poster_id)
      .eq("worker_id", contact.worker_id)
      .maybeSingle();

    const { error } = await supabase
      .from("completion_confirmations")
      .upsert(
        {
          gig_id: contact.gig_id,
          poster_id: contact.poster_id,
          worker_id: contact.worker_id,
          payment_id: payment?.id ?? null,
          poster_confirmed: true,
          poster_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "gig_id,worker_id" }
      );

    if (error) {
      setMessage(error.message);
      setLoadingId("");
      return;
    }

    if (payment?.id) {
      await supabase
        .from("payments")
        .update({
          status: "pending_admin_confirmation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
    }

    await loadData();
    setMessage("Completion confirmed. Waiting for admin confirmation.");
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
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a href="/payments" className="hidden sm:inline hover:underline">
              Payments
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Completion confirmation</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Confirm a gig has been completed.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Posters confirm the job is done first. Gigtree admin then confirms
            before payout can move forward.
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

        {!message && contacts.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No accepted gigs yet</h2>
            <p className="mt-3 text-[#42513c]">
              Completion confirmation appears after a worker accepts and masked
              contact is created.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {contacts.map((contact) => {
            const completion = findCompletion(contact);

            return (
              <article
                key={contact.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                        {contact.gigs?.category ?? "Gig"}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                        {completion?.poster_confirmed
                          ? "Poster confirmed"
                          : "Awaiting poster confirmation"}
                      </span>
                      {completion?.admin_confirmed && (
                        <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                          Admin confirmed
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold">
                      {contact.gigs?.title ?? "Unknown gig"}
                    </h2>
                    <p className="mt-2 text-[#42513c]">
                      {contact.gigs?.location_area ?? "Remote UK"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col justify-center">
                    {completion?.poster_confirmed ? (
                      <div className="rounded-2xl bg-[#e8f0e4] p-4 text-sm font-semibold text-[#2f6f3e]">
                        Completion already confirmed
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={loadingId === contact.id}
                        onClick={() => confirmComplete(contact)}
                        className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {loadingId === contact.id
                          ? "Confirming..."
                          : "Confirm job done"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
