"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  gig_id: string;
  worker_id: string;
  availability_answer: string;
  experience_answer: string;
  requirements_confirmed: boolean;
  status: string;
  created_at: string;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
    pay_type: "hourly" | "fixed";
    hourly_rate: number | null;
    fixed_amount: number | null;
    schedule_summary: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
};

function formatPay(application: Application) {
  const gig = application.gigs;

  if (!gig) return "Pay TBC";

  if (gig.pay_type === "hourly" && gig.hourly_rate) {
    return `£${gig.hourly_rate}/hr`;
  }

  if (gig.pay_type === "fixed" && gig.fixed_amount) {
    return `£${gig.fixed_amount} fixed`;
  }

  return "Pay TBC";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminApplicationsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Checking admin access...");
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
        availability_answer,
        experience_answer,
        requirements_confirmed,
        status,
        created_at,
        gigs (
          title,
          category,
          location_area,
          pay_type,
          hourly_rate,
          fixed_amount,
          schedule_summary
        ),
        profiles (
          full_name
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

  async function updateStatus(applicationId: string, status: string) {
    setLoadingId(applicationId);
    setMessage("");

    const { error } = await supabase
      .from("gig_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      setMessage(error.message);
      setLoadingId("");
      return;
    }

    setApplications((current) =>
      current.map((item) =>
        item.id === applicationId ? { ...item, status } : item
      )
    );

    setMessage("Application status updated.");
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
            <a href="/admin" className="hidden sm:inline hover:underline">
              Admin home
            </a>
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin applications</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Review worker applications.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Review submitted applications before recommending candidates to gig posters.
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

        {isAdmin && applications.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No applications yet</h2>
            <p className="mt-3 text-[#42513c]">
              Submitted gig applications will appear here.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                      {formatStatus(application.status)}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {application.gigs?.category ?? "Gig"}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">
                    {application.gigs?.title ?? "Unknown gig"}
                  </h2>

                  <p className="mt-2 text-[#42513c]">
                    Worker: {application.profiles?.full_name || "Unnamed worker"}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-[#42513c] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Location:
                      </span>{" "}
                      {application.gigs?.location_area ?? "Remote UK"}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Pay:
                      </span>{" "}
                      {formatPay(application)}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Timing:
                      </span>{" "}
                      {application.gigs?.schedule_summary ?? "Flexible"}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
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
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                  <button
                    type="button"
                    disabled={loadingId === application.id}
                    onClick={() => updateStatus(application.id, "under_review")}
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50"
                  >
                    Mark under review
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === application.id}
                    onClick={() => updateStatus(application.id, "recommended")}
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Mark recommended
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === application.id}
                    onClick={() => updateStatus(application.id, "not_recommended")}
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50"
                  >
                    Not recommended
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
