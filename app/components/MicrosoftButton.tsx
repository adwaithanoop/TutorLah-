"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MicrosoftButton({ next }: { next?: string }) {
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    const redirectTo = `${window.location.origin}/auth/confirm${params.size ? `?${params}` : ""}`;
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo, scopes: "email openid profile" },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div>
      <button
        onClick={signIn}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 23 23" aria-hidden="true">
          <path fill="#f25022" d="M1 1h10v10H1z" />
          <path fill="#7fba00" d="M12 1h10v10H12z" />
          <path fill="#00a4ef" d="M1 12h10v10H1z" />
          <path fill="#ffb900" d="M12 12h10v10H12z" />
        </svg>
        Continue with NUS Microsoft
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
