"use client";
import { SiteHeader } from "@/components/site-header";

import { FormEvent, useEffect, useState } from "react";
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

type Recommendation = {
  id: string;
  application_id: string;
  gig_id: string;
  anonymous_label: string;
  summary: string;
  fit_notes: string | null;
  status: string;
  created_at: string;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminRecommendationsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [anonymousLabel, setAnonymousLabel] = useState("Candidate A");
  const [summary, setSummary] = useState("");
  const [fitNotes, setFitNotes] = useState("");
  const [message, setMessage] = useState("Loading recommendations...");
  const [saving, setSaving] = useState(false);

  async function loadData() {
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

    const { data: applicationData, error: applicationError } = await supabase
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
      .in("status", ["recommended", "under_review", "submitted"])
      .order("created_at", { ascending: false });

    if (applicationError) {
      setMessage(applicationError.message);
      return;
    }

    const { data: recommendationData, error: recommendationError } =
      await supabase
        .from("admin_recommendations")
        .select(
          "id,application_id,gig_id,anonymous_label,summary,fit_notes,status,created_at"
        )
        .order("created_at", { ascending: false });

    if (recommendationError) {
      setMessage(recommendationError.message);
      return;
    }

    setApplications((applicationData ?? []) as Application[]);
    setRecommendations((recommendationData ?? []) as Recommendation[]);
    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedApplication = applications.find(
    (application) => application.id === selectedApplicationId
  );

  async function createRecommendation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    if (!selectedApplication) {
      setMessage("Please choose an application.");
      setSaving(false);
      return;
    }

    if (!anonymousLabel || !summary) {
      setMessage("Please add a candidate label and admin summary.");
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: recommendationError } = await supabase
      .from("admin_recommendations")
      .upsert(
        {
          gig_id: selectedApplication.gig_id,
          application_id: selectedApplication.id,
          anonymous_label: anonymousLabel,
          summary,
          fit_notes: fitNotes || null,
          status: "sent_to_poster",
          created_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id" }
      );

    if (recommendationError) {
      setMessage(recommendationError.message);
      setSaving(false);
      return;
    }

    const { error: applicationError } = await supabase
      .from("gig_applications")
      .update({
        status: "recommended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedApplication.id);

    if (applicationError) {
      setMessage(applicationError.message);
      setSaving(false);
      return;
    }

    setSelectedApplicationId("");
    setAnonymousLabel("Candidate A");
    setSummary("");
    setFitNotes("");

    await loadData();
    setMessage("Anonymous recommendation sent to poster.");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="admin" />

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin recommendations</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Create anonymous Candidate A/B summaries.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Posters should see a clear anonymous summary first — not worker
            names, direct contact details, or CVs. Use this page to explain why
            a worker may be a good fit.
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

        {isAdmin && (
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Create recommendation</h2>
              <p className="mt-3 text-[#42513c]">
                Choose an application, give it an anonymous label, then write
                the poster-facing summary.
              </p>

              <form onSubmit={createRecommendation} className="mt-6 grid gap-5">
                <label>
                  <span className="text-sm font-semibold">Application</span>
                  <select
                    value={selectedApplicationId}
                    onChange={(event) =>
                      setSelectedApplicationId(event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                  >
                    <option value="">Choose an application</option>
                    {applications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {application.gigs?.title ?? "Unknown gig"} ·{" "}
                        {application.worker_id.slice(0, 8)} ·{" "}
                        {formatStatus(application.status)}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedApplication && (
                  <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                    <p className="font-semibold text-[#172014]">
                      Selected application
                    </p>
                    <p className="mt-2">
                      Gig: {selectedApplication.gigs?.title ?? "Unknown gig"}
                    </p>
                    <p>Category: {selectedApplication.gigs?.category ?? "Gig"}</p>
                    <p>
                      Worker ID: {selectedApplication.worker_id.slice(0, 8)}
                    </p>
                  </div>
                )}

                <label>
                  <span className="text-sm font-semibold">
                    Anonymous label
                  </span>
                  <select
                    value={anonymousLabel}
                    onChange={(event) => setAnonymousLabel(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                  >
                    <option>Candidate A</option>
                    <option>Candidate B</option>
                    <option>Candidate C</option>
                    <option>Candidate D</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Admin summary shown to poster
                  </span>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    className="mt-2 min-h-40 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Example: Candidate A has relevant cleaning experience, is available on Sunday, and appears suitable for this home help gig."
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Fit notes
                  </span>
                  <textarea
                    value={fitNotes}
                    onChange={(event) => setFitNotes(event.target.value)}
                    className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Example: Strong availability, local to the area, and profile suggests good fit."
                  />
                </label>

                <div className="rounded-2xl bg-[#e8f0e4] p-4 text-sm text-[#42513c]">
                  Do not include the worker’s name, direct email, phone number,
                  exact address, or full CV content in the poster summary.
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#2f6f3e] px-6 py-4 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Sending..." : "Send anonymous recommendation"}
                </button>
              </form>
            </section>

            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Recommendation guide</h2>
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">1. Keep it anonymous</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Use Candidate A/B labels instead of names or contact
                    details.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">2. Explain the fit</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Mention skills, availability, location fit, and relevant
                    experience.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">3. Poster chooses</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Poster selects one candidate, then the worker must confirm.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">4. Contact stays hidden</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Contact is only revealed after worker confirmation.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {isAdmin && (
          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Recent recommendations</h2>
                <p className="mt-2 text-[#42513c]">
                  Recently created anonymous summaries.
                </p>
              </div>
              <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                {recommendations.length} total
              </span>
            </div>

            {recommendations.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-[#f6f8f4] p-4 text-[#42513c]">
                No recommendations created yet.
              </p>
            ) : (
              <div className="mt-6 grid gap-4">
                {recommendations.slice(0, 8).map((recommendation) => (
                  <article
                    key={recommendation.id}
                    className="rounded-2xl border border-black/10 p-5"
                  >
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                        {recommendation.anonymous_label}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {formatStatus(recommendation.status)}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {new Date(recommendation.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-[#42513c]">
                      {recommendation.summary}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
