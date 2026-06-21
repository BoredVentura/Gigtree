"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MaskedContact = {
  id: string;
  gig_id: string;
  worker_id: string;
  poster_id: string;
  masked_email: string | null;
  masked_phone: string | null;
  expires_at: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
    schedule_summary: string | null;
  } | null;
};

function daysUntil(dateString: string) {
  const now = new Date();
  const expiry = new Date(dateString);
  const difference = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<MaskedContact[]>([]);
  const [message, setMessage] = useState("Loading contact details...");

  useEffect(() => {
    async function loadContacts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view contact details.");
        return;
      }

      const { data, error } = await supabase
        .from("masked_contacts")
        .select(
          `
          id,
          gig_id,
          worker_id,
          poster_id,
          masked_email,
          masked_phone,
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
        .or(`worker_id.eq.${user.id},poster_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      setContacts((data ?? []) as MaskedContact[]);
      setMessage("");
    }

    loadContacts();
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
            <a href="/payments" className="hover:underline">
              Payments
            </a>
            <a href="/completions" className="hover:underline">
              Completions
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Masked contacts</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Temporary contact details.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Contact details are only shown after the poster selects a candidate
            and the worker confirms they still accept the gig.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-[#2f6f3e]/20 bg-[#e8f0e4] p-6 shadow-sm">
          <h2 className="text-2xl font-bold">How contact works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">1. Masked first</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Gigtree shows temporary contact details instead of exposing
                direct personal details too early.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">2. Use for this gig only</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Contact should only be used to arrange the selected gig.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">3. Expires after the contact period</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Temporary contact details are designed to expire after the gig
                contact period.
              </p>
            </div>
          </div>
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

        {!message && contacts.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No contact details available</h2>
            <p className="mt-3 text-[#42513c]">
              Contact details will appear here after a worker accepts a selected
              gig.
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
          {contacts.map((contact) => {
            const daysLeft = daysUntil(contact.expires_at);

            return (
              <article
                key={contact.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                    {contact.gigs?.category ?? "Gig"}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                    Expires {new Date(contact.expires_at).toLocaleDateString()}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                    {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                  </span>
                </div>

                <h2 className="text-2xl font-bold">
                  {contact.gigs?.title ?? "Unknown gig"}
                </h2>

                <div className="mt-4 grid gap-3 text-sm text-[#42513c] sm:grid-cols-2">
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    <span className="block font-semibold text-[#172014]">
                      Location
                    </span>
                    {contact.gigs?.location_area ?? "Remote UK"}
                  </p>

                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    <span className="block font-semibold text-[#172014]">
                      Timing
                    </span>
                    {contact.gigs?.schedule_summary ?? "Flexible"}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Masked email
                    </p>
                    <p className="mt-1 break-all text-lg font-bold">
                      {contact.masked_email ?? "Not available"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Masked phone
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {contact.masked_phone ?? "Not available"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#2f6f3e]/20 bg-[#e8f0e4] p-4 text-sm text-[#42513c]">
                  Use these details only for this selected gig. If the work is
                  complete, the poster should confirm completion so payment can
                  move through Gigtree’s review and release process.
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="/completions"
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
                  >
                    Confirm completion
                  </a>
                  <a
                    href="/payments"
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
                  >
                    View payments
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
