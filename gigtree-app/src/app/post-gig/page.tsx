"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PostGigPage() {
  const [canPost, setCanPost] = useState(false);
  const [message, setMessage] = useState("Checking poster access...");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Home help");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<"remote" | "in_person" | "hybrid">("in_person");
  const [locationArea, setLocationArea] = useState("");
  const [payType, setPayType] = useState<"hourly" | "fixed">("hourly");
  const [hourlyRate, setHourlyRate] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState("");

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in before posting a gig.");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("can_post_gigs")
        .eq("id", user.id)
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!profile?.can_post_gigs) {
        setMessage("You need Gigtree approval before posting gigs.");
        setCanPost(false);
        return;
      }

      setCanPost(true);
      setMessage("");
    }

    checkAccess();
  }, []);

  async function createGig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in before posting a gig.");
      setLoading(false);
      return;
    }

    if (!title || !category || !description || !scheduleSummary) {
      setMessage("Please complete the title, category, description, and timing.");
      setLoading(false);
      return;
    }

    if (locationType !== "remote" && !locationArea) {
      setMessage("Please add the location area for in-person or hybrid gigs.");
      setLoading(false);
      return;
    }

    if (payType === "hourly" && !hourlyRate) {
      setMessage("Please add an hourly rate.");
      setLoading(false);
      return;
    }

    if (payType === "fixed" && !fixedAmount) {
      setMessage("Please add a fixed amount.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("gigs").insert({
      poster_id: user.id,
      title,
      category,
      description,
      location_type: locationType,
      location_area: locationType === "remote" ? null : locationArea,
      pay_type: payType,
      hourly_rate: payType === "hourly" ? Number(hourlyRate) : null,
      fixed_amount: payType === "fixed" ? Number(fixedAmount) : null,
      schedule_summary: scheduleSummary,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setTitle("");
    setCategory("Home help");
    setDescription("");
    setLocationType("in_person");
    setLocationArea("");
    setPayType("hourly");
    setHourlyRate("");
    setFixedAmount("");
    setScheduleSummary("");

    setMessage("Gig posted. Gigtree can now review applicants and recommend candidates.");
    setLoading(false);
  }

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
            <a href="/posted-gigs" className="hover:underline">
              My posted gigs
            </a>
            <a href="/post-request" className="hover:underline">
              Poster access
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Post a gig</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Create a clear, safe gig.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
              Tell workers what the job involves, where it happens, when it is
              needed, and how much it pays. Gigtree manages applications,
              recommendations, confirmation, contact, and payment flow.
            </p>

            {message && (
              <div className="mt-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm">
                {message}
                {message.includes("sign in") && (
                  <a
                    href="/login"
                    className="mt-4 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
                  >
                    Sign in
                  </a>
                )}
                {message.includes("approval") && (
                  <a
                    href="/post-request"
                    className="mt-4 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
                  >
                    Request poster access
                  </a>
                )}
              </div>
            )}

            {canPost && (
              <form
                onSubmit={createGig}
                className="mt-8 grid gap-5 rounded-3xl bg-white p-6 shadow-sm"
              >
                <label>
                  <span className="text-sm font-semibold">Gig title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Example: Clean a flat in London"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                  >
                    <option>Home help</option>
                    <option>Events</option>
                    <option>Admin</option>
                    <option>Creative</option>
                    <option>Tech</option>
                    <option>Delivery</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-semibold">Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="mt-2 min-h-36 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Describe the work, expected tasks, tools needed, and any safety details."
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold">Location type</span>
                    <select
                      value={locationType}
                      onChange={(event) =>
                        setLocationType(event.target.value as "remote" | "in_person" | "hybrid")
                      }
                      className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    >
                      <option value="in_person">In person</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Location area</span>
                    <input
                      value={locationArea}
                      onChange={(event) => setLocationArea(event.target.value)}
                      disabled={locationType === "remote"}
                      className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
                      placeholder="Example: London, Manchester, Remote UK"
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <label>
                    <span className="text-sm font-semibold">Pay type</span>
                    <select
                      value={payType}
                      onChange={(event) =>
                        setPayType(event.target.value as "hourly" | "fixed")
                      }
                      className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Hourly rate (£)</span>
                    <input
                      type="number"
                      min="0"
                      value={hourlyRate}
                      onChange={(event) => setHourlyRate(event.target.value)}
                      disabled={payType !== "hourly"}
                      className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
                      placeholder="15"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Fixed amount (£)</span>
                    <input
                      type="number"
                      min="0"
                      value={fixedAmount}
                      onChange={(event) => setFixedAmount(event.target.value)}
                      disabled={payType !== "fixed"}
                      className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
                      placeholder="100"
                    />
                  </label>
                </div>

                <label>
                  <span className="text-sm font-semibold">Timing / schedule</span>
                  <input
                    value={scheduleSummary}
                    onChange={(event) => setScheduleSummary(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Example: Sunday afternoon, flexible this week, 2 hours"
                  />
                </label>

                <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                  <p className="font-semibold text-[#172014]">Before posting</p>
                  <p className="mt-2">
                    Do not post unlawful, unsafe, discriminatory, misleading, or
                    exploitative work. Contact details stay hidden until the
                    Gigtree selection and confirmation flow is complete.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#2f6f3e] px-6 py-4 font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "Posting..." : "Post gig"}
                </button>
              </form>
            )}
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">What happens next?</h2>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="font-semibold">1. Workers apply</p>
                <p className="mt-1 text-sm text-[#42513c]">
                  Applicants submit private applications to Gigtree.
                </p>
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="font-semibold">2. Admin recommends</p>
                <p className="mt-1 text-sm text-[#42513c]">
                  Gigtree reviews applicants and sends anonymous summaries.
                </p>
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="font-semibold">3. You select a candidate</p>
                <p className="mt-1 text-sm text-[#42513c]">
                  The worker then confirms they still want the gig.
                </p>
              </div>

              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="font-semibold">4. Contact and completion</p>
                <p className="mt-1 text-sm text-[#42513c]">
                  Temporary contact is revealed, then completion and payment are
                  handled through Gigtree.
                </p>
              </div>
            </div>

            <a
              href="/posted-gigs"
              className="mt-6 inline-block rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
            >
              View my posted gigs
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
