"use client";
import { SiteHeader } from "@/components/site-header";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Confirmation = {
  id: string;
  gig_id: string;
  application_id: string;
  worker_id: string;
  status: string;
  created_at: string;
};

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
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPay(gig?: Gig) {
  if (!gig) return "Pay not set";

  if (gig.pay_type === "hourly") {
    return `£${gig.hourly_rate ?? 0}/hour`;
  }

  return `£${gig.fixed_amount ?? 0} fixed`;
}

function confirmationInfo(status: string) {
  switch (status) {
    case "waiting_for_worker":
      return {
        label: "Waiting for your decision",
        description:
          "The poster selected you. You need to accept or decline before contact opens.",
        nextStep:
          "Accept only if you can complete the gig. Decline if you are no longer available.",
      };
    case "accepted_by_worker":
      return {
        label: "Accepted",
        description:
          "You accepted this gig. Temporary contact details should now be available.",
        nextStep:
          "Use contact details to coordinate the work, then follow completion and payment steps.",
      };
    case "declined_by_worker":
      return {
        label: "Declined",
        description:
          "You declined this gig after being selected.",
        nextStep:
          "No further action needed. You can browse and apply for other gigs.",
      };
    default:
      return {
        label: formatStatus(status),
        description:
          "This confirmation has an updated status.",
        nextStep:
          "Check your dashboard for next steps.",
      };
  }
}

