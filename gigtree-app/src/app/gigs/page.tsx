"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
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

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [message, setMessage] = useState("Loading gigs...");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");

  async function loadGigs() {
    const { data, error } = await supabase
      .from("gigs")
      .select(
        "id,title,category,description,location_area,pay_type,fixed_amount,hourly_rate,schedule_summary,status,created_at"
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setGigs((data ?? []) as Gig[]);
    setMessage("");
  }

  useEffect(() => {
    loadGigs();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(gigs.map((gig) => gig.category))).filter(Boolean);
    return ["All", ...unique];
  }, [gigs]);

  const filteredGigs = useMemo(() => {
    return gigs.filter((gig) => {
      const matchesCategory =
        categoryFilter === "All" || gig.category === categoryFilter;

      const searchText = `${gig.title} ${gig.category} ${gig.description} ${
        gig.location_area ?? ""
      } ${gig.schedule_summary ?? ""}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [gigs, categoryFilter, search]);

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
              <a href="/dashboard" className="rounded-full px-4 py-2 hover:bg-white">
                Dashboard
              </a>
              <a href="/profile" className="rounded-full px-4 py-2 hover:bg-white">
                Profile
              </a>
              <a href="/login" className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]">
                Sign in
              </a>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2f6f3e] shadow-sm ring-1 ring-black/10">
                Apply privately with your Gigtree profile
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Browse gigs.
                <span className="block text-[#2f6f3e]">Find your next fit.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#42513c]">
                Explore local and online gigs. Apply privately, let admin review
                your profile, and move through the trusted Gigtree flow.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/profile"
                  className="rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 hover:bg-[#255a33]"
                >
                  Improve profile
                </a>
                <a
                  href="/applications"
                  className="rounded-full bg-white px-7 py-4 font-bold shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
                >
                  My applications
                </a>
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <div className="rounded-[1.5rem] bg-[#142014] p-6 text-white">
                <p className="font-semibold text-[#b9f36b]">Worker-first flow</p>
                <h2 className="mt-2 text-3xl font-black">
                  Apply without exposing everything.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Posters see anonymous admin summaries first. Your details stay
                  controlled through the Gigtree process.
                </p>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  1. Build your worker profile.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  2. Apply privately to suitable gigs.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  3. Admin reviews and recommends good fits.
                </p>
              </div>
            </aside>
          </div>

          <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/10">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <label>
                <span className="text-sm font-semibold">Search gigs</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                  placeholder="Search by title, skill, category, location..."
                />
              </label>

              <label className="lg:w-72">
                <span className="text-sm font-semibold">Category</span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    categoryFilter === category
                      ? "bg-[#2f6f3e] text-white"
                      : "bg-[#f6f8f4] text-[#42513c] hover:bg-[#e8f0e4]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {message && (
            <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm ring-1 ring-black/10">
              {message}
            </div>
          )}

          {!message && gigs.length === 0 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">No open gigs yet</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
                New gigs will appear here when approved posters create them.
                Build your worker profile now so you are ready to apply.
              </p>

              <a
                href="/profile"
                className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
              >
                Build profile
              </a>
            </div>
          )}

          {!message && gigs.length > 0 && filteredGigs.length === 0 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">No matching gigs</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
                Try a different search or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("All");
                }}
                className="mt-6 rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredGigs.length > 0 && (
            <section className="pb-16">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Open gigs</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {filteredGigs.length} showing
                </span>
              </div>

              <div className="grid gap-5">
                {filteredGigs.map((gig) => (
                  <article
                    key={gig.id}
                    className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                            {gig.category}
                          </span>
                          <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                            {formatPay(gig)}
                          </span>
                          <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                            {formatStatus(gig.status)}
                          </span>
                          <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                            Posted {new Date(gig.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black">{gig.title}</h3>

                        <p className="mt-3 line-clamp-3 leading-7 text-[#42513c]">
                          {gig.description}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-2">
                          <p className="rounded-2xl bg-[#f6f8f4] p-4">
                            <span className="block font-semibold text-[#142014]">
                              Location
                            </span>
                            {gig.location_area ?? "Remote / not set"}
                          </p>

                          <p className="rounded-2xl bg-[#f6f8f4] p-4">
                            <span className="block font-semibold text-[#142014]">
                              Timing
                            </span>
                            {gig.schedule_summary ?? "Flexible"}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                        <a
                          href={`/gigs/${gig.id}`}
                          className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                        >
                          View and apply
                        </a>

                        <a
                          href="/profile"
                          className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                        >
                          Improve profile
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
