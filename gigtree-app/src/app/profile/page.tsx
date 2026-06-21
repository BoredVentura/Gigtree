"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type WorkerProfile = {
  id?: string;
  user_id?: string;
  bio: string | null;
  location_area: string | null;
  remote_available: boolean;
  in_person_available: boolean;
  skills: string[];
  availability: string | null;
  experience_summary: string | null;
  portfolio_links: string[];
  cv_file_url: string | null;
};

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [bio, setBio] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [remoteAvailable, setRemoteAvailable] = useState(true);
  const [inPersonAvailable, setInPersonAvailable] = useState(false);
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [cvFileUrl, setCvFileUrl] = useState("");
  const [message, setMessage] = useState("Loading profile...");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please sign in to edit your worker profile.");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data) {
        const profile = data as WorkerProfile;
        setBio(profile.bio ?? "");
        setLocationArea(profile.location_area ?? "");
        setRemoteAvailable(profile.remote_available);
        setInPersonAvailable(profile.in_person_available);
        setSkills((profile.skills ?? []).join(", "));
        setAvailability(profile.availability ?? "");
        setExperienceSummary(profile.experience_summary ?? "");
        setPortfolioLinks((profile.portfolio_links ?? []).join(", "));
        setCvFileUrl(profile.cv_file_url ?? "");
      }

      setMessage("");
    }

    loadProfile();
  }, []);

  async function uploadCv(file: File) {
    if (!userId) {
      setMessage("Please sign in before uploading a CV.");
      return;
    }

    setUploadingCv(true);
    setMessage("");

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${Date.now()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setMessage(error.message);
    } else {
      setCvFileUrl(filePath);
      setMessage("CV uploaded. Remember to save your profile.");
    }

    setUploadingCv(false);
  }

  async function saveProfile() {
    if (!userId) {
      setMessage("Please sign in before saving your profile.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      user_id: userId,
      bio,
      location_area: locationArea,
      remote_available: remoteAvailable,
      in_person_available: inPersonAvailable,
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      availability,
      experience_summary: experienceSummary,
      portfolio_links: portfolioLinks
        .split(",")
        .map((link) => link.trim())
        .filter(Boolean),
      cv_file_url: cvFileUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("worker_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile saved.");
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
          <p className="font-semibold text-[#2f6f3e]">Worker profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Build your Gigtree profile.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            This profile helps Gigtree review your applications and recommend
            you for suitable gigs.
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
          </div>
        )}

        <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-semibold">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Tell Gigtree a little about yourself"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Location area</label>
            <input
              value={locationArea}
              onChange={(event) => setLocationArea(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Example: Manchester, Birmingham, Remote UK"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4">
              <input
                type="checkbox"
                checked={remoteAvailable}
                onChange={(event) => setRemoteAvailable(event.target.checked)}
              />
              <span>Available for online gigs</span>
            </label>

            <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4">
              <input
                type="checkbox"
                checked={inPersonAvailable}
                onChange={(event) => setInPersonAvailable(event.target.checked)}
              />
              <span>Available for in-person gigs</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">Skills</label>
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Example: events, admin, retail, design"
            />
            <p className="mt-2 text-sm text-[#42513c]">
              Separate skills with commas.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold">Availability</label>
            <textarea
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Example: weekends, evenings, flexible remote hours"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Experience summary</label>
            <textarea
              value={experienceSummary}
              onChange={(event) => setExperienceSummary(event.target.value)}
              className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="Summarise your relevant experience"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Portfolio links</label>
            <input
              value={portfolioLinks}
              onChange={(event) => setPortfolioLinks(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
              placeholder="https://example.com, https://linkedin.com/in/..."
            />
            <p className="mt-2 text-sm text-[#42513c]">
              Separate links with commas.
            </p>
          </div>

          <div className="rounded-2xl bg-[#f6f8f4] p-4">
            <label className="text-sm font-semibold">CV upload</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadCv(file);
              }}
              className="mt-3 block w-full text-sm"
            />
            <p className="mt-2 text-sm text-[#42513c]">
              Accepted formats: PDF, DOC, DOCX.
            </p>
            {cvFileUrl && (
              <p className="mt-3 text-sm font-medium text-[#2f6f3e]">
                CV uploaded: {cvFileUrl}
              </p>
            )}
            {uploadingCv && (
              <p className="mt-3 text-sm text-[#42513c]">Uploading CV...</p>
            )}
          </div>

        <label className="flex items-start gap-3 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={async (event) => {
              const checked = event.target.checked;
              setAgeConfirmed(checked);

              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (user) {
                const { error } = await supabase
                  .from("profiles")
                  .update({
                    age_confirmed: checked,
                    age_confirmed_at: checked ? new Date().toISOString() : null,
                  })
                  .eq("id", user.id);

                if (error) {
                  setMessage(error.message);
                } else {
                  setMessage(
                    checked
                      ? "18+ confirmation saved."
                      : "18+ confirmation removed."
                  );
                }
              }
            }}
            className="mt-1"
          />
          <span>
            I confirm that I am 18 or over and agree to Gigtree's{" "}
            <a href="/terms" className="font-semibold text-[#2f6f3e] underline">
              Terms
            </a>
            ,{" "}
            <a href="/privacy" className="font-semibold text-[#2f6f3e] underline">
              Privacy Notice
            </a>
            , and{" "}
            <a href="/safety" className="font-semibold text-[#2f6f3e] underline">
              Safety Rules
            </a>
            .
          </span>
        </label>



          <button
            type="button"
            onClick={saveProfile}
            disabled={loading}
            className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </section>
    </main>
  );
}
