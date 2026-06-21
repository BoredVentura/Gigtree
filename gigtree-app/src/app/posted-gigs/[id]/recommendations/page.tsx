"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
  poster_id: string;
  title: string;
  category: string;
  description: string;
  location_area: string | null;
  pay_type: string;
  fixed_amount: number | null;
  hourly_rate: number | null;
  schedule_summary: string | null;
  status: string;
};

type Recommendation = {
  id: string;
  gig_id: string;
  application_id: string;
  anonymous_label: string;
  summary: string;
  fit_notes: string | null;
  status: string;
  created_at: string;
};

type Application = {
  id: string;
  worker_id: string;
  status: string;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPay(gig: Gig | null) {
  if (!gig) return "Pay not set";

  if (gig.pay_type === "hourly") {
    return `£${gig.hourly_rate ?? 0}/hour`;
  }

  return `£${gig.fixed_amount ?? 0} fixed`;
}

function recommendationInfo(status: string) {
  if (status === "selected_by_poster") {
    return {
      label: "Selected",
      description:
        "You selected this candidate. The worker now needs to confirm before contact opens.",
    };
  }

  if (status === "sent_to_poster") {
    return {
      label: "Ready to review",
      description:
        "Admin has prepared this anonymous candidate summary for your review.",
    };
  }

  return {
    label: formatStatus(status),
    description: "This candidate has an updated recommendation status.",
  };
}

export default function RecommendationDetailPage() {
  const params = useParams<{ id: string }>();
  const gigId = params.id;

  const [userId, setUserId] = useState("");
  const [gig, setGig] = useState<Gig | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading recommendations...");
  const [loadingId, setLoadingId] = useState("");

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view recommendations.");
      return;
    }

    setUserId(user.id);

    const { data: gigData, error: gigError } = await supabase
      .from("gigs")
      .select(
        "id,poster_id,title,category,description,location_area,pay_type,fixed_amount,hourly_rate,schedule_summary,status"
      )
      .eq("id", gigId)
      .single();

    if (gigError) {
      setMessage(gigError.message);
      return;
    }

    const loadedGig = gigData as Gig;

    if (loadedGig.poster_id !== user.id) {
      setMessage("You do not have access to these recommendations.");
      return;
    }

    setGig(loadedGig);

    const { data: recommendationData, error: recommendationError } =
      await supabase
        .from("admin_recommendations")
        .select(
          "id,gig_id,application_id,anonymous_label,summary,fit_notes,status,created_at"
        )
        .eq("gig_id", gigId)
        .order("created_at", { ascending: true });

    if (recommendationError) {
      setMessage(recommendationError.message);
      return;
    }

    const loadedRecommendations =
      (recommendationData ?? []) as Recommendation[];

    setRecommendations(loadedRecommendations);

    const applicationIds = loadedRecommendations.map(
      (recommendation) => recommendation.application_id
    );

    if (applicationIds.length > 0) {
      const { data: applicationData, error: applicationError } = await supabase
        .from("gig_applications")
        .select("id,worker_id,status")
        .in("id", applicationIds);

      if (applicationError) {
        setMessage(applicationError.message);
        return;
      }

      setApplications((applicationData ?? []) as Application[]);
    } else {
      setApplications([]);
    }

    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  const applicationById = useMemo(() => {
    const map = new Map<string, Application>();

    for (const application of applications) {
      map.set(application.id, application);
    }

    return map;
  }, [applications]);

  const selectedRecommendation = recommendations.find(
    (recommendation) => recommendation.status === "selected_by_poster"
  );

  async function selectCandidate(recommendation: Recommendation) {
    if (!gig) return;

    const application = applicationById.get(recommendation.application_id);

    if (!application) {
      setMessage("Could not find the matching application.");
      return;
    }

    const confirmed = window.confirm(
      `Choose ${recommendation.anonymous_label}?\n\nThe worker will still need to confirm before contact details open.`
    );

    if (!confirmed) return;

    setLoadingId(recommendation.id);
    setMessage("");

    const { error: recommendationError } = await supabase
      .from("admin_recommendations")
      .update({
        status: "selected_by_poster",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recommendation.id);

    if (recommendationError) {
      setMessage(recommendationError.message);
      setLoadingId("");
      return;
    }

    await supabase
      .from("admin_recommendations")
      .update({
        status: "not_selected",
        updated_at: new Date().toISOString(),
      })
      .eq("gig_id", gig.id)
      .neq("id", recommendation.id);

    const { error: applicationError } = await supabase
      .from("gig_applications")
      .update({
        status: "selected_by_poster",
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (applicationError) {
      setMessage(applicationError.message);
      setLoadingId("");
      return;
    }

    await supabase.from("worker_acceptance_confirmations").upsert(
      {
        gig_id: gig.id,
        application_id: application.id,
        worker_id: application.worker_id,
        status: "waiting_for_worker",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "gig_id" }
    );

    await loadData();
    setMessage(
      `${recommendation.anonymous_label} selected. The worker now needs to confirm.`
    );
    setLoadingId("");
  }

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
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
            <a href="/contacts" className="rounded-full px-4 py-2 hover:bg-white">
              Contacts
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Candidate recommendations</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Review anonymous candidates.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Gigtree shows admin-written Candidate A/B summaries first. Names,
              CVs, and direct contact details stay hidden until the worker
              confirms after selection.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Selection flow</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                1. Review anonymous summaries.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                2. Choose the best fit.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                3. Worker confirms or declines.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                4. Contact opens after confirmation.
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

        {gig && (
          <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <div className="flex flex-col justify-between gap-5 lg:flex-row">
              <div>
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                    {gig.category}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                    {formatPay(gig)}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                    {formatStatus(gig.status)}
                  </span>
                </div>

                <h2 className="text-3xl font-black">{gig.title}</h2>

                <p className="mt-3 max-w-4xl leading-7 text-[#42513c]">
                  {gig.description}
                </p>
              </div>

              <div className="grid shrink-0 gap-3 text-sm text-[#42513c] lg:w-72">
                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <span className="block font-semibold text-[#142014]">
                    Location
                  </span>
                  {gig.location_area ?? "Remote / not set"}
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <span className="block font-semibold text-[#142014]">
                    Timing
                  </span>
                  {gig.schedule_summary ?? "Flexible"}
                </div>
              </div>
            </div>
          </section>
        )}

        {gig && recommendations.length === 0 && !message && (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-3xl font-black">No recommendations yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
              Admin recommendations will appear here after workers apply and
              Gigtree has reviewed suitable candidates.
            </p>

            <a
              href="/posted-gigs"
              className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
            >
              Back to posted gigs
            </a>
          </div>
        )}

        {gig && recommendations.length > 0 && (
          <div className="grid gap-8 pb-16">
            {selectedRecommendation && (
              <section className="rounded-[2rem] bg-[#e8f0e4] p-6 shadow-sm ring-1 ring-[#2f6f3e]/20">
                <p className="font-semibold text-[#2f6f3e]">
                  Selected candidate
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {selectedRecommendation.anonymous_label}
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  The worker now needs to confirm before temporary contact
                  details open.
                </p>
              </section>
            )}

            <section>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Candidate summaries</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {recommendations.length} candidate
                  {recommendations.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-5">
                {recommendations.map((recommendation) => {
                  const info = recommendationInfo(recommendation.status);
                  const isSelected =
                    recommendation.status === "selected_by_poster";
                  const application = applicationById.get(
                    recommendation.application_id
                  );

                  return (
                    <article
                      key={recommendation.id}
                      className={`rounded-[2rem] p-6 shadow-sm ring-1 ${
                        isSelected
                          ? "bg-[#e8f0e4] ring-[#2f6f3e]/20"
                          : "bg-white ring-black/10"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#2f6f3e] px-3 py-1 font-semibold text-white">
                              {recommendation.anonymous_label}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#42513c] ring-1 ring-black/10">
                              {info.label}
                            </span>
                          </div>

                          <h3 className="text-3xl font-black">
                            {recommendation.anonymous_label}
                          </h3>

                          <p className="mt-3 leading-7 text-[#42513c]">
                            {info.description}
                          </p>

                          <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-5">
                            <p className="font-semibold">Admin summary</p>
                            <p className="mt-3 whitespace-pre-wrap leading-7 text-[#42513c]">
                              {recommendation.summary}
                            </p>
                          </div>

                          {recommendation.fit_notes && (
                            <div className="mt-4 rounded-2xl bg-[#fff7e8] p-5">
                              <p className="font-semibold">Fit notes</p>
                              <p className="mt-3 whitespace-pre-wrap leading-7 text-[#42513c]">
                                {recommendation.fit_notes}
                              </p>
                            </div>
                          )}

                          <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-[#42513c] ring-1 ring-black/10">
                            Worker identity and contact details are hidden at
                            this stage.
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                          {!selectedRecommendation && (
                            <button
                              type="button"
                              disabled={
                                loadingId === recommendation.id || !application
                              }
                              onClick={() => selectCandidate(recommendation)}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              {loadingId === recommendation.id
                                ? "Selecting..."
                                : `Choose ${recommendation.anonymous_label}`}
                            </button>
                          )}

                          {isSelected && (
                            <a
                              href="/confirmations"
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                            >
                              Worker confirmation
                            </a>
                          )}

                          <a
                            href="/posted-gigs"
                            className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                          >
                            Back to gigs
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
