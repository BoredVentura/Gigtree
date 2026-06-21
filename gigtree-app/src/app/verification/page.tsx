"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

function statusInfo(status: string) {
  switch (status) {
    case "not_submitted":
      return {
        label: "Not submitted",
        description: "Add your details and upload ID when you are ready.",
        nextStep: "Submit verification before payout release.",
      };
    case "submitted":
      return {
        label: "Submitted",
        description: "Your verification has been sent to admin for review.",
        nextStep: "Wait for admin review. You can still update and resubmit if needed.",
      };
    case "needs_more_info":
      return {
        label: "Needs more info",
        description: "Admin needs more information before approval.",
        nextStep: "Update your details or ID document, then resubmit.",
      };
    case "approved":
      return {
        label: "Approved",
        description: "Your worker verification has been approved.",
        nextStep: "Eligible completed gig payments can now move toward payout release.",
      };
    case "rejected":
      return {
        label: "Rejected",
        description: "Your verification was not approved.",
        nextStep: "Review your details and contact Gigtree before resubmitting.",
      };
    default:
      return {
        label: formatStatus(status),
        description: "Your verification status has changed.",
        nextStep: "Check your details and continue if needed.",
      };
  }
}

export default function VerificationPage() {
  const [userId, setUserId] = useState("");
  const [record, setRecord] = useState<VerificationRecord | null>(null);

  const [fullLegalName, setFullLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("Passport");
  const [idDocumentFilePath, setIdDocumentFilePath] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("Loading verification...");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadVerification() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to submit worker verification.");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("verification_records")
      .select(
        "id,user_id,full_legal_name,date_of_birth,address_line,id_document_type,id_document_file_path,notes,status,submitted_at,reviewed_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      const loaded = data as VerificationRecord;
      setRecord(loaded);
      setFullLegalName(loaded.full_legal_name ?? "");
      setDateOfBirth(loaded.date_of_birth ?? "");
      setAddressLine(loaded.address_line ?? "");
      setIdDocumentType(loaded.id_document_type ?? "Passport");
      setIdDocumentFilePath(loaded.id_document_file_path);
      setNotes(loaded.notes ?? "");
    }

    setMessage("");
  }

  useEffect(() => {
    loadVerification();
  }, []);

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>) {
    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/verification-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("verification-documents")
      .upload(filePath, file, { upsert: true });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    setIdDocumentFilePath(filePath);
    setMessage("ID document uploaded. Submit verification when ready.");
    setUploading(false);
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    if (!fullLegalName || !dateOfBirth || !addressLine || !idDocumentFilePath) {
      setMessage("Please add your legal name, date of birth, address, and ID document.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("verification_records").upsert(
      {
        user_id: userId,
        full_legal_name: fullLegalName,
        date_of_birth: dateOfBirth,
        address_line: addressLine,
        id_document_type: idDocumentType,
        id_document_file_path: idDocumentFilePath,
        notes: notes || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await loadVerification();
    setMessage("Verification submitted. Admin will review it.");
    setSaving(false);
  }

  const currentStatus = record?.status ?? "not_submitted";
  const info = statusInfo(currentStatus);

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f6f3e] text-xl text-white shadow-lg shadow-[#2f6f3e]/20">
              ✦
            </span>
            <span className="text-2xl font-black tracking-tight">Gigtree</span>
          </a>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <a href="/dashboard" className="rounded-full px-4 py-2 hover:bg-white">
              Dashboard
            </a>
            <a href="/profile" className="rounded-full px-4 py-2 hover:bg-white">
              Profile
            </a>
            <a href="/payments" className="rounded-full px-4 py-2 hover:bg-white">
              Payments
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Worker verification</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Verify your identity before payout release.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Verification helps Gigtree protect workers, posters, and payments.
              You can apply for gigs before approval, but payout release may
              require verified ID.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-bold text-[#2f6f3e]">
                {info.label}
              </span>
              {record?.submitted_at && (
                <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-bold text-[#42513c]">
                  Submitted {new Date(record.submitted_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <h2 className="mt-5 text-2xl font-black">Current status</h2>
            <p className="mt-3 leading-7 text-[#42513c]">{info.description}</p>

            <div className="mt-5 rounded-2xl bg-[#e8f0e4] p-4">
              <p className="font-semibold text-[#2f6f3e]">Next step</p>
              <p className="mt-2 text-sm text-[#42513c]">{info.nextStep}</p>
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

        {userId && (
          <form onSubmit={submitVerification} className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="grid gap-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 1</p>
                <h2 className="mt-1 text-3xl font-black">Legal details</h2>
                <p className="mt-2 text-[#42513c]">
                  Use the same details shown on your ID document.
                </p>

                <div className="mt-6 grid gap-5">
                  <label>
                    <span className="text-sm font-semibold">Full legal name</span>
                    <input
                      value={fullLegalName}
                      onChange={(event) => setFullLegalName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Full legal name"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Date of birth</span>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Address</span>
                    <textarea
                      value={addressLine}
                      onChange={(event) => setAddressLine(event.target.value)}
                      className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Your current address"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 2</p>
                <h2 className="mt-1 text-3xl font-black">Upload ID</h2>
                <p className="mt-2 text-[#42513c]">
                  Upload a clear image or PDF of your ID. This is private to
                  admin review.
                </p>

                <div className="mt-6 grid gap-5">
                  <label>
                    <span className="text-sm font-semibold">Document type</span>
                    <select
                      value={idDocumentType}
                      onChange={(event) => setIdDocumentType(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                    >
                      <option>Passport</option>
                      <option>Driving licence</option>
                      <option>National ID</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <div className="rounded-3xl bg-[#f6f8f4] p-5">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={uploadDocument}
                      disabled={uploading}
                      className="w-full"
                    />

                    <p className="mt-4 text-sm text-[#42513c]">
                      {idDocumentFilePath
                        ? "ID document uploaded and ready to submit."
                        : "No ID document uploaded yet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 3</p>
                <h2 className="mt-1 text-3xl font-black">Extra notes</h2>
                <p className="mt-2 text-[#42513c]">
                  Add anything admin should know when reviewing your ID.
                </p>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-6 min-h-32 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                  placeholder="Optional notes"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit verification"}
              </button>
            </section>

            <aside className="grid h-fit gap-5">
              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">Why this matters</p>
                <h2 className="mt-2 text-2xl font-black">
                  Payouts need trust.
                </h2>
                <p className="mt-4 leading-7 text-white/70">
                  Verification helps Gigtree confirm that payouts are going to
                  the right adult worker.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <h2 className="text-2xl font-black">What happens next</h2>
                <div className="mt-4 grid gap-3 text-sm text-[#42513c]">
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    Admin reviews your submitted details and ID document.
                  </p>
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    You may be asked for more information if something is unclear.
                  </p>
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    Once approved, eligible completed gig payments can move
                    toward release.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#fff7e8] p-6 shadow-sm ring-1 ring-black/10">
                <h2 className="text-2xl font-black">Privacy note</h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  Your ID document is for admin verification only. Posters do
                  not see your uploaded ID.
                </p>
              </div>
            </aside>
          </form>
        )}
      </section>
    </main>
  );
}
