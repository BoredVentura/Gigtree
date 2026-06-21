"use client";
import { SiteHeader } from "@/components/site-header";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SignOutButton from "@/components/sign-out-button";

type Profile = {
  id: string;
  full_name: string | null;
  can_post_gigs: boolean;
  is_admin: boolean;
  age_confirmed: boolean;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Loading your dashboard...");

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
      .select("id,full_name,can_post_gigs,is_admin,age_confirmed")
      .eq("id", user.id)
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setProfile(data as Profile);
    setMessage("");
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="dashboard" />

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Dashboard</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Your Gigtree control centre for applications, profile, poster
              tools, verification, contacts, payments, and admin actions.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#42513c]">
                  Account status
                </p>
                <p className="mt-1 text-3xl font-black">
                  {profile?.age_confirmed ? "Ready" : "Confirm 18+"}
                </p>
              </div>

              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#e8f0e4] text-2xl">
                🌱
              </div>
            </div>

            <p className="mt-5 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
              {profile?.age_confirmed
                ? "Your 18+ confirmation is complete."
                : "Confirm you are 18+ in your worker profile."}
            </p>

            <a
              href="/profile"
              className="mt-4 block rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
            >
              Improve profile
            </a>
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

        {profile && (
          <div className="grid gap-8">
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Worker tools</p>
                <h2 className="mt-2 text-3xl font-black">
                  Find and manage gigs.
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  Build your profile, apply privately, track applications, and
                  complete verification.
                </p>

                <div className="mt-6 grid gap-3">
                  <a href="/profile" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Worker profile
                  </a>
                  <a href="/gigs" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Browse gigs
                  </a>
                  <a href="/applications" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    My applications
                  </a>
                  <a href="/confirmations" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Worker confirmations
                  </a>
                  <a href="/verification" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Verification
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Poster tools</p>
                <h2 className="mt-2 text-3xl font-black">
                  Post and manage work.
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  Request access, post gigs after approval, review candidates,
                  and confirm completed work.
                </p>

                <div className="mt-6 grid gap-3">
                  {profile.can_post_gigs ? (
                    <a href="/post-gig" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                      Post a gig
                    </a>
                  ) : (
                    <a href="/post-request" className="rounded-2xl bg-[#fff7e8] p-4 font-semibold hover:bg-[#ffe8b8]">
                      Request poster access
                    </a>
                  )}

                  <a href="/posted-gigs" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    My posted gigs
                  </a>
                  <a href="/contacts" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Contact details
                  </a>
                  <a href="/completions" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Completion confirmations
                  </a>
                  <a href="/payments" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Payments
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">Next steps</p>
                <h2 className="mt-2 text-3xl font-black">
                  Keep your flow moving.
                </h2>

                <div className="mt-6 grid gap-3 text-sm">
                  {!profile.age_confirmed && (
                    <a href="/profile" className="rounded-2xl bg-white/10 p-4 font-semibold hover:bg-white/15">
                      Confirm you are 18+
                    </a>
                  )}

                  <a href="/status" className="rounded-2xl bg-white/10 p-4 font-semibold hover:bg-white/15">
                    View status timeline
                  </a>
                  <a href="/profile" className="rounded-2xl bg-white/10 p-4 font-semibold hover:bg-white/15">
                    Add skills and CV
                  </a>
                  <a href="/verification" className="rounded-2xl bg-white/10 p-4 font-semibold hover:bg-white/15">
                    Submit verification
                  </a>
                  <a href="/gigs" className="rounded-2xl bg-white/10 p-4 font-semibold hover:bg-white/15">
                    Apply for gigs
                  </a>
                </div>
              </div>
            </section>

            {profile.is_admin && (
              <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <p className="font-semibold text-[#2f6f3e]">Admin tools</p>
                    <h2 className="mt-2 text-3xl font-black">
                      Review, approve, and release.
                    </h2>
                    <p className="mt-3 max-w-3xl leading-7 text-[#42513c]">
                      Manage applications, recommendations, verification,
                      completions, payouts, and audit logs.
                    </p>
                  </div>

                  <a
                    href="/admin"
                    className="h-fit rounded-full bg-[#2f6f3e] px-6 py-4 text-center font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
                  >
                    Admin centre
                  </a>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <a href="/admin/applications" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Applications
                  </a>
                  <a href="/admin/recommendations" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Recommendations
                  </a>
                  <a href="/admin/verification" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Verification
                  </a>
                  <a href="/admin/completions" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Completions
                  </a>
                  <a href="/admin/payouts" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Payouts
                  </a>
                  <a href="/admin/audit" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                    Audit logs
                  </a>
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
