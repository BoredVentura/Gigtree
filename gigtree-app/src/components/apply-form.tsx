"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ApplyFormProps = {
  gigId: string;
};

export function ApplyForm({ gigId }: ApplyFormProps) {
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!availableFrom || !availableUntil) {
      setMessage("Please choose your available date range.");
      return;
    }

    if (availableUntil < availableFrom) {
      setMessage("Available until must be after available from.");
      return;
    }

    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in before applying.");
      setIsSubmitting(false);
      return;
    }

    const availabilityAnswer = `Available from ${availableFrom} until ${availableUntil}${
      availabilityNote ? `. Notes: ${availabilityNote}` : ""
    }`;

    const experienceAnswer =
      availabilityNote ||
      "Worker has applied with profile experience for admin review.";

    const { error } = await supabase.from("gig_applications").insert({
      gig_id: gigId,
      worker_id: user.id,
      status: "submitted",
      availability_answer: availabilityAnswer,
      experience_answer: experienceAnswer,
      requirements_confirmed: true,
      available_from: availableFrom,
      available_until: availableUntil,
      availability_note: availabilityNote,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Application sent. Gigtree will review your fit for this gig.");
    setAvailableFrom("");
    setAvailableUntil("");
    setAvailabilityNote("");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={submitApplication} className="grid gap-4">
      <div>
        <h3 className="text-xl font-black">Your availability</h3>
        <p className="mt-2 text-sm leading-6 text-[#42513c]">
          Choose the date range when you are available for this gig.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold">Available from</span>
          <input
            type="date"
            value={availableFrom}
            onChange={(event) => setAvailableFrom(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
            required
          />
        </label>

        <label>
          <span className="text-sm font-semibold">Available until</span>
          <input
            type="date"
            value={availableUntil}
            onChange={(event) => setAvailableUntil(event.target.value)}
            min={availableFrom || undefined}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
            required
          />
        </label>
      </div>

      <label>
        <span className="text-sm font-semibold">Availability notes</span>
        <textarea
          value={availabilityNote}
          onChange={(event) => setAvailabilityNote(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
          placeholder="Example: I’m free weekdays after 5pm, or weekends all day."
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Apply for this gig"}
      </button>

      {message && (
        <p className="rounded-2xl bg-[#f6f8f4] p-4 text-sm leading-6 text-[#42513c]">
          {message}
        </p>
      )}
    </form>
  );
}
