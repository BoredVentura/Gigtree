"use client";
import { SiteHeader } from "@/components/site-header";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  can_post_gigs: boolean;
  age_confirmed: boolean;
};

type PayType = "fixed" | "hourly";

export default function PostGigPage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General help");
  const [description, setDescription] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [payType, setPayType] = useState<PayType>("fixed");
  const [fixedAmount, setFixedAmount] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState("");

  const [message, setMessage] = useState("Loading posting access...");
  const [saving, setSaving] = useState(false);

  async function loadAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to post a gig.");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,can_post_gigs,age_confirmed")
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
    loadAccess();
  }, []);

  function resetForm() {
    setTitle("");
    setCategory("General help");
    setDescription("");
    setLocationArea("");
    setIsRemote(false);
    setPayType("fixed");
    setFixedAmount("");
    setHourlyRate("");
    setScheduleSummary("");
  }

  async function submitGig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    if (!profile?.can_post_gigs) {
      setMessage("You need admin approval before posting gigs.");
      return;
    }

    if (!title.trim() || !description.trim() || !scheduleSummary.trim()) {
      setMessage("Please add a title, description, and timing.");
      return;
    }

    if (!isRemote && !locationArea.trim()) {
      setMessage("Please add a location area, or mark this gig as remote.");
      return;
    }

    if (payType === "fixed" && !fixedAmount) {
      setMessage("Please add a fixed amount.");
      return;
    }

    if (payType === "hourly" && !hourlyRate) {
      setMessage("Please add an hourly rate.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("gigs").insert({
      poster_id: userId,
      title,
      category,
      description,
      location_type: isRemote ? "remote" : "in_person",
      location_area: isRemote ? null : locationArea,
      pay_type: payType,
      fixed_amount: payType === "fixed" ? Number(fixedAmount) : null,
      hourly_rate: payType === "hourly" ? Number(hourlyRate) : null,
      schedule_summary: scheduleSummary,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    resetForm();
    setMessage("Gig posted. Workers can now apply privately.");
    setSaving(false);
  }

  const canPost = Boolean(profile?.can_post_gigs);

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="post" />

          <div className="grid gap-10 py-16 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2f6f3e] shadow-sm ring-1 ring-black/10">
                Create a clear, trusted gig
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Post work.
                <span className="block text-[#2f6f3e]">Get better applicants.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#42513c]">
                Describe the work clearly so Gigtree can help review applicants
                and recommend suitable workers privately.
              </p>

              <div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Clear brief</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Explain what needs doing.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Private apply</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Workers apply through Gigtree.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Admin review</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Candidates are reviewed first.
                  </p>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <div className="rounded-[1.5rem] bg-[#142014] p-6 text-white">
                <p className="font-semibold text-[#b9f36b]">Posting status</p>
                <h2 className="mt-2 text-3xl font-black">
                  {canPost ? "Approved to post" : "Access required"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {canPost
                    ? "You can create gigs for workers to apply to."
                    : "Gigtree requires admin approval before posting gigs."}
                </p>
              </div>

              {!canPost && (
                <a
                  href="/post-request"
                  className="mt-5 block rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                >
                  Request poster access
                </a>
              )}

              <div className="mt-5 rounded-2xl bg-[#e8f0e4] p-4">
                <p className="font-semibold text-[#2f6f3e]">After posting</p>
                <p className="mt-2 text-sm text-[#42513c]">
                  Workers apply privately. Admin reviews applicants and creates
                  anonymous candidate summaries for you.
                </p>
              </div>
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

          {userId && canPost && (
            <section className="grid gap-8 pb-16 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={submitGig}
                className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
              >
                <p className="font-semibold text-[#2f6f3e]">Gig form</p>
                <h2 className="mt-2 text-3xl font-black">
                  Tell workers what you need.
                </h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  A clear gig helps workers decide whether they are a good fit
                  and helps admin review applicants properly.
                </p>

                <div className="mt-6 grid gap-5">
                  <label>
                    <span className="text-sm font-semibold">Gig title</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Example: Weekend event helper needed"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Category</span>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                    >
                      <option>General help</option>
                      <option>Home help</option>
                      <option>Events</option>
                      <option>Cleaning</option>
                      <option>Gardening</option>
                      <option>Admin</option>
                      <option>Design</option>
                      <option>Writing</option>
                      <option>Remote work</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Description</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="mt-2 min-h-44 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Describe the work, expectations, tools needed, location details, and anything the worker should know."
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4">
                      <input
                        type="checkbox"
                        checked={isRemote}
                        onChange={(event) => setIsRemote(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold">Remote gig</span>
                        <span className="text-sm text-[#42513c]">
                          Worker can complete this online.
                        </span>
                      </span>
                    </label>

                    <label>
                      <span className="text-sm font-semibold">
                        Location area
                      </span>
                      <input
                        value={locationArea}
                        onChange={(event) => setLocationArea(event.target.value)}
                        disabled={isRemote}
                        className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none disabled:opacity-50 focus:border-[#2f6f3e]"
                        placeholder="Example: Luton, London, Remote UK"
                      />
                    </label>
                  </div>

                  <label>
                    <span className="text-sm font-semibold">Timing</span>
                    <textarea
                      value={scheduleSummary}
                      onChange={(event) => setScheduleSummary(event.target.value)}
                      className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Example: Saturday 10am–4pm, or flexible within the next two weeks."
                    />
                  </label>

                  <div className="rounded-[1.5rem] bg-[#f6f8f4] p-5">
                    <p className="font-semibold">Pay</p>
                    <p className="mt-1 text-sm text-[#42513c]">
                      Set a clear amount. Payments are handled through the
                      Gigtree flow.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setPayType("fixed")}
                        className={`rounded-full px-4 py-3 text-sm font-bold ${
                          payType === "fixed"
                            ? "bg-[#2f6f3e] text-white"
                            : "text-[#42513c]"
                        }`}
                      >
                        Fixed
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayType("hourly")}
                        className={`rounded-full px-4 py-3 text-sm font-bold ${
                          payType === "hourly"
                            ? "bg-[#2f6f3e] text-white"
                            : "text-[#42513c]"
                        }`}
                      >
                        Hourly
                      </button>
                    </div>

                    {payType === "fixed" ? (
                      <label className="mt-4 block">
                        <span className="text-sm font-semibold">
                          Fixed amount (£)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={fixedAmount}
                          onChange={(event) => setFixedAmount(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white p-4 outline-none focus:border-[#2f6f3e]"
                          placeholder="Example: 120"
                        />
                      </label>
                    ) : (
                      <label className="mt-4 block">
                        <span className="text-sm font-semibold">
                          Hourly rate (£)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={hourlyRate}
                          onChange={(event) => setHourlyRate(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white p-4 outline-none focus:border-[#2f6f3e]"
                          placeholder="Example: 15"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 disabled:opacity-50"
                >
                  {saving ? "Posting..." : "Post gig"}
                </button>
              </form>

              <aside className="grid h-fit gap-5">
                <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                  <p className="font-semibold text-[#b9f36b]">
                    Strong gig posts
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    Make the work easy to understand.
                  </h2>
                  <p className="mt-4 leading-7 text-white/70">
                    The clearer the brief, the easier it is for workers to apply
                    and for admin to recommend the best candidates.
                  </p>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                  <h2 className="text-2xl font-black">Include</h2>
                  <div className="mt-4 grid gap-3 text-sm text-[#42513c]">
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      What the worker needs to do.
                    </p>
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      Timing, location, and expected hours.
                    </p>
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      Skills, tools, or experience needed.
                    </p>
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      Clear pay and any practical details.
                    </p>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-[#fff7e8] p-6 shadow-sm ring-1 ring-black/10">
                  <h2 className="text-2xl font-black">What happens next</h2>
                  <p className="mt-3 leading-7 text-[#42513c]">
                    Workers apply privately. Admin reviews applications and
                    prepares anonymous Candidate A/B summaries for you.
                  </p>
                </div>
              </aside>
            </section>
          )}

          {userId && !canPost && !message && (
            <section className="pb-16">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <h2 className="text-3xl font-black">Poster access required</h2>
                <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
                  You need admin approval before posting gigs. This keeps the
                  marketplace safer and helps protect workers.
                </p>

                <a
                  href="/post-request"
                  className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
                >
                  Request poster access
                </a>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
