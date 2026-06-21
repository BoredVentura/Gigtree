"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading applications...");

  useEffect(() => {
    async function loadApplications() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view your applications.");
        return;
      }

      const { data, error } = await supabase
        .from("gig_applications")
        .select(
          `
          id,
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

    loadApplications();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a href="/gigs" className="hidden sm:inline hover:underline">
              Browse gigs
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">My applications</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Track the gigs you have applied for.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Applications submitted through Gigtree are reviewed before workers
            are recommended to posters.
          </p>
        </div>

        {message && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
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

        {!message && applications.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No applications yet</h2>
            <p className="mt-3 text-[#42513c]">
              Browse gigs and submit your first application.
            </p>
            <a
              href="/gigs"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              Browse gigs
            </a>
          </div>
        )}

        <div className="grid gap-5">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                      {application.gigs?.category ?? "Gig"}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {formatStatus(application.status)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">
                    {application.gigs?.title ?? "Unknown gig"}
                  </h2>

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
                    <p className="text-sm font-semibold">Your availability</p>
                    <p className="mt-1 text-[#42513c]">
                      {application.availability_answer}
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold">Your experience</p>
                    <p className="mt-1 text-[#42513c]">
                      {application.experience_answer}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
