"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nusEmailSchema } from "@/lib/validation/auth";

type Status = "idle" | "sending" | "code" | "verifying" | "error";

export default function MagicLinkForm({
  next,
  asTutor = false,
}: {
  next?: string;
  asTutor?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    const parsed = nusEmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");
    const { error: otpError } = await createClient().auth.signInWithOtp({
      email: parsed.data,
      options: { data: asTutor ? { intended_role: "tutor" } : undefined },
    });

    if (otpError) {
      setError(otpError.message);
      setStatus("error");
      return;
    }
    setEmail(parsed.data);
    setStatus("code");
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setStatus("verifying");
    setError("");

    const supabase = createClient();
    const code = token.trim();
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });

    if (verifyError) {
      setError(verifyError.message || "That code is invalid or has expired. Check the latest email.");
      setStatus("error");
      return;
    }
    router.push(next ?? "/dashboard");
    router.refresh();
  }

  if (status === "code" || (status === "verifying") || (status === "error" && token)) {
    return (
      <form onSubmit={verifyCode} className="space-y-3">
        <p className="text-sm text-gray-600">
          We emailed a sign-in code to <span className="font-medium">{email}</span>. Enter it below.
        </p>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          value={token}
          onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))}
          placeholder="Enter your code"
          maxLength={10}
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-center text-lg tracking-[0.3em] text-gray-900 placeholder-gray-300 placeholder:tracking-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {status === "error" && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === "verifying"}
          className="w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "verifying" ? "Verifying…" : "Verify & sign in"}
        </button>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setToken(""); setError(""); }}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-3">
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        NUS email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="e1234567@u.nus.edu"
        autoComplete="email"
        required
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending code…" : "Email me a sign-in code"}
      </button>
      <p className="text-center text-xs text-gray-400">
        Only @u.nus.edu accounts can join the beta.
      </p>
    </form>
  );
}