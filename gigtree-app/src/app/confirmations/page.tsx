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

function statusText(status: Confirmation["status"]) {
  if (status === "pending_worker_confirmation") {
    return {
      label: "Action needed",
      description:
        "A poster selected your anonymous candidate summary. You need to accept or decline before contact details are revealed.",
      nextStep: "Accept if you still want the gig, or decline if you are no longer available.",
    };
  }

  if (status === "accepted") {
    return {
      label: "Accepted",
      description:
        "You accepted this selected gig. Temporary masked contact details should now be available.",
      nextStep: "Open Contact details to arrange the final details with the poster.",
    };
  }

  if (status === "declined") {
    return {
      label: "Declined",
      description:
        "You declined this selected gig. Your contact details were not revealed.",
      nextStep: "No further action needed.",
    };
  }

  return {
    label: "Expired",
    description:
      "This confirmation has expired and is no longer active.",
    nextStep: "No further action needed.",
  };
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
        status: status === "accepted" ? "accepted_by_worker" : "declined_by_worker",
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

    await loadConfirmations();

    setMessage(
      status === "accepted"
        ? "Gig accepted. Temporary masked contact details are now available."
        : "Gig declined. Your contact details were not revealed."
    );

    setLoadingId("");
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
            <a href="/applications" className="hover:underline">
              My applications
            </a>
            <a href="/contacts" className="hover:underline">
              Contacts
            </a>
            <a href="/status" className="hover:underline">
              Status
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Worker confirmations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Confirm selected gigs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            If a poster selects your anonymous candidate summary, you still
            choose whether to accept before temporary contact details are
            revealed.
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
            <a
              href="/gigs"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              Browse gigs
            </a>
          </div>
        )}

        <div className="grid gap-5">
          {confirmations.map((confirmation) => {
            const info = statusText(confirmation.status);

            return (
              <article
                key={confirmation.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                        {info.label}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {confirmation.gigs?.category ?? "Gig"}
                      </span>
                      <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                        {formatStatus(confirmation.status)}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold">
                      {confirmation.gigs?.title ?? "Unknown gig"}
                    </h2>

                    <div className="mt-4 grid gap-3 text-sm text-[#42513c] sm:grid-cols-3">
                      <p className="rounded-2xl bg-[#f6f8f4] p-4">
                        <span className="block font-semibold text-[#172014]">
                          Location
                        </span>
                        {confirmation.gigs?.location_area ?? "Remote UK"}
                      </p>

                      <p className="rounded-2xl bg-[#f6f8f4] p-4">
                        <span className="block font-semibold text-[#172014]">
                          Pay
                        </span>
                        {formatPay(confirmation)}
                      </p>

                      <p className="rounded-2xl bg-[#f6f8f4] p-4">
                        <span className="block font-semibold text-[#172014]">
                          Timing
                        </span>
                        {confirmation.gigs?.schedule_summary ?? "Flexible"}
                      </p>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4">
                      <p className="font-semibold">What this means</p>
                      <p className="mt-2 text-[#42513c]">{info.description}</p>
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                      <p className="font-semibold text-[#2f6f3e]">Next step</p>
                      <p className="mt-2 text-[#42513c]">{info.nextStep}</p>
                    </div>

                    <div className="mt-3 rounded-2xl border border-black/10 p-4 text-sm text-[#42513c]">
                      Your direct contact details stay hidden until you accept.
                      If you decline, contact is not revealed.
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
                          {loadingId === confirmation.id
                            ? "Accepting..."
                            : "Accept gig"}
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
                    ) : confirmation.status === "accepted" ? (
                      <a
                        href="/contacts"
                        className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                      >
                        View contact details
                      </a>
                    ) : (
                      <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm font-semibold text-[#42513c]">
                        {formatStatus(confirmation.status)}
                      </div>
                    )}

                    <a
                      href="/applications"
                      className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                    >
                      View applications
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
