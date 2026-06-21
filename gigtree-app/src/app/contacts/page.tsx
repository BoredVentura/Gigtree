"use client";
import { SiteHeader } from "@/components/site-header";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contact = {
  id: string;
  gig_id: string;
  poster_id: string;
  worker_id: string;
  masked_email: string | null;
  masked_phone: string | null;
  expires_at: string | null;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    description: string;
    location_area: string | null;
    schedule_summary: string | null;
  } | null;
};

function daysUntil(dateString: string | null) {
  if (!dateString) return null;

  const now = new Date();
  const expiry = new Date(dateString);
  const diff = expiry.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function contactInfo(contact: Contact, userId: string) {
  const daysLeft = daysUntil(contact.expires_at);
  const isPoster = contact.poster_id === userId;
  const role = isPoster ? "Poster" : "Worker";

  if (daysLeft !== null && daysLeft <= 0) {
    return {
      role,
      label: "Expired",
      description:
        "This temporary contact window has expired.",
      nextStep:
        "Use dashboard or admin support if something still needs resolving.",
    };
  }

  return {
    role,
    label: "Contact open",
    description:
      "Temporary contact details are available for coordinating this gig.",
    nextStep:
      isPoster
        ? "Coordinate the work, then confirm completion once finished."
        : "Coordinate the work, complete the gig, then watch for completion and payout steps.",
  };
}

export default function ContactsPage() {
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("Loading contact details...");

  async function loadContacts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view contact details.");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("masked_contacts")
      .select(
        `
        id,
        gig_id,
        poster_id,
        worker_id,
        masked_email,
        masked_phone,
        expires_at,
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

    setContacts((data ?? []) as Contact[]);
    setMessage("");
  }

  useEffect(() => {
    loadContacts();
  }, []);

  const activeContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const daysLeft = daysUntil(contact.expires_at);
      return daysLeft === null || daysLeft > 0;
    });
  }, [contacts]);

  const expiredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const daysLeft = daysUntil(contact.expires_at);
      return daysLeft !== null && daysLeft <= 0;
    });
  }, [contacts]);

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="dashboard" />

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Contact details</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Coordinate accepted gigs safely.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Contact details open only after the poster selects a worker and
              the worker accepts. Keep communication focused on the agreed gig.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Temporary contact</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                1. Contact opens after worker acceptance.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                2. Use it only to coordinate the agreed gig.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                3. Confirm completion when the work is done.
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
            <h2 className="text-3xl font-black">No open contacts yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
              Contact details appear here after a poster selects a candidate and
              the worker accepts the gig.
            </p>

            <a
              href="/dashboard"
              className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
            >
              Back to dashboard
            </a>
          </div>
        )}

        {userId && contacts.length > 0 && (
          <div className="grid gap-8 pb-16">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Active contacts</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {activeContacts.length} active
                </span>
              </div>

              {activeContacts.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No active contacts right now.
                </div>
              ) : (
                <div className="grid gap-5">
                  {activeContacts.map((contact) => {
                    const info = contactInfo(contact, userId);
                    const daysLeft = daysUntil(contact.expires_at);

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
                                You are: {info.role}
                              </span>
                              {daysLeft !== null && (
                                <span className="rounded-full bg-[#fff7e8] px-3 py-1 font-semibold text-[#42513c]">
                                  {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                                </span>
                              )}
                            </div>

                            <h3 className="text-2xl font-black">
                              {contact.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-3 line-clamp-3 leading-7 text-[#42513c]">
                              {contact.gigs?.description ?? "Gig details unavailable."}
                            </p>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-2">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Email
                                </span>
                                {contact.masked_email ?? "Not provided"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Phone
                                </span>
                                {contact.masked_phone ?? "Not provided"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Location
                                </span>
                                {contact.gigs?.location_area ?? "Remote / not set"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Timing
                                </span>
                                {contact.gigs?.schedule_summary ?? "Flexible"}
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
                            {contact.poster_id === userId && (
                              <a
                                href="/completions"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                Confirm completion
                              </a>
                            )}

                            <a
                              href="/payments"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              Payments
                            </a>

                            <a
                              href={`/gigs/${contact.gig_id}`}
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
                <h2 className="text-3xl font-black">Expired contacts</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {expiredContacts.length} expired
                </span>
              </div>

              {expiredContacts.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No expired contacts yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {expiredContacts.map((contact) => {
                    const info = contactInfo(contact, userId);

                    return (
                      <article
                        key={contact.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                Expired
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                You were: {info.role}
                              </span>
                            </div>

                            <h3 className="text-xl font-black">
                              {contact.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              {info.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                            <a
                              href="/dashboard"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              Dashboard
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
