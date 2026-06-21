"use client";

import { supabase } from "@/lib/supabase";

export default function SignOutButton() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-black/10 px-4 py-2 font-semibold hover:bg-white"
    >
      Sign out
    </button>
  );
}
