"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  is_admin: boolean | null;
};

type AdminCard = {
  title: string;
  description: string;
  href: string;
  action: string;
};

const adminCards: AdminCard[] = [
  {
    title: "Poster access requests",
    description: "Approve or reject users who want permission to post gigs.",
    href: "/admin",
    action: "Review requests",
  },
  {
    title: "Applications",
    description: "Review worker applications and mark them as recommended or unsuitable.",
    href: "/admin/applications",
    action: "Review applications",
  },
  {
    title: "Create recommendations",
    description: "Write anonymous candidate summaries for posters to review.",
    href: "/admin/recommendations",
    action: "Create summaries",
  },
  {
    title: "Completion reviews",
    description: "Confirm completed gigs after posters mark jobs as done.",
    href: "/admin/completions",
    action: "Review completions",
  },
  {
    title: "Verification reviews",
    description: "Review worker verification details and uploaded ID documents.",
    href: "/admin/verification",
    action: "Review verification",
  },
  {
    title: "Payout releases",
    description: "Release payouts once completion and worker verification are approved.",
    href: "/admin/payouts",
    action: "Release payouts",
  },
  {
    title: "User status overview",
    description: "View the regular user status page for testing the end-to-end flow.",
    href: "/status",
    action: "Open status page",
  },
  {
    title: "Payments",
    description: "View held, pending, ready, and released payment records.",
    href: "/payments",
    action: "View payments",
  },
];

type PosterAccessRequest = {
  id: string;
  user_id: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<PosterAccessRequest[]>([]);
  const [message, setMessage] = useState("Loading admin control centre...");
  const [loadingId, setLoadingId] = useState("");

  async function loadAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in as an admin.");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name,is_admin")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    const loadedProfile = profileData as Profile;
    setProfile(loadedProfile);

    if (!loadedProfile.is_admin) {
      setMessage("You do not have admin access.");
      return;
    }

    const { data: requestData, error: requestError } = await supabase
      .from("poster_access_requests")
      .select("id,user_id,reason,status,created_at")
      .order("created_at", { ascending: false });

    if (requestError) {
      setMessage(requestError.message);
      return;
    }

    setRequests((requestData ?? []) as PosterAccessRequest[]);
    setMessage("");
  }

  useEffect(() => {
    loadAdmin();
  }, []);

  async function updateRequest(
    request: PosterAccessRequest,
    status: "approved" | "rejected"
  ) {
    setLoadingId(request.id);
    setMessage("");

    const { error: requestError } = await supabase
      .from("poster_access_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      setMessage(requestError.message);
      setLoadingId("");
      return;
    }

    if (status === "approved") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ can_post_gigs: true })
        .eq("id", request.user_id);

      if (profileError) {
        setMessage(profileError.message);
        setLoadingId("");
        return;
      }
    }

    await loadAdmin();
    setLoadingId("");
  }

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const reviewedRequests = requests.filter((request) => request.status !== "pending");

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
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
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin control centre</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Manage Gigtree operations
            {profile?.full_name ? `, ${profile.full_name}` : ""}.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Review poster access, applications, recommendations, completions,
            verification, payments, and payout release from one place.
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

        {profile?.is_admin && !message && (
          <>
            <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {adminCards.map((card) => (
                <a
                  key={card.href + card.title}
                  href={card.href}
                  className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h2 className="text-xl font-bold">{card.title}</h2>
                  <p className="mt-3 min-h-20 text-sm leading-6 text-[#42513c]">
                    {card.description}
                  </p>
                  <span className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-4 py-2 text-sm font-semibold text-white">
                    {card.action}
                  </span>
                </a>
              ))}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Poster access requests</h2>
                  <p className="mt-2 text-[#42513c]">
                    Approve users before they can post gigs.
                  </p>
                </div>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {pendingRequests.length} pending
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="mt-6 rounded-2xl bg-[#f6f8f4] p-4 text-[#42513c]">
                  No pending poster access requests.
                </p>
              ) : (
                <div className="mt-6 grid gap-4">
                  {pendingRequests.map((request) => (
                    <article
                      key={request.id}
                      className="rounded-2xl border border-black/10 p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              Pending
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold">
                            User ID: {request.user_id.slice(0, 8)}
                          </h3>

                          <p className="mt-2 whitespace-pre-wrap text-[#42513c]">
                            {request.reason ?? "No reason provided."}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          <button
                            type="button"
                            disabled={loadingId === request.id}
                            onClick={() => updateRequest(request, "approved")}
                            className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === request.id}
                            onClick={() => updateRequest(request, "rejected")}
                            className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {reviewedRequests.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold">Recently reviewed</h3>
                  <div className="mt-4 grid gap-3">
                    {reviewedRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f6f8f4] p-4"
                      >
                        <div>
                          <p className="font-semibold">
                            User ID: {request.user_id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-[#42513c]">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
                          {request.status[0].toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
