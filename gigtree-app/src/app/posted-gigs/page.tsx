"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
  title: string;
  category: string;
  description: string;
  location_area: string | null;
  pay_type: string;
  fixed_amount: number | null;
  hourly_rate: number | null;
  schedule_summary: string | null;
  status: string;
  created_at: string;
};

type Recommendation = {
  id: string;
  gig_id: string;
  application_id: string;
  anonymous_label: string;
  summary: string;
  status: string;
};

type Contact = {
  id: string;
  gig_id: string;
  worker_id: string;
  expires_at: string | null;
};

type Completion = {
  id: string;
  gig_id: string;
  poster_confirmed: boolean;
  admin_confirmed: boolean;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPay(gig: Gig) {
  if (gig.pay_type === "hourly") {
    return `£${gig.hourly_rate ?? 0}/hour`;
  }

  return `£${gig.fixed_amount ?? 0} fixed`;
}

function stageInfo({
  gig,
  recommendationCount,
  hasContact,
  completion,
}: {
  gig: Gig;
  recommendationCount: number;
  hasContact: boolean;
  completion?: Completion;
}) {
  if (completion?.admin_confirmed) {
    return {
      label: "Complete",
      description: "Poster and admin have confirmed this gig as complete.",
      nextStep: "Check payments if needed.",
      priority: 5,
    };
  }

  if (completion?.poster_confirmed) {
    return {
      label: "Waiting for admin completion review",
      description: "You confirmed completion. Admin needs to review next.",
      nextStep: "No action needed unless admin contacts you.",
      priority: 4,
    };
  }

  if (hasContact) {
    return {
      label: "Contact opened",
      description: "Temporary contact details are available for this gig.",
      nextStep: "Use contact details and confirm completion when the work is done.",
      priority: 3,
    };
  }

  if (recommendationCount > 0) {
    return {
      label: "Review candidates",
      description: "Admin has prepared anonymous candidate summaries.",
      nextStep: "Review recommendations and choose a candidate.",
      priority: 2,
    };
  }

  return {
    label: "Open for applications",
    description: "Workers can apply privately. Admin will review applicants.",
    nextStep: "Wait for applications and admin recommendations.",
    priority: 1,
  };
}

export default function PostedGigsPage() {
  const [userId, setUserId] = useState("");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [message, setMessage] = useState("Loading your posted gigs...");

  async function loadPostedGigs() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view your posted gigs.");
      return;
    }

    setUserId(user.id);

    const { data: gigData, error: gigError } = await supabase
      .from("gigs")
      .select(
        "id,title,category,description,location_area,pay_type,fixed_amount,hourly_rate,schedule_summary,status,created_at"
      )
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false });

    if (gigError) {
      setMessage(gigError.message);
      return;
    }

    const loadedGigs = (gigData ?? []) as Gig[];
    setGigs(loadedGigs);

    const gigIds = loadedGigs.map((gig) => gig.id);

    if (gigIds.length === 0) {
      setRecommendations([]);
      setContacts([]);
      setCompletions([]);
      setMessage("");
      return;
    }

    const [recommendationResult, contactResult, completionResult] =
      await Promise.all([
        supabase
          .from("admin_recommendations")
          .select("id,gig_id,application_id,anonymous_label,summary,status")
          .in("gig_id", gigIds),
        supabase
          .from("masked_contacts")
          .select("id,gig_id,worker_id,expires_at")
          .in("gig_id", gigIds),
        supabase
          .from("completion_confirmations")
          .select("id,gig_id,poster_confirmed,admin_confirmed")
          .in("gig_id", gigIds),
      ]);

    if (recommendationResult.error) {
      setMessage(recommendationResult.error.message);
      return;
    }

    if (contactResult.error) {
      setMessage(contactResult.error.message);
      return;
    }

    if (completionResult.error) {
      setMessage(completionResult.error.message);
      return;
    }

    setRecommendations((recommendationResult.data ?? []) as Recommendation[]);
    setContacts((contactResult.data ?? []) as Contact[]);
    setCompletions((completionResult.data ?? []) as Completion[]);
    setMessage("");
  }

  useEffect(() => {
    loadPostedGigs();
  }, []);

  const recommendationsByGig = useMemo(() => {
    const map = new Map<string, Recommendation[]>();

    for (const recommendation of recommendations) {
      const current = map.get(recommendation.gig_id) ?? [];
      current.push(recommendation);
      map.set(recommendation.gig_id, current);
    }

    return map;
  }, [recommendations]);

  const contactsByGig = useMemo(() => {
    const map = new Map<string, Contact[]>();

    for (const contact of contacts) {
      const current = map.get(contact.gig_id) ?? [];
      current.push(contact);
      map.set(contact.gig_id, current);
    }

    return map;
  }, [contacts]);

  const completionByGig = useMemo(() => {
    const map = new Map<string, Completion>();

    for (const completion of completions) {
      map.set(completion.gig_id, completion);
    }

    return map;
  }, [completions]);

  const actionGigs = gigs.filter((gig) => {
    const stage = stageInfo({
      gig,
      recommendationCount: recommendationsByGig.get(gig.id)?.length ?? 0,
      hasContact: (contactsByGig.get(gig.id)?.length ?? 0) > 0,
      completion: completionByGig.get(gig.id),
    });

    return stage.priority >= 2 && stage.priority < 5;
  });

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
            <a href="/post-gig" className="rounded-full px-4 py-2 hover:bg-white">
              Post gig
            </a>
            <a href="/contacts" className="rounded-full px-4 py-2 hover:bg-white">
              Contacts
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Posted gigs</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Track your gigs from posting to completion.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              See where each gig is in the Gigtree flow: applications,
              recommendations, contact, completion, and payment.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Quick summary</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {gigs.length}
                </span>
                Total posted gigs
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {actionGigs.length}
                </span>
                Gigs with next actions
              </div>

              <a
                href="/post-gig"
                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
              >
                Post another gig
              </a>
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

        {userId && gigs.length === 0 && !message && (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-3xl font-black">No posted gigs yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
              Once you post a gig, it will appear here with its current stage
              and next action.
            </p>

            <a
              href="/post-gig"
              className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
            >
              Post your first gig
            </a>
          </div>
        )}

        {userId && gigs.length > 0 && (
          <div className="grid gap-8 pb-16">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Needs attention</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {actionGigs.length} active
                </span>
              </div>

              {actionGigs.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No posted gigs currently need action.
                </div>
              ) : (
                <div className="grid gap-5">
                  {actionGigs.map((gig) => {
                    const gigRecommendations =
                      recommendationsByGig.get(gig.id) ?? [];
                    const hasContact =
                      (contactsByGig.get(gig.id)?.length ?? 0) > 0;
                    const completion = completionByGig.get(gig.id);

                    const stage = stageInfo({
                      gig,
                      recommendationCount: gigRecommendations.length,
                      hasContact,
                      completion,
                    });

                    return (
                      <article
                        key={gig.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {stage.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {gig.category}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {formatPay(gig)}
                              </span>
                            </div>

                            <h3 className="text-2xl font-black">{gig.title}</h3>

                            <p className="mt-3 line-clamp-3 leading-7 text-[#42513c]">
                              {gig.description}
                            </p>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Location
                                </span>
                                {gig.location_area ?? "Remote / not set"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Timing
                                </span>
                                {gig.schedule_summary ?? "Flexible"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Candidates
                                </span>
                                {gigRecommendations.length} recommendation
                                {gigRecommendations.length === 1 ? "" : "s"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {stage.nextStep}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            {gigRecommendations.length > 0 && !hasContact && (
                              <a
                                href={`/posted-gigs/${gig.id}/recommendations`}
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                Review candidates
                              </a>
                            )}

                            {hasContact && !completion?.poster_confirmed && (
                              <>
                                <a
                                  href="/contacts"
                                  className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                                >
                                  View contact
                                </a>
                                <a
                                  href="/completions"
                                  className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                                >
                                  Confirm complete
                                </a>
                              </>
                            )}

                            {completion?.poster_confirmed && (
                              <a
                                href="/payments"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                View payments
                              </a>
                            )}

                            <a
                              href={`/gigs/${gig.id}`}
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              View public page
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
                <h2 className="text-3xl font-black">All posted gigs</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {gigs.length} total
                </span>
              </div>

              <div className="grid gap-4">
                {gigs.map((gig) => {
                  const gigRecommendations =
                    recommendationsByGig.get(gig.id) ?? [];
                  const hasContact =
                    (contactsByGig.get(gig.id)?.length ?? 0) > 0;
                  const completion = completionByGig.get(gig.id);

                  const stage = stageInfo({
                    gig,
                    recommendationCount: gigRecommendations.length,
                    hasContact,
                    completion,
                  });

                  return (
                    <article
                      key={gig.id}
                      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                              {stage.label}
                            </span>
                            <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                              {formatStatus(gig.status)}
                            </span>
                          </div>

                          <h3 className="text-xl font-black">{gig.title}</h3>

                          <p className="mt-2 text-[#42513c]">
                            {stage.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                          {gigRecommendations.length > 0 && (
                            <a
                              href={`/posted-gigs/${gig.id}/recommendations`}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                            >
                              Candidates
                            </a>
                          )}

                          <a
                            href={`/gigs/${gig.id}`}
                            className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                          >
                            View
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
