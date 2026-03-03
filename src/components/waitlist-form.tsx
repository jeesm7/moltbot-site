"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join waitlist");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <CheckCircleIcon className="w-5 h-5" />
        <span className="font-medium">You&apos;re on the list! We&apos;ll be in touch.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full sm:flex-1 h-12 px-5 rounded-full bg-white/5 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
      <Button
        type="submit"
        size="lg"
        className="rounded-full px-8 h-12 text-base w-full sm:w-auto"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Joining...
          </span>
        ) : (
          <>
            Join the Waitlist
            <ArrowRightIcon className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>
      {status === "error" && (
        <p className="text-sm text-red-400 mt-1 sm:mt-0">{errorMsg}</p>
      )}
    </form>
  );
}
