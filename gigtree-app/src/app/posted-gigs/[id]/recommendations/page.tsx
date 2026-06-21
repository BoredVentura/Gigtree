"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Recommendation = {
  id: string;
  application_id: string;
  anonymous_label: string;
  summary: string;
  fit_notes: string | null;
  status: "draft" | "sent_to_poster" | "selected" | "declined";
  created_at: string;
  gig_applications: {
    worker_id: string;
  } | null;
};

type Gig = {
  id: string;
  title: string;
  category: string;
  location_area: string | null;
  schedule_summary: string | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PosterRecommendationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [gigId, setGigId] = useState("");
  const [gig, setGig] = useState<Gig | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState("Loading recommendations...");
  const [loadingId, setLoadingId] = useState("");

  async function loadRecommendations() {
    const resolvedParams = await params;
    setGigId(resolvedParams.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view recommendations.");
      return;
    }

    const { data: gigData, error: gigError } = await supabase
      .from("gigs")
      .select("id,title,category,location_area,schedule_summary")
      .eq("id", resolvedParams.id)
      .eq("poster_id", user.id)
      .single();

    if (gigError) {
      setMessage(gigError.message);
      return;
    }

    setGig(gigData as Gig);

    const { data, error } = await supabase
      .from("admin_recommendations")
      .select(
        `
        id,
        application_id,
        anonymous_label,
        summary,
        fit_notes,
        status,
        created_at,
        gig_applications (
          worker_id
        )
      `
      )
      .eq("gig_id", resolvedParams.id)
      .in("status", ["sent_to_poster", "selected", "declined"])
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRecommendations((data ?? []) as Recommendation[]);
    setMessage("");
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function selectCandidate(recommendation: Recommendation) {
    setLoadingId(recommendation.id);
    setMessage("");

    const workerId = recommendation.gig_applications?.worker_id;

    if (!workerId) {
      setMessage("Worker ID could not be found for this recommendation.");
      setLoadingId("");
      return;
    }

    const { error: recommendationError } = await supabase
      .from("admin_recommendations")
      .update({
        status: "selected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recommendation.id);

    if (recommendationError) {
      setMessage(recommendationError.message);
      setLoadingId("");
      return;
    }

    const { error: applicationError } = await supabase
      .from("gig_applications")
      .update({
        status: "selected_by_poster",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recommendation.application_id);

    if (applicationError) {
      setMessage(applicationError.message);
      setLoadingId("");
      return;
    }

    const { error: confirmationError } = await supabase
      .from("worker_acceptance_confirmations")
      .upsert(
        {
          gig_id: gigId,
          application_id: recommendation.application_id,
          worker_id: workerId,
          status: "pending_worker_confirmation",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id" }
      );

    if (confirmationError) {
      setMessage(confirmationError.message);
      setLoadingId("");
      return;
    }

    await loadRecommendations();
    setMessage(
      `${recommendation.anonymous_label} selected. The worker now needs to confirm they still accept the gig.`
    );
    setLoadingId("");
  }

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
            <a href="/posted-gigs" className="hover:underline">
              My posted gigs
            </a>
            <a href="/contacts" className="hover:underline">
              Contacts
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Anonymous recommendations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Review candidates for {gig?.title ?? "this gig"}.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Gigtree shows anonymous Candidate A/B summaries first. Names, CVs,
            phone numbers, and direct contact details stay hidden until a
            candidate is selected and the worker confirms.
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

        {gig && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                {gig.category}
              </span>
              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                {gig.location_area ?? "Remote UK"}
              </span>
              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                {gig.schedule_summary ?? "Flexible"}
              </span>
            </div>
          </section>
        )}

        {!message && recommendations.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No recommendations yet</h2>
            <p className="mt-3 text-[#42513c]">
              Gigtree admin has not sent anonymous candidates for this gig yet.
              Once admin reviews applications, Candidate A/B summaries will
              appear here.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {recommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                      {recommendation.anonymous_label}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                      {formatStatus(recommendation.status)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">
                    {recommendation.anonymous_label}
                  </h2>

                  <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="font-semibold">Admin summary</p>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-[#42513c]">
                      {recommendation.summary}
                    </p>
                  </div>

                  {recommendation.fit_notes && (
                    <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                      <p className="font-semibold text-[#2f6f3e]">
                        Why this candidate may fit
                      </p>
                      <p className="mt-2 whitespace-pre-wrap leading-7 text-[#42513c]">
                        {recommendation.fit_notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 rounded-2xl border border-black/10 p-4 text-sm text-[#42513c]">
                    Selecting this candidate does not reveal direct contact
                    immediately. The worker must confirm first.
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                  {recommendation.status === "selected" ? (
                    <div className="rounded-2xl bg-[#e8f0e4] p-4 text-sm font-semibold text-[#2f6f3e]">
                      Candidate selected. Waiting for worker confirmation.
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={loadingId === recommendation.id}
                      onClick={() => selectCandidate(recommendation)}
                      className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {loadingId === recommendation.id
                        ? "Selecting..."
                        : "Select this candidate"}
                    </button>
                  )}

                  <a
                    href="/posted-gigs"
                    className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                  >
                    Back to posted gigs
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
