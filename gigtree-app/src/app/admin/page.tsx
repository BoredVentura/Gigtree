"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PosterRequest = {
  id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  reason_for_posting: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<PosterRequest[]>([]);
  const [message, setMessage] = useState("Checking admin access...");
  const [loadingId, setLoadingId] = useState("");

  async function loadAdminData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in as an admin.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      setMessage("You do not have admin access.");
      return;
    }

    setIsAdmin(true);

    const { data, error } = await supabase
      .from("poster_access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRequests((data ?? []) as PosterRequest[]);
    setMessage("");
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function updateRequest(request: PosterRequest, status: "approved" | "rejected") {
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

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status } : item
      )
    );

    setMessage(
      status === "approved"
        ? "Request approved and posting access unlocked."
        : "Request rejected."
    );
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
            <a
              href="/admin/applications"
              className="hidden sm:inline hover:underline"
            >
              Applications
            </a>
            <a
              href="/admin/recommendations"
              className="hidden sm:inline hover:underline"
            >
              Recommendations
            </a>
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a href="/gigs" className="hidden sm:inline hover:underline">
              Browse gigs
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Manage Gigtree access requests.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Review poster requests and unlock posting access for approved users.
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

        {isAdmin && requests.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No requests yet</h2>
            <p className="mt-3 text-[#42513c]">
              Poster access requests will appear here.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                      {request.status}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">{request.contact_name}</h2>
                  <p className="mt-2 text-[#42513c]">{request.contact_email}</p>
                  {request.contact_phone && (
                    <p className="mt-1 text-[#42513c]">{request.contact_phone}</p>
                  )}

                  <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold">Reason for posting</p>
                    <p className="mt-1 text-[#42513c]">
                      {request.reason_for_posting || "No reason provided."}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-row gap-2 md:flex-col md:justify-center">
                  <button
                    type="button"
                    disabled={loadingId === request.id || request.status === "approved"}
                    onClick={() => updateRequest(request, "approved")}
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === request.id || request.status === "rejected"}
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
      </section>
    </main>
  );
}
