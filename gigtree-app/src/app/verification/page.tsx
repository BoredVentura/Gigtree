"use client";

import { FormEvent, useEffect, useState } from "react";
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

export default function VerificationPage() {
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [message, setMessage] = useState("Loading verification...");
  const [saving, setSaving] = useState(false);

  const [fullLegalName, setFullLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("passport");
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  async function loadRecord() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to submit verification.");
      return;
    }

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
      const verification = data as VerificationRecord;
      setRecord(verification);
      setFullLegalName(verification.full_legal_name ?? "");
      setDateOfBirth(verification.date_of_birth ?? "");
      setAddressLine(verification.address_line ?? "");
      setIdDocumentType(verification.id_document_type ?? "passport");
      setNotes(verification.notes ?? "");
    }

    setMessage("");
  }

  useEffect(() => {
    loadRecord();
  }, []);

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in.");
      setSaving(false);
      return;
    }

    if (!fullLegalName || !dateOfBirth || !addressLine || !idDocumentType) {
      setMessage("Please complete all required fields.");
      setSaving(false);
      return;
    }

    if (!record?.id_document_file_path && !idDocumentFile) {
      setMessage("Please upload an ID document.");
      setSaving(false);
      return;
    }

    let uploadedFilePath = record?.id_document_file_path ?? null;

    if (idDocumentFile) {
      const safeFileName = idDocumentFile.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, idDocumentFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setMessage(uploadError.message);
        setSaving(false);
        return;
      }

      uploadedFilePath = filePath;
    }

    const payload = {
      user_id: user.id,
      full_legal_name: fullLegalName,
      date_of_birth: dateOfBirth,
      address_line: addressLine,
      id_document_type: idDocumentType,
      id_document_file_path: uploadedFilePath,
      notes,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };

    let error;

    if (record?.id) {
      const result = await supabase
        .from("verification_records")
        .update(payload)
        .eq("id", record.id);
      error = result.error;
    } else {
      const result = await supabase.from("verification_records").insert(payload);
      error = result.error;
    }

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await loadRecord();
    setIdDocumentFile(null);
    setMessage("Verification and ID document submitted for admin review.");
    setSaving(false);
  }

  const locked = record?.status === "approved";

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <a href="/dashboard" className="text-sm hover:underline">
            Dashboard
          </a>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Worker verification</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Submit verification.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#42513c]">
            Verification is required before Gigtree releases worker payouts.
            Upload a passport, driving licence, national ID, or other accepted
            document for admin review.
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

        {record && (
          <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#42513c]">
              Current status
            </p>
            <p className="mt-1 text-2xl font-bold text-[#2f6f3e]">
              {formatStatus(record.status)}
            </p>
            {record.id_document_file_path && (
              <p className="mt-3 text-sm text-[#42513c]">
                ID document uploaded.
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={submitVerification}
          className="grid gap-5 rounded-3xl bg-white p-6 shadow-sm"
        >
          <label>
            <span className="text-sm font-semibold">Full legal name</span>
            <input
              value={fullLegalName}
              onChange={(event) => setFullLegalName(event.target.value)}
              disabled={locked}
              className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
              placeholder="Your full legal name"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">Date of birth</span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              disabled={locked}
              className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">Address</span>
            <textarea
              value={addressLine}
              onChange={(event) => setAddressLine(event.target.value)}
              disabled={locked}
              className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
              placeholder="Your current address"
            />
          </label>

          <label>
            <span className="text-sm font-semibold">ID document type</span>
            <select
              value={idDocumentType}
              onChange={(event) => setIdDocumentType(event.target.value)}
              disabled={locked}
              className="mt-2 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
            >
              <option value="passport">Passport</option>
              <option value="driving_licence">Driving licence</option>
              <option value="national_id">National ID</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold">
              Upload ID document
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={locked}
              onChange={(event) =>
                setIdDocumentFile(event.target.files?.[0] ?? null)
              }
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
            />
            <p className="mt-2 text-sm text-[#42513c]">
              Accepted files: PDF, PNG, JPG, JPEG.
            </p>
          </label>

          <label>
            <span className="text-sm font-semibold">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={locked}
              className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 p-4 outline-none focus:border-[#2f6f3e] disabled:bg-black/5"
              placeholder="Optional notes for admin"
            />
          </label>

          {locked ? (
            <div className="rounded-2xl bg-[#e8f0e4] p-4 font-semibold text-[#2f6f3e]">
              Your verification has been approved.
            </div>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#2f6f3e] px-6 py-4 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit verification"}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
