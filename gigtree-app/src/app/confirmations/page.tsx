"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Confirmation = {
  id: string;
  gig_id: string;
  application_id: string;
  worker_id: string;
  status: "pending_worker_confirmation" | "accepted" | "declined" | "expired";
  poster_selected_at: string;
  worker_confirmed_at: string | null;
  gigs: {
    title: string;
    category: string;
    location_area: string | null;
    pay_type: "hourly" | "fixed";
    hourly_rate: number | null;
    fixed_amount: number | null;
    schedule_summary: string | null;
    poster_id: string;
  } | null;
};

function formatPay(confirmation: Confirmation) {
  const gig = confirmation.gigs;

  if (!gig) return "Pay TBC";

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

export default function ConfirmationsPage() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [message, setMessage] = useState("Loading confirmations...");
  const [loadingId, setLoadingId] = useState("");

  async function loadConfirmations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view confirmations.");
      return;
    }

    const { data, error } = await supabase
      .from("worker_acceptance_confirmations")
      .select(
        `
        id,
        gig_id,
        application_id,
        worker_id,
        status,
        poster_selected_at,
        worker_confirmed_at,
        gigs (
          title,
          category,
          location_area,
          pay_type,
          hourly_rate,
          fixed_amount,
          schedule_summary,
          poster_id
        )
      `
      )
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setConfirmations((data ?? []) as Confirmation[]);
    setMessage("");
  }

  useEffect(() => {
    loadConfirmations();
  }, []);

  async function updateConfirmation(
    confirmation: Confirmation,
    status: "accepted" | "declined"
  ) {
    setLoadingId(confirmation.id);
    setMessage("");

    const { error: confirmationError } = await supabase
      .from("worker_acceptance_confirmations")
      .update({
        status,
        worker_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", confirmation.id);

    if (confirmationError) {
      setMessage(confirmationError.message);
      setLoadingId("");
      return;
    }

    const { error: applicationError } = await supabase
      .from("gig_applications")
      .update({
        status: status === "accepted" ? "accepted_by_worker" : "cancelled_by_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", confirmation.application_id);

    if (applicationError) {
      setMessage(applicationError.message);
      setLoadingId("");
      return;
    }

    if (status === "accepted") {
      const posterId = confirmation.gigs?.poster_id;

      if (!posterId) {
        setMessage("Accepted, but poster could not be found for contact reveal.");
        setLoadingId("");
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const { error: contactError } = await supabase
        .from("masked_contacts")
        .upsert(
          {
            gig_id: confirmation.gig_id,
            worker_id: confirmation.worker_id,
            poster_id: posterId,
            masked_email: `gig-${confirmation.gig_id.slice(0, 8)}@masked.gigtree.local`,
            masked_phone: "+44 0000 000000",
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: "gig_id,worker_id,poster_id" }
        );

      if (contactError) {
        setMessage(contactError.message);
        setLoadingId("");
        return;
      }
    }

    setConfirmations((current) =>
      current.map((item) =>
        item.id === confirmation.id ? { ...item, status } : item
      )
    );

    setMessage(
      status === "accepted"
        ? "Gig accepted. Next step: controlled contact reveal."
        : "Gig declined."
    );

    setLoadingId("");
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a href="/applications" className="hidden sm:inline hover:underline">
              My applications
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Worker confirmations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Confirm selected gigs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            When a poster selects your anonymous candidate summary, you confirm
            whether you still accept the gig before identity or contact details
            are revealed.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl bg-white p-5 text-[#42513c] shadow-sm">
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

        {!message && confirmations.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No confirmations yet</h2>
            <p className="mt-3 text-[#42513c]">
              Selected gigs will appear here when a poster chooses your
              anonymous candidate summary.
            </p>
          </div>
        )}

        <div className="grid gap-5">
          {confirmations.map((confirmation) => (
            <article
              key={confirmation.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                      {formatStatus(confirmation.status)}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {confirmation.gigs?.category ?? "Gig"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">
                    {confirmation.gigs?.title ?? "Unknown gig"}
                  </h2>

                  <div className="mt-4 grid gap-2 text-sm text-[#42513c] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Location:
                      </span>{" "}
                      {confirmation.gigs?.location_area ?? "Remote UK"}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Pay:
                      </span>{" "}
                      {formatPay(confirmation)}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Timing:
                      </span>{" "}
                      {confirmation.gigs?.schedule_summary ?? "Flexible"}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                    Poster selected your anonymous candidate summary on{" "}
                    {new Date(
                      confirmation.poster_selected_at
                    ).toLocaleDateString()}
                    .
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                  {confirmation.status === "pending_worker_confirmation" ? (
                    <>
                      <button
                        type="button"
                        disabled={loadingId === confirmation.id}
                        onClick={() => updateConfirmation(confirmation, "accepted")}
                        className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        Accept gig
                      </button>
                      <button
                        type="button"
                        disabled={loadingId === confirmation.id}
                        onClick={() => updateConfirmation(confirmation, "declined")}
                        className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm font-semibold text-[#42513c]">
                      {formatStatus(confirmation.status)}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
