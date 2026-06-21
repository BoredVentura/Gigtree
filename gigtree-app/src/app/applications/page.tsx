"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  gig_id: string;
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

function statusInfo(status: string) {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        description:
          "Your application has been received. Gigtree admin will review it before anything is shown to the poster.",
        nextStep: "Wait for admin review.",
      };
    case "under_review":
      return {
        label: "Under admin review",
        description:
          "Gigtree admin is checking your profile, experience, and fit for this gig.",
        nextStep: "Make sure your worker profile is complete.",
      };
    case "recommended":
      return {
        label: "Recommended to poster",
        description:
          "Admin has recommended your anonymous candidate summary to the poster.",
        nextStep: "Wait for the poster to choose a candidate.",
      };
    case "not_recommended":
      return {
        label: "Not recommended",
        description:
          "Admin decided not to recommend this application for this gig.",
        nextStep: "Keep your profile updated and apply for other gigs.",
      };
    case "selected_by_poster":
      return {
        label: "Selected by poster",
        description:
          "The poster selected your anonymous candidate summary.",
        nextStep: "Go to Worker confirmations and accept or decline the gig.",
      };
    case "accepted_by_worker":
      return {
        label: "Accepted by you",
        description:
          "You accepted the gig. Temporary masked contact details should now be available.",
        nextStep: "Check Contact details and agree the final arrangements.",
      };
    case "declined_by_worker":
      return {
        label: "Declined by you",
        description:
          "You declined this selected gig.",
        nextStep: "No further action needed.",
      };
    case "withdrawn_by_admin":
      return {
        label: "Withdrawn by admin",
        description:
          "Gigtree admin withdrew this application.",
        nextStep: "Contact Gigtree support if you think this is wrong.",
      };
    case "cancelled_by_admin":
      return {
        label: "Cancelled",
        description:
          "This application or gig was cancelled.",
        nextStep: "No further action needed.",
      };
    default:
      return {
        label: status
          .split("_")
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(" "),
        description: "This application has an updated status.",
        nextStep: "Check your dashboard for the next available action.",
      };
  }
}

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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading your applications...");

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
          gig_id,
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
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/dashboard" className="hover:underline">
              Dashboard
            </a>
            <a href="/gigs" className="hover:underline">
              Browse gigs
            </a>
            <a href="/confirmations" className="hover:underline">
              Worker confirmations
            </a>
            <a href="/contacts" className="hover:underline">
              Contacts
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">My applications</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Track your gig applications.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Gigtree reviews applications before posters see anonymous candidate
            summaries. Your direct contact details stay hidden until both sides
            confirm.
          </p>
        </div>

        {message && (
          <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
            {message}
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
              You have not applied for any gigs yet. Browse open gigs and apply
              when you find a good fit.
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
          {applications.map((application) => {
            const info = statusInfo(application.status);

            return (
              <article
                key={application.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                        {info.label}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {application.gigs?.category ?? "Gig"}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        Applied{" "}
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold">
                      {application.gigs?.title ?? "Unknown gig"}
                    </h2>

                    <div className="mt-4 grid gap-3 text-sm text-[#42513c] sm:grid-cols-3">
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
                      <p className="font-semibold">What this means</p>
                      <p className="mt-2 text-[#42513c]">{info.description}</p>
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                      <p className="font-semibold text-[#2f6f3e]">
                        Next step
                      </p>
                      <p className="mt-2 text-[#42513c]">{info.nextStep}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                    {application.status === "selected_by_poster" && (
                      <a
                        href="/confirmations"
                        className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                      >
                        Confirm selection
                      </a>
                    )}

                    {application.status === "accepted_by_worker" && (
                      <a
                        href="/contacts"
                        className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                      >
                        View contact details
                      </a>
                    )}

                    <a
                      href={`/gigs/${application.gig_id}`}
                      className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                    >
                      View gig
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
