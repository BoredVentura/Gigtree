"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createAuditLog } from "@/lib/audit-log";

type VerificationRecord = {
  id: string;
  user_id: string;
  full_legal_name: string | null;
  date_of_birth: string | null;
  address_line: string | null;
  id_document_type: string | null;
  id_document_file_path: string | null;
  notes: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function reviewInfo(status: string) {
  switch (status) {
    case "submitted":
      return {
        label: "Needs review",
        description:
          "The worker has submitted verification details and an ID document for admin review.",
        nextStep:
          "Open the uploaded ID, compare details, then approve, reject, or request more info.",
      };
    case "needs_more_info":
      return {
        label: "Needs more info",
        description:
          "Admin requested more information from the worker.",
        nextStep:
          "Wait for the worker to update and resubmit verification.",
      };
    case "approved":
      return {
        label: "Approved",
        description:
          "This worker is verified. Eligible payments should move to ready for release.",
        nextStep:
          "Check payout releases for any payments ready to release.",
      };
    case "rejected":
      return {
        label: "Rejected",
        description:
          "This verification submission was rejected.",
        nextStep:
          "Worker payout should not be released until verification is resolved.",
      };
    default:
      return {
        label: formatStatus(status),
        description:
          "This verification record has an updated status.",
        nextStep:
          "Review manually if needed.",
      };
  }
}

export default function AdminVerificationPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [message, setMessage] = useState("Loading verification reviews...");
  const [loadingId, setLoadingId] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in as an admin.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      setMessage("You do not have admin access.");
      return;
    }

    setIsAdmin(true);

    const { data, error } = await supabase
      .from("verification_records")
      .select(
        "id,user_id,full_legal_name,date_of_birth,address_line,id_document_type,id_document_file_path,notes,status,submitted_at,reviewed_at"
      )
      .order("submitted_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const verificationRecords = (data ?? []) as VerificationRecord[];
    setRecords(verificationRecords);

    const urls: Record<string, string> = {};

    for (const record of verificationRecords) {
      if (record.id_document_file_path) {
        const { data: signedUrlData } = await supabase.storage
          .from("verification-documents")
          .createSignedUrl(record.id_document_file_path, 60 * 10);

        if (signedUrlData?.signedUrl) {
          urls[record.id] = signedUrlData.signedUrl;
        }
      }
    }

    setSignedUrls(urls);
    setMessage("");
  }

  useEffect(() => {
    loadData();
  }, []);

  async function reviewRecord(
    record: VerificationRecord,
    status: "approved" | "rejected" | "needs_more_info"
  ) {
    setLoadingId(record.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in.");
      setLoadingId("");
      return;
    }

    const { error: updateError } = await supabase
      .from("verification_records")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", record.id);

    if (updateError) {
      setMessage(updateError.message);
      setLoadingId("");
      return;
    }

    if (status === "approved") {
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "ready_for_release",
          updated_at: new Date().toISOString(),
        })
        .eq("worker_id", record.user_id)
        .eq("status", "pending_worker_verification");

      if (paymentError) {
        setMessage(paymentError.message);
        setLoadingId("");
        return;
      }
    }

    await createAuditLog({
      action:
        status === "approved"
          ? "verification_approved"
          : status === "rejected"
            ? "verification_rejected"
            : "verification_needs_more_info",
      entityType: "verification_record",
      entityId: record.id,
      notes:
        status === "approved"
          ? "Worker verification approved. Eligible payments moved to ready for release."
          : `Worker verification marked as ${formatStatus(status)}.`,
    });

    await loadData();

    setMessage(
      status === "approved"
        ? "Verification approved. Eligible payments moved to ready for release."
        : `Verification marked as ${formatStatus(status)}.`
    );

    setLoadingId("");
  }

  const needsReview = records.filter((record) => record.status === "submitted");
  const laterStage = records.filter((record) => record.status !== "submitted");

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/admin" className="hover:underline">
              Admin
            </a>
            <a href="/admin/completions" className="hover:underline">
              Completions
            </a>
            <a href="/admin/payouts" className="hover:underline">
              Payouts
            </a>
            <a href="/admin/audit" className="hover:underline">
              Audit
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin verification</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Review worker ID verification.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
            Review submitted worker details and uploaded ID documents before
            payouts are released.
          </p>
        </div>

        <section className="mb-6 rounded-3xl border border-[#2f6f3e]/20 bg-[#e8f0e4] p-6 shadow-sm">
          <h2 className="text-2xl font-bold">What approval does</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">1. Marks worker verified</p>
              <p className="mt-1 text-sm text-[#42513c]">
                The verification record is marked approved.
              </p>
            </div>

            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">2. Updates eligible payments</p>
              <p className="mt-1 text-sm text-[#42513c]">
                Payments waiting for worker verification move to ready for
                release.
              </p>
            </div>

            <div className="rounded-2xl bg-white/70 p-4">
              <p className="font-semibold">3. Records an audit log</p>
              <p className="mt-1 text-sm text-[#42513c]">
                The admin decision is saved in the platform audit history.
              </p>
            </div>
          </div>
        </section>

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

        {isAdmin && !message && records.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No verification records yet</h2>
            <p className="mt-3 text-[#42513c]">
              Submitted worker verification records will appear here.
            </p>
          </div>
        )}

        {isAdmin && records.length > 0 && (
          <div className="grid gap-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black">Needs verification review</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {needsReview.length} pending
                </span>
              </div>

              {needsReview.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No submitted verifications currently need review.
                </div>
              ) : (
                <div className="grid gap-5">
                  {needsReview.map((record) => {
                    const info = reviewInfo(record.status);

                    return (
                      <article
                        key={record.id}
                        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                {record.id_document_type ?? "Document"}
                              </span>
                              {record.submitted_at && (
                                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                  Submitted{" "}
                                  {new Date(record.submitted_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            <h3 className="text-2xl font-bold">
                              {record.full_legal_name ?? "Unnamed worker"}
                            </h3>

                            <div className="mt-4 grid gap-3 text-sm text-[#42513c] md:grid-cols-3">
                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Worker ID
                                </span>
                                {record.user_id.slice(0, 8)}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Date of birth
                                </span>
                                {record.date_of_birth ?? "Not provided"}
                              </p>

                              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                                <span className="block font-semibold text-[#172014]">
                                  Document
                                </span>
                                {record.id_document_file_path ? "Uploaded" : "Missing"}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4">
                              <p className="font-semibold">Address</p>
                              <p className="mt-2 whitespace-pre-wrap text-[#42513c]">
                                {record.address_line ?? "Not provided"}
                              </p>
                            </div>

                            {record.notes && (
                              <div className="mt-3 rounded-2xl bg-[#f6f8f4] p-4">
                                <p className="font-semibold">Worker notes</p>
                                <p className="mt-2 whitespace-pre-wrap text-[#42513c]">
                                  {record.notes}
                                </p>
                              </div>
                            )}

                            <div className="mt-3 rounded-2xl bg-[#e8f0e4] p-4">
                              <p className="font-semibold text-[#2f6f3e]">
                                Next step
                              </p>
                              <p className="mt-2 text-[#42513c]">
                                {info.nextStep}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 lg:justify-center">
                            {signedUrls[record.id] ? (
                              <a
                                href={signedUrls[record.id]}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                              >
                                View uploaded ID
                              </a>
                            ) : (
                              <div className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold text-[#42513c]">
                                No ID document
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={loadingId === record.id}
                              onClick={() => reviewRecord(record, "approved")}
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                            >
                              Approve verification
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === record.id}
                              onClick={() => reviewRecord(record, "needs_more_info")}
                              className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50 hover:bg-[#f6f8f4]"
                            >
                              Needs more info
                            </button>

                            <button
                              type="button"
                              disabled={loadingId === record.id}
                              onClick={() => reviewRecord(record, "rejected")}
                              className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50 hover:bg-[#f6f8f4]"
                            >
                              Reject
                            </button>
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
                <h2 className="text-3xl font-black">Reviewed verification</h2>
                <span className="rounded-full bg-[#e8f0e4] px-4 py-2 text-sm font-semibold text-[#2f6f3e]">
                  {laterStage.length} reviewed / pending info
                </span>
              </div>

              {laterStage.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
                  No reviewed verification records yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {laterStage.map((record) => {
                    const info = reviewInfo(record.status);

                    return (
                      <article
                        key={record.id}
                        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="mb-3 flex flex-wrap gap-2 text-sm">
                              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                                {info.label}
                              </span>
                              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                                {record.id_document_type ?? "Document"}
                              </span>
                            </div>

                            <h3 className="text-xl font-bold">
                              {record.full_legal_name ?? "Unnamed worker"}
                            </h3>

                            <p className="mt-2 text-[#42513c]">
                              {info.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                            {signedUrls[record.id] && (
                              <a
                                href={signedUrls[record.id]}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                              >
                                View ID
                              </a>
                            )}
                            <a
                              href="/admin/payouts"
                              className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                            >
                              Payouts
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
