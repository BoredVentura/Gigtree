"use client";
import { SiteHeader } from "@/components/site-header";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  gig_id: string;
  worker_id: string;
  status: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
    schedule_summary: string | null;
  } | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function statusInfo(status: string) {
  switch (status) {
    case "submitted":
      return {
        label: "Needs review",
        description: "This worker has applied and is waiting for admin review.",
        nextStep: "Review the application and mark it under review, recommended, or not recommended.",
      };
    case "under_review":
      return {
        label: "Under review",
        description: "Admin has started reviewing this application.",
        nextStep: "Decide whether to recommend this worker to the poster.",
      };
    case "recommended":
      return {
        label: "Recommended",
        description: "This application has been marked recommended.",
        nextStep: "Create or check the anonymous candidate summary.",
      };
    case "not_recommended":
      return {
        label: "Not recommended",
        description: "This worker will not be recommended to the poster for this gig.",
        nextStep: "No further action needed unless you change the decision.",
      };
    case "selected_by_poster":
      return {
        label: "Selected by poster",
        description: "The poster selected this candidate.",
        nextStep: "Wait for the worker to confirm or decline.",
      };
    case "accepted_by_worker":
      return {
        label: "Worker accepted",
        description: "The worker accepted the selected gig.",
        nextStep: "Contact and completion flow can continue.",
      };
    case "declined_by_worker":
      return {
        label: "Worker declined",
        description: "The worker declined after being selected.",
        nextStep: "Consider recommending another candidate.",
      };
    default:
      return {
        label: formatStatus(status),
        description: "This application has an updated status.",
        nextStep: "Check the gig status and continue manually if needed.",
      };
  }
}

export default function AdminApplicationsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading applications...");
  const [loadingId, setLoadingId] = useState("");

  async function loadApplications() {
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
      .from("gig_applications")
      .select(
        `
        id,
        gig_id,
        worker_id,
        status,
        created_at,
        gigs (
          title,
          category,
          location_area,
          schedule_summary
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setApplications((data ?? []) as Application[]);
    setMessage("");
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function updateStatus(application: Application, status: string) {
    setLoadingId(application.id);
    setMessage("");

    const { error } = await supabase
      .from("gig_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (error) {
      setMessage(error.message);
      setLoadingId("");
      return;
    }

    await loadApplications();
    setMessage(`Application marked as ${formatStatus(status)}.`);
    setLoadingId("");
  }

  const needsReview = applications.filter((app) =>
    ["submitted", "under_review"].includes(app.status)
  );
  const laterStage = applications.filter(
    (app) => !["submitted", "under_review"].includes(app.status)
  );

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="admin" />

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin applications</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Review worker applications.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Review new applications, decide who should move forward, and then
            create anonymous candidate summaries for posters.
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

        {isAdmin && !message && applications.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No applications yet</h2>
            <p className="mt-3 text-[#42513c]">
              Worker applications will appear here after users apply to gigs.
            </p>
          </div>
        )}

        {isAdmin && applications.length > 0 && (
          <div className="grid gap-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Needs admin review</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {needsReview.length} pending
                </span>
              </div>

              {needsReview.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No applications currently need review.
                </div>
              ) : (
                <div className="grid gap-5">
                  {needsReview.map((application) => {
                    const info = statusInfo(application.status);

                    return (
                      <article
                        key={application.id}
                        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                {application.gigs?.category ?? "Gig"}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                Applied {new Date(application.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-2xl font-bold">
                              {application.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Worker
                                </span>
                                {application.worker_id.slice(0, 8)}
                              </p>
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Location
                                </span>
                                {application.gigs?.location_area ?? "Remote UK"}
                              </p>
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Timing
                                </span>
                                {application.gigs?.schedule_summary ?? "Flexible"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">{info.nextStep}</p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            <button
                              type="button"
                              disabled={loadingId === application.id}
                              onClick={() => updateStatus(application, "under_review")}
                              className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50 hover:bg-[#f6f8f4]"
                            >
                              Mark under review
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === application.id}
                              onClick={() => updateStatus(application, "recommended")}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              Mark recommended
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === application.id}
                              onClick={() => updateStatus(application, "not_recommended")}
                              className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50 hover:bg-[#f6f8f4]"
                            >
                              Not recommended
                            </button>

                            <a
                              href="/admin/recommendations"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              Create summary
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
                <h2 className="text-3xl font-black">Later-stage applications</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {laterStage.length} total
                </span>
              </div>

              {laterStage.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No later-stage applications yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {laterStage.map((application) => {
                    const info = statusInfo(application.status);

                    return (
                      <article
                        key={application.id}
                        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                {formatStatus(application.status)}
                              </span>
                            </div>

                            <h3 className="text-xl font-bold">
                              {application.gigs?.title ?? "Unknown gig"}
                            </h3>
                            <p className="mt-2 text-[#42513c]">
                              {info.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                            <a
                              href="/admin/recommendations"
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                            >
                              Recommendations
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
