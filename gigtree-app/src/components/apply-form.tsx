"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function ApplyForm({ gigId }: { gigId: string }) {
  const [availability, setAvailability] = useState("");
  const [experience, setExperience] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitApplication() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in before applying.");
      setLoading(false);
      return;
    }

    if (!availability.trim() || !experience.trim() || !confirmed) {
      setMessage("Please complete all fields and confirm the requirements.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("gig_applications").insert({
      gig_id: gigId,
      worker_id: user.id,
      availability_answer: availability,
      experience_answer: experience,
      requirements_confirmed: confirmed,
      status: "submitted",
    });

    if (error) {
      if (error.code === "23505") {
        setMessage("You have already applied for this gig.");
      } else {
        setMessage(error.message);
      }
    } else {
      setMessage("Application submitted. Gigtree will review it before making recommendations.");
      setAvailability("");
      setExperience("");
      setConfirmed(false);
    }

    setLoading(false);
  }

  return (
    <form className="mt-6 space-y-4">
      <div>
        <label className="text-sm font-semibold">Availability</label>
        <input
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
          placeholder="When are you available?"
        />
      </div>

      <div>
        <label className="text-sm font-semibold">Relevant experience</label>
        <textarea
          value={experience}
          onChange={(event) => setExperience(event.target.value)}
          className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
          placeholder="Briefly describe relevant experience"
        />
      </div>

      <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span>
          I confirm I meet the requirements and understand that Gigtree may
          review my application before recommending me.
        </span>
      </label>

      {message && (
        <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
          {message}
        </div>
      )}

      {message === "Please sign in before applying." && (
        <a
          href="/login"
          className="block rounded-full border border-black/10 px-5 py-3 text-center font-semibold"
        >
          Sign in to apply
        </a>
      )}

      <button
        type="button"
        onClick={submitApplication}
        disabled={loading}
        className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
