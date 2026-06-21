"use client";
import { SiteHeader } from "@/components/site-header";

import { useEffect, useMemo, useState } from "react";
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
    description: string;
    location_area: string | null;
    pay_type: string;
    fixed_amount: number | null;
    hourly_rate: number | null;
    schedule_summary: string | null;
    status: string;
  } | null;
};

function formatPay(application: Application) {
  const gig = application.gigs;

  if (!gig) return "Pay unavailable";

  if (gig.pay_type === "hourly") {
    return `£${gig.hourly_rate ?? 0}/hour`;
  }

  return `£${gig.fixed_amount ?? 0} fixed`;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function applicationInfo(status: string) {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        description:
          "Your application has been received and is waiting for review.",
        nextStep:
          "Keep your profile strong while admin reviews suitable candidates.",
      };
    case "under_review":
      return {
        label: "Under review",
        description:
          "Gigtree is reviewing your profile and application fit.",
        nextStep:
          "No action needed right now unless your profile is incomplete.",
      };
    case "recommended":
      return {
        label: "Recommended",
        description:
          "You have been included in the anonymous candidate summaries shown to the poster.",
        nextStep:
          "Wait for the poster to choose who they want to move forward with.",
      };
    case "selected_by_poster":
      return {
        label: "Selected by poster",
        description:
          "The poster wants to move forward with you.",
        nextStep:
          "Go to confirmations and accept if you still want the gig.",
      };
    case "accepted_by_worker":
      return {
        label: "Accepted",
        description:
          "You accepted the gig. Contact and completion steps can now move forward.",
        nextStep:
          "Check contacts for temporary contact details.",
      };
    case "declined_by_worker":
      return {
        label: "Declined",
        description:
          "You declined this selected gig.",
        nextStep:
          "No further action is needed.",
      };
    case "not_recommended":
      return {
        label: "Not recommended",
        description:
          "This application was not recommended to the poster this time.",
        nextStep:
          "Improve your profile and apply for other suitable gigs.",
      };
    default:
      return {
        label: formatStatus(status),
        description:
          "This application has an updated status.",
        nextStep:
          "Check your dashboard or contact Gigtree if unsure.",
      };
  }
}

export default function ApplicationsPage() {
  const [userId, setUserId] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading applications...");

  async function loadApplications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view your applications.");
      return;
    }

    setUserId(user.id);

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
          description,
          location_area,
          pay_type,
          fixed_amount,
          hourly_rate,
          schedule_summary,
          status
        )
      `
      )
      .eq("worker_id", user.id)
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

  const activeApplications = useMemo(() => {
    return applications.filter(
      (application) =>
        !["not_recommended", "declined_by_worker", "cancelled_by_admin"].includes(
          application.status
        )
    );
  }, [applications]);

  const closedApplications = useMemo(() => {
    return applications.filter((application) =>
      ["not_recommended", "declined_by_worker", "cancelled_by_admin"].includes(
        application.status
      )
    );
  }, [applications]);

  const selectedApplications = useMemo(() => {
    return applications.filter(
      (application) => application.status === "selected_by_poster"
    );
  }, [applications]);

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="applications" />

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">My applications</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Track every gig you applied for.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              See whether your applications are submitted, under review,
              recommended, selected, accepted, or closed.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">Application summary</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {applications.length}
                </span>
                Total applications
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {activeApplications.length}
                </span>
                Active applications
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <span className="block text-2xl font-black text-[#142014]">
                  {selectedApplications.length}
                </span>
                Need confirmation
              </div>
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

        {userId && applications.length === 0 && !message && (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-3xl font-black">No applications yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
              Apply for suitable gigs and they will appear here. Your profile
              helps admin decide whether to recommend you to posters.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/gigs"
                className="rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
              >
                Browse gigs
              </a>
              <a
                href="/profile"
                className="rounded-full bg-white px-6 py-4 font-bold shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
              >
                Improve profile
              </a>
            </div>
          </div>
        )}

        {userId && applications.length > 0 && (
          <div className="grid gap-8 pb-16">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Active applications</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {activeApplications.length} active
                </span>
              </div>

              {activeApplications.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No active applications right now.
                </div>
              ) : (
                <div className="grid gap-5">
                  {activeApplications.map((application) => {
                    const info = applicationInfo(application.status);

                    return (
                      <article
                        key={application.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {application.gigs?.category ?? "Gig"}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {formatPay(application)}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                Applied {new Date(application.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-2xl font-black">
                              {application.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-3 line-clamp-3 leading-7 text-[#42513c]">
                              {application.gigs?.description ?? "Gig details unavailable."}
                            </p>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-2">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Location
                                </span>
                                {application.gigs?.location_area ?? "Remote / not set"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Timing
                                </span>
                                {application.gigs?.schedule_summary ?? "Flexible"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4">
                              <p className="font-semibold text-[#142014]">
                                What this means
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {info.description}
                              </p>
                            </div>

                            <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {info.nextStep}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            {application.status === "selected_by_poster" && (
                              <a
                                href="/confirmations"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                Confirm gig
                              </a>
                            )}

                            {application.status === "accepted_by_worker" && (
                              <a
                                href="/contacts"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                Contacts
                              </a>
                            )}

                            <a
                              href={`/gigs/${application.gig_id}`}
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              View gig
                            </a>

                            <a
                              href="/profile"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              Improve profile
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
                <h2 className="text-3xl font-black">Closed applications</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {closedApplications.length} closed
                </span>
              </div>

              {closedApplications.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No closed applications yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {closedApplications.map((application) => {
                    const info = applicationInfo(application.status);

                    return (
                      <article
                        key={application.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {application.gigs?.category ?? "Gig"}
                              </span>
                            </div>

                            <h3 className="text-xl font-black">
                              {application.gigs?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              {info.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                            <a
                              href="/gigs"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              Browse more gigs
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
