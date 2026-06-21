"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ApplyForm } from "@/components/apply-form";

type Gig = {
  id: string;
  poster_id: string;
  title: string;
  category: string;
  description: string;
  location_area: string | null;
  pay_type: string;
  fixed_amount: number | null;
  hourly_rate: number | null;
  schedule_summary: string | null;
  status: string;
  created_at: string;
};

function formatPay(gig: Gig) {
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

export default function GigDetailPage() {
  const params = useParams();
  const gigId = params.id as string;

  const [gig, setGig] = useState<Gig | null>(null);
  const [message, setMessage] = useState("Loading gig...");
  const [userId, setUserId] = useState("");

  async function loadGig() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? "");

    const { data, error } = await supabase
      .from("gigs")
      .select(
        "id,poster_id,title,category,description,location_area,pay_type,fixed_amount,hourly_rate,schedule_summary,status,created_at"
      )
      .eq("id", gigId)
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setGig(data as Gig);
    setMessage("");
  }

  useEffect(() => {
    loadGig();
  }, [gigId]);

  const isPoster = useMemo(() => {
    return Boolean(gig && userId && gig.poster_id === userId);
  }, [gig, userId]);

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f6f3e] text-xl text-white shadow-lg shadow-[#2f6f3e]/20">
                ✦
              </span>
              <span className="text-2xl font-black tracking-tight">Gigtree</span>
            </a>

            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
              <a href="/gigs" className="rounded-full px-4 py-2 hover:bg-white">
                Browse gigs
              </a>
              <a href="/dashboard" className="rounded-full px-4 py-2 hover:bg-white">
                Dashboard
              </a>
              <a href="/profile" className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]">
                Profile
              </a>
            </div>
          </nav>

          {message && (
            <div className="mt-10 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm ring-1 ring-black/10">
              {message}
            </div>
          )}

          {!message && gig && (
            <div className="grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
              <section>
                <div className="mb-6 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white px-4 py-2 font-bold text-[#2f6f3e] shadow-sm ring-1 ring-black/10">
                    {gig.category}
                  </span>
                  <span className="rounded-full bg-white px-4 py-2 font-bold text-[#42513c] shadow-sm ring-1 ring-black/10">
                    {formatStatus(gig.status)}
                  </span>
                  <span className="rounded-full bg-white px-4 py-2 font-bold text-[#42513c] shadow-sm ring-1 ring-black/10">
                    Posted {new Date(gig.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                  {gig.title}
                </h1>

                <p className="mt-7 max-w-3xl whitespace-pre-line text-lg leading-8 text-[#42513c]">
                  {gig.description}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/10">
                    <p className="text-sm font-semibold text-[#42513c]">Pay</p>
                    <p className="mt-2 text-3xl font-black text-[#2f6f3e]">
                      {formatPay(gig)}
                    </p>
                  </div>

                  <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/10">
                    <p className="text-sm font-semibold text-[#42513c]">Location</p>
                    <p className="mt-2 text-2xl font-black">
                      {gig.location_area ?? "Remote / not set"}
                    </p>
                  </div>

                  <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/10">
                    <p className="text-sm font-semibold text-[#42513c]">Timing</p>
                    <p className="mt-2 text-2xl font-black">
                      {gig.schedule_summary ?? "Flexible"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                  <h2 className="text-3xl font-black">How applying works</h2>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-[#f6f8f4] p-4">
                      <p className="font-bold text-[#142014]">1. Apply privately</p>
                      <p className="mt-2 text-sm leading-6 text-[#42513c]">
                        Your application is linked to your Gigtree profile.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f6f8f4] p-4">
                      <p className="font-bold text-[#142014]">2. Admin reviews</p>
                      <p className="mt-2 text-sm leading-6 text-[#42513c]">
                        Gigtree reviews applicants and prepares anonymous summaries.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f6f8f4] p-4">
                      <p className="font-bold text-[#142014]">3. Poster chooses</p>
                      <p className="mt-2 text-sm leading-6 text-[#42513c]">
                        If selected, you confirm before contact details open.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                  <h2 className="text-3xl font-black">Safety notes</h2>
                  <div className="mt-5 grid gap-3 text-sm text-white/75 md:grid-cols-2">
                    <p className="rounded-2xl bg-white/10 p-4">
                      Keep communication inside the Gigtree flow until contact opens.
                    </p>
                    <p className="rounded-2xl bg-white/10 p-4">
                      Do not share sensitive personal documents directly with posters.
                    </p>
                    <p className="rounded-2xl bg-white/10 p-4">
                      For in-person gigs, only attend safe and agreed locations.
                    </p>
                    <p className="rounded-2xl bg-white/10 p-4">
                      Payment release depends on completion confirmation and verification.
                    </p>
                  </div>
                </div>
              </section>

              <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
                <div className="rounded-[1.5rem] bg-[#e8f0e4] p-5">
                  <p className="font-semibold text-[#2f6f3e]">Apply for this gig</p>
                  <h2 className="mt-2 text-3xl font-black">
                    Send your interest.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#42513c]">
                    The poster will not immediately see your full identity, CV,
                    or contact details. Admin reviews and recommends suitable
                    candidates first.
                  </p>
                </div>

                {gig.status !== "open" && (
                  <div className="mt-5 rounded-2xl bg-[#fff7e8] p-4 text-sm leading-6 text-[#42513c]">
                    This gig is not currently open for new applications.
                  </div>
                )}

                {isPoster && (
                  <div className="mt-5 rounded-2xl bg-[#fff7e8] p-4 text-sm leading-6 text-[#42513c]">
                    You posted this gig, so you cannot apply to it as a worker.
                  </div>
                )}

                {!userId && (
                  <div className="mt-5 rounded-2xl bg-[#fff7e8] p-4">
                    <p className="text-sm leading-6 text-[#42513c]">
                      Please sign in before applying.
                    </p>
                    <a
                      href="/login"
                      className="mt-4 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
                    >
                      Sign in
                    </a>
                  </div>
                )}

                {userId && !isPoster && gig.status === "open" && (
                  <div className="mt-5">
                    <ApplyForm gigId={gig.id} />
                  </div>
                )}

                <div className="mt-6 grid gap-3 text-sm text-[#42513c]">
                  <a
                    href="/profile"
                    className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]"
                  >
                    Improve your worker profile →
                  </a>
                  <a
                    href="/applications"
                    className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]"
                  >
                    View your applications →
                  </a>
                  <a
                    href="/gigs"
                    className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]"
                  >
                    Browse more gigs →
                  </a>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
