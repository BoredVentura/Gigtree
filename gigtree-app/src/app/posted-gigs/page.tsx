"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PostedGig = {
  id: string;
  title: string;
  description: string;
  category: string;
  trust_level: "low" | "medium" | "high";
  location_type: "online" | "in_person";
  location_area: string | null;
  pay_type: "hourly" | "fixed";
  hourly_rate: number | null;
  fixed_amount: number | null;
  currency: string;
  schedule_summary: string | null;
  status: string;
  created_at: string;
};

function formatPay(gig: PostedGig) {
  if (gig.pay_type === "hourly" && gig.hourly_rate) {
    return `£${gig.hourly_rate}/hr`;
  }

  if (gig.pay_type === "fixed" && gig.fixed_amount) {
    return `£${gig.fixed_amount} fixed`;
  }

  return "Pay TBC";
}

function formatLocationType(type: PostedGig["location_type"]) {
  return type === "in_person" ? "In-person" : "Online";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PostedGigsPage() {
  const [gigs, setGigs] = useState<PostedGig[]>([]);
  const [message, setMessage] = useState("Loading posted gigs...");

  useEffect(() => {
    async function loadPostedGigs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view your posted gigs.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("can_post_gigs")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setMessage(profileError.message);
        return;
      }

      if (!profile?.can_post_gigs) {
        setMessage("Your account is not approved to post gigs yet.");
        return;
      }

      const { data, error } = await supabase
        .from("gigs")
        .select(
          "id,title,description,category,trust_level,location_type,location_area,pay_type,hourly_rate,fixed_amount,currency,schedule_summary,status,created_at"
        )
        .eq("poster_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      setGigs((data ?? []) as PostedGig[]);
      setMessage("");
    }

    loadPostedGigs();
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
            <a href="/post-gig" className="hidden sm:inline hover:underline">
              Post a gig
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">My posted gigs</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Track the gigs you have posted.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            View your Gigtree listings and their current statuses.
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

            {message.includes("not approved") && (
              <a
                href="/post-request"
                className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
              >
                Request posting access
              </a>
            )}
          </div>
        )}

        {!message && gigs.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No posted gigs yet</h2>
            <p className="mt-3 text-[#42513c]">
              Create your first gig listing.
            </p>
            <a
              href="/post-gig"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              Post a gig
            </a>
          </div>
        )}

        <div className="grid gap-5">
          {gigs.map((gig) => (
            <article
              key={gig.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                      {gig.category}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {formatLocationType(gig.location_type)}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {formatStatus(gig.status)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">{gig.title}</h2>
                  <p className="mt-2 text-[#42513c]">{gig.description}</p>

                  <div className="mt-4 grid gap-2 text-sm text-[#42513c] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Location:
                      </span>{" "}
                      {gig.location_area ?? "Remote UK"}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Pay:
                      </span>{" "}
                      {formatPay(gig)}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Timing:
                      </span>{" "}
                      {gig.schedule_summary ?? "Flexible"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-row gap-2 md:flex-col md:justify-center">
                  <a
                    href={`/posted-gigs/${gig.id}/recommendations`}
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                  >
                    View recommendations
                  </a>
                  <a
                    href={`/gigs/${gig.id}`}
                    className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold"
                  >
                    View public page
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
