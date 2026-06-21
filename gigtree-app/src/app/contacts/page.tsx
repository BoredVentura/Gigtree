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
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a href="/gigs" className="hidden sm:inline hover:underline">
              Browse gigs
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
          </div>
        )}

        <div className="grid gap-5">
          {contacts.map((contact) => (
            <article
              key={contact.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                  {contact.gigs?.category ?? "Gig"}
                </span>
                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                  Expires {new Date(contact.expires_at).toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-2xl font-bold">
                {contact.gigs?.title ?? "Unknown gig"}
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
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

              <div className="mt-5 rounded-2xl bg-[#e8f0e4] p-4 text-sm text-[#42513c]">
                These contact details are temporary and should expire after the
                gig contact period.
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
