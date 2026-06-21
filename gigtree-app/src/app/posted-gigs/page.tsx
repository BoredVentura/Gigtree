"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PostedGig = {
  id: string;
  title: string;
  category: string;
  location_area: string | null;
  pay_type: "hourly" | "fixed";
  hourly_rate: number | null;
  fixed_amount: number | null;
  schedule_summary: string | null;
  status: string;
  created_at: string;
};

type Recommendation = {
  id: string;
  gig_id: string;
  status: string;
};

type Contact = {
  id: string;
  gig_id: string;
};

type Completion = {
  id: string;
  gig_id: string;
  poster_confirmed: boolean;
  admin_confirmed: boolean;
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

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function stageForGig({
  gig,
  recommendations,
  contacts,
  completions,
}: {
  gig: PostedGig;
  recommendations: Recommendation[];
  contacts: Contact[];
  completions: Completion[];
}) {
  const gigRecommendations = recommendations.filter((item) => item.gig_id === gig.id);
  const selectedRecommendation = gigRecommendations.find(
    (item) => item.status === "selected"
  );
  const hasContact = contacts.some((item) => item.gig_id === gig.id);
  const completion = completions.find((item) => item.gig_id === gig.id);

  if (completion?.admin_confirmed) {
    return {
      label: "Admin confirmed completion",
      description: "This gig has been confirmed complete by poster and admin.",
      nextStep: "Track payment status.",
      href: "/payments",
      action: "View payments",
    };
  }

  if (completion?.poster_confirmed) {
    return {
      label: "Waiting for admin completion review",
      description: "You confirmed the job is done. Gigtree admin now needs to review it.",
      nextStep: "Wait for admin review.",
      href: "/status",
      action: "View status",
    };
  }

  if (hasContact) {
    return {
      label: "Contact available",
      description:
        "The worker accepted. Temporary masked contact details are available.",
      nextStep: "Agree final details, then confirm completion after the work is done.",
      href: "/contacts",
      action: "View contacts",
    };
  }

  if (selectedRecommendation) {
    return {
      label: "Candidate selected",
      description:
        "You selected a candidate. The worker now needs to accept or decline.",
      nextStep: "Wait for worker confirmation.",
      href: `/posted-gigs/${gig.id}/recommendations`,
      action: "View selection",
    };
  }

  if (gigRecommendations.length > 0) {
    return {
      label: "Recommendations available",
      description:
        "Gigtree admin has recommended anonymous candidates for this gig.",
      nextStep: "Review candidates and select one.",
      href: `/posted-gigs/${gig.id}/recommendations`,
      action: "Review candidates",
    };
  }

  return {
    label: "Applications under review",
    description:
      "Your gig is live or waiting for Gigtree admin to review applicants.",
    nextStep: "Wait for admin recommendations.",
    href: `/posted-gigs/${gig.id}/recommendations`,
    action: "Check recommendations",
  };
}

export default function PostedGigsPage() {
  const [gigs, setGigs] = useState<PostedGig[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [message, setMessage] = useState("Loading your posted gigs...");

  useEffect(() => {
    async function loadPostedGigs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view posted gigs.");
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
        setMessage("You need poster approval before viewing posted gigs.");
        return;
      }

      const { data: gigData, error: gigError } = await supabase
        .from("gigs")
        .select(
          "id,title,category,location_area,pay_type,hourly_rate,fixed_amount,schedule_summary,status,created_at"
        )
        .eq("poster_id", user.id)
        .order("created_at", { ascending: false });

      if (gigError) {
        setMessage(gigError.message);
        return;
      }

      const postedGigs = (gigData ?? []) as PostedGig[];
      setGigs(postedGigs);

      const gigIds = postedGigs.map((gig) => gig.id);

      if (gigIds.length === 0) {
        setMessage("");
        return;
      }

      const { data: recommendationData } = await supabase
        .from("admin_recommendations")
        .select("id,gig_id,status")
        .in("gig_id", gigIds);

      const { data: contactData } = await supabase
        .from("masked_contacts")
        .select("id,gig_id")
        .in("gig_id", gigIds);

      const { data: completionData } = await supabase
        .from("completion_confirmations")
        .select("id,gig_id,poster_confirmed,admin_confirmed")
        .in("gig_id", gigIds);

      setRecommendations((recommendationData ?? []) as Recommendation[]);
      setContacts((contactData ?? []) as Contact[]);
      setCompletions((completionData ?? []) as Completion[]);
      setMessage("");
    }

    loadPostedGigs();
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
            <a href="/post-gig" className="hover:underline">
              Post gig
            </a>
            <a href="/status" className="hover:underline">
              Status
            </a>
            <a href="/payments" className="hover:underline">
              Payments
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">My posted gigs</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Track gigs you have posted.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            See each gig stage, review admin recommendations, and follow the
            path from candidate selection to contact, completion, and payment.
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

        {!message && gigs.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No posted gigs yet</h2>
            <p className="mt-3 text-[#42513c]">
              Once you post a gig, it will appear here with recommendations and
              next steps.
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
          {gigs.map((gig) => {
            const stage = stageForGig({
              gig,
              recommendations,
              contacts,
              completions,
            });

            return (
              <article
                key={gig.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                        {stage.label}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {gig.category}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {formatStatus(gig.status)}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold">{gig.title}</h2>

                    <div className="mt-4 grid gap-3 text-sm text-[#42513c] sm:grid-cols-3">
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

                    <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
                      <p className="font-semibold">Current stage</p>
                      <p className="mt-2 text-[#42513c]">{stage.description}</p>
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                      <p className="font-semibold text-[#2f6f3e]">
                        Next step
                      </p>
                      <p className="mt-2 text-[#42513c]">{stage.nextStep}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                    <a
                      href={stage.href}
                      className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                    >
                      {stage.action}
                    </a>
                    <a
                      href={`/posted-gigs/${gig.id}/recommendations`}
                      className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                    >
                      Recommendations
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