export default function ConfirmationsPage() {
  const [userId, setUserId] = useState("");
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [message, setMessage] = useState("Loading worker confirmations...");
  const [loadingId, setLoadingId] = useState("");

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to view worker confirmations.");
      return;
    }

    setUserId(user.id);

    const { data: confirmationData, error: confirmationError } = await supabase
      .from("worker_acceptance_confirmations")
      .select("id,gig_id,application_id,worker_id,status,created_at")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    if (confirmationError) {
      setMessage(confirmationError.message);
      return;
    }

    const loadedConfirmations = (confirmationData ?? []) as Confirmation[];
    setConfirmations(loadedConfirmations);

    const gigIds = loadedConfirmations.map((confirmation) => confirmation.gig_id);

    if (gigIds.length === 0) {
      setGigs([]);
      setMessage("");
      return;
    }

    const { data: gigData, error: gigError } = await supabase
      .from("gigs")
      .select(
        "id,poster_id,title,category,description,location_area,pay_type,fixed_amount,hourly_rate,schedule_summary"
      )
      .in("id", gigIds);

    if (gigError) {
      setMessage(gigError.message);
      return;
    }

    setGigs((gigData ?? []) as Gig[]);
    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  const gigById = useMemo(() => {
    const map = new Map<string, Gig>();

    for (const gig of gigs) {
      map.set(gig.id, gig);
    }

    return map;
  }, [gigs]);

  async function acceptGig(confirmation: Confirmation) {
    const confirmed = window.confirm(
      "Accept this selected gig?\n\nOnly accept if you are available and willing to complete the work."
    );

    if (!confirmed) return;

    setLoadingId(confirmation.id);
    setMessage("");

    const { error: confirmationError } = await supabase
      .from("worker_acceptance_confirmations")
      .update({
        status: "accepted_by_worker",
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
        status: "accepted_by_worker",
        updated_at: new Date().toISOString(),
      })
      .eq("id", confirmation.application_id);

    if (applicationError) {
      setMessage(applicationError.message);
      setLoadingId("");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await supabase.from("masked_contacts").upsert(
      {
        gig_id: confirmation.gig_id,
        poster_id: gigById.get(confirmation.gig_id)?.poster_id,
        worker_id: confirmation.worker_id,
        masked_email: `contact-${confirmation.gig_id.slice(0, 8)}@gigtree.local`,
        masked_phone: "Available through Gigtree",
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "gig_id" }
    );

    await loadData();
    setMessage("Gig accepted. Contact details can now open in the contact page.");
    setLoadingId("");
  }

  async function declineGig(confirmation: Confirmation) {
    const confirmed = window.confirm(
      "Decline this selected gig?\n\nThe poster may need to choose another candidate."
    );

    if (!confirmed) return;

    setLoadingId(confirmation.id);
    setMessage("");

    const { error: confirmationError } = await supabase
      .from("worker_acceptance_confirmations")
      .update({
        status: "declined_by_worker",
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
        status: "declined_by_worker",
        updated_at: new Date().toISOString(),
      })
      .eq("id", confirmation.application_id);

    if (applicationError) {
      setMessage(applicationError.message);
      setLoadingId("");
      return;
    }

    await loadData();
    setMessage("Gig declined. You can browse and apply for other gigs.");
    setLoadingId("");
  }

  const pendingConfirmations = confirmations.filter(
    (confirmation) => confirmation.status === "waiting_for_worker"
  );

  const decidedConfirmations = confirmations.filter(
    (confirmation) => confirmation.status !== "waiting_for_worker"
  );

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="applications" />

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Worker confirmations</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Accept or decline selected gigs.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              When a poster chooses you, you still get the final say. Accept if
              you can complete the work, or decline if you are no longer
              available.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-2xl font-black">What accepting means</h2>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                1. You confirm you want the gig.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                2. Temporary contact can open.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                3. You coordinate and complete the work.
              </p>
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                4. Completion and verification support payout release.
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

        {userId && confirmations.length === 0 && !message && (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <h2 className="text-3xl font-black">No confirmations yet</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[#42513c]">
              Selected gigs will appear here when a poster chooses you from an
              admin recommendation.
            </p>

            <a
              href="/gigs"
              className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-6 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20"
            >
              Browse gigs
            </a>
          </div>
        )}

        {userId && confirmations.length > 0 && (
          <div className="grid gap-8 pb-16">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Needs your decision</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {pendingConfirmations.length} pending
                </span>
              </div>

              {pendingConfirmations.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No selected gigs currently need your decision.
                </div>
              ) : (
                <div className="grid gap-5">
                  {pendingConfirmations.map((confirmation) => {
                    const gig = gigById.get(confirmation.gig_id);
                    const info = confirmationInfo(confirmation.status);

                    return (
                      <article
                        key={confirmation.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {gig?.category ?? "Gig"}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {formatPay(gig)}
                              </span>
                            </div>

                            <h3 className="text-2xl font-black">
                              {gig?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-3 line-clamp-3 leading-7 text-[#42513c]">
                              {gig?.description ?? "Gig details unavailable."}
                            </p>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-2">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Location
                                </span>
                                {gig?.location_area ?? "Remote / not set"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#142014]">
                                  Timing
                                </span>
                                {gig?.schedule_summary ?? "Flexible"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {info.nextStep}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            <button
                              type="button"
                              disabled={loadingId === confirmation.id}
                              onClick={() => acceptGig(confirmation)}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              {loadingId === confirmation.id
                                ? "Accepting..."
                                : "Accept gig"}
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === confirmation.id}
                              onClick={() => declineGig(confirmation)}
                              className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50 hover:bg-[#f6f8f4]"
                            >
                              Decline
                            </button>

                            {gig && (
                              <a
                                href={`/gigs/${gig.id}`}
                                className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                              >
                                View gig
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Past decisions</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {decidedConfirmations.length} decided
                </span>
              </div>

              {decidedConfirmations.length === 0 ? (
                <div className="rounded-[2rem] bg-white p-6 text-[#42513c] shadow-sm ring-1 ring-black/10">
                  No accepted or declined gigs yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {decidedConfirmations.map((confirmation) => {
                    const gig = gigById.get(confirmation.gig_id);
                    const info = confirmationInfo(confirmation.status);

                    return (
                      <article
                        key={confirmation.id}
                        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold text-[#42513c]">
                                {gig?.category ?? "Gig"}
                              </span>
                            </div>

                            <h3 className="text-xl font-black">
                              {gig?.title ?? "Unknown gig"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              {info.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                            {confirmation.status === "accepted_by_worker" && (
                              <a
                                href="/contacts"
                                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                              >
                                View contact
                              </a>
                            )}

                            <a
                              href="/applications"
                              className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                            >
                              Applications
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
