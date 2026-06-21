"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
  title: string;
  poster_id: string;
};

type Recommendation = {
  id: string;
  application_id: string;
  anonymous_label: string;
  summary: string;
  status: "draft" | "sent_to_poster" | "selected" | "declined";
  created_at: string;
};

export default function PostedGigRecommendationsPage({
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
      .select("id,title,poster_id")
      .eq("id", resolvedParams.id)
      .single();

    if (gigError || !gigData) {
      setMessage("Gig not found.");
      return;
    }

    if (gigData.poster_id !== user.id) {
      setMessage("You can only view recommendations for gigs you posted.");
      return;
    }

    setGig(gigData as Gig);

    const { data, error } = await supabase
      .from("admin_recommendations")
      .select("id,application_id,anonymous_label,summary,status,created_at")
      .eq("gig_id", resolvedParams.id)
      .in("status", ["draft", "sent_to_poster", "selected"])
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
  }, [params]);

  async function selectCandidate(recommendation: Recommendation) {
    setLoadingId(recommendation.id);
    setMessage("");

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

    setRecommendations((current) =>
      current.map((item) =>
        item.id === recommendation.id ? { ...item, status: "selected" } : item
      )
    );

    setMessage(
      "Candidate selected. Next step: worker confirmation before identity/contact is revealed."
    );
    setLoadingId("");
  }

  const hasSelectedCandidate = recommendations.some(
    (recommendation) => recommendation.status === "selected"
  );

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/posted-gigs" className="hidden sm:inline hover:underline">
              My posted gigs
            </a>
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Candidate recommendations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            {gig ? gig.title : "Gig recommendations"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Choose an anonymous candidate summary. The worker must confirm
            before identity or contact details are revealed.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
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

        {!message && recommendations.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No recommendations yet</h2>
            <p className="mt-3 text-[#42513c]">
              Gigtree admin has not created candidate summaries for this gig yet.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {recommendations.map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                  {recommendation.anonymous_label}
                </span>
                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                  {recommendation.status.replaceAll("_", " ")}
                </span>
              </div>

              <h2 className="text-2xl font-bold">
                {recommendation.anonymous_label}
              </h2>

              <p className="mt-4 text-lg leading-8 text-[#42513c]">
                {recommendation.summary}
              </p>

              <div className="mt-6 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                Identity, CV, and contact details are hidden at this stage.
              </div>

              {recommendation.status === "selected" ? (
                <div className="mt-5 rounded-2xl bg-[#e8f0e4] p-4 text-sm font-semibold text-[#2f6f3e]">
                  Selected. Waiting for worker confirmation.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={loadingId === recommendation.id || hasSelectedCandidate}
                  onClick={() => selectCandidate(recommendation)}
                  className="mt-5 rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {loadingId === recommendation.id
                    ? "Selecting..."
                    : hasSelectedCandidate
                      ? "Candidate already selected"
                      : "Select this candidate"}
                </button>
              )}
            </article>
          ))}
        </div>

        {gigId && (
          <a
            href="/posted-gigs"
            className="mt-8 inline-block rounded-full border border-black/10 px-5 py-3 font-semibold"
          >
            Back to posted gigs
          </a>
        )}
      </section>
    </main>
  );
}
