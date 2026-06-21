"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  gig_id: string;
  worker_id: string;
  availability_answer: string;
  experience_answer: string;
  status: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
};

export default function AdminRecommendationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [anonymousLabel, setAnonymousLabel] = useState("Candidate A");
  const [summary, setSummary] = useState("");
  const [fitNotes, setFitNotes] = useState("");
  const [message, setMessage] = useState("Loading applications...");
  const [loading, setLoading] = useState(false);

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

    const { data, error } = await supabase
      .from("gig_applications")
      .select(
        `
        id,
        gig_id,
        worker_id,
        availability_answer,
        experience_answer,
        status,
        created_at,
        gigs (
          title,
          category,
          location_area
        ),
        profiles (
          full_name
        )
      `
      )
      .in("status", ["under_review", "recommended", "submitted"])
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

  async function createRecommendation() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const selected = applications.find(
      (application) => application.id === selectedApplicationId
    );

    if (!user || !selected) {
      setMessage("Select an application first.");
      setLoading(false);
      return;
    }

    if (!anonymousLabel.trim() || !summary.trim()) {
      setMessage("Enter an anonymous label and summary.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("admin_recommendations").upsert(
      {
        gig_id: selected.gig_id,
        application_id: selected.id,
        anonymous_label: anonymousLabel,
        summary,
        fit_notes: fitNotes,
        status: "draft",
        created_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "application_id" }
    );

    if (error) {
      setMessage(error.message);
    } else {
      await supabase
        .from("gig_applications")
        .update({
          status: "recommended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);

      setMessage("Anonymous recommendation saved.");
      setSelectedApplicationId("");
      setAnonymousLabel("Candidate A");
      setSummary("");
      setFitNotes("");
      loadApplications();
    }

    setLoading(false);
  }

  const selectedApplication = applications.find(
    (application) => application.id === selectedApplicationId
  );

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/admin" className="hidden sm:inline hover:underline">
              Admin home
            </a>
            <a
              href="/admin/applications"
              className="hidden sm:inline hover:underline"
            >
              Applications
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin recommendations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Create anonymous candidate summaries.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Turn reviewed applications into anonymous summaries that can later
            be shown to gig posters.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-5">
            {applications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => setSelectedApplicationId(application.id)}
                className={`rounded-3xl border p-6 text-left shadow-sm ${
                  selectedApplicationId === application.id
                    ? "border-[#2f6f3e] bg-[#e8f0e4]"
                    : "border-black/10 bg-white"
                }`}
              >
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white px-3 py-1 font-medium text-[#2f6f3e]">
                    {application.status}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-medium">
                    {application.gigs?.category ?? "Gig"}
                  </span>
                </div>

                <h2 className="text-2xl font-bold">
                  {application.gigs?.title ?? "Unknown gig"}
                </h2>

                <p className="mt-2 text-[#42513c]">
                  Worker: {application.profiles?.full_name || "Unnamed worker"}
                </p>

                <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="text-sm font-semibold">Availability</p>
                  <p className="mt-1 text-[#42513c]">
                    {application.availability_answer}
                  </p>
                </div>

                <div className="mt-3 rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="text-sm font-semibold">Experience</p>
                  <p className="mt-1 text-[#42513c]">
                    {application.experience_answer}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-2xl font-bold">Recommendation summary</h2>
            <p className="mt-2 text-sm leading-6 text-[#42513c]">
              This is what the poster will eventually see. Keep it anonymous.
            </p>

            {selectedApplication && (
              <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                Creating summary for:{" "}
                <span className="font-semibold text-[#172014]">
                  {selectedApplication.gigs?.title}
                </span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold">
                  Anonymous label
                </label>
                <input
                  value={anonymousLabel}
                  onChange={(event) => setAnonymousLabel(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Candidate A"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Recommendation summary
                </label>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="mt-2 min-h-36 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Example: Strong fit for event support. Available Saturday and has relevant guest-facing experience."
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Internal fit notes
                </label>
                <textarea
                  value={fitNotes}
                  onChange={(event) => setFitNotes(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Admin-only notes"
                />
              </div>

              <button
                type="button"
                onClick={createRecommendation}
                disabled={loading}
                className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save recommendation"}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
