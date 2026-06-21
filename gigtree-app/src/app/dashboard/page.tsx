"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SignOutButton from "@/components/sign-out-button";

type Profile = {
  full_name: string | null;
  can_post_gigs: boolean | null;
  is_admin: boolean | null;
  age_confirmed: boolean | null;
};

const cards = [
  {
    title: "Status overview",
    description: "See posted gigs, applications, completions, and payments in one place.",
    href: "/status",
    action: "View status",
  },
  {
    title: "Worker profile",
    description: "Add your skills, availability, location, portfolio, and CV.",
    href: "/profile",
    action: "Edit profile",
  },
  {
    title: "Browse gigs",
    description: "Find local and remote gigs that match your skills.",
    href: "/gigs",
    action: "Browse gigs",
  },
  {
    title: "My applications",
    description: "Track gigs you have applied for and see current statuses.",
    href: "/applications",
    action: "View applications",
  },
  {
    title: "Worker confirmations",
    description: "Accept or decline gigs after a poster selects you.",
    href: "/confirmations",
    action: "View confirmations",
  },
  {
    title: "Contact details",
    description: "View temporary masked contact details for accepted gigs.",
    href: "/contacts",
    action: "View contacts",
  },
  {
    title: "Verification",
    description: "Submit worker verification before payouts are released.",
    href: "/verification",
    action: "Submit verification",
  },
  {
    title: "Completion confirmations",
    description: "Confirm completed gigs before admin payout review.",
    href: "/completions",
    action: "Confirm completion",
  },
  {
    title: "Payments",
    description: "View held payments, pending verification, and payout status.",
    href: "/payments",
    action: "View payments",
  },
  {
    title: "Post a gig request",
    description: "Request approval to post gigs on Gigtree.",
    href: "/post-request",
    action: "Request access",
  },
  {
    title: "Post a gig",
    description: "Create a new gig once your poster access is approved.",
    href: "/post-gig",
    action: "Post gig",
  },
  {
    title: "My posted gigs",
    description: "View gigs you have posted and track recommendations.",
    href: "/posted-gigs",
    action: "View posted gigs",
  },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Loading dashboard...");

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to view your dashboard.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,can_post_gigs,is_admin,age_confirmed")
        .eq("id", user.id)
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setProfile(data as Profile);
      setMessage("");
    }

    loadDashboard();
  }, []);

  const visibleCards = cards.filter((card) => {
    if (card.href === "/post-gig" || card.href === "/posted-gigs") {
      return profile?.can_post_gigs;
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/status" className="hover:underline">
              Status
            </a>
            <a href="/payments" className="hover:underline">
              Payments
            </a>
            <a href="/contacts" className="hover:underline">
              Contacts
            </a>
            <a href="/verification" className="hover:underline">
              Verification
            </a>
            {profile?.is_admin && (
              <a href="/admin" className="font-semibold text-[#2f6f3e] hover:underline">
                Admin
              </a>
            )}
            <SignOutButton />
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Dashboard</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Manage your worker profile, applications, posted gigs, contact
            details, verification, and payments from one place.
          </p>

          {profile?.is_admin && (
            <a
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-3 font-semibold text-white"
            >
              Open admin control centre
            </a>
          )}
        </div>

        {!message && profile && !profile.age_confirmed && (
          <div className="mb-6 rounded-3xl border border-[#d28b28]/30 bg-[#fff7e8] p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Age confirmation needed</h2>
            <p className="mt-3 text-[#42513c]">
              Gigtree is for users aged 18 or over. Please confirm this before
              using the platform fully.
            </p>
            <a
              href="/profile"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              Confirm in profile
            </a>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
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

        {!message && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h2 className="text-2xl font-bold">{card.title}</h2>
                <p className="mt-3 min-h-14 text-[#42513c]">
                  {card.description}
                </p>
                <span className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white">
                  {card.action}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
