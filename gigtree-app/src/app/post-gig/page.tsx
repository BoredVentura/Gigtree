"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PostGigPage() {
  const [userId, setUserId] = useState("");
  const [canPost, setCanPost] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Events");
  const [trustLevel, setTrustLevel] = useState<"low" | "medium" | "high">("low");
  const [locationType, setLocationType] = useState<"online" | "in_person">("online");
  const [locationArea, setLocationArea] = useState("");
  const [payType, setPayType] = useState<"hourly" | "fixed">("fixed");
  const [payAmount, setPayAmount] = useState("");
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [requirements, setRequirements] = useState("");

  const [message, setMessage] = useState("Checking posting access...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to post a gig.");
        setCheckingAccess(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("can_post_gigs,age_confirmed")
        .eq("id", user.id)
        .single();

      if (error) {
        setMessage(error.message);
        setCheckingAccess(false);
        return;
      }

      if (!data?.can_post_gigs) {
        setMessage("Your account is not approved to post gigs yet.");
        setCheckingAccess(false);
        return;
      }

      setCanPost(true);
      setMessage("");
      setCheckingAccess(false);
    }

    checkAccess();
  }, []);

  async function createGig() {
    if (!userId || !canPost) {
      setMessage("You are not approved to post gigs.");
      return;
    }

    if (!title.trim() || !description.trim() || !payAmount.trim()) {
      setMessage("Please enter a title, description, and pay amount.");
      return;
    }

    setLoading(true);
    setMessage("");

    const amount = Number(payAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Please enter a valid pay amount.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("gigs").insert({
      poster_id: userId,
      title,
      description,
      category,
      trust_level: trustLevel,
      location_type: locationType,
      location_area: locationArea || (locationType === "online" ? "Remote UK" : null),
      pay_type: payType,
      hourly_rate: payType === "hourly" ? amount : null,
      fixed_amount: payType === "fixed" ? amount : null,
      currency: "GBP",
      schedule_summary: scheduleSummary,
      requirements: requirements
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      status: "open",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Gig posted successfully.");
      setTitle("");
      setDescription("");
      setCategory("Events");
      setTrustLevel("low");
      setLocationType("online");
      setLocationArea("");
      setPayType("fixed");
      setPayAmount("");
      setScheduleSummary("");
      setRequirements("");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-4xl px-6 py-8">
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
          <p className="font-semibold text-[#2f6f3e]">Post a gig</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Create a new Gigtree listing.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Approved posters can publish online or in-person gigs. High-trust
            gigs can require worker verification before applying.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm">
            {message}

            {message.includes("sign in") && (
              <a
                href="/login"
                className="mt-4 block rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
              >
                Sign in
              </a>
            )}

            {message.includes("not approved") && (
              <a
                href="/post-request"
                className="mt-4 block rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
              >
                Request posting access
              </a>
            )}
          </div>
        )}

        {!checkingAccess && canPost && (
          <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <label className="text-sm font-semibold">Gig title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                placeholder="Example: Event assistant needed"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                placeholder="Describe the gig clearly"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                >
                  <option>Events</option>
                  <option>Admin</option>
                  <option>Retail</option>
                  <option>Creative</option>
                  <option>Care</option>
                  <option>Driving</option>
                  <option>Home help</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Trust level</label>
                <select
                  value={trustLevel}
                  onChange={(event) =>
                    setTrustLevel(event.target.value as "low" | "medium" | "high")
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                >
                  <option value="low">Low trust</option>
                  <option value="medium">Medium trust</option>
                  <option value="high">High trust - verification required</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Location type</label>
                <select
                  value={locationType}
                  onChange={(event) =>
                    setLocationType(event.target.value as "online" | "in_person")
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                >
                  <option value="online">Online</option>
                  <option value="in_person">In-person</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Location area</label>
                <input
                  value={locationArea}
                  onChange={(event) => setLocationArea(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Example: Manchester or Remote UK"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Pay type</label>
                <select
                  value={payType}
                  onChange={(event) =>
                    setPayType(event.target.value as "hourly" | "fixed")
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                >
                  <option value="fixed">Fixed price</option>
                  <option value="hourly">Hourly rate</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Pay amount GBP</label>
                <input
                  value={payAmount}
                  onChange={(event) => setPayAmount(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Example: 90"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Schedule summary</label>
              <input
                value={scheduleSummary}
                onChange={(event) => setScheduleSummary(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                placeholder="Example: Saturday afternoon or complete within 3 days"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Requirements</label>
              <textarea
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                placeholder={"Enter one requirement per line\nExample: Confident speaking with guests"}
              />
            </div>

            <button
              type="button"
              onClick={createGig}
              disabled={loading}
              className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Posting..." : "Post gig"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
