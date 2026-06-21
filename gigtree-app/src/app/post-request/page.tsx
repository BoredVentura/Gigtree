"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PostRequestPage() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [reasonForPosting, setReasonForPosting] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitRequest() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in before requesting posting access.");
      setLoading(false);
      return;
    }

    if (!contactName.trim() || !contactEmail.trim()) {
      setMessage("Please enter your contact name and email.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("poster_access_requests").insert({
      user_id: user.id,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      reason_for_posting: reasonForPosting,
      status: "pending",
    });

    if (error) {
      console.error("Poster access request error:", error);
      setMessage(`Could not submit request: ${error.message}`);
    } else {
      setMessage("Request submitted. Gigtree will review your posting access request.");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setReasonForPosting("");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-3xl px-6 py-8">
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
          <p className="font-semibold text-[#2f6f3e]">Post a gig request</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Request access to post gigs.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#42513c]">
            Gigtree approves posters before they can publish gigs. Submit your
            details and admin will review your request.
          </p>
        </div>

        <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-semibold">Contact name</label>
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Your name or business contact"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Contact email</label>
            <input
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              type="email"
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Contact phone</label>
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">
              Why do you want to post gigs?
            </label>
            <textarea
              value={reasonForPosting}
              onChange={(event) => setReasonForPosting(event.target.value)}
              className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Briefly describe the types of gigs you want to post"
            />
          </div>

          {message && (
            <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
              {message}
              {message.includes("sign in") && (
                <a
                  href="/login"
                  className="mt-4 block rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                >
                  Sign in
                </a>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={submitRequest}
            disabled={loading}
            className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </section>
    </main>
  );
}
