"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RequestRow = {
  id: string;
  reason: string | null;
  status: string;
  created_at: string;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function statusInfo(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "Pending review",
        description: "Admin has not reviewed your poster access request yet.",
        nextStep: "Wait for admin approval before posting gigs.",
      };
    case "approved":
      return {
        label: "Approved",
        description: "You can now post gigs on Gigtree.",
        nextStep: "Go to Post a gig and create your first listing.",
      };
    case "rejected":
      return {
        label: "Not approved",
        description: "Your request was not approved at this time.",
        nextStep: "Contact Gigtree if you think this needs another review.",
      };
    default:
      return {
        label: formatStatus(status),
        description: "Your request has an updated status.",
        nextStep: "Check your dashboard for next steps.",
      };
  }
}

export default function PostRequestPage() {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState("Loading poster access...");
  const [saving, setSaving] = useState(false);

  async function loadRequests() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to request poster access.");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("poster_access_requests")
      .select("id,reason,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRequests((data ?? []) as RequestRow[]);
    setMessage("");
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    if (!reason.trim()) {
      setMessage("Please tell us what kind of gigs you want to post.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("poster_access_requests").insert({
      user_id: userId,
      reason,
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setReason("");
    await loadRequests();
    setMessage("Poster access request sent for admin review.");
    setSaving(false);
  }

  const latestRequest = requests[0];
  const latestInfo = latestRequest ? statusInfo(latestRequest.status) : null;

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
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
              <a href="/posted-gigs" className="rounded-full px-4 py-2 hover:bg-white">
                Posted gigs
              </a>
              <a href="/gigs" className="rounded-full px-4 py-2 hover:bg-white">
                Browse gigs
              </a>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2f6f3e] shadow-sm ring-1 ring-black/10">
                Poster access is admin-approved
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Want to post gigs?
                <span className="block text-[#2f6f3e]">
                  Request access first.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#42513c]">
                Gigtree reviews posters before they can publish gigs. This helps
                protect workers, reduce spam, and keep the marketplace trusted.
              </p>

              <div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Reviewed</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Admin checks poster requests.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Safer</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Fewer low-quality listings.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Clear</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Workers know gigs are checked.
                  </p>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <div className="rounded-[1.5rem] bg-[#142014] p-6 text-white">
                <p className="font-semibold text-[#b9f36b]">
                  Latest request
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {latestInfo ? latestInfo.label : "No request yet"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {latestInfo
                    ? latestInfo.description
                    : "Submit a request to start posting gigs."}
                </p>
              </div>

              {latestInfo && (
                <div className="mt-5 rounded-2xl bg-[#e8f0e4] p-4">
                  <p className="font-semibold text-[#2f6f3e]">Next step</p>
                  <p className="mt-2 text-sm text-[#42513c]">
                    {latestInfo.nextStep}
                  </p>
                </div>
              )}

              {latestRequest?.status === "approved" && (
                <a
                  href="/post-gig"
                  className="mt-5 block rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                >
                  Post a gig
                </a>
              )}
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

          {userId && latestRequest?.status !== "approved" && (
            <section className="grid gap-8 pb-16 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={submitRequest}
                className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
              >
                <p className="font-semibold text-[#2f6f3e]">Request form</p>
                <h2 className="mt-2 text-3xl font-black">
                  Tell us what you want to post.
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  Include the types of gigs, whether they are local or remote,
                  expected budget range, and why you want to use Gigtree.
                </p>

                <label className="mt-6 block">
                  <span className="text-sm font-semibold">
                    What kind of gigs do you want to post?
                  </span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 min-h-44 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Example: I need occasional local event helpers and remote admin support. Gigs will usually be £60–£150..."
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 disabled:opacity-50"
                >
                  {saving ? "Sending..." : "Send access request"}
                </button>
              </form>

              <aside className="grid h-fit gap-5">
                <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                  <p className="font-semibold text-[#b9f36b]">
                    What admin checks
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    Quality and trust.
                  </h2>
                  <p className="mt-4 leading-7 text-white/70">
                    Admin checks whether your planned gigs are suitable for
                    Gigtree and safe for workers.
                  </p>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                  <h2 className="text-2xl font-black">Good requests mention</h2>
                  <div className="mt-4 grid gap-3 text-sm text-[#42513c]">
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      The type of work you want done.
                    </p>
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      Whether it is local, remote, or both.
                    </p>
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      Approximate budget and timing.
                    </p>
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      Any safety or trust details.
                    </p>
                  </div>
                </div>
              </aside>
            </section>
          )}

          {requests.length > 0 && (
            <section className="pb-16">
              <h2 className="text-3xl font-black">Request history</h2>

              <div className="mt-5 grid gap-4">
                {requests.map((request) => {
                  const info = statusInfo(request.status);

                  return (
                    <article
                      key={request.id}
                      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              {info.label}
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap text-[#42513c]">
                            {request.reason}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c] md:w-64">
                          <p className="font-semibold text-[#142014]">
                            Next step
                          </p>
                          <p className="mt-2">{info.nextStep}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
