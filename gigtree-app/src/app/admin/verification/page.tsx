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
      notes: `Worker verification marked as ${formatStatus(status)}.`,
    });

    await loadData();

    setMessage(
      status === "approved"
        ? "Verification approved. Eligible payments moved to ready for release."
        : `Verification marked as ${formatStatus(status)}.`
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
            <a href="/admin" className="hidden sm:inline hover:underline">
              Admin
            </a>
            <a href="/admin/completions" className="hidden sm:inline hover:underline">
              Completion reviews
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Admin verification</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Review worker verification.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Review submitted worker details and uploaded ID documents before
            releasing payouts.
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

        {isAdmin && !message && records.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No verification records yet</h2>
            <p className="mt-3 text-[#42513c]">
              Submitted worker verification records will appear here.
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="grid gap-5">
            {records.map((record) => (
              <article
                key={record.id}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                    {formatStatus(record.status)}
                  </span>
                  <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                    {record.id_document_type ?? "Document"}
                  </span>
                  {record.submitted_at && (
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      Submitted {new Date(record.submitted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold">
                  {record.full_legal_name ?? "Unnamed worker"}
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Date of birth
                    </p>
                    <p className="mt-1 font-bold">
                      {record.date_of_birth ?? "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f6f8f4] p-4 md:col-span-2">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Address
                    </p>
                    <p className="mt-1 font-bold whitespace-pre-wrap">
                      {record.address_line ?? "Not provided"}
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 rounded-2xl bg-[#f6f8f4] p-4">
                    <p className="text-sm font-semibold text-[#42513c]">
                      Worker notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{record.notes}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {signedUrls[record.id] ? (
                    <a
                      href={signedUrls[record.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-black/10 px-5 py-3 font-semibold hover:bg-[#f6f8f4]"
                    >
                      View uploaded ID
                    </a>
                  ) : (
                    <div className="rounded-full border border-black/10 px-5 py-3 font-semibold text-[#42513c]">
                      No ID document
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loadingId === record.id}
                    onClick={() => reviewRecord(record, "approved")}
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === record.id}
                    onClick={() => reviewRecord(record, "needs_more_info")}
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50"
                  >
                    Needs more info
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === record.id}
                    onClick={() => reviewRecord(record, "rejected")}
                    className="rounded-full border border-black/10 px-5 py-3 font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
