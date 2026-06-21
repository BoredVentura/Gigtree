"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  age_confirmed: boolean;
};

type WorkerProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  location_area: string | null;
  remote_available: boolean;
  in_person_available: boolean;
  skills: string[] | null;
  availability: string | null;
  experience_summary: string | null;
  portfolio_links: string[] | null;
  cv_file_url: string | null;
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value: string[] | null) {
  return (value ?? []).join("\n");
}

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [bio, setBio] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [remoteAvailable, setRemoteAvailable] = useState(true);
  const [inPersonAvailable, setInPersonAvailable] = useState(true);
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [cvFileUrl, setCvFileUrl] = useState<string | null>(null);

  const [message, setMessage] = useState("Loading your profile...");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in to build your profile.");
      return;
    }

    setUserId(user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,phone,age_confirmed")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    const loadedProfile = profileData as Profile;
    setProfile(loadedProfile);
    setFullName(loadedProfile.full_name ?? "");
    setPhone(loadedProfile.phone ?? "");
    setAgeConfirmed(Boolean(loadedProfile.age_confirmed));

    const { data: workerData, error: workerError } = await supabase
      .from("worker_profiles")
      .select(
        "id,user_id,bio,location_area,remote_available,in_person_available,skills,availability,experience_summary,portfolio_links,cv_file_url"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (workerError) {
      setMessage(workerError.message);
      return;
    }

    if (workerData) {
      const loadedWorker = workerData as WorkerProfile;
      setBio(loadedWorker.bio ?? "");
      setLocationArea(loadedWorker.location_area ?? "");
      setRemoteAvailable(Boolean(loadedWorker.remote_available));
      setInPersonAvailable(Boolean(loadedWorker.in_person_available));
      setSkills(joinLines(loadedWorker.skills));
      setAvailability(loadedWorker.availability ?? "");
      setExperienceSummary(loadedWorker.experience_summary ?? "");
      setPortfolioLinks(joinLines(loadedWorker.portfolio_links));
      setCvFileUrl(loadedWorker.cv_file_url);
    }

    setMessage("");
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: phone || null,
        age_confirmed: ageConfirmed,
        age_confirmed_at: ageConfirmed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      setMessage(profileError.message);
      setSaving(false);
      return;
    }

    const { error: workerError } = await supabase
      .from("worker_profiles")
      .upsert(
        {
          user_id: userId,
          bio: bio || null,
          location_area: locationArea || null,
          remote_available: remoteAvailable,
          in_person_available: inPersonAvailable,
          skills: splitLines(skills),
          availability: availability || null,
          experience_summary: experienceSummary || null,
          portfolio_links: splitLines(portfolioLinks),
          cv_file_url: cvFileUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (workerError) {
      setMessage(workerError.message);
      setSaving(false);
      return;
    }

    await loadProfile();
    setMessage("Profile saved. Admins can now use this when reviewing applications.");
    setSaving(false);
  }

  async function uploadCv(event: ChangeEvent<HTMLInputElement>) {
    if (!userId) {
      setMessage("Please sign in first.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/cv-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    setCvFileUrl(filePath);

    const { error: workerError } = await supabase
      .from("worker_profiles")
      .upsert(
        {
          user_id: userId,
          cv_file_url: filePath,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (workerError) {
      setMessage(workerError.message);
      setUploading(false);
      return;
    }

    await loadProfile();
    setMessage("CV uploaded. It stays private to admin review.");
    setUploading(false);
  }

  async function quickSaveAgeConfirmed(checked: boolean) {
    setAgeConfirmed(checked);

    if (!userId) return;

    await supabase
      .from("profiles")
      .update({
        age_confirmed: checked,
        age_confirmed_at: checked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  const completedItems = [
    fullName.trim().length > 0,
    bio.trim().length > 0,
    locationArea.trim().length > 0,
    skills.trim().length > 0,
    availability.trim().length > 0,
    experienceSummary.trim().length > 0,
    Boolean(cvFileUrl),
    ageConfirmed,
  ].filter(Boolean).length;

  const completionPercent = Math.round((completedItems / 8) * 100);

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
            <a href="/gigs" className="rounded-full px-4 py-2 hover:bg-white">
              Browse gigs
            </a>
            <a href="/applications" className="rounded-full px-4 py-2 hover:bg-white">
              My applications
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-semibold text-[#2f6f3e]">Worker profile</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight tracking-tight">
              Help admins recommend you for the right gigs.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42513c]">
              Your profile gives Gigtree enough information to review your
              applications properly. Posters do not automatically see your full
              details or CV.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#42513c]">
                  Profile strength
                </p>
                <p className="mt-1 text-3xl font-black">{completionPercent}%</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#e8f0e4] font-black text-[#2f6f3e]">
                {completedItems}/8
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8f0e4]">
              <div
                className="h-full rounded-full bg-[#2f6f3e]"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
              <p className="rounded-2xl bg-[#f6f8f4] p-4">
                Strong profiles include skills, availability, experience, CV,
                and location.
              </p>
              <a
                href="/verification"
                className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
              >
                Worker verification
              </a>
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

        {profile && (
          <form onSubmit={saveProfile} className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="grid gap-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 1</p>
                <h2 className="mt-1 text-3xl font-black">Basic details</h2>
                <p className="mt-2 text-[#42513c]">
                  These help admin understand who is applying.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold">Full name</span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Your full name"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">Phone</span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Optional phone number"
                    />
                  </label>
                </div>

                <label className="mt-5 flex gap-3 rounded-2xl bg-[#e8f0e4] p-4 text-sm text-[#42513c]">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(event) =>
                      quickSaveAgeConfirmed(event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-[#172014]">
                      I confirm I am 18 or over.
                    </span>{" "}
                    Gigtree is currently for adults only.
                  </span>
                </label>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 2</p>
                <h2 className="mt-1 text-3xl font-black">Work preferences</h2>
                <p className="mt-2 text-[#42513c]">
                  Tell us where and how you can work.
                </p>

                <div className="mt-6 grid gap-5">
                  <label>
                    <span className="text-sm font-semibold">Location area</span>
                    <input
                      value={locationArea}
                      onChange={(event) => setLocationArea(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Example: Luton, London, Remote UK"
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4">
                      <input
                        type="checkbox"
                        checked={inPersonAvailable}
                        onChange={(event) =>
                          setInPersonAvailable(event.target.checked)
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold">
                          In-person gigs
                        </span>
                        <span className="text-sm text-[#42513c]">
                          I can work local/on-site gigs.
                        </span>
                      </span>
                    </label>

                    <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4">
                      <input
                        type="checkbox"
                        checked={remoteAvailable}
                        onChange={(event) =>
                          setRemoteAvailable(event.target.checked)
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold">Remote gigs</span>
                        <span className="text-sm text-[#42513c]">
                          I can work online gigs.
                        </span>
                      </span>
                    </label>
                  </div>

                  <label>
                    <span className="text-sm font-semibold">Availability</span>
                    <textarea
                      value={availability}
                      onChange={(event) => setAvailability(event.target.value)}
                      className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Example: Weekends, evenings after 6pm, Mondays remote only..."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 3</p>
                <h2 className="mt-1 text-3xl font-black">Skills and experience</h2>
                <p className="mt-2 text-[#42513c]">
                  This is what admins use to decide if you are a strong fit.
                </p>

                <div className="mt-6 grid gap-5">
                  <label>
                    <span className="text-sm font-semibold">Short bio</span>
                    <textarea
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="A short introduction about you and the type of work you are looking for."
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Skills, one per line
                    </span>
                    <textarea
                      value={skills}
                      onChange={(event) => setSkills(event.target.value)}
                      className="mt-2 min-h-36 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder={"Cleaning\nEvent support\nAdmin work\nLogo design"}
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Experience summary
                    </span>
                    <textarea
                      value={experienceSummary}
                      onChange={(event) =>
                        setExperienceSummary(event.target.value)
                      }
                      className="mt-2 min-h-40 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Tell admins about relevant experience, previous work, training, tools, or strengths."
                    />
                  </label>

                  <label>
                    <span className="text-sm font-semibold">
                      Portfolio links, one per line
                    </span>
                    <textarea
                      value={portfolioLinks}
                      onChange={(event) => setPortfolioLinks(event.target.value)}
                      className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder={"https://example.com\nhttps://linkedin.com/in/..."}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Step 4</p>
                <h2 className="mt-1 text-3xl font-black">Private CV</h2>
                <p className="mt-2 text-[#42513c]">
                  Uploading a CV helps admin review your applications. It is not
                  automatically shown to posters.
                </p>

                <div className="mt-6 rounded-3xl bg-[#f6f8f4] p-5">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={uploadCv}
                    disabled={uploading}
                    className="w-full"
                  />

                  <p className="mt-4 text-sm text-[#42513c]">
                    {cvFileUrl
                      ? "CV uploaded and linked to your profile."
                      : "No CV uploaded yet."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
            </section>

            <aside className="grid h-fit gap-5">
              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">What admins see</p>
                <h2 className="mt-2 text-2xl font-black">
                  A fuller picture of your fit.
                </h2>
                <p className="mt-4 leading-7 text-white/70">
                  Admins can use your skills, CV, location, and availability to
                  recommend you more confidently.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <h2 className="text-2xl font-black">Privacy reminder</h2>
                <div className="mt-4 grid gap-3 text-sm text-[#42513c]">
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    Posters see anonymous candidate summaries first.
                  </p>
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    Your CV is for admin review, not automatic poster access.
                  </p>
                  <p className="rounded-2xl bg-[#f6f8f4] p-4">
                    Contact details are controlled through the Gigtree flow.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#fff7e8] p-6 shadow-sm ring-1 ring-black/10">
                <h2 className="text-2xl font-black">Next after profile</h2>
                <p className="mt-3 leading-7 text-[#42513c]">
                  Browse gigs, apply privately, then complete verification
                  before payout release.
                </p>
                <div className="mt-5 grid gap-3">
                  <a
                    href="/gigs"
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                  >
                    Browse gigs
                  </a>
                  <a
                    href="/verification"
                    className="rounded-full bg-white px-5 py-3 text-center font-semibold ring-1 ring-black/10"
                  >
                    Verification
                  </a>
                </div>
              </div>
            </aside>
          </form>
        )}
      </section>
    </main>
  );
}
