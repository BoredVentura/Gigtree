"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    if (mode === "sign_up" && !ageConfirmed) {
      setMessage("Please confirm you are 18 or over to create a Gigtree account.");
      setSaving(false);
      return;
    }

    if (mode === "sign_in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      window.location.href = "/dashboard";
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          age_confirmed: ageConfirmed,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName || null,
        age_confirmed: ageConfirmed,
        age_confirmed_at: ageConfirmed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    }

    setMessage("Account created. Check your email if confirmation is required, then sign in.");
    setMode("sign_in");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1fr_460px]">
          <div>
            <nav className="flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f6f3e] text-xl text-white shadow-lg shadow-[#2f6f3e]/20">
                  ✦
                </span>
                <span className="text-2xl font-black tracking-tight">
                  Gigtree
                </span>
              </a>

              <a
                href="/gigs"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
              >
                Browse gigs
              </a>
            </nav>

            <div className="flex min-h-[70vh] flex-col justify-center py-16">
              <div className="mb-6 inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2f6f3e] shadow-sm ring-1 ring-black/10">
                Trusted gig marketplace
              </div>

              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Join Gigtree.
                <span className="block text-[#2f6f3e]">
                  Work safer.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#42513c]">
                Sign in to manage your profile, apply for gigs, post work after
                approval, track contacts, complete verification, and manage
                payments.
              </p>

              <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Private</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Apply with your profile.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Reviewed</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Admins recommend fits.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/10">
                  <p className="text-2xl font-black">Protected</p>
                  <p className="mt-1 text-sm text-[#42513c]">
                    Payment flow controlled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <section className="w-full rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <div className="rounded-[1.5rem] bg-[#142014] p-6 text-white">
                <p className="font-semibold text-[#b9f36b]">
                  {mode === "sign_in" ? "Welcome back" : "Create account"}
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {mode === "sign_in" ? "Sign in to Gigtree." : "Start your profile."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Gigtree is currently for UK users aged 18+.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-[#f6f8f4] p-1">
                <button
                  type="button"
                  onClick={() => setMode("sign_in")}
                  className={`rounded-full px-4 py-3 text-sm font-bold ${
                    mode === "sign_in"
                      ? "bg-[#2f6f3e] text-white"
                      : "text-[#42513c]"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => setMode("sign_up")}
                  className={`rounded-full px-4 py-3 text-sm font-bold ${
                    mode === "sign_up"
                      ? "bg-[#2f6f3e] text-white"
                      : "text-[#42513c]"
                  }`}
                >
                  Sign up
                </button>
              </div>

              {message && (
                <div className="mt-5 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                {mode === "sign_up" && (
                  <label>
                    <span className="text-sm font-semibold">Full name</span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                      placeholder="Your full name"
                    />
                  </label>
                )}

                <label>
                  <span className="text-sm font-semibold">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fbfff6] p-4 outline-none focus:border-[#2f6f3e]"
                    placeholder="Password"
                    required
                  />
                </label>

                {mode === "sign_up" && (
                  <label className="flex gap-3 rounded-2xl bg-[#e8f0e4] p-4 text-sm text-[#42513c]">
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(event) => setAgeConfirmed(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-[#142014]">
                        I confirm I am 18 or over.
                      </span>{" "}
                      Gigtree is currently for adults only.
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 disabled:opacity-50"
                >
                  {saving
                    ? "Please wait..."
                    : mode === "sign_in"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[#42513c]">
                {mode === "sign_in"
                  ? "New to Gigtree? Switch to sign up above."
                  : "Already have an account? Switch to sign in above."}
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
