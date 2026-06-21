"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account created. Check your email if confirmation is required, then sign in.");
        setMode("sign-in");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>

          <div className="mt-8">
            <p className="font-semibold text-[#2f6f3e]">
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {mode === "sign-in"
                ? "Welcome back."
                : "Start using Gigtree."}
            </h1>
            <p className="mt-3 text-[#42513c]">
              {mode === "sign-in"
                ? "Sign in to manage your dashboard, applications, and payments."
                : "Create one account to apply for gigs and request posting access."}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {mode === "sign-up" && (
              <div>
                <label className="text-sm font-semibold">Full name</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-semibold">Email address</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            {message && (
              <div className="rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <button
              type="button"
              onClick={() =>
                setMode(mode === "sign-in" ? "sign-up" : "sign-in")
              }
              className="w-full rounded-full border border-black/10 px-5 py-3 font-semibold"
            >
              {mode === "sign-in"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
